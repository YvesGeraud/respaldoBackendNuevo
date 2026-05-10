import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock de Prisma
vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_categoria: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    rl_rol_permiso: {
      findMany: vi.fn(),
    },
  },
}));

import app from '@/setup';
import { prisma } from '@/config/database.config';

const SECRET = process.env['JWT_SECRET']!;

const getAuthCookie = (
  id = 1,
  rol = 'ADMIN',
  permisos: string[] = ['PLATILLOS_VER', 'PLATILLOS_EDITAR'],
) => {
  const token = jwt.sign({ id_ct_usuario: id, usuario: 'admin', rol, permisos }, SECRET, {
    expiresIn: '15m',
  });
  return `accessToken=${token}`;
};

describe('Módulo de Categorías — Rutas de Integración', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock por defecto para permisos
    vi.mocked(prisma.rl_rol_permiso.findMany).mockResolvedValue([
      { ct_permiso: { codigo: 'USUARIOS_VER' } },
      { ct_permiso: { codigo: 'USUARIOS_CREAR' } },
      { ct_permiso: { codigo: 'USUARIOS_EDITAR' } },
      { ct_permiso: { codigo: 'USUARIOS_BORRAR' } },
      { ct_permiso: { codigo: 'CLIENTES_VER' } },
      { ct_permiso: { codigo: 'CLIENTES_CREAR' } },
      { ct_permiso: { codigo: 'CLIENTES_EDITAR' } },
      { ct_permiso: { codigo: 'CLIENTES_BORRAR' } },
      { ct_permiso: { codigo: 'PLATILLOS_VER' } },
      { ct_permiso: { codigo: 'PLATILLOS_CREAR' } },
      { ct_permiso: { codigo: 'PLATILLOS_EDITAR' } },
      { ct_permiso: { codigo: 'PLATILLOS_BORRAR' } },
      { ct_permiso: { codigo: 'MESAS_VER' } },
      { ct_permiso: { codigo: 'MESAS_CREAR' } },
      { ct_permiso: { codigo: 'MESAS_EDITAR' } },
      { ct_permiso: { codigo: 'MESAS_BORRAR' } },
      { ct_permiso: { codigo: 'CONFIG_VER' } },
      { ct_permiso: { codigo: 'CONFIG_EDITAR' } },
      { ct_permiso: { codigo: 'RESERVACIONES_VER' } },
      { ct_permiso: { codigo: 'RESERVACIONES_CREAR' } },
      { ct_permiso: { codigo: 'RESERVACIONES_EDITAR' } },
      { ct_permiso: { codigo: 'RESERVACIONES_BORRAR' } },
      { ct_permiso: { codigo: 'ORDENES_CREAR' } },
      { ct_permiso: { codigo: 'ORDENES_ESTADO' } },
      { ct_permiso: { codigo: 'ORDENES_CANCELAR' } },
    ] as any);
  });

  describe('GET /api/categorias', () => {
    it('debe retornar lista de categorias', async () => {
      const mockCategorias = [{ id_ct_categoria: 1, nombre: 'Postres', estado: true }];

      vi.mocked(prisma.ct_categoria.findMany).mockResolvedValue(mockCategorias as any);
      vi.mocked(prisma.ct_categoria.count).mockResolvedValue(1);

      const res = await request(app).get('/api/categorias').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos).toHaveLength(1);
    });
  });

  describe('POST /api/categorias', () => {
    it('debe crear una categoría', async () => {
      vi.mocked(prisma.ct_categoria.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.ct_categoria.create).mockResolvedValue({
        id_ct_categoria: 2,
        nombre: 'Bebidas',
        estado: true,
      } as any);

      const res = await request(app)
        .post('/api/categorias')
        .set('Cookie', getAuthCookie())
        .send({ nombre: 'Bebidas' });

      expect(res.status).toBe(201);
      expect(res.body.datos.nombre).toBe('Bebidas');
    });
  });

  describe('PATCH /api/categorias/:id', () => {
    it('debe actualizar una categoría', async () => {
      vi.mocked(prisma.ct_categoria.findUnique).mockResolvedValue({ id_ct_categoria: 1 } as any);
      vi.mocked(prisma.ct_categoria.update).mockResolvedValue({
        id_ct_categoria: 1,
        nombre: 'Editada',
      } as any);

      const res = await request(app)
        .put('/api/categorias/1')
        .set('Cookie', getAuthCookie())
        .send({ nombre: 'Editada' });

      expect(res.status).toBe(200);
      expect(res.body.datos.nombre).toBe('Editada');
    });
  });

  describe('DELETE /api/categorias/:id', () => {
    it('debe desactivar una categoría', async () => {
      vi.mocked(prisma.ct_categoria.findUnique).mockResolvedValue({
        id_ct_categoria: 1,
        estado: true,
      } as any);
      vi.mocked(prisma.ct_categoria.update).mockResolvedValue({
        id_ct_categoria: 1,
        estado: false,
      } as any);

      const res = await request(app).delete('/api/categorias/1').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
    });
  });
});
