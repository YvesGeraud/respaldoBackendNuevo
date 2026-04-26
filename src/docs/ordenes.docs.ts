import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import {
  crearOrdenSchema,
  actualizarEstadoOrdenSchema,
  filtrosOrdenesSchema,
} from '@/schemas/orden.schema';
import { idParamSchema } from '@/schemas/comun.schema';
import { okResponse, paginatedResponse } from '@/docs/respuestas.docs';

const OrdenSchema = z.object({
  id_rl_orden: z.number(),
  id_mesa: z.number().nullable(),
  total: z.number(),
  estado: z.string(),
  fecha_reg: z.date(),
  detalles: z.array(z.object({
    id_dt_detalle_orden: z.number(),
    id_ct_platillo: z.number(),
    cantidad: z.number(),
    precio_unitario: z.number(),
    subtotal: z.number(),
    ct_platillo: z.object({
      nombre: z.string(),
    }),
  })),
});

export const registerOrdenesDocs = (registry: OpenAPIRegistry) => {
  registry.register('Orden', OrdenSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/ordenes',
    tags: ['Órdenes'],
    summary: 'Listar órdenes',
    security: [{ bearerAuth: [] }],
    request: {
      query: filtrosOrdenesSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(OrdenSchema)),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/ordenes/{id}',
    tags: ['Órdenes'],
    summary: 'Obtener detalle de orden',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(OrdenSchema),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/ordenes',
    tags: ['Órdenes'],
    summary: 'Crear nueva orden',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearOrdenSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(OrdenSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/ordenes/{id}/estado',
    tags: ['Órdenes'],
    summary: 'Actualizar estado de orden',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: actualizarEstadoOrdenSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(OrdenSchema),
    },
  });
};
