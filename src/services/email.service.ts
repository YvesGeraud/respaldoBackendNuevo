import path from 'path';
import fs from 'fs';
import { sendEmail } from '@/utils/mailer.utils';
import { logger } from '@/utils/logger.utils';

// ── Directorio de plantillas (desde la raíz del proyecto) ───────────────────────

const TEMPLATES_DIR = path.resolve(process.cwd(), 'src/templates/email');

/**
 * Carga y renderiza una plantilla HTML reemplazando {{variable}} por los datos.
 */
function renderizarPlantilla(
  nombreArchivo: string,
  datos: Record<string, string | number>,
): string {
  const ruta = path.join(TEMPLATES_DIR, nombreArchivo);
  const plantilla = fs.readFileSync(ruta, 'utf-8');
  return plantilla.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const valor = datos[key];
    return valor !== undefined ? String(valor) : '';
  });
}

/**
 * Envuelve el contenido en la plantilla base.
 */
function envolverEnBase(asunto: string, contenido: string): string {
  const basePath = path.join(TEMPLATES_DIR, 'base.html');
  const base = fs.readFileSync(basePath, 'utf-8');
  return base
    .replace('{{asunto}}', asunto)
    .replace('{{contenido}}', contenido);
}

// ── Servicio ───────────────────────────────────────────────────────────────────

/**
 * Servicio de correo. Carga plantillas, renderiza con datos y envía via mailer.utils.
 *
 * Uso desde otros servicios (ej. reservacion.service):
 *
 *   import emailService from '@/services/email.service';
 *
 *   // Después de crear la reservación en BD:
 *   await emailService.enviarConfirmacionReservacion(emailCliente, {
 *     nombreCliente,
 *     fecha: reservacion.fecha,
 *     hora,
 *     numPersonas: reservacion.num_personas,
 *   });
 *
 * El envío se hace en background; si falla se registra en logs pero no interrumpe
 * la operación principal (crear reservación sigue respondiendo 201).
 */
class EmailService {
  /**
   * Envía correo de confirmación de reservación.
   */
  async enviarConfirmacionReservacion(
    emailCliente: string,
    datos: { nombreCliente: string; fecha: string; hora: string; numPersonas: number },
  ) {
    const contenido = renderizarPlantilla('reservacion.html', datos);
    const html = envolverEnBase('Reservación confirmada', contenido);
    const resultado = await sendEmail({
      to: emailCliente,
      subject: 'Reservación confirmada - Restaurante',
      html,
    });
    if (!resultado.success) {
      logger.warn('No se pudo enviar correo de confirmación', { email: emailCliente, error: resultado.error });
    }
    return resultado;
  }

  /**
   * Envía correo con link para restablecer contraseña.
   */
  async enviarLinkRecuperarPassword(email: string, token: string, baseUrl?: string) {
    const url = baseUrl ?? process.env.APP_URL ?? 'http://localhost:4200';
    const link = `${url}/restablecer-password?token=${encodeURIComponent(token)}`;
    const contenido = renderizarPlantilla('recuperar-password.html', { link });
    const html = envolverEnBase('Restablecer contraseña', contenido);
    const resultado = await sendEmail({
      to: email,
      subject: 'Restablecer contraseña - Restaurante',
      html,
    });
    if (!resultado.success) {
      logger.warn('No se pudo enviar correo de recuperación', { email, error: resultado.error });
    }
    return resultado;
  }

  /**
   * Envía un correo de prueba (útil para verificar configuración SMTP).
   */
  async enviarPrueba(email: string) {
    const contenido = '<p>Si recibiste este correo, la configuración SMTP está correcta.</p>';
    const html = envolverEnBase('Correo de prueba', contenido);
    return sendEmail({
      to: email,
      subject: 'Correo de prueba - Restaurante',
      html,
    });
  }
}

export default new EmailService();
