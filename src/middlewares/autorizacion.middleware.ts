import { Request, Response, NextFunction } from 'express';
import { ErrorNoAutorizado } from '@/utils/errores.utils';
import { Permiso } from '@/types';

/**
 * Middleware que verifica si el usuario autenticado tiene el permiso requerido.
 * Debe usarse después del middleware de autenticación.
 *
 * @param permiso El nombre del permiso que se requiere para acceder a la ruta.
 * @example
 * router.post('/', autenticado, tienePermiso('PLATILLOS_CREAR'), controller.crear);
 */
export const tienePermiso = (permiso: Permiso) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const usuario = req.usuario;

    // Si no hay usuario en la petición o no tiene el permiso buscado
    if (!usuario || !usuario.permisos || !usuario.permisos.includes(permiso)) {
      next(new ErrorNoAutorizado(`No tienes el permiso necesario: ${permiso}`));
      return;
    }

    next();
  };
};
