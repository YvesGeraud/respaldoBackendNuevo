import { Router } from 'express';
import categoriaController from '@/controllers/categoria.controller';
import { validar } from '@/middlewares/validar.middlewares';
import {
  crearCategoriaSchema,
  actualizarCategoriaSchema,
  idParamCategoriaSchema,
  filtrosCategoriasSchema,
} from '@/schemas/categoria.schema';

import { autenticado } from '@/middlewares/autenticacion.middleware';
// Asumiendo que queremos que todo el mundo autenticado pueda ver categorías, pero solo admin las edite.
// Si no tienes roles estrictos para configuraciones, omitimos tienePermiso o usamos genérico.
// Puesto que el usuario preguntó por permisos genéricos y no nos dio una nueva tabla,
// Dejamos las de consulta abiertas para autenticados, y las de edición con permiso genérico si hiciera falta.
// Voy a poner autenticado para todas por lo pronto para no quebrar.

const router = Router();

// Rutas protegidas (Requieren al menos login para verlas en el dropdown)
router.get('/', autenticado, validar(filtrosCategoriasSchema), categoriaController.listar);
router.get('/:id', autenticado, validar(idParamCategoriaSchema), categoriaController.obtenerPorId);

// Creación, actualización y borrado
router.post('/', autenticado, validar(crearCategoriaSchema), categoriaController.crear);

router.put('/:id', autenticado, validar(actualizarCategoriaSchema), categoriaController.actualizar);

router.delete('/:id', autenticado, validar(idParamCategoriaSchema), categoriaController.eliminar);

export { router as categoriaRouter };
