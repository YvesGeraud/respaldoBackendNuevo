import { z } from '@/zod-extended';

// ── Base ──────────────────────────────────────────────────────────────────────

export const metaSchema = z.object({
  pagina: z.number(),
  totalPaginas: z.number(),
  totalRegistros: z.number(),
  porPagina: z.number(),
});

export const respuestaExitoSchema = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    exito: z.literal(true),
    mensaje: z.string(),
    datos: data,
    meta: metaSchema.optional(),
  });

export const respuestaErrorSchema = z.object({
  exito: z.literal(false),
  mensaje: z.string(),
  codigo: z.string(),
  errores: z
    .array(
      z.object({
        campo: z.string(),
        mensaje: z.string(),
      }),
    )
    .optional(),
});

// ── Helpers ───────────────────────────────────────────────────────────────────

export const okResponse = <T extends z.ZodTypeAny>(schema: T) => ({
  description: 'OK',
  content: {
    'application/json': {
      schema: respuestaExitoSchema(schema),
    },
  },
});

export const paginatedResponse = <T extends z.ZodTypeAny>(schema: T) => ({
  description: 'OK (paginado)',
  content: {
    'application/json': {
      schema: respuestaExitoSchema(schema), // ya incluye meta opcional
    },
  },
});

export const errorResponse = (description = 'Error') => ({
  description,
  content: {
    'application/json': {
      schema: respuestaErrorSchema,
    },
  },
});
