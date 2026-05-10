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

// Rutas públicas y protegidas de reservaciones

/**
 * @route   GET /api/reservaciones
 * @desc    Obtener todas las reservaciones con filtros y paginación
 */
router.get(
  '/',
  autenticado,
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
  autenticado,
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
  // Público: cualquier persona puede crear una reservación desde la web
  validar(crearReservacionSchema),
  reservacionController.crear,
);

/**
 * @route   PATCH /api/reservaciones/:id
 * @desc    Actualizar una reservación (estado, mesa, notas, etc.)
 */
router.patch(
  '/:id',
  autenticado,
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
  autenticado,
  tienePermiso('RESERVACIONES_BORRAR'),
  validar(idParamSchema),
  reservacionController.eliminar,
);

export { router as reservacionesRouter };
