import { Router } from 'express';
import platilloController from '@/controllers/platillo.controller';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearPlatilloSchema,
  actualizarPlatilloSchema,
  idParamSchema,
  filtrosPlatillosSchema,
  crearPlatillosLoteSchema,
} from '@/schemas/platillo.schema';

/**
 * Rutas de platillos.
 * Las rutas de lectura (GET) son públicas.
 * Las de escritura (POST/PUT/DELETE) requieren autenticación — descomenta
 * `autenticado` cuando implementes el middleware de auth.
 *
 * import { autenticado } from '@/middlewares/autenticacion.middleware';
 */
const router = Router();

// Rutas públicas
router.get('/', validar(filtrosPlatillosSchema), platilloController.listar);
router.get('/:id', validar(idParamSchema), platilloController.obtenerPorId);

// Rutas protegidas (agregar `autenticado,` antes de `validar` cuando esté listo)
// ⚠ /batch DEBE ir antes de /:id — Express interpreta "batch" como un ID si va después
router.post('/batch', validar(crearPlatillosLoteSchema), platilloController.crearLote);
router.post('/', validar(crearPlatilloSchema), platilloController.crear);
router.put('/:id', validar(actualizarPlatilloSchema), platilloController.actualizar);
router.delete('/:id', validar(idParamSchema), platilloController.eliminar);

export { router as platilloRouter };
