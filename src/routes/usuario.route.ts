import { Router } from 'express';
import usuarioController from '@/controllers/usuario.controller';
import { autenticado } from '@/middlewares/autenticacion.middleware';
import { tienePermiso } from '@/middlewares/autorizacion.middleware';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearUsuarioSchema,
  actualizarUsuarioSchema,
  filtrosUsuariosSchema,
} from '@/schemas/usuario.schema';
import { idParamSchema } from '@/schemas/comun.schema';

const router = Router();

// Todas las rutas de usuarios requieren estar autenticado
router.use(autenticado);

// Gestión de Roles y Permisos (para llenar selects en el front y administración)
router.get('/roles', usuarioController.listarRoles);
router.get('/permisos', tienePermiso('USUARIOS_VER'), usuarioController.listarPermisos);
router.get('/roles/:id/permisos', tienePermiso('USUARIOS_VER'), usuarioController.obtenerPermisosRol);
router.put('/roles/:id/permisos', tienePermiso('USUARIOS_EDITAR'), usuarioController.actualizarPermisosRol);

// CRUD de Usuarios
router.get(
  '/',
  tienePermiso('USUARIOS_VER'),
  validar(filtrosUsuariosSchema),
  usuarioController.listar,
);

router.get(
  '/:id',
  tienePermiso('USUARIOS_VER'),
  validar(idParamSchema),
  usuarioController.obtenerPorId,
);

router.post(
  '/',
  tienePermiso('USUARIOS_CREAR'),
  validar(crearUsuarioSchema),
  usuarioController.crear,
);

router.patch(
  '/:id',
  tienePermiso('USUARIOS_EDITAR'),
  validar(actualizarUsuarioSchema),
  usuarioController.actualizar,
);

router.delete(
  '/:id',
  tienePermiso('USUARIOS_BORRAR'),
  validar(idParamSchema),
  usuarioController.eliminar,
);

export { router as usuarioRouter };
