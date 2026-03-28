import { Prisma } from '@/generated/prisma/client';
import { getAuditContext } from '@/utils/async-context';

/**
 * Extensión de Prisma para Auditoría Automática.
 * Captura cambios (CREATE, UPDATE, DELETE) y guarda el estado anterior/nuevo.
 */
export const auditExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    name: 'auditExtension',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          // Solo auditar operaciones de escritura
          const operacionesAuditables = ['create', 'update', 'delete', 'updateMany', 'deleteMany', 'upsert'];
          if (!operacionesAuditables.includes(operation)) {
            return query(args);
          }

          const context = getAuditContext();
          // Si no hay contexto (ej: scripts de consola), ejecutamos normal sin auditar
          if (!context) return query(args);

          // Usamos 'any' porque el modelo es dinámico y Prisma no provee estas uniones fácilmente en extensiones genéricas
          /* eslint-disable @typescript-eslint/no-explicit-any */
          let datosAnteriores: any = null;
          let registroId: string | null = null;

          // 1. Capturar datos ANTES (para Update y Delete)
          if (operation === 'update' || operation === 'delete' || operation === 'upsert') {
            try {
              const findArgs = { where: (args as any).where };
              datosAnteriores = await (client as any)[model].findUnique(findArgs);
              if (datosAnteriores) {
                // Intentar extraer el ID del registro
                registroId = String(datosAnteriores.id || datosAnteriores[`id_${model}`] || '');
              }
            } catch {
              console.warn(`[Audit] No se pudo obtener el estado previo de ${model}`);
            }
          }

          // 2. Ejecutar la operación real
          const resultado = await query(args);

          // 3. Capturar datos DESPUÉS y Guardar Log
          let datosNuevos: any = null;
          if (operation === 'create' || operation === 'update' || operation === 'upsert') {
            datosNuevos = resultado;
            if (!registroId && datosNuevos) {
              registroId = String(datosNuevos.id || datosNuevos[`id_${model}`] || '');
            }
          }

          // Evitar auditar la propia tabla de logs (bucle infinito)
          if (model === 'dt_bitacora') return resultado;

          // 4. Persistir en la tabla dt_bitacora de forma asíncrona para no bloquear la respuesta
          // Usamos el cliente base (sin extensión) para evitar recursividad
          (async () => {
            try {
              await (client as any).dt_bitacora.create({
                data: {
                  id_ct_usuario: context.id_ct_usuario,
                  accion: operation.toUpperCase(),
                  modelo: model,
                  registro_id: registroId,
                  endpoint: context.endpoint || 'N/A',
                  metodo: (operation === 'create' ? 'POST' : operation === 'update' ? 'PUT' : 'DELETE'),
                  ip_address: context.ip,
                  user_agent: context.user_agent,
                  datos_anteriores: datosAnteriores ? JSON.parse(JSON.stringify(datosAnteriores)) : null,
                  datos_nuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : null,
                },
              });
            } catch (auditError) {
              console.error(`[Audit Error] Error al guardar bitácora para ${model}:`, auditError);
            }
          })();
          /* eslint-enable @typescript-eslint/no-explicit-any */

          return resultado;
        },
      },
    },
  });
});
