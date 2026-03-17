import type { Request, Response } from 'express';
import emailService from '@/services/email.service';
import { responder } from '@/utils/respuestas.utils';
import type {
  ConfirmarReservacionDTO,
  RecuperarPasswordDTO,
  EnviarPruebaDTO,
} from '@/schemas/email.schema';

/**
 * Rutas de correo. Sirven para:
 * - Probar envío manual (desarrollo/admin)
 * - Endpoints de uso interno o desde el frontend
 *
 * En producción, el servicio suele llamarse desde otros módulos
 * (ej. reservacion.service tras crear la reservación) sin pasar por estas rutas.
 */
class EmailController {
  /** POST /emails/confirmar-reservacion — Envía confirmación de reservación */
  async confirmarReservacion(req: Request, res: Response): Promise<void> {
    const body = req.body as ConfirmarReservacionDTO;
    const resultado = await emailService.enviarConfirmacionReservacion(body.email, {
      nombreCliente: body.nombreCliente,
      fecha: body.fecha,
      hora: body.hora,
      numPersonas: body.numPersonas,
    });
    if (resultado.success) {
      responder.ok(res, { messageId: resultado.messageId }, 'Correo enviado');
    } else {
      responder.ok(
        res,
        { enviado: false, error: resultado.error },
        'Reservación procesada, pero no se pudo enviar el correo',
      );
    }
  }

  /** POST /emails/recuperar-password — Envía link de recuperación */
  async recuperarPassword(req: Request, res: Response): Promise<void> {
    const body = req.body as RecuperarPasswordDTO;
    const resultado = await emailService.enviarLinkRecuperarPassword(
      body.email,
      body.token,
      body.baseUrl,
    );
    if (resultado.success) {
      responder.ok(res, { enviado: true }, 'Correo enviado');
    } else {
      // Por seguridad no revelar si el email existe; responder igual
      responder.ok(res, { enviado: false }, 'Si el correo existe, recibirás el enlace');
    }
  }

  /** POST /emails/prueba — Envía correo de prueba (configuración SMTP) */
  async enviarPrueba(req: Request, res: Response): Promise<void> {
    const { email } = req.body as EnviarPruebaDTO;
    const resultado = await emailService.enviarPrueba(email);
    if (resultado.success) {
      responder.ok(res, { messageId: resultado.messageId }, 'Correo de prueba enviado');
    } else {
      responder.ok(res, { enviado: false, error: resultado.error }, 'No se pudo enviar');
    }
  }
}

export default new EmailController();
