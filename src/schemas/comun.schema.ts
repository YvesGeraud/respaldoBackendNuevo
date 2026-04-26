import { z } from 'zod';

/**
 * Esquema genérico para validar que el parámetro "id" en la URL sea un número entero positivo.
 */
export const idParamSchema = z.object({
  params: z.object({
    id: z.coerce.number().int().positive('El ID debe ser un número entero positivo'),
  }),
});
