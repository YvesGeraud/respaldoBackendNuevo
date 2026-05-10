import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';

// Mock de Prisma
vi.mock('@/config/database.config', () => ({
  prisma: {
    ct_configuracion: {
      findFirst: vi.fn(),
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

const getAuthCookie = (id = 1, rol = 'ADMIN', permisos: string[] = ['CONFIG_VER']) => {
  const token = jwt.sign({ id_ct_usuario: id, usuario: 'admin', rol, permisos }, SECRET, {
    expiresIn: '15m',
  });
  return `accessToken=${token}`;
};

describe('Módulo de Configuración — Rutas de Integración', () => {
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

  describe('GET /api/configuracion', () => {
    it('debe retornar la configuración existente', async () => {
      const mockConfig = { id_ct_configuracion: 1, nombre_restaurante: 'Test Rest' };
      vi.mocked(prisma.ct_configuracion.findFirst).mockResolvedValue(mockConfig as any);

      const res = await request(app).get('/api/configuracion').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
      expect(res.body.exito).toBe(true);
      expect(res.body.datos.nombre_restaurante).toBe('Test Rest');
    });

    it('debe crear configuración por defecto si no existe', async () => {
      vi.mocked(prisma.ct_configuracion.findFirst).mockResolvedValue(null);
      vi.mocked(prisma.ct_configuracion.create).mockResolvedValue({
        id_ct_configuracion: 1,
        nombre_restaurante: 'Mi Restaurante',
      } as any);

      const res = await request(app).get('/api/configuracion').set('Cookie', getAuthCookie());

      expect(res.status).toBe(200);
      expect(prisma.ct_configuracion.create).toHaveBeenCalled();
    });

    it('debe retornar 403 si el usuario no tiene permisos', async () => {
      vi.mocked(prisma.rl_rol_permiso.findMany).mockResolvedValueOnce([]); // Sin permisos

      const res = await request(app)
        .get('/api/configuracion')
        .set('Cookie', getAuthCookie(2, 'CAJERO', []));

      expect(res.status).toBe(403);
    });
  });

  describe('PATCH /api/configuracion', () => {
    it('debe actualizar la configuración', async () => {
      vi.mocked(prisma.ct_configuracion.findFirst).mockResolvedValue({
        id_ct_configuracion: 1,
      } as any);
      vi.mocked(prisma.ct_configuracion.update).mockResolvedValue({
        id_ct_configuracion: 1,
        nombre_restaurante: 'Nuevo Nombre',
      } as any);

      const res = await request(app)
        .patch('/api/configuracion')
        .set('Cookie', getAuthCookie())
        .send({ nombre_restaurante: 'Nuevo Nombre', moneda: '$', impuesto_porcentaje: 0.16 });

      expect(res.status).toBe(200);
      expect(res.body.datos.nombre_restaurante).toBe('Nuevo Nombre');
      expect(prisma.ct_configuracion.update).toHaveBeenCalled();
    });
  });
});
