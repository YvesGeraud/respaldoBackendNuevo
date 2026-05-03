import { z } from '@/zod-extended';
import { MSG } from '@/constants';

// ── Campos ordenables (whitelist) ─────────────────────────────────────────────

/**
 * Exportado para usarlo también en parsearPaginacion() del controller,
 * garantizando que schema y util usen exactamente la misma lista.
 */
export const CAMPOS_ORDENABLES_PLATILLO = [
  'nombre',
  'precio',
  'fecha_reg',
  'id_ct_categoria',
] as const;

// ── Campos base reutilizables ─────────────────────────────────────────────────

/**
 * Definición única de cada campo. Los schemas de crear/actualizar
 * los comparten para no duplicar reglas de validación.
 */
const campos = {
  id_ct_categoria: z
    .number({ error: MSG.VAL_REQUERIDO('categoría') })
    .int()
    .positive(MSG.VAL_REQUERIDO('id de categoría')),

  nombre: z
    .string()
    .trim()
    .min(1, MSG.VAL_REQUERIDO('nombre'))
    .max(200, MSG.VAL_MAX('nombre', 200)),

  descripcion: z.string().trim().max(500, MSG.VAL_MAX('descripción', 500)).optional(),

  precio: z.number({ error: MSG.VAL_REQUERIDO('precio') }).positive(MSG.VAL_REQUERIDO('precio')),

  imagen_url: z.string().url('La URL de la imagen no es válida').nullable().optional(),
};

// ── Schemas ───────────────────────────────────────────────────────────────────

export const crearPlatilloSchema = z.object({
  body: z.object(campos),
});

export const actualizarPlatilloSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('id')),
  }),
  body: z
    .object({
      id_ct_categoria: z.number().int().positive().optional(),
      nombre: z.string().trim().min(1).max(200).optional(),
      descripcion: z.string().trim().max(500).optional(),
      precio: z.number().positive().optional(),
      // null = eliminar imagen explícitamente | undefined = no tocar el campo
      imagen_url: z.string().url().nullable().optional(),
      estado: z.boolean().optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: 'Debes enviar al menos un campo para actualizar',
    }),
});



export const filtrosPlatillosSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    busqueda: z.string().trim().optional(),
    id_ct_categoria: z.coerce.number().int().positive().optional(),
    estado: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    // Whitelist explícita — evita que el cliente ordene por columnas internas
    ordenar_por: z.enum(CAMPOS_ORDENABLES_PLATILLO).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
  }),
});

/**
 * Batch: array de platillos para crear en un solo request.
 * Mínimo 1, máximo 500 por lote — evita payloads que saturen la BD.
 */
export const crearPlatillosLoteSchema = z.object({
  body: z
    .array(z.object(campos))
    .min(1, 'Se requiere al menos un platillo en el lote')
    .max(500, 'El máximo por lote es 500 platillos'),
});

// ── Tipos inferidos ───────────────────────────────────────────────────────────

export type CrearPlatilloDTO = z.infer<typeof crearPlatilloSchema>['body'];
export type ActualizarPlatilloDTO = z.infer<typeof actualizarPlatilloSchema>['body'];
export type FiltrosPlatillos = z.infer<typeof filtrosPlatillosSchema>['query'];
export type CrearPlatillosLoteDTO = z.infer<typeof crearPlatillosLoteSchema>['body'];
