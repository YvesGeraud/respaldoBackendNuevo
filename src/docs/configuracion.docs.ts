import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from '@/zod-extended';
import { actualizarConfiguracionSchema } from '@/schemas/configuracion.schema';
import { okResponse } from '@/docs/respuestas.docs';

const ConfiguracionSchema = z.object({
  id_ct_configuracion: z.number(),
  nombre_restaurante: z.string(),
  logo_url: z.string().nullable(),
  telefono: z.string().nullable(),
  direccion: z.string().nullable(),
  email_contacto: z.string().nullable(),
  horario_apertura: z.string().nullable(),
  horario_cierre: z.string().nullable(),
  moneda: z.string(),
  impuesto_porcentaje: z.number(),
  fecha_mod: z.date().nullable(),
});

export const registerConfiguracionDocs = (registry: OpenAPIRegistry) => {
  registry.register('Configuracion', ConfiguracionSchema);

  registry.registerPath({
    method: 'get',
    path: '/api/configuracion',
    tags: ['Configuración'],
    summary: 'Obtener configuración del restaurante',
    security: [{ bearerAuth: [] }],
    responses: {
      200: okResponse(ConfiguracionSchema),
    },
  });

  registry.registerPath({
    method: 'patch',
    path: '/api/configuracion',
    tags: ['Configuración'],
    summary: 'Actualizar configuración',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: actualizarConfiguracionSchema.shape.body,
          },
        },
      },
    },
    responses: {
      200: okResponse(ConfiguracionSchema),
    },
  });
};
