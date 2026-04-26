import type { Request, Response } from 'express';
import ordenService from '@/services/orden.service';
import { responder } from '@/utils/respuestas.utils';
import type {
  FiltrosOrdenes,
  CrearOrdenDTO,
  ActualizarEstadoOrdenDTO,
} from '@/schemas/orden.schema';

class OrdenController {
  async obtenerTodos(req: Request, res: Response): Promise<void> {
    const filtros = req.query as unknown as FiltrosOrdenes;
    const { datos, ...meta } = await ordenService.obtenerTodos(filtros);
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const orden = await ordenService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, orden);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const datos = req.body as CrearOrdenDTO;
    const id_ct_usuario = req.usuario!.id_ct_usuario;
    const nuevaOrden = await ordenService.crearOrdenCompleta(id_ct_usuario, id_ct_usuario, datos);
    responder.creado(res, nuevaOrden, 'Orden creada exitosamente');
  }

  async actualizarEstado(req: Request, res: Response): Promise<void> {
    const id = Number(req.params['id']);
    const datos = req.body as ActualizarEstadoOrdenDTO;
    const id_ct_usuario = req.usuario!.id_ct_usuario;

    const ordenModificada = await ordenService.actualizarEstado(id_ct_usuario, id, datos);
    responder.ok(res, ordenModificada, `El estado de la orden fue actualizado a ${datos.estado}`);
  }

  async cancelar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params['id']);
    const id_ct_usuario = req.usuario!.id_ct_usuario;

    await ordenService.cancelar(id_ct_usuario, id);
    responder.ok(res, null, 'Orden cancelada exitosamente');
  }
}

export default new OrdenController();
