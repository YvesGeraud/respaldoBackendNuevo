import { z } from '@/zod-extended';
import { MSG } from '@/constants';

export const CAMPOS_ORDENABLES_MESA = ['id_ct_mesa', 'codigo', 'capacidad', 'fecha_reg'] as const;

// ── Campos base reutilizables ─────────────────────────────────────────────────
const campos = {
  codigo: z
    .string()
    .trim()
    .min(1, MSG.VAL_REQUERIDO('código'))
    .max(50, MSG.VAL_MAX('código', 50)),
  
  capacidad: z.coerce
    .number()
    .int()
    .positive(MSG.VAL_REQUERIDO('capacidad'))
    .max(20, 'La capacidad máxima es de 20 personas por mesa'),
};

// ── Schemas ───────────────────────────────────────────────────────────────────
export const crearMesaSchema = z.object({
  body: z.object(campos),
});

export const actualizarMesaSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('id')),
  }),
  body: z.object({
    codigo: campos.codigo.optional(),
    capacidad: campos.capacidad.optional(),
    estado: z.boolean().optional(),
  }).refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'Debes enviar al menos un campo para actualizar',
  }),
});

export const filtrosMesasSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    codigo: z.string().trim().optional(),
    estado: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    ordenar_por: z.enum(CAMPOS_ORDENABLES_MESA).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CrearMesaDTO = z.infer<typeof crearMesaSchema>['body'];
export type ActualizarMesaDTO = z.infer<typeof actualizarMesaSchema>['body'];
export type FiltrosMesas = z.infer<typeof filtrosMesasSchema>['query'];
