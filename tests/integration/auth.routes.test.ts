import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';

/**
 * vi.mock es HOISTED por vitest al tope del archivo (antes de los imports).
 * Esto nos permite interceptar la BD sin que auth.service.ts llegue a conectarse.
 */
vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_usuario: {
      // Por defecto: usuario no encontrado — cada test puede sobreescribir con mockResolvedValueOnce
      findUnique: vi.fn().mockResolvedValue(null),
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

// ── POST /api/v1/auth/login — validación Zod ──────────────────────────────────
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

// ── POST /api/v1/auth/login — autenticación (BD mockeada) ─────────────────────

describe('POST /api/auth/login — autenticación', () => {
  it('401 UNAUTHORIZED si el usuario no existe en BD', async () => {
    // El mock devuelve null (usuario no encontrado) — ver vi.mock arriba
    const res = await request(app)
      .post('/api/auth/login')
      .send({ usuario: 'noexiste', contrasena: 'password123' });

    expect(res.status).toBe(401);
    expect(res.body.exito).toBe(false);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('401 UNAUTHORIZED si el usuario está inactivo', async () => {
    const { prisma } = await import('../../src/config/database.config');
    vi.mocked(prisma.ct_usuario.findUnique).mockResolvedValueOnce({
      id_ct_usuario: 1,
      usuario: 'inactivo',
      contrasena: 'hash',
      email: null,
      nombre_completo: 'Usuario Inactivo',
      rol: 'DOCENTE' as never,
      estado: false, // estado false → bloqueado
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

// ── Rutas protegidas sin cookie ────────────────────────────────────────────────

describe('Rutas protegidas — sin cookie de sesión', () => {
  it('GET /api/auth/me → 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
  });

  it('POST /api/auth/logout → 401', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });

  it('POST /api/auth/refresh sin cookie → 401', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
    expect(res.body.codigo).toBe('UNAUTHORIZED');
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
