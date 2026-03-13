import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    usuario: z.string().trim().min(3, 'El usuario debe tener al menos 3 caracteres'),
    contrasena: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
  }),
});

export type LoginDTO = z.infer<typeof loginSchema>['body'];
