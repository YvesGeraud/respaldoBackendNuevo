import type { Request, Response } from 'express';
import categoriaService from '@/services/categoria.service';
import { responder } from '@/utils/respuestas.utils';
import type {
  FiltrosCategorias,
  CrearCategoriaDTO,
  ActualizarCategoriaDTO,
} from '@/schemas/categoria.schema';

class CategoriaController {
  async listar(req: Request, res: Response): Promise<void> {
    const { datos, ...meta } = await categoriaService.obtenerTodos(
      req.query as unknown as FiltrosCategorias,
    );
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const categoria = await categoriaService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, categoria);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const categoria = await categoriaService.crear(
      req.usuario!.id_ct_usuario,
      req.body as CrearCategoriaDTO,
    );
    responder.creado(res, categoria, 'Categoría creada exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const categoria = await categoriaService.actualizar(
      req.usuario!.id_ct_usuario,
      Number(req.params['id']),
      req.body as ActualizarCategoriaDTO,
    );
    responder.ok(res, categoria, 'Categoría actualizada exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await categoriaService.eliminar(req.usuario!.id_ct_usuario, Number(req.params['id']));
    responder.ok(res, null, 'Categoría eliminada exitosamente');
  }
}

export default new CategoriaController();
