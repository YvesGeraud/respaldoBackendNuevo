import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock de Prisma
vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_platillo: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    rl_rol_permiso: {
      findMany: vi.fn(),
    }
  },
}));

import app from '@/setup';
import { prisma } from '@/config/database.config';

const SECRET = process.env['JWT_SECRET']!;

const getAuthCookie = (id = 1, rol = 'ADMIN', permisos: string[] = ['PLATILLOS_VER', 'PLATILLOS_EDITAR']) => {
  const token = jwt.sign(
    { id_ct_usuario: id, usuario: 'admin', rol, permisos },
    SECRET,
    { expiresIn: '15m' }
  );
  return `accessToken=${token}`;
};

describe('Módulo de Platillos — Rutas de Integración', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock por defecto para permisos
    vi.mocked(prisma.rl_rol_permiso.findMany).mockResolvedValue([{"ct_permiso":{"codigo":"USUARIOS_VER"}},{"ct_permiso":{"codigo":"USUARIOS_CREAR"}},{"ct_permiso":{"codigo":"USUARIOS_EDITAR"}},{"ct_permiso":{"codigo":"USUARIOS_BORRAR"}},{"ct_permiso":{"codigo":"CLIENTES_VER"}},{"ct_permiso":{"codigo":"CLIENTES_CREAR"}},{"ct_permiso":{"codigo":"CLIENTES_EDITAR"}},{"ct_permiso":{"codigo":"CLIENTES_BORRAR"}},{"ct_permiso":{"codigo":"PLATILLOS_VER"}},{"ct_permiso":{"codigo":"PLATILLOS_CREAR"}},{"ct_permiso":{"codigo":"PLATILLOS_EDITAR"}},{"ct_permiso":{"codigo":"PLATILLOS_BORRAR"}},{"ct_permiso":{"codigo":"MESAS_VER"}},{"ct_permiso":{"codigo":"MESAS_CREAR"}},{"ct_permiso":{"codigo":"MESAS_EDITAR"}},{"ct_permiso":{"codigo":"MESAS_BORRAR"}},{"ct_permiso":{"codigo":"CONFIG_VER"}},{"ct_permiso":{"codigo":"CONFIG_EDITAR"}},{"ct_permiso":{"codigo":"RESERVACIONES_VER"}},{"ct_permiso":{"codigo":"RESERVACIONES_CREAR"}},{"ct_permiso":{"codigo":"RESERVACIONES_EDITAR"}},{"ct_permiso":{"codigo":"RESERVACIONES_BORRAR"}},{"ct_permiso":{"codigo":"ORDENES_CREAR"}},{"ct_permiso":{"codigo":"ORDENES_ESTADO"}},{"ct_permiso":{"codigo":"ORDENES_CANCELAR"}}] as any);

    // Mock findFirst como null por defecto
    vi.mocked(prisma.ct_platillo.findFirst).mockResolvedValue(null);
  });

  describe('GET /api/platillos', () => {
    it('debe retornar lista de platillos (endpoint público)', async () => {
      const mockPlatillos = [
        { id_ct_platillo: 1, nombre: 'Tacos', precio: 50, estado: true },
      ];

      vi.mocked(prisma.ct_platillo.findMany).mockResolvedValue(mockPlatillos as any);
      vi.mocked(prisma.ct_platillo.count).mockResolvedValue(1);

      // Endpoint público, no necesita cookie
      const res = await request(app).get('/api/platillos');

      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos).toHaveLength(1);
    });
  });

  describe('GET /api/platillos/:id', () => {
    it('debe retornar el detalle de un platillo', async () => {
      vi.mocked(prisma.ct_platillo.findUnique).mockResolvedValue({ id_ct_platillo: 1, nombre: 'Tacos' } as any);

      const res = await request(app).get('/api/platillos/1');

      expect(res.status).toBe(200);
      expect(res.body.datos.nombre).toBe('Tacos');
    });

    it('debe retornar 404 si el platillo no existe', async () => {
      vi.mocked(prisma.ct_platillo.findUnique).mockResolvedValue(null);

      const res = await request(app).get('/api/platillos/99');

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/platillos', () => {
    it('debe crear un platillo autenticado', async () => {
      vi.mocked(prisma.ct_platillo.create).mockResolvedValue({
        id_ct_platillo: 2,
        nombre: 'Hamburguesa',
        precio: 100,
        estado: true,
      } as any);

      const res = await request(app)
        .post('/api/platillos')
        .set('Cookie', getAuthCookie())
        .send({ nombre: 'Hamburguesa', precio: 100, id_ct_categoria: 1 });

      expect(res.status).toBe(201);
      expect(res.body.datos.nombre).toBe('Hamburguesa');
    });

    it('debe retornar 401 si se intenta crear sin autenticación', async () => {
      const res = await request(app)
        .post('/api/platillos')
        .send({ nombre: 'Hamburguesa', precio: 100, id_ct_categoria: 1 });

      expect(res.status).toBe(401);
    });
  });

  describe('PATCH /api/platillos/:id', () => {
    it('debe actualizar un platillo', async () => {
      vi.mocked(prisma.ct_platillo.findUnique).mockResolvedValue({ id_ct_platillo: 1 } as any);
      vi.mocked(prisma.ct_platillo.update).mockResolvedValue({ id_ct_platillo: 1, precio: 120 } as any);

      const res = await request(app)
        .patch('/api/platillos/1')
        .set('Cookie', getAuthCookie())
        .send({ precio: 120 });

      expect(res.status).toBe(200);
      expect(res.body.datos.precio).toBe(120);
    });
  });

  describe('DELETE /api/platillos/:id', () => {
    it('debe desactivar un platillo', async () => {
      vi.mocked(prisma.ct_platillo.findUnique).mockResolvedValue({ id_ct_platillo: 1, estado: true } as any);
      vi.mocked(prisma.ct_platillo.update).mockResolvedValue({ id_ct_platillo: 1, estado: false } as any);

      const res = await request(app)
        .delete('/api/platillos/1')
        .set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
    });
  });
});
