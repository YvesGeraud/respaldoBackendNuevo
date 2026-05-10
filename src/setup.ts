import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { ipKeyGenerator, rateLimit } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';

import { config } from '@/config/servidor.config';
import { prisma } from '@/config/database.config';
import { errorMiddleware } from '@/middlewares/error.middlewares';
import { router } from '@/routes'; // Para cuando se implemente un api
import { authRouter } from '@/routes/auth.route'; // Para cuando se implemente la autenticación
import { middlewareAuditoria } from '@/middlewares/auditoria.middleware';
import { morganStream } from '@/utils/logger.utils';

// ── Stripe webhook router ────────────────────────────────────────────────────────────
// Se importa aquí (y no en routes/index.ts) porque DEBE montarse ANTES del
// middleware express.json(). El webhook de Stripe necesita el body como Buffer
// crudo para verificar la firma HMAC. Si express.json() procesa el body primero,
// la verificación de Stripe falla con 'No signatures found matching the expected signature'.
import { webhookRouter } from '@/routes/pago.route';

// ── Swagger ──────────────────────────────────────────────────────────────────
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '@/docs/swagger.docs';

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();

// Confiar en el proxy inverso (Nginx, AWS, etc.) para obtener la IP real del cliente.
// Sin esto, TODAS las peticiones parecerían venir de la IP del proxy, bloqueando a todos al instante.
app.set('trust proxy', 1);

// ── Seguridad ─────────────────────────────────────────────────────────────────

// Cabeceras de seguridad HTTP (elimina X-Powered-By, añade CSP, etc.)
app.use(helmet());

// CORS: lista blanca desde ALLOWED_ORIGINS (.env en local, passenger_env_var en servidor)
app.use(
  cors({
    origin: (origin, callback) => {
      // Sin origin → Postman, curl, o llamadas server-to-server: permitir
      if (!origin) return callback(null, true);

      if (config.cors.origenes.includes(origin)) {
        callback(null, true);
      } else {
        if (!config.esProduccion) {
          console.warn(`[CORS] Origen bloqueado: ${origin}`);
        }
        callback(new Error(`Origen no permitido por CORS: ${origin}`));
      }
    },
    credentials: true, // necesario para cookies HttpOnly cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400, // preflight cacheado 24 h → reduce requests OPTIONS
  }),
);

// Rate limiting global — protege contra abuso y ataques de fuerza bruta
// Aumentado a 1000 para soportar múltiples usuarios detrás de la misma IP pública (NAT de gobierno/escuelas)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    standardHeaders: 'draft-8', // RateLimit headers estándar (RFC)
    legacyHeaders: false,
    message: {
      exito: false,
      mensaje: 'Demasiadas peticiones desde esta red. Intenta de nuevo en 15 minutos.',
      codigo: 'TOO_MANY_REQUESTS',
    },
    handler: (req, res, _next, options) => {
      // Guardar bloqueo global de forma asíncrona sin frenar la respuesta (Fuego y olvido)
      prisma.dt_bloqueo_seguridad
        .create({
          data: {
            ip_address: req.ip || 'desconocida',
            endpoint: req.originalUrl,
            usuario_intentado: null,
            limite_alcanzado: typeof options.max === 'number' ? options.max : 1000,
            user_agent: req.get('user-agent') || null,
          },
        })
        .catch((e) => console.error('[Seguridad] Error al registrar bloqueo global:', e));

      res.status(options.statusCode).json(options.message);
    },
  }),
);

