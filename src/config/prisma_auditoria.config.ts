import { Prisma } from '@prisma/client';
import { getAuditContext } from '@/utils/auth.utils';

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
          const operacionesAuditables = [
            'create',
            'update',
            'delete',
            'updateMany',
            'deleteMany',
            'upsert',
          ];
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
              const accionMap: Record<string, string> = {
                create: 'CREAR',
                update: 'ACTUALIZAR',
                delete: 'ELIMINAR',
                updateMany: 'ACTUALIZAR_MULTIPLE',
                deleteMany: 'ELIMINAR_MULTIPLE',
                upsert: 'GUARDAR',
              };

              let auditAnteriores = datosAnteriores;
              let auditNuevos = datosNuevos;

              // Si es una actualización, solo guardar los campos que cambiaron
              if (
                ['update', 'upsert'].includes(operation) &&
                datosAnteriores &&
                (args as any).data
              ) {
                const subAnterior: any = {};
                const subNuevo: any = {};

                // En upsert, args.update contiene los datos de actualización
                const dataToCompare =
                  operation === 'upsert' ? (args as any).update : (args as any).data;

                if (dataToCompare) {
                  const camposModificados = Object.keys(dataToCompare);
                  camposModificados.forEach((campo) => {
                    // Solo incluir si el campo existe en el registro anterior
                    if (Object.prototype.hasOwnProperty.call(datosAnteriores, campo)) {
                      subAnterior[campo] = (datosAnteriores as any)[campo];
                      subNuevo[campo] = resultado ? (resultado as any)[campo] : null;
                    }
                  });

                  auditAnteriores = subAnterior;
                  auditNuevos = subNuevo;
                }
              }

              await (client as any).dt_bitacora.create({
                data: {
                  id_ct_usuario: context.id_ct_usuario,
                  accion: accionMap[operation] || operation.toUpperCase(),
                  modelo: model,
                  registro_id: registroId,
                  endpoint: context.endpoint || 'N/A',
                  metodo:
                    operation === 'create'
                      ? 'POST'
                      : ['update', 'updateMany', 'upsert'].includes(operation)
                        ? 'PUT'
                        : 'DELETE',
                  ip_address: context.ip,
                  user_agent: context.user_agent,
                  datos_anteriores: auditAnteriores
                    ? JSON.parse(JSON.stringify(auditAnteriores))
                    : null,
                  datos_nuevos: auditNuevos ? JSON.parse(JSON.stringify(auditNuevos)) : null,
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
