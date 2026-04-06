import nodemailer from 'nodemailer';
import { mailConfig } from '@/config/email.config';
import { logger } from '@/utils/logger.utils';
import type { SendEmailOptions, SendEmailResponse } from '@/types/email.types';

const transporter = nodemailer.createTransport({
  host: mailConfig.host,
  port: mailConfig.port,
  secure: mailConfig.secure,
  auth: mailConfig.auth.user ? mailConfig.auth : undefined,
});

/**
 * Envía un correo de forma genérica.
 * La lógica de negocio (qué enviar, plantillas, etc.) va en las rutas/controladores.
 *
 * @example
 * // En un controlador de reservación
 * const html = `<h1>Hola ${nombre}</h1><p>Tu reservación para ${fecha} está confirmada.</p>`;
 * const res = await sendEmail({
 *   to: clienteEmail,
 *   subject: 'Reservación confirmada - Restaurante',
 *   html,
 * });
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResponse> {
  try {
    const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
    const info = await transporter.sendMail({
      from: options.from ?? mailConfig.from,
      to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });

    logger.info('Correo enviado', { messageId: info.messageId, to });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    const msg = (error as Error).message;
    logger.error('Error enviando correo', { error: msg });
    return { success: false, error: msg };
  }
}
