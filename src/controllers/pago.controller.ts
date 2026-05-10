import type { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import pagoService from '@/services/pago.service';
import stripeService from '@/services/stripe.service';
import { logger } from '@/utils/logger.utils';

/**
 * Controlador de pagos.
 *
 * Responsabilidad: manejar req/res de Express y delegar a pago.service.ts.
 * Este controller NO contiene lógica de negocio — solo:
 *   1. Extrae datos del request
 *   2. Llama al servicio correspondiente
 *   3. Formatea la respuesta HTTP
 *   4. Maneja errores con el helper centralizado
 */
class PagoController {
  /**
   * POST /api/reservaciones/:id/pago
   *
   * Inicia el proceso de pago para una reservación existente.
   * Devuelve el client_secret que el frontend necesita para que Stripe.js
   * capture los datos de la tarjeta de forma segura.
   *
   * El frontend debe:
   *   1. Recibir este client_secret
   *   2. Usar stripe.confirmCardPayment(client_secret, { payment_method: ... })
   *   3. Stripe notificará a nuestro webhook cuando el pago sea autorizado
   */
  iniciarPago = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idReservacion = Number(req.params.id);
      const { monto_centavos } = req.body as { monto_centavos: number };

      const resultado = await pagoService.iniciarPagoPorReservacion(idReservacion, monto_centavos);

      res.status(StatusCodes.CREATED).json({
        success: true,
        mensaje: 'Intento de pago creado. Complete el pago con Stripe.js en el frontend.',
        datos: resultado,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * POST /api/webhooks/stripe
   *
   * Endpoint que recibe eventos de Stripe. CONSIDERACIONES IMPORTANTES:
   *
   * 1. NO usa JWT — Stripe llama directamente a este endpoint sin autenticación JWT.
   *    La seguridad se garantiza verificando la firma HMAC del header 'stripe-signature'.
   *
   * 2. Necesita el body RAW (Buffer) para verificar la firma.
   *    La ruta usa express.raw() en lugar de express.json().
   *
   * 3. DEBE responder con 200 rápidamente — si Stripe no recibe 200 en ~30 seg,
   *    reintentará el evento. Nuestro código es idempotente por eso.
   *
   * 4. Solo procesamos los eventos que nos interesan; ignoramos el resto.
   */
  manejarWebhook = async (req: Request, res: Response): Promise<void> => {
    // Obtener la firma del header enviado por Stripe
    const firma = req.headers['stripe-signature'] as string;

    if (!firma) {
      logger.warn('[PagoController] Webhook recibido sin stripe-signature — ignorado');
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Firma requerida' });
      return;
    }

    let evento;
    try {
      // Verificar la firma HMAC — lanza error si la firma no es válida
      // req.body es un Buffer porque la ruta usa express.raw()
      evento = stripeService.construirEvento(req.body as Buffer, firma);
    } catch (errorFirma) {
      logger.warn('[PagoController] Firma de webhook inválida', { errorFirma });
      res.status(StatusCodes.BAD_REQUEST).json({ error: 'Firma inválida' });
      return;
    }

    logger.info('[PagoController] Webhook de Stripe recibido', { tipo: evento.type });

    // Procesar el evento según su tipo
    // Solo manejamos los eventos relevantes para nuestro flujo de pagos
    try {
      switch (evento.type) {
        case 'payment_intent.succeeded':
          // En modo Authorize & Capture, 'succeeded' = autorización exitosa (NO cobro)
          // El cliente autorizó su tarjeta → confirmar la reservación
          await pagoService.confirmarPagoWebhook(evento.data.object.id);
          break;

        case 'payment_intent.payment_failed':
          // El cliente intentó pagar pero la tarjeta fue rechazada
          // Logueamos para el dashboard — no cambiamos estado (puede reintentar)
          logger.warn('[PagoController] Pago fallido', {
            claveIntentoPago: evento.data.object.id,
            codigoError: evento.data.object.last_payment_error?.code,
          });
          break;

        default:
          // Evento no relevante para nuestro flujo — ignorar silenciosamente
          logger.debug('[PagoController] Evento de Stripe ignorado', { tipo: evento.type });
      }
    } catch (errorProcesamiento) {
      // Error al procesar el evento — logueamos pero respondemos 200 de todas formas
      // Si respondemos con error (4xx/5xx), Stripe reintentará indefinidamente
      logger.error('[PagoController] Error procesando webhook', { errorProcesamiento });
    }

    // Siempre responder 200 para que Stripe sepa que recibimos el evento
    res.status(StatusCodes.OK).json({ recibido: true });
  };

  /**
   * POST /api/reservaciones/:id/cancelar
   *
   * Cancela una reservación aplicando la política de cancelación:
   * - Sin cargo si cancela con suficiente antelación (horas_gracia_cancelacion)
   * - Con penalización si cancela tarde o en el mismo día
   */
  cancelar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idReservacion = Number(req.params.id);
      // El usuario autenticado que ejecuta la cancelación (para auditoría)
      const idUsuarioMod = req.usuario!.id_ct_usuario;

      await pagoService.cancelarReservacion(idReservacion, idUsuarioMod);

      res.status(StatusCodes.OK).json({
        success: true,
        mensaje: 'Reservación cancelada. Se evaluó la política de cancelación.',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * PATCH /api/reservaciones/:id/completar
   *
   * Marca una reservación como completada (el cliente asistió).
   * Libera la autorización de Stripe sin cobrar nada.
   * Solo disponible para usuarios con permiso RESERVACIONES_EDITAR.
   */
  completar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const idReservacion = Number(req.params.id);
      const idUsuarioMod = req.usuario!.id_ct_usuario;

      await pagoService.completarReservacion(idReservacion, idUsuarioMod);

      res.status(StatusCodes.OK).json({
        success: true,
        mensaje: 'Reservación completada. Autorización liberada sin cargo.',
      });
    } catch (error) {
      next(error);
    }
  };
}

export default new PagoController();
