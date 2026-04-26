import { Router } from 'express';
import mesaController from '@/controllers/mesa.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { tienePermiso } from '@/middlewares/autorizacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearMesaSchema,
  actualizarMesaSchema,
  filtrosMesasSchema,
} from '@/schemas/mesa.schema';
import { idParamSchema } from '@/schemas/comun.schema';

const router = Router();

// Todas las rutas de mesas requieren estar autenticado
router.use(autenticado);

router.get(
  '/',
  validar(filtrosMesasSchema),
  mesaController.listar
);

router.get(
  '/:id',
  validar(idParamSchema),
  mesaController.obtenerPorId
);

router.post(
  '/',
  tienePermiso('CONFIG_VER'), // Usamos un permiso de gestión/config para mesas
  validar(crearMesaSchema),
  mesaController.crear
);

router.patch(
  '/:id',
  tienePermiso('CONFIG_VER'),
  validar(actualizarMesaSchema),
  mesaController.actualizar
);

router.delete(
  '/:id',
  tienePermiso('CONFIG_VER'),
  validar(idParamSchema),
  mesaController.eliminar
);

export { router as mesaRouter };
