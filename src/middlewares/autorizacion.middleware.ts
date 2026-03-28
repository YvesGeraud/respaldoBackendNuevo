import { Request, Response, NextFunction } from 'express';
import { Permiso } from '@/types';
import { obtenerPermisosPorRol } from '@/config/permisos.config';
import { ErrorNoAutenticado, ErrorNoAutorizado } from '@/utils/errores.utils';

/**
 * Middleware para validar que el usuario tenga un permiso específico.
 * Debe usarse DESPUÉS del middleware de autenticación.
 * 
 * @param permisoRequerido El permiso necesario para acceder a la ruta.
 */
export const tienePermiso = (permisoRequerido: Permiso) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      throw new ErrorNoAutenticado('Usuario no identificado en la petición.');
    }

    const permisosDelUsuario = obtenerPermisosPorRol(usuario.rol);

    if (!permisosDelUsuario.includes(permisoRequerido)) {
      throw new ErrorNoAutorizado(`Acceso denegado. Se requiere el permiso: ${permisoRequerido}`);
    }

    next();
  };
};

/**
 * Middleware para validar que el usuario tenga AL MENOS UNO de los permisos listados.
 */
export const tieneCualquierPermiso = (permisos: Permiso[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const usuario = req.usuario;

    if (!usuario) {
      throw new ErrorNoAutenticado();
    }

    const permisosDelUsuario = obtenerPermisosPorRol(usuario.rol);
    const tieneAlguno = permisos.some(p => permisosDelUsuario.includes(p));

    if (!tieneAlguno) {
      throw new ErrorNoAutorizado('Acceso denegado. No cuentas con los permisos necesarios.');
    }

    next();
  };
};
