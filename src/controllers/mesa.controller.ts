import type { Request, Response } from 'express';
import mesaService from '@/services/mesa.service';
import { responder } from '@/utils/respuestas.utils';
import { filtrosMesasSchema, CrearMesaDTO, ActualizarMesaDTO } from '@/schemas/mesa.schema';

class MesaController {
  async listar(req: Request, res: Response): Promise<void> {
    // Validamos y transformamos los filtros usando el schema (p.ej. "true" -> true)
    const filtros = filtrosMesasSchema.parse({ query: req.query }).query;

    const { datos, ...meta } = await mesaService.obtenerTodas(filtros);
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const mesa = await mesaService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, mesa);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const mesa = await mesaService.crear(req.usuario!.id_ct_usuario, req.body as CrearMesaDTO);
    responder.creado(res, mesa, 'Mesa creada exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const mesa = await mesaService.actualizar(
      req.usuario!.id_ct_usuario,
      Number(req.params['id']),
      req.body as ActualizarMesaDTO,
    );
    responder.ok(res, mesa, 'Mesa actualizada exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await mesaService.eliminar(req.usuario!.id_ct_usuario, Number(req.params['id']));
    responder.ok(res, null, 'Mesa desactivada exitosamente');
  }
}

export default new MesaController();
