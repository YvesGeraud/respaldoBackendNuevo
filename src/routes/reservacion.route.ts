import { Router } from 'express';
import reservacionController from '@/controllers/reservacion.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { tienePermiso } from '@/middlewares/autorizacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import {
  filtrosReservacionesSchema,
  crearReservacionSchema,
  actualizarReservacionSchema,
} from '@/schemas/reservacion.schema';
import { idParamSchema } from '@/schemas/comun.schema';

const router = Router();

// Todas las rutas de reservaciones requieren autenticación
router.use(autenticado);

/**
 * @route   GET /api/reservaciones
 * @desc    Obtener todas las reservaciones con filtros y paginación
 */
router.get(
  '/',
  tienePermiso('RESERVACIONES_VER'),
  validar(filtrosReservacionesSchema),
  reservacionController.obtenerTodos,
);

/**
 * @route   GET /api/reservaciones/:id
 * @desc    Obtener una reservación por ID
 */
router.get(
  '/:id',
  tienePermiso('RESERVACIONES_VER'),
  validar(idParamSchema),
  reservacionController.obtenerPorId,
);

/**
 * @route   POST /api/reservaciones
 * @desc    Crear una nueva reservación
 */
router.post(
  '/',
  tienePermiso('RESERVACIONES_CREAR'),
  validar(crearReservacionSchema),
  reservacionController.crear,
);

/**
 * @route   PATCH /api/reservaciones/:id
 * @desc    Actualizar una reservación (estado, mesa, notas, etc.)
 */
router.patch(
  '/:id',
  tienePermiso('RESERVACIONES_EDITAR'),
  validar(actualizarReservacionSchema),
  reservacionController.actualizar,
);

/**
 * @route   DELETE /api/reservaciones/:id
 * @desc    Eliminar una reservación
 */
router.delete(
  '/:id',
  tienePermiso('RESERVACIONES_BORRAR'),
  validar(idParamSchema),
  reservacionController.eliminar,
);

export { router as reservacionesRouter };