// Rate limiting estricto para rutas de autenticación (login, refresh)
// Como es un sistema gubernamental (muchos usuarios bajo la misma IP de un edificio),
// usamos un 'keyGenerator' que agrupa por IP + Usuario.
// De esta forma, si "Juan" olvida su clave 20 veces, se bloquea a "Juan", pero no a "María" que está en el mismo edificio.
const limitarAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // 30 intentos cada 15 min por combinación (IP + Usuario)
  keyGenerator: (req) => {
    const usuario = req.body?.usuario ? `_${String(req.body.usuario).toLowerCase()}` : '';
    // Usamos ipKeyGenerator(req.ip) en vez de req.ip directamente para cumplir con la validación IPv6 de la librería
    return `${ipKeyGenerator(req.ip || '')}${usuario}`;
  },
  message: {
    exito: false,
    mensaje: 'Demasiados intentos de autenticación. Intenta de nuevo en 15 minutos.',
    codigo: 'TOO_MANY_REQUESTS',
  },
  handler: (req, res, _next, options) => {
    // Guardar bloqueo de autenticación
    prisma.dt_bloqueo_seguridad
      .create({
        data: {
          ip_address: req.ip || 'desconocida',
          endpoint: req.originalUrl,
          usuario_intentado: req.body?.usuario ? String(req.body.usuario) : null,
          limite_alcanzado: typeof options.max === 'number' ? options.max : 30,
          user_agent: req.get('user-agent') || null,
        },
      })
      .catch((e) => console.error('[Seguridad] Error al registrar bloqueo auth:', e));

    res.status(options.statusCode).json(options.message);
  },
});

// ── Performance ───────────────────────────────────────────────────────────────

// Comprime respuestas con gzip (reduce ~70% el tamaño en JSON grandes)
app.use(compression());

// ── Parseo de peticiones ──────────────────────────────────────────────────────

app.use(express.json({ limit: '10kb' })); // límite para evitar payloads gigantes
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser()); // necesario para leer cookies httpOnly

// ── Logging HTTP ──────────────────────────────────────────────────────────────

// 'dev' en desarrollo: coloreado y conciso | 'combined' en prod: formato Apache (para logs)
app.use(morgan(config.esProduccion ? 'combined' : 'dev', { stream: morganStream }));

// ── Auditoría ────────────────────────────────────────────────────────────────
// Captura el contexto de la petición (usuario, ip, etc) para Prisma
app.use(middlewareAuditoria);

// ── Rutas ─────────────────────────────────────────────────────────────────────

// Prefijo base para todas las rutas (útil cuando el proxy no reescribe la ruta)
// local: "/" -> "/health" | servidor: "/app/dms/" -> "/app/dms/health"
const base = config.basePath.endsWith('/') ? config.basePath : `${config.basePath}/`;

// ── Swagger UI ───────────────────────────────────────────────────────────────

// ⚠️ Webhook de Stripe: se monta aquí (después de declarar 'base') con express.raw() en la ruta
// interna, por lo que aunque express.json() ya esté registrado globalmente arriba,
// Express aplica el middleware correcto por ruta: el webhook recibe el body como Buffer.
app.use(`${base}api/webhooks`, webhookRouter);

// Se sirve en /docs (o según configuración)
app.use(`${base}docs`, swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get(`${base}docs-json`, (_req, res) => res.json(swaggerSpec));

// Health check — sin autenticación, útil para balanceadores de carga y monitoreo
app.get(`${base}health`, async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1 as db_health_check`;
    res.status(StatusCodes.OK).json({
      estado: 'ok',
      entorno: config.nodeEnv,
      base_datos: 'conectada',
    });
  } catch (error: unknown) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      estado: 'error',
      entorno: config.nodeEnv,
      base_datos: 'desconectada',
      mensaje: error instanceof Error ? error.message : String(error),
    });
  }
});

// Auth con rate limiting estricto (limitarAuth) — debe montarse ANTES de /api/v1
// para que el rate limiter se aplique antes del router general
app.use(`${base}api/auth`, limitarAuth, authRouter);

// Resto de módulos centralizados en routes/index.ts
app.use(`${base}api/`, router);

// ── 404 ───────────────────────────────────────────────────────────────────────

// Captura cualquier ruta no registrada antes de llegar al error middleware
app.use((req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    exito: false,
    mensaje: `Ruta ${req.method} ${req.path} no encontrada`,
    codigo: 'NOT_FOUND',
  });
});

// ── Error middleware ──────────────────────────────────────────────────────────

// SIEMPRE al final — Express lo reconoce por sus 4 parámetros (err, req, res, next)
app.use(errorMiddleware);

export default app;
