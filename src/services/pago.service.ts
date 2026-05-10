import { prisma } from '@/config/database.config';
import { logger } from '@/utils/logger.utils';
import stripeService from '@/services/stripe.service';
import emailService from '@/services/email.service';
import { ErrorNoEncontrado, ErrorValidacion } from '@/utils/errores.utils';
import { ESTADO_RESERVACION, type ClaveEstadoReservacion } from '@/schemas/pago.schema';

// ── Helpers internos ────────────────────────────────────────────────────────

/**
 * Obtiene el ID numérico de un estado de reservación a partir de su clave.
 * Se usa para las queries de Prisma (que trabajan con el ID de FK, no con la clave string).
 *
 * @throws ErrorNoEncontrado si la clave no existe en ct_estado_reservacion
 */
async function obtenerIdEstado(clave: ClaveEstadoReservacion): Promise<number> {
  const estado = await prisma.ct_estado_reservacion.findUnique({
    where: { clave },
  });

  if (!estado) {
    // Si esto falla, el seed no se corrió correctamente
    throw new ErrorNoEncontrado(`Estado de reservación '${clave}'`);
  }

  return estado.id_ct_estado_reservacion;
}

/**
 * Obtiene una reservación completa con todas sus relaciones.
 * Centralizado aquí para no repetir el include en cada método del servicio.
 *
 * @throws ErrorNoEncontrado si la reservación no existe
 */
async function obtenerReservacionOError(idReservacion: number) {
  const reservacion = await prisma.rl_reservacion.findUnique({
    where: { id_rl_reservacion: idReservacion },
    include: {
      // Incluimos el estado para poder leer su clave en la lógica de negocio
      ct_estado_reservacion: true,
      ct_cliente: true,
    },
  });

  if (!reservacion) {
    throw new ErrorNoEncontrado('Reservación');
  }

  return reservacion;
}

// ── Servicio principal ──────────────────────────────────────────────────────

/**
 * Servicio orquestador de pagos.
 *
 * RESPONSABILIDAD: coordina la lógica de negocio entre Stripe (stripe.service.ts),
 * la base de datos (Prisma) y las notificaciones (email.service.ts).
 *
 * Este servicio SÍ conoce las reglas de negocio del restaurante:
 *   - Cuánto cobrar por no-show
 *   - Cuántas horas tiene el cliente para cancelar sin cargo
 *   - Qué email enviar en cada transición de estado
 *
 * No conoce Express — los controllers manejan req/res.
 */
