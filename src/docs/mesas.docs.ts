import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import {
  crearMesaSchema,
  actualizarMesaSchema,
  filtrosMesasSchema,
} from '@/schemas/mesa.schema';
import { idParamSchema } from '@/schemas/comun.schema';
import { okResponse, paginatedResponse } from '@/docs/respuestas.docs';

const MesaSchema = z.object({
  id_ct_mesa: z.number(),
  codigo: z.string(),
  capacidad: z.number(),
  estado: z.boolean(),
  fecha_reg: z.date(),
});

export const registerMesasDocs = (registry: OpenAPIRegistry) => {
  registry.register('Mesa', MesaSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/mesas',
    tags: ['Mesas'],
    summary: 'Listar mesas',
    security: [{ bearerAuth: [] }],
    request: {
      query: filtrosMesasSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(MesaSchema)),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/mesas',
    tags: ['Mesas'],
    summary: 'Crear mesa',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearMesaSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(MesaSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/mesas/{id}',
    tags: ['Mesas'],
    summary: 'Actualizar mesa',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: actualizarMesaSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(MesaSchema),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/mesas/{id}',
    tags: ['Mesas'],
    summary: 'Desactivar mesa',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(z.null()),
    },
  });
};
