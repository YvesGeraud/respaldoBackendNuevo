import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { loginSchema } from '@/schemas/auth.schema';
import { okResponse, errorResponse } from '@/docs/respuestas.docs';
import { z } from '@/zod-extended';

export const registerAuthDocs = (registry: OpenAPIRegistry) => {
  // ── LOGIN ───────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/auth/login',
    tags: ['Auth'],
    summary: 'Iniciar sesión',
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(
        loginSchema.shape.body.extend({
          accessToken: z.string(),
        }),
      ),
      401: errorResponse('Credenciales inválidas'),
    },
  });

  // ── REFRESH ─────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/auth/refresh',
    tags: ['Auth'],
    summary: 'Refrescar tokens',
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(z.object({ accessToken: z.string() })),
      401: errorResponse('Refresh token inválido o expirado'),
    },
  });

  // ── LOGOUT (opcional pero recomendado) ──────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/auth/logout',
    tags: ['Auth'],
    summary: 'Cerrar sesión',
    request: {
      body: {
        content: {
          'application/json': {
            schema: z.object({}),
          },
        },
      },
    },
    responses: {
      200: okResponse(z.object({})),
    },
  });
};
