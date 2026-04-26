import type { Request, Response } from 'express';
import reservacionService from '@/services/reservacion.service';
import { responder } from '@/utils/respuestas.utils';
import type {
  FiltrosReservaciones,
  CrearReservacionDTO,
  ActualizarReservacionDTO,
} from '@/schemas/reservacion.schema';

class ReservacionController {
  async obtenerTodos(req: Request, res: Response): Promise<void> {
    const filtros = req.query as unknown as FiltrosReservaciones;
    const { datos, ...meta } = await reservacionService.obtenerTodos(filtros);
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const id = Number(req.params['id']);
    const reservacion = await reservacionService.obtenerPorId(id);
    responder.ok(res, reservacion);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const id_ct_usuario = req.usuario!.id_ct_usuario;
    const datos = req.body as CrearReservacionDTO;

    const nuevaReservacion = await reservacionService.crear(id_ct_usuario, datos);
    responder.creado(res, nuevaReservacion, 'Reservación creada exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params['id']);
    const id_ct_usuario = req.usuario!.id_ct_usuario;
    const datos = req.body as ActualizarReservacionDTO;

    const reservacionModificada = await reservacionService.actualizar(id, id_ct_usuario, datos);
    responder.ok(res, reservacionModificada, 'Reservación actualizada exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    const id = Number(req.params['id']);
    const id_ct_usuario = req.usuario!.id_ct_usuario;
    await reservacionService.eliminar(id, id_ct_usuario);
    responder.ok(res, null, 'Reservación cancelada exitosamente');
  }
}

export default new ReservacionController();
