import type { Request, Response, NextFunction } from 'express';
import authService from '@/services/auth.service';
import { ErrorNoAutenticado, ErrorNoAutorizado } from '@/utils/errores.utils';
import { getAuditContext } from '@/utils/async-context';

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
      id_ct_usuario: payload.id_ct_usuario,
      usuario: payload.usuario,
      email: payload.email,
      id_ct_rol: payload.id_ct_rol,
      rol: payload.rol,
    };

    // ─────────────────────────────────────────────────────────────────────────────
    // ACTUALIZAR CONTEXTO DE AUDITORÍA
    // Como el auditMiddleware corre globalmente al inicio de la petición (antes de auth),
    // aquí inyectamos el ID del usuario en el objeto de contexto ya existente.
    const context = getAuditContext();
    if (context) {
      context.id_ct_usuario = payload.id_ct_usuario;
    }
    // ─────────────────────────────────────────────────────────────────────────────

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
 * router.patch('/:id',  autenticado, autorizado('ADMIN', 'GERENTE'), controller.actualizar);
 */
export const autorizado = (...rolesPermitidos: string[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const rol = req.usuario?.rol;

    if (!rol || !rolesPermitidos.includes(rol)) {
      next(new ErrorNoAutorizado(`Requiere rol: ${rolesPermitidos.join(' o ')}`));
      return;
    }

    next();
  };
};
