import { prisma } from '@/config/database.config';
import { logger } from '@/utils/logger.utils';
import pagoService from '@/services/pago.service';
import { ESTADO_RESERVACION } from '@/schemas/pago.schema';

// ── Configuración del job ───────────────────────────────────────────────────

/**
 * Tiempo máximo de espera (en minutos) después de la hora de reservación
 * antes de considerarla un no-show.
 *
 * Ejemplo: si la reservación es a las 20:00 y MARGEN_NO_SHOW_MINUTOS = 30,
 * el cron a las 20:00 NO procesará esa reservación todavía.
 * La procesará en la siguiente ejecución cuando ya sean >= 20:30.
 *
 * Esto evita marcar como no-show a clientes que llegaron un poco tarde.
 */
const MARGEN_NO_SHOW_MINUTOS = 30;

// ── Job ────────────────────────────────────────────────────────────────────

/**
 * Detecta y procesa reservaciones no-show.
 *
 * LÓGICA:
 *   1. Busca reservaciones en estado CONFIRMADA
 *   2. Cuya fecha_reservacion + margen de gracia ya pasó
 *   3. Las marca como NO_SHOW y captura el cargo de penalización en Stripe
 *
 * CUÁNDO EJECUTAR:
 *   Cada hora desde setup.ts con setInterval.
 *   El margen de gracia (MARGEN_NO_SHOW_MINUTOS) evita falsos positivos.
 *
 * FAULT TOLERANCE:
 *   Los errores individuales de cada reservación se loguean pero NO detienen
 *   el procesamiento de las demás reservaciones del batch.
 *   Tampoco propaga errores al llamador — un job de background no debe
 *   tumbar el servidor si algo sale mal.
 *
 * @example
 * // En setup.ts:
 * setInterval(() => void procesarNoShows(), 60 * 60 * 1_000); // cada hora
 */
export async function procesarNoShows(): Promise<void> {
  const ahora = new Date();

  // Calcular el límite temporal: reservaciones cuya hora + margen ya pasó
  // Esto da MARGEN_NO_SHOW_MINUTOS de gracia al cliente para llegar
  const limiteNoShow = new Date(ahora.getTime() - MARGEN_NO_SHOW_MINUTOS * 60 * 1_000);

  try {
    // Obtener el ID del estado CONFIRMADA para filtrar en la query
    const estadoConfirmada = await prisma.ct_estado_reservacion.findUnique({
      where: { clave: ESTADO_RESERVACION.CONFIRMADA },
    });

    if (!estadoConfirmada) {
      logger.error('[noshow.job] Estado CONFIRMADA no encontrado en ct_estado_reservacion. ' +
        'Verifica que el seed se ejecutó correctamente.');
      return;
    }

    // Buscar reservaciones CONFIRMADAS cuya fecha ya pasó (incluyendo el margen)
    const reservacionesPendientes = await prisma.rl_reservacion.findMany({
      where: {
        id_ct_estado_reservacion: estadoConfirmada.id_ct_estado_reservacion,
        // La fecha de reservación + margen debe ser anterior a ahora
        fecha_reservacion: { lt: limiteNoShow },
        // Solo las que tienen pago activo (clave_intento_pago presente)
        clave_intento_pago: { not: null },
      },
      select: {
        id_rl_reservacion: true,
        fecha_reservacion: true,
        ct_cliente: { select: { nombre: true } },
      },
    });

    if (reservacionesPendientes.length === 0) {
      // Log de nivel debug para no saturar los logs en ejecuciones normales
      logger.debug('[noshow.job] Sin reservaciones no-show en esta ejecución');
      return;
    }

    logger.info(`[noshow.job] Procesando ${reservacionesPendientes.length} no-shows`);

    // Procesar cada reservación de forma independiente
    // Si una falla, continuamos con las demás (no usamos Promise.all para esto)
    for (const reservacion of reservacionesPendientes) {
      try {
        await pagoService.procesarNoShow(reservacion.id_rl_reservacion);
        logger.info('[noshow.job] No-show procesado', {
          id: reservacion.id_rl_reservacion,
          cliente: reservacion.ct_cliente.nombre,
          fechaReservacion: reservacion.fecha_reservacion,
        });
      } catch (errorReservacion) {
        // Error individual: solo loguear, no detener el batch
        logger.error('[noshow.job] Error procesando reservación', {
          idReservacion: reservacion.id_rl_reservacion,
          error: errorReservacion,
        });
      }
    }
  } catch (errorGeneral) {
    // Error general del job (ej: BD no disponible): loguear sin propagar
    // Un job de background NUNCA debe tumbar el servidor
    logger.error('[noshow.job] Error general en procesamiento de no-shows', {
      error: errorGeneral,
    });
  }
}
