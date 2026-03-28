/**
 * Lista maestra de permisos disponibles en el sistema.
 * Se utiliza para:
 * 1. Definir qué puede hacer cada rol en el backend (middleware).
 * 2. Permitir que el frontend oculte/muestre elementos de la UI reactivamente.
 */
export type Permiso =
  // Usuarios y Roles
  | 'USUARIOS_VER' | 'USUARIOS_CREAR' | 'USUARIOS_EDITAR' | 'USUARIOS_BORRAR'
  // Platillos y Menú
  | 'PLATILLOS_VER' | 'PLATILLOS_CREAR' | 'PLATILLOS_EDITAR' | 'PLATILLOS_BORRAR'
  // Órdenes y Ventas
  | 'ORDENES_VER' | 'ORDENES_CREAR' | 'ORDENES_ESTADO' | 'ORDENES_CANCELAR'
  // Configuración y Auditoría
  | 'CONFIG_VER' | 'AUDITORIA_VER' | 'REPORTES_VER';
