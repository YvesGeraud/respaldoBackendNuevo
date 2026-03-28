import { Permiso } from '@/types';

/**
 * Mapeo de roles a permisos detallados.
 * Centraliza la lógica de "quién puede hacer qué".
 * NOTA: Los nombres de las llaves deben coincidir exactamente con el campo 'nombre' en ct_rol.
 */
export const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
  ADMIN: [
    'USUARIOS_VER', 'USUARIOS_CREAR', 'USUARIOS_EDITAR', 'USUARIOS_BORRAR',
    'PLATILLOS_VER', 'PLATILLOS_CREAR', 'PLATILLOS_EDITAR', 'PLATILLOS_BORRAR',
    'ORDENES_VER', 'ORDENES_CREAR', 'ORDENES_ESTADO', 'ORDENES_CANCELAR',
    'CONFIG_VER', 'AUDITORIA_VER', 'REPORTES_VER'
  ],

  GERENTE: [
    'USUARIOS_VER',
    'PLATILLOS_VER', 'PLATILLOS_CREAR', 'PLATILLOS_EDITAR',
    'ORDENES_VER', 'ORDENES_CREAR', 'ORDENES_ESTADO', 'ORDENES_CANCELAR',
    'REPORTES_VER', 'AUDITORIA_VER'
  ],
  
  CAJERO: [
    'PLATILLOS_VER',
    'ORDENES_VER', 'ORDENES_CREAR', 'ORDENES_ESTADO', 'ORDENES_CANCELAR',
    'REPORTES_VER'
  ],

  MESERO: [
    'PLATILLOS_VER',
    'ORDENES_VER', 'ORDENES_CREAR', 'ORDENES_ESTADO'
  ],

  COCINA: [
    'PLATILLOS_VER',
    'ORDENES_VER', 'ORDENES_ESTADO', 'PLATILLOS_CREAR'
  ]
};

export type Rol = keyof typeof PERMISOS_POR_ROL;

/**
 * Función utilidad para obtener los permisos de un rol.
 */
export function obtenerPermisosPorRol(rol: string): Permiso[] {
  return PERMISOS_POR_ROL[rol] || [];
}
