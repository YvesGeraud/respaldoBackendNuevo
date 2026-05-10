import { z } from '@/zod-extended';

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

  // APIs externas
  API_EXTERNA_URL: z.string().url('API_EXTERNA_URL debe ser una URL válida').optional(),

  // ── Stripe ──────────────────────────────────────────────────────────────────
  // Clave secreta del servidor (sk_test_... en desarrollo, sk_live_... en producción).
  // NUNCA exponer esta clave al cliente — solo se usa en el backend.
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY es obligatorio'),

  // Secreto del webhook: generado por Stripe al registrar el endpoint.
  // Se usa para verificar la firma HMAC de cada evento entrante y asegurar
  // que el request proviene realmente de Stripe y no de un tercero.
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET es obligatorio'),

  // Clave pública (pk_test_... / pk_live_...) — esta SÍ se puede enviar al frontend
  // para que Stripe.js la use al tokenizar la tarjeta del cliente.
  STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY es obligatorio'),

  // Autenticación
  JWT_SECRET: z.string().min(1, 'JWT_SECRET es obligatorio'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(1, 'JWT_REFRESH_SECRET es obligatorio'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_ROUNDS: z.coerce.number().default(12),
});

export type Entorno = z.infer<typeof entornoSchema>;
