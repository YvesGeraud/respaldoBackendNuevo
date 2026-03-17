import { Request, Response, NextFunction } from 'express';
import { auditContextStorage } from '@/utils/async-context';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Solo nos interesa registrar los métodos que alteran datos
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    // Tratamos de obtener la data de la petición y usuario si existe
    // (Asegúrate de que este middleware corra DESPUÉS de tu authMiddleware si quieres req.user)
    const id_ct_usuario = (req as any).user?.id || undefined;
    const ip = req.ip || req.connection.remoteAddress;
    const user_agent = req.get('user-agent');
    const endpoint = req.originalUrl;
    
    const contextData = {
      id_ct_usuario,
      ip,
      user_agent,
      endpoint
    };

    // run() ejecuta "next()" dentro de un contexto aislado asíncrono.
    // Todas las operaciones de Prisma o Promises que se levanten de "next"
    // tendrán disponible este "contextData".
    auditContextStorage.run(contextData, () => {
      next();
    });
  } else {
      next();
  }
};
