import type { Request, Response, NextFunction } from 'express';
import type { RolUsuario } from '@/generated/prisma/client';
import authService from '@/services/auth.service';
import { ErrorNoAutenticado, ErrorNoAutorizado } from '@/utils/errores.utils';

/**
 * Lee el accessToken de la cookie httpOnly y lo verifica.
 * Si es válido, adjunta el payload en req.usuario para que los controllers lo usen.
 * Si el token expiró o es inválido, los errores JWT llegan al error middleware global.
 */
export const autenticado = (req: Request, _res: Response, next: NextFunction): void => {
  const token = req.cookies['accessToken'] as string | undefined;

  if (!token) {
    next(new ErrorNoAutenticado('No hay sesión activa'));
    return;
  }

  try {
    const payload = authService.verificarAccessToken(token);
    req.usuario = {
      id_usuario: payload.id_usuario,
      usuario: payload.usuario,
      email: payload.email,
      rol: payload.rol as RolUsuario, // el JWT almacena el enum como string
    };
    next();
  } catch (error) {
    // TokenExpiredError y JsonWebTokenError llegan aquí y el error middleware los maneja
    next(error);
  }
};

/**
 * Factory que genera middleware de control de roles.
 * Debe usarse SIEMPRE después de `autenticado`.
 *
 * @example
 * router.delete('/:id', autenticado, autorizado('ADMIN'), controller.eliminar);
 * router.patch('/:id',  autenticado, autorizado('ADMIN', 'ENCARGADO'), controller.actualizar);
 */
export const autorizado = (...rolesPermitidos: RolUsuario[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const rol = req.usuario?.rol;

    if (!rol || !rolesPermitidos.includes(rol)) {
      next(new ErrorNoAutorizado(`Requiere rol: ${rolesPermitidos.join(' o ')}`));
      return;
    }

    next();
  };
};
