import { Router } from 'express';
import clienteController from '@/controllers/cliente.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { tienePermiso } from '@/middlewares/autorizacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearClienteSchema,
  actualizarClienteSchema,
  filtrosClientesSchema,
} from '@/schemas/cliente.schema';
import { idParamSchema } from '@/schemas/comun.schema';

const router = Router();

// Todas las rutas de clientes requieren estar autenticado
router.use(autenticado);

router.get(
  '/',
  tienePermiso('CLIENTES_VER'),
  validar(filtrosClientesSchema),
  clienteController.listar
);

router.get(
  '/:id',
  tienePermiso('CLIENTES_VER'),
  validar(idParamSchema),
  clienteController.obtenerPorId
);

router.post(
  '/',
  tienePermiso('CLIENTES_CREAR'),
  validar(crearClienteSchema),
  clienteController.crear
);

router.patch(
  '/:id',
  tienePermiso('CLIENTES_EDITAR'),
  validar(actualizarClienteSchema),
  clienteController.actualizar
);

router.delete(
  '/:id',
  tienePermiso('CLIENTES_BORRAR'),
  validar(idParamSchema),
  clienteController.eliminar
);

export { router as clienteRouter };
