import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';

import {
  confirmarReservacionSchema,
  recuperarPasswordSchema,
  enviarPruebaSchema,
} from '@/schemas/email.schema';

import { okResponse, errorResponse } from '@/docs/respuestas.docs';

export const registerEmailDocs = (registry: OpenAPIRegistry) => {
  // ── CONFIRMAR RESERVACIÓN ───────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/emails/confirmar-reservacion',
    tags: ['Email'],
    summary: 'Enviar confirmación de reservación',
    request: {
      body: {
        content: {
          'application/json': {
            schema: confirmarReservacionSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(confirmarReservacionSchema.shape.body),
      400: errorResponse('Error al enviar correo'),
    },
  });

  // ── RECUPERAR PASSWORD ──────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/emails/recuperar-password',
    tags: ['Email'],
    summary: 'Enviar link de recuperación',
    request: {
      body: {
        content: {
          'application/json': {
            schema: recuperarPasswordSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(recuperarPasswordSchema.shape.body),
    },
  });

  // ── EMAIL DE PRUEBA ─────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/emails/prueba',
    tags: ['Email'],
    summary: 'Enviar correo de prueba',
    request: {
      body: {
        content: {
          'application/json': {
            schema: enviarPruebaSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(enviarPruebaSchema.shape.body),
    },
  });
};
