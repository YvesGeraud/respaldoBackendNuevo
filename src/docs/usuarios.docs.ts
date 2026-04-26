import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  filtrosUsuariosSchema,
} from '@/schemas/usuario.schema';
import { idParamSchema } from '@/schemas/comun.schema';
import { okResponse, paginatedResponse, errorResponse } from '@/docs/respuestas.docs';

const UsuarioSchema = z.object({
  id_ct_usuario: z.number(),
  usuario: z.string(),
  email: z.string().nullable(),
  nombre_completo: z.string(),
  id_ct_rol: z.number(),
  estado: z.boolean(),
  fecha_reg: z.date(),
  ct_rol: z.object({
    nombre: z.string(),
  }),
});

export const registerUsuariosDocs = (registry: OpenAPIRegistry) => {
  registry.register('Usuario', UsuarioSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/usuarios',
    tags: ['Usuarios'],
    summary: 'Listar usuarios del staff',
    security: [{ bearerAuth: [] }],
    request: {
      query: filtrosUsuariosSchema.shape.query,
    },
    responses: {
      200: paginatedResponse(z.array(UsuarioSchema)),
      401: errorResponse('No autenticado'),
    },
  });

  registry.registerPath({
    method: 'get',
    path: '/api/usuarios/roles',
    tags: ['Usuarios'],
    summary: 'Listar roles disponibles',
    security: [{ bearerAuth: [] }],
    responses: {
      200: okResponse(z.array(z.object({
        id_ct_rol: z.number(),
        nombre: z.string(),
        descripcion: z.string().nullable(),
      }))),
    },
  });

  registry.registerPath({
    method: 'post',
    path: '/api/usuarios',
    tags: ['Usuarios'],
    summary: 'Crear nuevo usuario de staff',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: crearUsuarioSchema.shape.body,
          },
        },
      },
    },
    responses: {
      201: okResponse(UsuarioSchema),
      400: errorResponse('Datos inválidos o duplicados'),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/usuarios/{id}',
    tags: ['Usuarios'],
    summary: 'Actualizar usuario',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
      body: {
        content: {
          'application/json': {
            schema: actualizarUsuarioSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(UsuarioSchema),
      404: errorResponse('No encontrado'),
    },
  });

  registry.registerPath({
    method: 'delete',
    path: '/api/usuarios/{id}',
    tags: ['Usuarios'],
    summary: 'Desactivar usuario',
    security: [{ bearerAuth: [] }],
    request: {
      params: idParamSchema.shape.params,
    },
    responses: {
      200: okResponse(z.null()),
    },
  });
};
