import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

/**
 * vi.mock es HOISTED por vitest al tope del archivo (antes de los imports).
 * Mockeamos db para interceptar Prisma sin conectarse a la BD real.
 * Se incluye dt_refresh_token porque auth.service lo usa en login, refresh y logout.
 */
vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_usuario: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    dt_refresh_token: {
      create: vi.fn().mockResolvedValue({ id_dt_refresh_token: 1 }),
      findUnique: vi.fn().mockResolvedValue(null),
      update: vi.fn().mockResolvedValue({}),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
  },
}));

import app from '@/app';

// ── Health check ───────────────────────────────────────────────────────────────

describe('GET /health', () => {
  it('responde 200 con estado ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.estado).toBe('ok');
  });
});

// ── POST /api/auth/login — validación Zod ──────────────────────────────────────
// Estos casos NO llegan a la BD: el middleware de validación los rechaza primero.

describe('POST /api/auth/login — validación', () => {
  it('400 VALIDATION_ERROR si falta la contraseña', async () => {
    const res = await request(app).post('/api/auth/login').send({ usuario: 'docente01' });

    expect(res.status).toBe(400);
    expect(res.body.exito).toBe(false);
    expect(res.body.codigo).toBe('VALIDATION_ERROR');
    expect(res.body.errores).toBeInstanceOf(Array);
  });

  it('400 VALIDATION_ERROR si falta el usuario', async () => {
    const res = await request(app).post('/api/auth/login').send({ contrasena: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDATION_ERROR');
  });

  it('400 VALIDATION_ERROR si el usuario tiene menos de 3 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'ab', contrasena: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDATION_ERROR');
  });

  it('400 VALIDATION_ERROR si la contraseña tiene menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'docente01', contrasena: '123' });

    expect(res.status).toBe(400);
    expect(res.body.codigo).toBe('VALIDATION_ERROR');
  });
});

// ── POST /api/auth/login — autenticación (BD mockeada) ────────────────────────

describe('POST /api/auth/login — autenticación', () => {
  it('401 UNAUTHORIZED si el usuario no existe en BD', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'noexiste', contrasena: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('401 UNAUTHORIZED si el usuario está inactivo', async () => {
    const { prisma } = await import('@/config/database.config');
    vi.mocked(prisma.ct_usuario.findUnique).mockResolvedValueOnce({
      id_ct_usuario: 1,
      usuario: 'inactivo',
      contrasena: 'hash',
      email: null,
      nombre_completo: 'Usuario Inactivo',
      rol: 'CAJERO' as never,
      estado: false,
      fecha_registro: new Date(),
      fecha_modificacion: null,
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'inactivo', contrasena: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });
});

// ── POST /api/auth/refresh — rotación de tokens ───────────────────────────────

describe('POST /api/auth/refresh — rotación', () => {
  it('401 si no hay cookie de refreshToken', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('401 si el refreshToken tiene firma inválida (JWT malformado)', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', 'refreshToken=esto.no.es.un.jwt.valido');

    expect(res.status).toBe(401);
  });

  it('401 si el hash del token no está en BD (ya girado o fabricado)', async () => {
    const { prisma } = await import('@/config/database.config');
    // El mock por defecto de findUnique ya devuelve null — token no encontrado en BD
    vi.mocked(prisma.dt_refresh_token.findUnique).mockResolvedValueOnce(null);

    // Generamos un token válido criptográficamente para que pase la verificación JWT
    const jwt = await import('jsonwebtoken');
    const tokenValido = jwt.sign(
      { id_ct_usuario: 1, usuario: 'test', email: null, rol: 'CAJERO' },
      process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: '7d' },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${tokenValido}`);

    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('401 si el token ya fue revocado (reutilización detectada) → invalida familia', async () => {
    const { prisma } = await import('@/config/database.config');

    vi.mocked(prisma.dt_refresh_token.findUnique).mockResolvedValueOnce({
      id_dt_refresh_token: 5,
      token_hash: 'cualquier-hash',
      id_ct_usuario: 1,
      expira_en: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revocado: true, // ← ya revocado: reutilización
      revocado_en: new Date(),
      reemplazado_por: 6,
      creado_en: new Date(),
    } as never);

    const jwt = await import('jsonwebtoken');
    const tokenValido = jwt.sign(
      { id_ct_usuario: 1, usuario: 'test', email: null, rol: 'CAJERO' },
      process.env['JWT_REFRESH_SECRET']!,
      { expiresIn: '7d' },
    );

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${tokenValido}`);

    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
    // Verifica que se invalidó toda la familia de tokens del usuario
    expect(vi.mocked(prisma.dt_refresh_token.updateMany)).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id_ct_usuario: 1 }),
        data: expect.objectContaining({ revocado: true }),
      }),
    );
  });
});

// ── Rutas protegidas sin cookie ────────────────────────────────────────────────

describe('Rutas protegidas — sin cookie de sesión', () => {
  it('GET /api/auth/me → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/logout → 401 (requiere accessToken cookie)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

// ── 404 ───────────────────────────────────────────────────────────────────────

describe('Rutas no existentes', () => {
  it('responde 404 para una ruta desconocida', async () => {
    const res = await request(app).get('/api/no-existe');
    expect(res.status).toBe(404);
    expect(res.body.codigo).toBe('NOT_FOUND');
  });
});
