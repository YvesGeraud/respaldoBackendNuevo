import { Router } from 'express';
import configuracionController from '@/controllers/configuracion.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { tienePermiso } from '@/middlewares/autorizacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import { actualizarConfiguracionSchema } from '@/schemas/configuracion.schema';

const router = Router();

// Todas las rutas de configuración requieren estar autenticado
router.use(autenticado);

router.get(
  '/',
  tienePermiso('CONFIG_VER'),
  configuracionController.obtener
);

router.patch(
  '/',
  tienePermiso('CONFIG_VER'), // Usamos el mismo permiso para editar ya que es configuración crítica
  validar(actualizarConfiguracionSchema),
  configuracionController.actualizar
);

export { router as configuracionRouter };
