import { z } from '@/zod-extended';
import { rl_orden_estado as EstadoOrden } from '@prisma/client';
import { MSG } from '@/constants';

// ── Campos ordenables (whitelist) ─────────────────────────────────────────────

export const CAMPOS_ORDENABLES_ORDEN = ['id_rl_orden', 'estado', 'total', 'fecha_reg'] as const;

// ── Campos base reutilizables ─────────────────────────────────────────────────

const detalleOrdenSchema = z.object({
  id_ct_platillo: z
    .number({ error: MSG.VAL_REQUERIDO('id_ct_platillo') })
    .int()
    .positive(MSG.VAL_REQUERIDO('id de platillo')),
  cantidad: z
    .number({ error: MSG.VAL_REQUERIDO('cantidad') })
    .int()
    .positive('La cantidad debe ser mayor a 0'),
});

const campos = {
  id_mesa: z.number().int().positive().optional(),
  detalles: z.array(detalleOrdenSchema).min(1, 'La orden debe contener al menos un platillo'),
};

// ── Schemas ───────────────────────────────────────────────────────────────────

export const crearOrdenSchema = z.object({
  body: z.object(campos),
});

export const actualizarEstadoOrdenSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('id')),
  }),
  body: z.object({
    estado: z.nativeEnum(EstadoOrden),
  }),
});

export const actualizarOrdenSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('id')),
  }),
  body: z.object({
    id_mesa: z.number().int().positive().optional().nullable(),
    detalles: z.array(detalleOrdenSchema).min(1, 'La orden debe contener al menos un platillo').optional(),
  }),
});

export const filtrosOrdenesSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    id_ct_usuario: z.coerce.number().int().positive().optional(),
    id_mesa: z.coerce.number().int().positive().optional(),
    estado: z.nativeEnum(EstadoOrden).optional(),
    // Whitelist explícita
    ordenar_por: z.enum(CAMPOS_ORDENABLES_ORDEN).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
    fecha_inicio: z.string().datetime().optional(),
    fecha_fin: z.string().datetime().optional(),
  }),
});

// ── Tipos inferidos ───────────────────────────────────────────────────────────

export type DetalleOrdenDTO = z.infer<typeof detalleOrdenSchema>;
export type CrearOrdenDTO = z.infer<typeof crearOrdenSchema>['body'];
export type ActualizarEstadoOrdenDTO = z.infer<typeof actualizarEstadoOrdenSchema>['body'];
export type ActualizarOrdenDTO = z.infer<typeof actualizarOrdenSchema>['body'];
export type FiltrosOrdenes = z.infer<typeof filtrosOrdenesSchema>['query'];
