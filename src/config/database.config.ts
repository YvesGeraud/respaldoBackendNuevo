import { PrismaClient, Prisma } from '@/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { config } from '@/config/servidor.config';
import { getAuditContext } from '@/utils/async-context';

declare global {
  var prisma: PrismaClient | undefined;
}

function crearCliente(): PrismaClient {
  const adapter = new PrismaMariaDb({
    host: config.db.host,
    port: config.db.port,
    database: config.db.nombre,
    user: config.db.usuario,
    password: config.db.password,
    // En producción: ajusta según (max_connections de MariaDB / nº de instancias del app) - 10 de margen
    connectionLimit: config.esProduccion ? 20 : 5,
    // Tiempo máximo para obtener conexión del pool — falla rápido bajo alta carga
    acquireTimeout: 8_000,
    // Cierra conexiones inactivas después de 10 min para liberar recursos en el servidor DB
    idleTimeout: 600_000,
    // Tiempo máximo para abrir la conexión TCP con el servidor
    connectTimeout: 5_000,
  });

  const baseClient = new PrismaClient({
    adapter,
    log: config.nodeEnv === 'development' ? ['query', 'warn', 'error'] : ['error'],
  });

  // Prisma Extension para Bitácora de Auditoría
  return baseClient.$extends({
    query: {
      $allModels: {
        async update({ model, operation, args, query }) {
          // Ignoramos la propia tabla de logs y de tokens temporales de sesión
          if (model === 'AuditLog' || model === 'dt_refresh_token') {
             return query(args);
          }

          // 1. Obtenemos el registro ANTES de actualizarlo
          const before = await (baseClient as any)[model].findUnique({
            where: args.where,
          });

          // 2. Ejecutamos la actualización normal
          const result = await query(args);

          // 3. Calculamos las diferencias
          const oldValues: Record<string, any> = {};
          const newValues: Record<string, any> = {};

          if (before && args.data) {
            const beforeAny = before as Record<string, any>;
            const resultAny = result as Record<string, any>;
            for (const key of Object.keys(args.data)) {
              if (beforeAny[key] !== resultAny[key] && resultAny[key] !== undefined) {
                oldValues[key] = beforeAny[key];
                newValues[key] = resultAny[key];
              }
            }
          }

          // 4. Si hubo cambios reales, guardamos el log asíncronamente
          if (Object.keys(oldValues).length > 0) {
            const context = getAuditContext();

            // Usamos fire-and-forget para no bloquear el hilo de la respuesta al cliente
            baseClient.auditLog.create({
              data: {
                action: 'UPDATE',
                endpoint: context?.endpoint || 'Internal',
                statusCode: 200, // asumiendo éxito porque estamos a nivel BD
                userId: context?.id_ct_usuario,
                ipAddress: context?.ip,
                userAgent: context?.user_agent,
                payload: {
                    modelName: model,
                    recordId: String((result as any).id || (result as any)[`id_${model}`] || (result as any)[`id`]),
                    oldValues,
                    newValues
                }
              },
            }).catch(err => console.error('Error guardando audit log:', err));
          }

          return result;
        },

        async create({ model, operation, args, query }) {
          if (model === 'AuditLog') {
             return query(args);
          }

          const result = await query(args);

          const context = getAuditContext();

          baseClient.auditLog.create({
            data: {
              action: 'CREATE',
              endpoint: context?.endpoint || 'Internal',
              statusCode: 200,
              userId: context?.id_ct_usuario,
              ipAddress: context?.ip,
              userAgent: context?.user_agent,
              payload: {
                  modelName: model,
                  recordId: String((result as any).id || (result as any)[`id_${model}`] || (result as any)[`id`]),
                  newValues: result,
              }
            },
          }).catch(err => console.error('Error guardando audit log:', err));
          
          return result;
        },

        async delete({ model, operation, args, query }) {
          if (model === 'AuditLog' || model === 'dt_refresh_token') {
             return query(args);
          }

          const before = await (baseClient as any)[model].findUnique({
             where: args.where,
          });

          const result = await query(args);

          if (before) {
            const context = getAuditContext();

            baseClient.auditLog.create({
              data: {
                action: 'DELETE',
                endpoint: context?.endpoint || 'Internal',
                statusCode: 200,
                userId: context?.id_ct_usuario,
                ipAddress: context?.ip,
                userAgent: context?.user_agent,
                payload: {
                    modelName: model,
                    recordId: String((before as any).id || (before as any)[`id_${model}`] || (before as any)[`id`]),
                    oldValues: before,
                }
              },
            }).catch(err => console.error('Error guardando audit log:', err));
          }
          
          return result;
        }
      },
    },
  }) as unknown as PrismaClient; // Forzamos el tipado para mantener compatibilidad con el resto de la app
}

export const prisma = globalThis.prisma ?? crearCliente();

if (!config.esProduccion) {
  globalThis.prisma = prisma;
}
