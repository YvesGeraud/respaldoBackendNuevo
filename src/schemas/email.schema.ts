import { z } from '@/zod';

// ── Schemas para rutas de email ────────────────────────────────────────────────

export const confirmarReservacionSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    nombreCliente: z.string().trim().min(1, 'El nombre es requerido'),
    fecha: z.string().trim().min(1, 'La fecha es requerida'),
    hora: z.string().trim().min(1, 'La hora es requerida'),
    numPersonas: z.number().int().positive('Debe ser al menos 1 persona'),
  }),
});

export const recuperarPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    token: z.string().trim().min(1, 'El token es requerido'),
    baseUrl: z.string().url().optional(),
  }),
});

export const enviarPruebaSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
  }),
});

// ── Tipos inferidos ────────────────────────────────────────────────────────────

export type ConfirmarReservacionDTO = z.infer<typeof confirmarReservacionSchema>['body'];
export type RecuperarPasswordDTO = z.infer<typeof recuperarPasswordSchema>['body'];
export type EnviarPruebaDTO = z.infer<typeof enviarPruebaSchema>['body'];
