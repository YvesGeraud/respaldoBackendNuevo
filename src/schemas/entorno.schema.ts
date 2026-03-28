import { z } from 'zod';

/**
 * Definición declarativa de todas las variables de entorno del sistema.
 * Este schema se encarga de:
 *   1. Tipado: Garantizar que cada variable tenga el tipo correcto (string, number, etc.)
 *   2. Coerción: Convertir strings de process.env a numbers de forma segura.
 *   3. Valores por defecto: Proveer fallbacks cuando no se definen en el .env.
 */
export const entornoSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  UPLOAD_BASE_PATH: z.string().default('uploads'),
  API_URL: z.string().url('API_URL debe ser una URL válida').default('http://localhost:3000'),
  HOST: z.string().default('/'), // local: "/", servidor: "/app/dms/"

  // Base de Datos
  DATABASE_URL: z.string(),
  DB_HOST: z.string(),
  DB_PORT: z.coerce.number(),
  DBNAMES: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),

  // Seguridad y CORS
  ALLOWED_ORIGINS: z
    .string()
    .default('http://localhost:4200')
    .transform((str) =>
      str
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
    ),

  // Autenticación
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es obligatorio'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET es obligatorio'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
});

export type Entorno = z.infer<typeof entornoSchema>;
