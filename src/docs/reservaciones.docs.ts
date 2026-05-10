import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import {
  crearReservacionSchema,
  actualizarReservacionSchema,
  filtrosReservacionesSchema,
} from '@/schemas/reservacion.schema';
import { idParamSchema } from '@/schemas/comun.schema';
import { okResponse, paginatedResponse } from '@/docs/respuestas.docs';

const ReservacionSchema = z.object({
  id_rl_reservacion: z.number(),
  id_ct_cliente: z.number(),
  id_ct_mesa: z.number().nullable(),
  fecha_reservacion: z.date(),
  num_personas: z.number(),
  estado: z.string(),
  notas: z.string().nullable(),
  fecha_reg: z.date(),
  ct_cliente: z.object({
    nombre: z.string(),
    correo: z.string(),
  }),
  ct_mesa: z
    .object({
      codigo: z.string(),
    })
    .nullable(),
});

export const registerReservacionesDocs = (registry: OpenAPIRegistry) => {
  registry.register('Reservacion', ReservacionSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/reservaciones',
    tags: ['Reservaciones'],
    summary: 'Listar reservaciones',
    security: [{ bearerAuth: [] }],
    request: {
      query: filtrosReservacionesSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(ReservacionSchema)),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/reservaciones',
    tags: ['Reservaciones'],
    summary: 'Crear reservación',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearReservacionSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(ReservacionSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/reservaciones/{id}',
    tags: ['Reservaciones'],
    summary: 'Actualizar reservación',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: actualizarReservacionSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(ReservacionSchema),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/reservaciones/{id}',
    tags: ['Reservaciones'],
    summary: 'Cancelar reservación',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(z.null()),
    },
  });
};
