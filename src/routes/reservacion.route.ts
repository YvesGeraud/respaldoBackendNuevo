import { Router } from 'express';
import reservacionController from '@/controllers/reservacion.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearReservacionSchema,
  actualizarReservacionSchema,
  filtrosReservacionesSchema,
  idParamSchema,
} from '@/schemas/reservacion.schema';

const router = Router();

// Todas las rutas de reservaciones requieren autenticación
router.use(autenticado);

/**
 * @route   GET /api/reservaciones
 * @desc    Obtener todas las reservaciones con filtros y paginación
 */
router.get('/', validar(filtrosReservacionesSchema), reservacionController.obtenerTodos);

/**
 * @route   GET /api/reservaciones/:id
 * @desc    Obtener una reservación por ID
 */
router.get('/:id', validar(idParamSchema), reservacionController.obtenerPorId);

/**
 * @route   POST /api/reservaciones
 * @desc    Crear una nueva reservación
 */
router.post('/', validar(crearReservacionSchema), reservacionController.crear);

/**
 * @route   PATCH /api/reservaciones/:id
 * @desc    Actualizar una reservación (estado, mesa, notas, etc.)
 */
router.patch('/:id', validar(actualizarReservacionSchema), reservacionController.actualizar);

/**
 * @route   DELETE /api/reservaciones/:id
 * @desc    Eliminar una reservación
 */
router.delete('/:id', validar(idParamSchema), reservacionController.eliminar);

export { router as reservacionesRouter };
