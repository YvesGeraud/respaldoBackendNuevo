/**
 * Define los roles estándar del sistema para validaciones y lógica de negocio.
 * Mapeado a los IDs o Nombres de la tabla 'ct_rol'.
 */
export const ROLES = {
  ADMIN: 'ADMIN',
  MESERO: 'MESERO',
  COCINA: 'COCINA',
  CAJERO: 'CAJERO',
} as const;

/**
 * Estados de las órdenes (Mapeado a enum EstadoOrden de Prisma).
 */
export const ESTADO_ORDEN = {
  PENDIENTE: 'PENDIENTE',
  EN_PROCESO: 'EN_PROCESO',
  LISTO: 'LISTO',
  ENTREGADO: 'ENTREGADO',
  CANCELADO: 'CANCELADO',
} as const;

/**
 * Estados de las reservaciones (Mapeado a enum EstadoReservacion de Prisma).
 */
export const ESTADO_RESERVACION = {
  PENDIENTE: 'PENDIENTE',
  CONFIRMADA: 'CONFIRMADA',
  CANCELADA: 'CANCELADA',
  COMPLETADA: 'COMPLETADA',
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];

/**
 * Lista maestra de códigos de permiso (Mapeado a la columna 'codigo' de ct_permiso).
 * Centralizado aquí para dar Type-Safety en middlewares y servicios.
 */
export const PERMISOS = {
  // Usuarios y Roles
  USUARIOS_VER: 'USUARIOS_VER',
  USUARIOS_CREAR: 'USUARIOS_CREAR',
  USUARIOS_EDITAR: 'USUARIOS_EDITAR',
  USUARIOS_BORRAR: 'USUARIOS_BORRAR',

  // Platillos y Menú
  PLATILLOS_VER: 'PLATILLOS_VER',
  PLATILLOS_CREAR: 'PLATILLOS_CREAR',
  PLATILLOS_EDITAR: 'PLATILLOS_EDITAR',
  PLATILLOS_BORRAR: 'PLATILLOS_BORRAR',

  // Órdenes y Ventas
  ORDENES_VER: 'ORDENES_VER',
  ORDENES_CREAR: 'ORDENES_CREAR',
  ORDENES_ESTADO: 'ORDENES_ESTADO',
  ORDENES_CANCELAR: 'ORDENES_CANCELAR',

  // Configuración y Auditoría
  CONFIG_VER: 'CONFIG_VER',
  AUDITORIA_VER: 'AUDITORIA_VER',
  REPORTES_VER: 'REPORTES_VER',
} as const;

export type Permiso = keyof typeof PERMISOS;
