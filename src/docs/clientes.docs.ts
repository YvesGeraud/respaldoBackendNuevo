import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  filtrosClientesSchema,
} from '@/schemas/cliente.schema';
import { idParamSchema } from '@/schemas/comun.schema';
import { okResponse, paginatedResponse } from '@/docs/respuestas.docs';

const ClienteSchema = z.object({
  id_ct_cliente: z.number(),
  nombre: z.string(),
  correo: z.string(),
  telefono: z.number(),
  estado: z.boolean(),
  fecha_reg: z.date(),
});

export const registerClientesDocs = (registry: OpenAPIRegistry) => {
  registry.register('Cliente', ClienteSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/clientes',
    tags: ['Clientes'],
    summary: 'Listar clientes',
    security: [{ bearerAuth: [] }],
    request: {
      query: filtrosClientesSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(ClienteSchema)),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/clientes',
    tags: ['Clientes'],
    summary: 'Registrar nuevo cliente',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearClienteSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(ClienteSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/clientes/{id}',
    tags: ['Clientes'],
    summary: 'Actualizar cliente',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: actualizarClienteSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(ClienteSchema),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/clientes/{id}',
    tags: ['Clientes'],
    summary: 'Desactivar cliente',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(z.null()),
    },
  });
};
