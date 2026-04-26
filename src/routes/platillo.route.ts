import { Router } from 'express';
import platilloController from '@/controllers/platillo.controller';
import { validar } from '@/middlewares/validar.middlewares';
import { idParamSchema } from '@/schemas/comun.schema';
import {
  crearPlatilloSchema,
  actualizarPlatilloSchema,
  filtrosPlatillosSchema,
  crearPlatillosLoteSchema,
} from '@/schemas/platillo.schema';

import { autenticado } from '@/middlewares/autenticacion.middleware'; //TODO: Implementar autenticación
import { tienePermiso } from '@/middlewares/autorizacion.middleware'; //TODO: Implementar autorización
const router = Router();

// Rutas públicas
router.get('/', validar(filtrosPlatillosSchema), platilloController.listar);
router.get('/:id', validar(idParamSchema), platilloController.obtenerPorId);

// Rutas protegidas (Requieren login y permisos específicos)
// ⚠ /batch DEBE ir antes de /:id — Express interpreta "batch" como un ID si va después
router.post(
  '/batch',
  autenticado,
  tienePermiso('PLATILLOS_CREAR'),
  validar(crearPlatillosLoteSchema),
  platilloController.crearLote,
);

router.post(
  '/',
  autenticado,
  tienePermiso('PLATILLOS_CREAR'),
  validar(crearPlatilloSchema),
  platilloController.crear,
);

router.patch(
  '/:id',
  autenticado,
  tienePermiso('PLATILLOS_EDITAR'),
  validar(actualizarPlatilloSchema),
  platilloController.actualizar,
);

router.delete(
  '/:id',
  autenticado,
  tienePermiso('PLATILLOS_BORRAR'),
  validar(idParamSchema),
  platilloController.eliminar,
);

export { router as platilloRouter };
