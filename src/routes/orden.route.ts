import { Router } from 'express';
import ordenController from '@/controllers/orden.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware'; // TODO: Validar que todos estén logueados
import { tienePermiso } from '@/middlewares/autorizacion.middleware'; // TODO: Implementar autorización
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearOrdenSchema,
  actualizarEstadoOrdenSchema,
  actualizarOrdenSchema,
  filtrosOrdenesSchema,
} from '@/schemas/orden.schema';
import { idParamSchema } from '@/schemas/comun.schema';

const router = Router();

router.use(autenticado);

// Rutas protegidas genéricas o de consulta (solo ocupan estar autenticados, o un rol de visualización)
router.get('/', validar(filtrosOrdenesSchema), ordenController.obtenerTodos);
router.get('/:id', validar(idParamSchema), ordenController.obtenerPorId);

// Rutas protegidas (Requieren login y permisos específicos)
router.post('/', tienePermiso('ORDENES_CREAR'), validar(crearOrdenSchema), ordenController.crear);

router.patch(
  '/:id/estado',
  tienePermiso('ORDENES_ESTADO'),
  validar(actualizarEstadoOrdenSchema),
  ordenController.actualizarEstado,
);

router.put(
  '/:id',
  tienePermiso('ORDENES_EDITAR'),
  validar(actualizarOrdenSchema),
  ordenController.actualizar,
);

router.delete(
  '/:id',
  tienePermiso('ORDENES_CANCELAR'), // O el permiso que definas
  validar(idParamSchema),
  ordenController.cancelar,
);

export { router as ordenRouter };
