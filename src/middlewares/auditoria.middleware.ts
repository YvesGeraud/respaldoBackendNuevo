import { Request, Response, NextFunction } from 'express';
import { auditContextStorage, AuditContext } from '@/utils/auth.utils';

/**
 * Middleware que inicializa el contexto de auditoría para cada petición.
 * Captura metadatos como IP, User Agent y Endpoint.
 * El ID del usuario se inyectará después en el middleware de autenticación.
 */
export const middlewareAuditoria = (req: Request, _res: Response, next: NextFunction) => {
  const context: AuditContext = {
    ip: req.ip || req.get('x-forwarded-for') || req.socket.remoteAddress,
    user_agent: req.get('user-agent'),
    endpoint: `${req.method} ${req.originalUrl}`,
    // id_ct_usuario se llenará en el middleware de autenticación si existe sesión
  };

  auditContextStorage.run(context, () => next());
};
