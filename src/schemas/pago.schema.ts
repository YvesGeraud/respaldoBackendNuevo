import { z } from '@/zod-extended';

// ── Constantes de dominio ───────────────────────────────────────────────────
// Claves técnicas de los estados de reservación (coinciden con el campo 'clave'
// en la tabla ct_estado_reservacion).
// Se definen aquí como constantes para evitar magic strings en todo el código.
export const ESTADO_RESERVACION = {
  PENDIENTE_PAGO: 'PENDIENTE_PAGO', // Formulario enviado, esperando pago
  CONFIRMADA: 'CONFIRMADA', // Pago autorizado por Stripe (webhook recibido)
  COMPLETADA: 'COMPLETADA', // Cliente asistió, autorización liberada
  NO_SHOW: 'NO_SHOW', // No se presentó, penalización capturada
  CANCELADA: 'CANCELADA', // Canceló a tiempo, sin cargo
  CANCELADA_CON_CARGO: 'CANCELADA_CON_CARGO', // Canceló tarde, penalización capturada
} as const;

// Tipo derivado del objeto de constantes — permite uso en TypeScript con type-safety
export type ClaveEstadoReservacion = (typeof ESTADO_RESERVACION)[keyof typeof ESTADO_RESERVACION];

// ── Schema: iniciar pago ────────────────────────────────────────────────────
/**
 * Valida el body del endpoint POST /api/reservaciones/:id/pago.
 * El cliente envía el monto y la moneda; el backend crea el PaymentIntent en Stripe.
 */
export const iniciarPagoSchema = z.object({
  body: z.object({
    // Monto en centavos — Stripe trabaja siempre con enteros sin decimales.
    // mínimo 100 centavos = $1 MXN (límite mínimo de Stripe)
    monto_centavos: z
      .number({ error: 'El monto es obligatorio' })
      .int('El monto debe ser un número entero (centavos)')
      .positive('El monto debe ser mayor a cero')
      .min(100, 'El monto mínimo es 100 centavos ($1 MXN)'),

    // Código ISO de la moneda — default MXN para el contexto del restaurante
    moneda: z.string().default('mxn'),
  }),
  params: z.object({
    // ID de la reservación a la que se le va a iniciar el pago
    id: z.coerce.number().int().positive(),
  }),
});

// ── Schema: cancelar reservación ───────────────────────────────────────────
/**
 * Valida el body del endpoint POST /api/reservaciones/:id/cancelar.
 * No requiere body obligatorio — el backend calcula si aplica cargo según la política.
 */
export const cancelarReservacionSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
});

// Tipos TypeScript derivados de los schemas
export type IniciarPagoDTO = z.infer<typeof iniciarPagoSchema>['body'];
export type CancelarReservacionParams = z.infer<typeof cancelarReservacionSchema>['params'];
