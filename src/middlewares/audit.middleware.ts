import { Request, Response, NextFunction } from 'express';
import { auditContextStorage, type AuditContext } from '@/utils/async-context';

export const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const contextData: AuditContext = {
    ip: req.ip || req.socket.remoteAddress,
    user_agent: req.get('user-agent'),
    endpoint: req.originalUrl,
  };

  auditContextStorage.run(contextData, () => {
    next();
  });
};