class PagoService {
  /**
   * PASO 1 del flujo: el cliente llenó el formulario y quiere reservar.
   *
   * Crea un intento de pago en Stripe con captura manual y actualiza la
   * reservación con los datos del intento. El frontend usará el client_secret
   * para que Stripe.js capture los datos de la tarjeta de forma segura
   * (los números de tarjeta NUNCA pasan por nuestro servidor).
   *
   * @param idReservacion - ID de la reservación existente en BD
   * @param montoCentavos - Monto a autorizar en centavos
   * @returns client_secret que el frontend necesita para Stripe.js
   * @throws ErrorNoEncontrado si la reservación no existe
   * @throws ErrorValidacion si la reservación ya tiene un pago en curso
   */
  async iniciarPagoPorReservacion(
    idReservacion: number,
    montoCentavos: number,
  ): Promise<{ client_secret: string; clave_publica: string }> {
    const reservacion = await obtenerReservacionOError(idReservacion);

    // Validación de negocio: no iniciar un segundo pago si ya hay uno activo
    if (reservacion.clave_intento_pago) {
      throw new ErrorValidacion(
        'Esta reservación ya tiene un intento de pago en curso. ' +
          'Si el pago falló, contacta al restaurante para reiniciarlo.',
      );
    }

    // Obtener configuración actual del restaurante (monto de penalización, etc.)
    const config = await prisma.ct_configuracion.findFirst();

    // Crear el intento de pago en Stripe con metadatos para rastreo en dashboard
    const intentoPago = await stripeService.crearIntentoPago(montoCentavos, 'mxn', {
      id_reservacion: String(idReservacion),
      id_cliente: String(reservacion.id_ct_cliente),
      nombre_cliente: reservacion.ct_cliente.nombre,
    });

    // Obtener el ID del estado PENDIENTE_PAGO para la FK
    const idEstadoPendiente = await obtenerIdEstado(ESTADO_RESERVACION.PENDIENTE_PAGO);

    // Actualizar la reservación con los datos del intento de pago.
    // Copiamos horas_gracia_cancelacion de la config ACTUAL para que cambios
    // futuros en la config no afecten esta reservación ya creada.
    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: idReservacion },
      data: {
        clave_intento_pago: intentoPago.id,
        estado_pago_stripe: intentoPago.status,
        monto_deposito_centavos: montoCentavos,
        horas_gracia_cancelacion: config?.horas_gracia_cancelacion ?? 24,
        id_ct_estado_reservacion: idEstadoPendiente,
        fecha_mod: new Date(),
      },
    });

    logger.info('[PagoService] Intento de pago creado', {
      idReservacion,
      claveIntentoPago: intentoPago.id,
      montoCentavos,
    });

    // El client_secret es lo que el frontend necesita para que Stripe.js
    // complete el flujo de pago sin que los datos de tarjeta pasen por nuestro server
    return {
      client_secret: intentoPago.client_secret!,
      // También devolvemos la clave pública para que el frontend inicialice Stripe.js
      clave_publica: process.env.STRIPE_PUBLISHABLE_KEY!,
    };
  }

  /**
   * PASO 2 del flujo: Stripe nos notifica vía webhook que el pago fue autorizado.
   *
   * Este método es llamado por el webhook controller cuando llega el evento
   * 'payment_intent.succeeded'. En modo Authorize & Capture, "succeeded" significa
   * que los fondos fueron AUTORIZADOS (reservados), NO cobrados todavía.
   *
   * IDEMPOTENCIA: si Stripe reenvía el webhook (porque no recibió un 200 a tiempo),
   * el @unique en clave_intento_pago en Prisma asegura que no se duplique nada —
   * la segunda actualización fallará silenciosamente al intentar buscar la reservación.
   *
   * @param claveIntentoPago - El ID del PaymentIntent (pi_...) del evento de Stripe
   */
  async confirmarPagoWebhook(claveIntentoPago: string): Promise<void> {
    // Buscar la reservación por el ID del intento de pago (llave de idempotencia)
    const reservacion = await prisma.rl_reservacion.findUnique({
      where: { clave_intento_pago: claveIntentoPago },
      include: {
        ct_estado_reservacion: true,
        ct_cliente: true,
      },
    });

    // Si no existe la reservación, ignoramos el evento (puede ser un test de Stripe)
    if (!reservacion) {
      logger.warn('[PagoService] Webhook: reservación no encontrada para intento de pago', {
        claveIntentoPago,
      });
      return;
    }

    // Idempotencia: si ya está CONFIRMADA, el webhook llegó duplicado — ignorar
    if (reservacion.ct_estado_reservacion.clave === ESTADO_RESERVACION.CONFIRMADA) {
      logger.info('[PagoService] Webhook duplicado ignorado (ya estaba CONFIRMADA)', {
        claveIntentoPago,
      });
      return;
    }

    const idEstadoConfirmada = await obtenerIdEstado(ESTADO_RESERVACION.CONFIRMADA);

    // Actualizar estado a CONFIRMADA y marcar que Stripe requiere captura (aún no cobrado)
    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: reservacion.id_rl_reservacion },
      data: {
        id_ct_estado_reservacion: idEstadoConfirmada,
        // 'requires_capture' = fondos autorizados, esperando la decisión del restaurante
        estado_pago_stripe: 'requires_capture',
        fecha_mod: new Date(),
      },
    });

    // Enviar email de confirmación al cliente
    // Si el envío falla, solo logueamos — no debe bloquear la confirmación
    try {
      const fechaReservacion = new Date(reservacion.fecha_reservacion);
      await emailService.enviarConfirmacionReservacion(reservacion.ct_cliente.correo, {
        nombreCliente: reservacion.ct_cliente.nombre,
        fecha: fechaReservacion.toLocaleDateString('es-MX'),
        hora: fechaReservacion.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        numPersonas: reservacion.num_personas,
      });
    } catch (errorEmail) {
      logger.warn('[PagoService] Email de confirmación no enviado', { errorEmail });
    }

    logger.info('[PagoService] Reservación confirmada por webhook', {
      idReservacion: reservacion.id_rl_reservacion,
      claveIntentoPago,
    });
  }

  /**
   * PROCESO AUTOMÁTICO: marca como no-show y captura el cargo de penalización.
   *
   * Llamado por el cron job en noshow.job.ts cuando detecta reservaciones
   * CONFIRMADAS cuya fecha ya pasó y no fueron marcadas como COMPLETADAS.
   *
   * @param idReservacion - ID de la reservación a procesar como no-show
   */
  async procesarNoShow(idReservacion: number): Promise<void> {
    const reservacion = await obtenerReservacionOError(idReservacion);

    // Validación defensiva: solo procesar si está CONFIRMADA
    if (reservacion.ct_estado_reservacion.clave !== ESTADO_RESERVACION.CONFIRMADA) {
      logger.warn('[PagoService] procesarNoShow: la reservación no está en estado CONFIRMADA', {
        idReservacion,
        estadoActual: reservacion.ct_estado_reservacion.clave,
      });
      return;
    }

    // Obtener el monto de penalización configurado en ct_configuracion
    const config = await prisma.ct_configuracion.findFirst();
    const montoPenalizacion = config?.monto_penalizacion_centavos ?? 20000; // Default: $200 MXN

    // Capturar el cargo en Stripe (cobrar la penalización)
    if (reservacion.clave_intento_pago) {
      await stripeService.capturarPago(reservacion.clave_intento_pago, montoPenalizacion);
    }

    const idEstadoNoShow = await obtenerIdEstado(ESTADO_RESERVACION.NO_SHOW);

    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: idReservacion },
      data: {
        id_ct_estado_reservacion: idEstadoNoShow,
        estado_pago_stripe: 'captured',
        fecha_mod: new Date(),
      },
    });

    logger.info('[PagoService] No-show procesado — cargo capturado', {
      idReservacion,
      montoPenalizacion,
    });

    // Notificar al cliente (plantilla en BD: RESERVA_NO_SHOW)
    try {
      await emailService.enviarConPlantillaPublica(
        reservacion.ct_cliente.correo,
        'RESERVA_NO_SHOW',
        {
          nombreCliente: reservacion.ct_cliente.nombre,
          monto: `$${(montoPenalizacion / 100).toFixed(2)} MXN`,
        },
      );
    } catch (errorEmail) {
      logger.warn('[PagoService] Email de no-show no enviado', { errorEmail });
    }
  }

  /**
   * Cancela una reservación y aplica la política de cancelación:
   *
   *   - Si cancela ANTES del período de gracia (horas_gracia_cancelacion):
   *     → Libera la autorización en Stripe (sin cargo) → estado CANCELADA
   *
   *   - Si cancela DESPUÉS del período de gracia:
   *     → Captura el cargo de penalización → estado CANCELADA_CON_CARGO
   *
   * @param idReservacion - ID de la reservación a cancelar
   * @param idUsuarioMod - ID del usuario que está ejecutando la cancelación (auditoría)
   */
  async cancelarReservacion(idReservacion: number, idUsuarioMod: number): Promise<void> {
    const reservacion = await obtenerReservacionOError(idReservacion);

    const estadoActual = reservacion.ct_estado_reservacion.clave;

    // Solo se pueden cancelar reservaciones en estos estados
    const estadosCancelables = [ESTADO_RESERVACION.PENDIENTE_PAGO, ESTADO_RESERVACION.CONFIRMADA];
    if (!estadosCancelables.includes(estadoActual as (typeof estadosCancelables)[number])) {
      throw new ErrorValidacion(
        `No se puede cancelar una reservación en estado '${reservacion.ct_estado_reservacion.nombre}'.`,
      );
    }

    // ── Evaluar política de cancelación ──────────────────────────────────────
    const ahora = new Date();
    const fechaReservacion = new Date(reservacion.fecha_reservacion);

    // Calcular cuántas horas faltan para la reservación
    const horasRestantes = (fechaReservacion.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    // Determinar si aún está dentro del período de gracia
    const cancelacionEsGratuita = horasRestantes >= reservacion.horas_gracia_cancelacion;

    if (reservacion.clave_intento_pago) {
      if (cancelacionEsGratuita) {
        // Sin cargo: liberar la autorización en Stripe
        await stripeService.liberarAutorizacion(reservacion.clave_intento_pago);
      } else {
        // Con cargo: capturar la penalización configurada en ct_configuracion
        const config = await prisma.ct_configuracion.findFirst();
        const montoPenalizacion = config?.monto_penalizacion_centavos ?? 20000;
        await stripeService.capturarPago(reservacion.clave_intento_pago, montoPenalizacion);
      }
    }

    // Determinar el estado final según si hubo cargo o no
    const claveEstadoFinal = cancelacionEsGratuita
      ? ESTADO_RESERVACION.CANCELADA
      : ESTADO_RESERVACION.CANCELADA_CON_CARGO;

    const idEstadoFinal = await obtenerIdEstado(claveEstadoFinal);

    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: idReservacion },
      data: {
        id_ct_estado_reservacion: idEstadoFinal,
        estado_pago_stripe: cancelacionEsGratuita ? 'released' : 'captured',
        id_ct_usuario_mod: idUsuarioMod,
        fecha_mod: new Date(),
      },
    });

    logger.info('[PagoService] Reservación cancelada', {
      idReservacion,
      cancelacionEsGratuita,
      horasRestantes: horasRestantes.toFixed(1),
      claveEstadoFinal,
    });

    // Enviar email según el tipo de cancelación
    const clavePlantilla = cancelacionEsGratuita
      ? 'RESERVA_CANCELADA_SIN_CARGO'
      : 'RESERVA_CANCELADA_CON_CARGO';

    try {
      const config = await prisma.ct_configuracion.findFirst();
      await emailService.enviarConPlantillaPublica(reservacion.ct_cliente.correo, clavePlantilla, {
        nombreCliente: reservacion.ct_cliente.nombre,
        monto: cancelacionEsGratuita
          ? '$0'
          : `$${((config?.monto_penalizacion_centavos ?? 20000) / 100).toFixed(2)} MXN`,
      });
    } catch (errorEmail) {
      logger.warn('[PagoService] Email de cancelación no enviado', { errorEmail });
    }
  }

  /**
   * Marca una reservación como COMPLETADA cuando el cliente asistió.
   * Libera la autorización en Stripe (sin cargo).
   *
   * @param idReservacion - ID de la reservación completada
   * @param idUsuarioMod - ID del usuario (mesero/admin) que la marca como completada
   */
  async completarReservacion(idReservacion: number, idUsuarioMod: number): Promise<void> {
    const reservacion = await obtenerReservacionOError(idReservacion);

    if (reservacion.ct_estado_reservacion.clave !== ESTADO_RESERVACION.CONFIRMADA) {
      throw new ErrorValidacion('Solo se pueden completar reservaciones en estado CONFIRMADA.');
    }

    // El cliente asistió → liberar la autorización (no cobrar nada)
    if (reservacion.clave_intento_pago) {
      await stripeService.liberarAutorizacion(reservacion.clave_intento_pago);
    }

    const idEstadoCompletada = await obtenerIdEstado(ESTADO_RESERVACION.COMPLETADA);

    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: idReservacion },
      data: {
        id_ct_estado_reservacion: idEstadoCompletada,
        estado_pago_stripe: 'released',
        id_ct_usuario_mod: idUsuarioMod,
        fecha_mod: new Date(),
      },
    });

    logger.info('[PagoService] Reservación completada — autorización liberada', { idReservacion });
  }
}

export default new PagoService();
