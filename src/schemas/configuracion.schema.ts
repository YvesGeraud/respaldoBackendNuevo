import { z } from '@/zod-extended';
import { MSG } from '@/constants';

// ── Campos base reutilizables ─────────────────────────────────────────────────
const campos = {
  nombre_restaurante: z
    .string()
    .trim()
    .min(1, MSG.VAL_REQUERIDO('nombre'))
    .max(100, MSG.VAL_MAX('nombre', 100)),

  logo_url: z.string().url('Logo debe ser una URL válida').max(500).optional().nullable(),

  telefono: z.string().trim().max(20).optional().nullable(),

  direccion: z.string().trim().max(255).optional().nullable(),

  email_contacto: z.string().trim().email(MSG.VAL_EMAIL).max(255).optional().nullable(),

  horario_apertura: z.string().trim().max(50).optional().nullable(),

  horario_cierre: z.string().trim().max(50).optional().nullable(),

  moneda: z.string().trim().max(10).default('$'),

  impuesto_porcentaje: z.coerce.number().min(0).max(1).default(0.16),
};

// ── Schemas ───────────────────────────────────────────────────────────────────
export const actualizarConfiguracionSchema = z.object({
  body: z
    .object({
      nombre_restaurante: campos.nombre_restaurante.optional(),
      logo_url: campos.logo_url,
      telefono: campos.telefono,
      direccion: campos.direccion,
      email_contacto: campos.email_contacto,
      horario_apertura: campos.horario_apertura,
      horario_cierre: campos.horario_cierre,
      moneda: campos.moneda.optional(),
      impuesto_porcentaje: campos.impuesto_porcentaje.optional(),
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: 'Debes enviar al menos un campo para actualizar',
    }),
});

export type ActualizarConfiguracionDTO = z.infer<typeof actualizarConfiguracionSchema>['body'];
