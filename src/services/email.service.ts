import { prisma } from '@/config/database.config';
import { sendEmail } from '@/utils/email.utils';
import { logger } from '@/utils/logger.utils';

/**
 * Servicio de correo mejorado.
 * Ahora las plantillas se gestionan desde la base de datos (ct_plantilla_correo),
 * lo que permite cambios dinámicos sin tocar el código.
 */
class EmailService {
  /**
   * Procesa una plantilla reemplazando los marcadores {{variable}} por valores reales.
   */
  private procesarTemplate(html: string, datos: Record<string, string | number>): string {
    return html.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const valor = datos[key];
      return valor !== undefined ? String(valor) : '';
    });
  }

  /**
   * Obtiene una plantilla de la base de datos por su clave única.
   */
  private async obtenerPlantilla(clave: string) {
    const plantilla = await prisma.ct_plantilla_correo.findUnique({
      where: { clave, estado: true },
    });

    if (!plantilla) {
      logger.error(`[EmailService] Plantilla no encontrada o inactiva: ${clave}`);
      return null;
    }

    return plantilla;
  }

  /**
   * Envío genérico basado en plantillas de base de datos.
   */
  private async enviarConPlantilla(
    to: string,
    clave: string,
    datos: Record<string, string | number>,
  ) {
    const plantilla = await this.obtenerPlantilla(clave);
    if (!plantilla) return { success: false, error: 'Plantilla no encontrada' };

    const html = this.procesarTemplate(plantilla.contenido_html, datos);
    const subject = this.procesarTemplate(plantilla.asunto, datos);

    const resultado = await sendEmail({
      to,
      subject,
      html,
    });

    if (!resultado.success) {
      logger.warn(`No se pudo enviar correo (${clave})`, { email: to, error: resultado.error });
    }

    return resultado;
  }

  // ── Métodos Específicos ──────────────────────────────────────────────────

  /**
   * Notifica al usuario que su contraseña ha sido cambiada.
   */
  async enviarNotificacionCambioPassword(email: string, usuario: string) {
    return this.enviarConPlantilla(email, 'CAMBIO_CONTRASENA', { usuario });
  }

  /**
   * Envía las nuevas credenciales después de un reseteo administrativo.
   */
  async enviarReseteoPassword(email: string, usuario: string, contrasena: string) {
    return this.enviarConPlantilla(email, 'RESETEO_CONTRASENA', { usuario, contrasena });
  }

  /**
   * Envía correo de confirmación de reservación (requiere plantilla en BD: RESERVA_CONFIRMADA).
   */
  async enviarConfirmacionReservacion(
    email: string,
    datos: { nombreCliente: string; fecha: string; hora: string; numPersonas: number },
  ) {
    return this.enviarConPlantilla(email, 'RESERVA_CONFIRMADA', {
      usuario: datos.nombreCliente,
      ...datos,
    });
  }

  /**
   * Envía correo con link para restablecer contraseña.
   */
  async enviarLinkRecuperarPassword(email: string, token: string, baseUrl?: string) {
    const url = baseUrl ?? process.env.APP_URL ?? 'http://localhost:4200';
    const link = `${url}/restablecer-password?token=${encodeURIComponent(token)}`;
    return this.enviarConPlantilla(email, 'RECUPERAR_PASSWORD', { link });
  }

  /**
   * Envía un correo de prueba.
   */
  async enviarPrueba(email: string) {
    return sendEmail({
      to: email,
      subject: 'Correo de prueba - USET',
      html: '<h1>Prueba de Conexión</h1><p>El sistema de correos está funcionando correctamente.</p>',
    });
  }
}

export default new EmailService();
