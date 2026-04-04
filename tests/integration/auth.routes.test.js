'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (!desc || ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
const vitest_1 = require('vitest');
const supertest_1 = __importDefault(require('supertest'));
vitest_1.vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_usuario: {
      findUnique: vitest_1.vi.fn().mockResolvedValue(null),
    },
    dt_refresh_token: {
      create: vitest_1.vi.fn().mockResolvedValue({ id_dt_refresh_token: 1 }),
      findUnique: vitest_1.vi.fn().mockResolvedValue(null),
      update: vitest_1.vi.fn().mockResolvedValue({}),
      updateMany: vitest_1.vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vitest_1.vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));
const app_1 = __importDefault(require('@/app'));
(0, vitest_1.describe)('GET /health', () => {
  (0, vitest_1.it)('responde 200 con estado ok', async () => {
    const res = await (0, supertest_1.default)(app_1.default).get('/health');
    (0, vitest_1.expect)(res.status).toBe(200);
    (0, vitest_1.expect)(res.body.estado).toBe('ok');
  });
});
(0, vitest_1.describe)('POST /api/auth/login — validación', () => {
  (0, vitest_1.it)('400 VALIDATION_ERROR si falta la contraseña', async () => {
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/login')
      .send({ usuario: 'docente01' });
    (0, vitest_1.expect)(res.status).toBe(400);
    (0, vitest_1.expect)(res.body.exito).toBe(false);
    (0, vitest_1.expect)(res.body.codigo).toBe('VALIDATION_ERROR');
    (0, vitest_1.expect)(res.body.errores).toBeInstanceOf(Array);
  });
  (0, vitest_1.it)('400 VALIDATION_ERROR si falta el usuario', async () => {
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/login')
      .send({ contrasena: 'password123' });
    (0, vitest_1.expect)(res.status).toBe(400);
    (0, vitest_1.expect)(res.body.codigo).toBe('VALIDATION_ERROR');
  });
  (0, vitest_1.it)('400 VALIDATION_ERROR si el usuario tiene menos de 3 caracteres', async () => {
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/login')
      .send({ usuario: 'ab', contrasena: 'password123' });
    (0, vitest_1.expect)(res.status).toBe(400);
    (0, vitest_1.expect)(res.body.codigo).toBe('VALIDATION_ERROR');
  });
  (0, vitest_1.it)(
    '400 VALIDATION_ERROR si la contraseña tiene menos de 8 caracteres',
    async () => {
      const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/auth/login')
        .send({ usuario: 'docente01', contrasena: '123' });
      (0, vitest_1.expect)(res.status).toBe(400);
      (0, vitest_1.expect)(res.body.codigo).toBe('VALIDATION_ERROR');
    },
  );
});
(0, vitest_1.describe)('POST /api/auth/login — autenticación', () => {
  (0, vitest_1.it)('401 UNAUTHORIZED si el usuario no existe en BD', async () => {
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/login')
      .send({ usuario: 'noexiste', contrasena: 'password123' });
    (0, vitest_1.expect)(res.status).toBe(401);
    (0, vitest_1.expect)(res.body.exito).toBe(false);
    (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
  });
  (0, vitest_1.it)('401 UNAUTHORIZED si el usuario está inactivo', async () => {
    const { prisma } = await Promise.resolve().then(() =>
      __importStar(require('@/config/database.config')),
    );
    vitest_1.vi.mocked(prisma.ct_usuario.findUnique).mockResolvedValueOnce({
      id_ct_usuario: 1,
      usuario: 'inactivo',
      contrasena: 'hash',
      email: null,
      nombre_completo: 'Usuario Inactivo',
      rol: 'CAJERO',
      estado: false,
      fecha_registro: new Date(),
      fecha_modificacion: null,
    });
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/login')
      .send({ usuario: 'inactivo', contrasena: 'password123' });
    (0, vitest_1.expect)(res.status).toBe(401);
    (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
  });
});
(0, vitest_1.describe)('POST /api/auth/refresh — rotación', () => {
  (0, vitest_1.it)('401 si no hay cookie de refreshToken', async () => {
    const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/refresh');
    (0, vitest_1.expect)(res.status).toBe(401);
    (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
  });
  (0, vitest_1.it)('401 si el refreshToken tiene firma inválida (JWT malformado)', async () => {
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=esto.no.es.un.jwt.valido');
    (0, vitest_1.expect)(res.status).toBe(401);
  });
  (0, vitest_1.it)('401 si el hash del token no está en BD (ya girado o fabricado)', async () => {
    const { prisma } = await Promise.resolve().then(() =>
      __importStar(require('@/config/database.config')),
    );
    vitest_1.vi.mocked(prisma.dt_refresh_token.findUnique).mockResolvedValueOnce(null);
    const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
    const tokenValido = jwt.sign(
      { id_ct_usuario: 1, usuario: 'test', email: null, rol: 'CAJERO' },
      process.env['JWT_REFRESH_SECRET'],
      { expiresIn: '7d' },
    );
    const res = await (0, supertest_1.default)(app_1.default)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${tokenValido}`);
    (0, vitest_1.expect)(res.status).toBe(401);
    (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
  });
  (0, vitest_1.it)(
    '401 si el token ya fue revocado (reutilización detectada) → invalida familia',
    async () => {
      const { prisma } = await Promise.resolve().then(() =>
        __importStar(require('@/config/database.config')),
      );
      vitest_1.vi.mocked(prisma.dt_refresh_token.findUnique).mockResolvedValueOnce({
        id_dt_refresh_token: 5,
        token_hash: 'cualquier-hash',
        id_ct_usuario: 1,
        expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        revocado: true,
        revocado_en: new Date(),
        reemplazado_por: 6,
        creado_en: new Date(),
      });
      const jwt = await Promise.resolve().then(() => __importStar(require('jsonwebtoken')));
      const tokenValido = jwt.sign(
        { id_ct_usuario: 1, usuario: 'test', email: null, rol: 'CAJERO' },
        process.env['JWT_REFRESH_SECRET'],
        { expiresIn: '7d' },
      );
      const res = await (0, supertest_1.default)(app_1.default)
        .post('/api/auth/refresh')
        .set('Cookie', `refreshToken=${tokenValido}`);
      (0, vitest_1.expect)(res.status).toBe(401);
      (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
      (0, vitest_1.expect)(
        vitest_1.vi.mocked(prisma.dt_refresh_token.updateMany),
      ).toHaveBeenCalledWith(
        vitest_1.expect.objectContaining({
          where: vitest_1.expect.objectContaining({ id_ct_usuario: 1 }),
          data: vitest_1.expect.objectContaining({ revocado: true }),
        }),
      );
    },
  );
});
(0, vitest_1.describe)('Rutas protegidas — sin cookie de sesión', () => {
  (0, vitest_1.it)('GET /api/auth/me → 401', async () => {
    const res = await (0, supertest_1.default)(app_1.default).get('/api/auth/me');
    (0, vitest_1.expect)(res.status).toBe(401);
    (0, vitest_1.expect)(res.body.codigo).toBe('UNAUTHORIZED');
  });
  (0, vitest_1.it)('POST /api/auth/logout → 401 (requiere accessToken cookie)', async () => {
    const res = await (0, supertest_1.default)(app_1.default).post('/api/auth/logout');
    (0, vitest_1.expect)(res.status).toBe(401);
  });
});
(0, vitest_1.describe)('Rutas no existentes', () => {
  (0, vitest_1.it)('responde 404 para una ruta desconocida', async () => {
    const res = await (0, supertest_1.default)(app_1.default).get('/api/no-existe');
    (0, vitest_1.expect)(res.status).toBe(404);
    (0, vitest_1.expect)(res.body.codigo).toBe('NOT_FOUND');
  });
});
//# sourceMappingURL=auth.routes.test.js.map
