import { z } from '@/zod-extended';
import { MSG } from '@/constants';
import { rl_reservacion_estado as EstadoReservacion } from '@prisma/client';

// ── Campos ordenables (whitelist) ─────────────────────────────────────────────

export const CAMPOS_ORDENABLES_RESERVACION = [
  'id_rl_reservacion',
  'estado',
  'fecha_reservacion',
  'fecha_reg',
] as const;

// ── Campos base reutilizables ─────────────────────────────────────────────────

const campos = {
  id_ct_cliente: z
    .number({ error: MSG.VAL_REQUERIDO('id de cliente') })
    .int()
    .positive(MSG.VAL_REQUERIDO('id de cliente')),

  num_personas: z
    .number({ error: MSG.VAL_REQUERIDO('número de personas') })
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo')
    .max(50, 'No se permiten reservaciones para tantas personas'),

  fecha_reservacion: z.coerce
    .date({ error: 'Debe ser una fecha y hora válida (ISO string)' })
    .min(new Date(new Date().setHours(0, 0, 0, 0)), 'La fecha no puede ser pasada')
    .refine(
      (fecha) => {
        const horas = fecha.getHours();
        return horas >= 10 && horas < 24;
      },
      { message: 'La hora de reservación debe estar entre las 10:00 y las 23:59' },
    ),

  id_ct_mesa: z
    .number({ error: MSG.VAL_REQUERIDO('id de mesa') })
    .int('Debe ser un número entero')
    .positive('Debe ser un número positivo')
    .optional(),

  notas: z.string().max(500, 'Máximo 500 caracteres').optional().nullable(),
};

// ── Schemas ───────────────────────────────────────────────────────────────────

export const crearReservacionSchema = z.object({
  body: z.object(campos),
});

export const actualizarReservacionSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(),
  }),
  body: z.object({
    estado: z.nativeEnum(EstadoReservacion).optional(),
    id_ct_cliente: z.coerce.number().int().positive().optional(),
    id_ct_mesa: z.coerce.number().int().positive().optional(),
    fecha_reservacion: campos.fecha_reservacion.optional(),
    num_personas: campos.num_personas.optional(),
    notas: campos.notas,
  }),
});

export const filtrosReservacionesSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    id_ct_cliente: z.coerce.number().int().positive().optional(),
    id_ct_mesa: z.coerce.number().int().positive().optional(),
    estado: z.nativeEnum(EstadoReservacion).optional(),
    ordenar_por: z.enum(CAMPOS_ORDENABLES_RESERVACION).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
  }),
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number({ error: 'El ID debe ser un número' }).int().positive(),
  }),
});

// ── Tipos inferidos ───────────────────────────────────────────────────────────

export type CrearReservacionDTO = z.infer<typeof crearReservacionSchema>['body'];
export type ActualizarReservacionDTO = z.infer<typeof actualizarReservacionSchema>['body'];
export type FiltrosReservaciones = z.infer<typeof filtrosReservacionesSchema>['query'];
