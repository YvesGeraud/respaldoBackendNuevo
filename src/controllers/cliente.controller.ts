import type { Request, Response } from 'express';
import clienteService from '@/services/cliente.service';
import { responder } from '@/utils/respuestas.utils';
import { FiltrosClientes, CrearClienteDTO, ActualizarClienteDTO } from '@/schemas/cliente.schema';

class ClienteController {
  async listar(req: Request, res: Response): Promise<void> {
    const { datos, ...meta } = await clienteService.obtenerTodos(
      req.query as unknown as FiltrosClientes,
    );
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const cliente = await clienteService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, cliente);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const cliente = await clienteService.crear(
      req.usuario!.id_ct_usuario,
      req.body as CrearClienteDTO,
    );
    responder.creado(res, cliente, 'Cliente registrado exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const cliente = await clienteService.actualizar(
      req.usuario!.id_ct_usuario,
      Number(req.params['id']),
      req.body as ActualizarClienteDTO,
    );
    responder.ok(res, cliente, 'Cliente actualizado exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await clienteService.eliminar(req.usuario!.id_ct_usuario, Number(req.params['id']));
    responder.ok(res, null, 'Cliente desactivado exitosamente');
  }
}

export default new ClienteController();
