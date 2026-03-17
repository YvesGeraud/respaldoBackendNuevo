/**
 * OpenAPI spec generada desde los schemas Zod.
 * Una sola fuente de verdad: los schemas de validación definen la documentación.
 */
import {
  OpenAPIRegistry,
  OpenApiGeneratorV3,
} from '@asteasolutions/zod-to-openapi';
import {
  crearPlatilloSchema,
  actualizarPlatilloSchema,
  idParamSchema,
  filtrosPlatillosSchema,
  crearPlatillosLoteSchema,
} from '@/schemas/platillo.schema';
import { loginSchema } from '@/schemas/auth.schema';
import {
  confirmarReservacionSchema,
  recuperarPasswordSchema,
  enviarPruebaSchema,
} from '@/schemas/email.schema';
import { config } from '@/config/servidor.config';

const registry = new OpenAPIRegistry();

// ── Health ────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/health',
  summary: 'Health check',
  tags: ['Sistema'],
  responses: { 200: { description: 'Servicio operativo' } },
});

// ── Auth ──────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/auth/login',
  summary: 'Iniciar sesión',
  tags: ['Auth'],
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
    200: { description: 'Login exitoso, cookies set' },
    401: { description: 'Credenciales inválidas' },
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/auth/refresh',
  summary: 'Refrescar tokens',
  tags: ['Auth'],
  responses: {
    200: { description: 'Tokens renovados' },
    401: { description: 'Refresh token inválido o expirado' },
  },
});

// ── Platillos ──────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'get',
  path: '/api/platillos',
  summary: 'Listar platillos',
  tags: ['Platillos'],
  request: { query: filtrosPlatillosSchema.shape.query },
  responses: { 200: { description: 'Lista paginada de platillos' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/platillos',
  summary: 'Crear platillo',
  tags: ['Platillos'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: crearPlatilloSchema.shape.body,
        },
      },
    },
  },
  responses: { 201: { description: 'Platillo creado' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/platillos/batch',
  summary: 'Crear platillos en lote',
  tags: ['Platillos'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: crearPlatillosLoteSchema.shape.body,
        },
      },
    },
  },
  responses: { 201: { description: 'Lote procesado' } },
});

registry.registerPath({
  method: 'get',
  path: '/api/platillos/{id}',
  summary: 'Obtener platillo por ID',
  tags: ['Platillos'],
  request: { params: idParamSchema.shape.params },
  responses: {
    200: { description: 'Platillo encontrado' },
    404: { description: 'No encontrado' },
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/platillos/{id}',
  summary: 'Actualizar platillo',
  tags: ['Platillos'],
  request: {
    params: actualizarPlatilloSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: actualizarPlatilloSchema.shape.body,
        },
      },
    },
  },
  responses: {
    200: { description: 'Platillo actualizado' },
    404: { description: 'No encontrado' },
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/platillos/{id}',
  summary: 'Eliminar platillo (soft delete)',
  tags: ['Platillos'],
  request: { params: idParamSchema.shape.params },
  responses: {
    204: { description: 'Eliminado' },
    404: { description: 'No encontrado' },
  },
});

// ── Email ──────────────────────────────────────────────────────────────────────

registry.registerPath({
  method: 'post',
  path: '/api/emails/confirmar-reservacion',
  summary: 'Enviar confirmación de reservación',
  tags: ['Email'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: confirmarReservacionSchema.shape.body,
        },
      },
    },
  },
  responses: { 200: { description: 'Correo enviado o intentado' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/emails/recuperar-password',
  summary: 'Enviar link de recuperar contraseña',
  tags: ['Email'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: recuperarPasswordSchema.shape.body,
        },
      },
    },
  },
  responses: { 200: { description: 'Si el email existe, se envió el enlace' } },
});

registry.registerPath({
  method: 'post',
  path: '/api/emails/prueba',
  summary: 'Enviar correo de prueba',
  tags: ['Email'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: enviarPruebaSchema.shape.body,
        },
      },
    },
  },
  responses: { 200: { description: 'Correo de prueba enviado' } },
});

// ── Generar documento ──────────────────────────────────────────────────────────

const generator = new OpenApiGeneratorV3(registry.definitions);

export const swaggerSpec = generator.generateDocument({
  openapi: '3.0.0',
  info: {
    title: 'API Restaurante',
    version: '1.0.0',
    description: 'API REST para el sistema de restaurante',
  },
  servers: [{ url: `http://localhost:${config.puerto}`, description: config.esProduccion ? 'Producción' : 'Desarrollo' }],
  tags: [
    { name: 'Auth', description: 'Autenticación y sesión' },
    { name: 'Platillos', description: 'Catálogo de platillos' },
    { name: 'Email', description: 'Envío de correos' },
  ],
});
