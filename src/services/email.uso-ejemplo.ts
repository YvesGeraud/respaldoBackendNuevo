/**
 * EJEMPLO: Uso del email service desde otros servicios
 *
 * Este archivo NO se importa en producción. Sirve solo como documentación
 * de cómo integrar el envío de correos en tus otros módulos.
 *
 * Puedes borrarlo cuando ya no lo necesites.
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import emailService from '@/services/email.service';

// ── Ejemplo 1: Reservación (desde reservacion.service) ─────────────────────────
//
// Cuando crees el módulo de reservaciones, después de guardar en BD:
//
// async crearReservacion(datos: CrearReservacionDTO) {
//   const reservacion = await prisma.dt_reservacion.create({ data: {...} });
//
//   // Envío en background — no bloquea la respuesta
//   emailService.enviarConfirmacionReservacion(datos.emailCliente, {
//     nombreCliente: datos.nombreCliente,
//     fecha: format(reservacion.fecha, 'dd/MM/yyyy'),
//     hora: format(reservacion.fecha, 'HH:mm'),
//     numPersonas: reservacion.num_personas,
//   }).catch(() => {}); // Opcional: si falla, ya está logueado en el service
//
//   return reservacion;
// }

// ── Ejemplo 2: Recuperar contraseña (desde auth.service) ───────────────────────
//
// async solicitarRecuperarPassword(email: string) {
//   const usuario = await prisma.ct_usuario.findUnique({ where: { email } });
//   if (!usuario) return; // Por seguridad, no revelar si existe
//
//   const token = generarTokenRecuperacion(usuario.id_usuario);
//   await guardarTokenEnBD(token, usuario.id_usuario);
//
//   await emailService.enviarLinkRecuperarPassword(email, token);
//   // El frontend redirige a /restablecer-password?token=xxx
// }

// ── Ejemplo 3: Llamada síncrona (esperar el resultado) ─────────────────────────
//
// const resultado = await emailService.enviarConfirmacionReservacion(...);
// if (!resultado.success) {
//   logger.warn('Correo no enviado', { error: resultado.error });
//   // Decides: ¿responder 201 igual o 500?
//   // Recomendación: 201 — la reservación se creó; el correo es secundario
// }
