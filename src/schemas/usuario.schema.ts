import { z } from '@/zod-extended';
import { MSG } from '@/constants';

export const CAMPOS_ORDENABLES_USUARIO = [
  'id_ct_usuario',
  'usuario',
  'email',
  'nombre_completo',
  'fecha_reg',
] as const;

// ── Campos base reutilizables ─────────────────────────────────────────────────
const campos = {
  usuario: z
    .string()
    .trim()
    .min(3, MSG.VAL_MIN('usuario', 3))
    .max(100, MSG.VAL_MAX('usuario', 100)),

  email: z
    .string()
    .trim()
    .email(MSG.VAL_EMAIL)
    .max(255, MSG.VAL_MAX('email', 255))
    .optional()
    .nullable(),

  nombre_completo: z
    .string()
    .trim()
    .min(3, MSG.VAL_MIN('nombre completo', 3))
    .max(200, MSG.VAL_MAX('nombre completo', 200)),

  id_ct_rol: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('rol')),

  contrasena: z
    .string()
    .min(6, MSG.VAL_MIN('contraseña', 6))
    .max(255, MSG.VAL_MAX('contraseña', 255))
    .optional(),

  estado: z.boolean().optional(),
};

// ── Schemas ───────────────────────────────────────────────────────────────────
export const crearUsuarioSchema = z.object({
  body: z.object({
    ...campos,
    contrasena: campos.contrasena.unwrap().min(6, MSG.VAL_MIN('contraseña', 6)), // Obligatoria al crear
  }),
});

export const actualizarUsuarioSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive(MSG.VAL_REQUERIDO('id')),
  }),
  body: z
    .object({
      usuario: campos.usuario.optional(),
      email: campos.email,
      nombre_completo: campos.nombre_completo.optional(),
      id_ct_rol: campos.id_ct_rol.optional(),
      contrasena: campos.contrasena,
      estado: campos.estado,
    })
    .refine((data) => Object.values(data).some((v) => v !== undefined), {
      message: 'Debes enviar al menos un campo para actualizar',
    }),
});

export const filtrosUsuariosSchema = z.object({
  query: z.object({
    pagina: z.coerce.number().int().positive().optional(),
    limite: z.coerce.number().int().positive().max(100).optional(),
    usuario: z.string().trim().optional(),
    email: z.string().trim().optional(),
    id_ct_rol: z.coerce.number().int().optional(),
    estado: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    ordenar_por: z.enum(CAMPOS_ORDENABLES_USUARIO).optional(),
    orden: z.enum(['asc', 'desc']).optional(),
  }),
});

export type CrearUsuarioDTO = z.infer<typeof crearUsuarioSchema>['body'];
export type ActualizarUsuarioDTO = z.infer<typeof actualizarUsuarioSchema>['body'];
export type FiltrosUsuarios = z.infer<typeof filtrosUsuariosSchema>['query'];
