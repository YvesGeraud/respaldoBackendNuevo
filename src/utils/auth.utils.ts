import { AsyncLocalStorage } from 'async_hooks';

export interface AuditContext {
  id_ct_usuario?: number;
  ip?: string;
  user_agent?: string;
  endpoint?: string;
}

// Creamos la instancia de AsyncLocalStorage que almacenará nuestro Contexto de Auditoría
export const auditContextStorage = new AsyncLocalStorage<AuditContext>();

/**
 * Función utilitaria para obtener el contexto actual si existe.
 * Esto será invocado por Prisma u otros servicios que no tienen acceso a "req".
 */
export const getAuditContext = (): AuditContext | undefined => {
  return auditContextStorage.getStore();
};
