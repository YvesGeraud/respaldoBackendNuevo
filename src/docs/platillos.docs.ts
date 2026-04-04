import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod';

// Tus schemas reales
import {
  crearPlatilloSchema,
  actualizarPlatilloSchema,
  idParamSchema,
  filtrosPlatillosSchema,
  crearPlatillosLoteSchema,
} from '@/schemas/platillo.schema';

// Helpers de respuesta (los que te enseñé)
import { okResponse, paginatedResponse, errorResponse } from '@/docs/respuestas.docs';

// ── Schema base (importante) ───────────────────────────────────────────────────

// Puedes definir uno base si no tienes uno separado aún
const PlatilloSchema = crearPlatilloSchema.shape.body;

// ── Registro ──────────────────────────────────────────────────────────────────

export const registerPlatillosDocs = (registry: OpenAPIRegistry) => {
  // Registrar schema reutilizable (opcional pero recomendado)
  registry.register('Platillo', PlatilloSchema);

  // ── GET /platillos ──────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/api/platillos',
    tags: ['Platillos'],
    summary: 'Listar platillos',
    request: {
      query: filtrosPlatillosSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(PlatilloSchema)),
      400: errorResponse('Error en filtros'),
    },
  });

  // ── POST /platillos ─────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/platillos',
    tags: ['Platillos'],
    summary: 'Crear platillo',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearPlatilloSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(PlatilloSchema),
      400: errorResponse('Datos inválidos'),
    },
  });

  // ── POST batch ──────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'post',
    path: '/api/platillos/batch',
    tags: ['Platillos'],
    summary: 'Crear platillos en lote',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearPlatillosLoteSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(z.array(PlatilloSchema)),
      400: errorResponse(),
    },
  });

  // ── GET by ID ───────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'get',
    path: '/api/platillos/{id}',
    tags: ['Platillos'],
    summary: 'Obtener platillo por ID',
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(PlatilloSchema),
      404: errorResponse('No encontrado'),
    },
  });

  // ── PUT ─────────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'put',
    path: '/api/platillos/{id}',
    tags: ['Platillos'],
    summary: 'Actualizar platillo',
    security: [{ bearerAuth: [] }],
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
      200: okResponse(PlatilloSchema),
      400: errorResponse(),
      404: errorResponse('No encontrado'),
    },
  });

  // ── DELETE ──────────────────────────────────────────────────────────────────
  registry.registerPath({
    method: 'delete',
    path: '/api/platillos/{id}',
    tags: ['Platillos'],
    summary: 'Eliminar platillo',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      204: { description: 'Eliminado correctamente' },
      404: errorResponse('No encontrado'),
    },
  });
};
