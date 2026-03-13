import type { Request, Response } from 'express';
import platilloService from '@/services/platillo.service';
import { responder } from '@/utils/respuestas.utils';
import type {
  FiltrosPlatillos,
  CrearPlatilloDTO,
  ActualizarPlatilloDTO,
  CrearPlatillosLoteDTO,
} from '@/schemas/platillo.schema';

/**
 * Express 5 propaga automáticamente los errores de Promises rechazadas al
 * error middleware — no se necesita try/catch en cada método.
 * Si el service lanza ErrorNoEncontrado, ErrorDuplicado, etc., llegan solos.
 */
class PlatilloController {
  async listar(req: Request, res: Response): Promise<void> {
    // req.query ya fue validado y coercionado por validar(filtrosPlatillosSchema)
    const { datos, ...meta } = await platilloService.obtenerTodos(
      req.query as unknown as FiltrosPlatillos,
    );
    responder.paginado(res, datos, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    // req.params.id ya es número en runtime gracias a z.coerce.number() en el schema
    const platillo = await platilloService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, platillo);
  }

  async crear(req: Request, res: Response): Promise<void> {
    const platillo = await platilloService.crear(req.body as CrearPlatilloDTO);
    responder.creado(res, platillo, 'Platillo creado exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const platillo = await platilloService.actualizar(
      Number(req.params['id']),
      req.body as ActualizarPlatilloDTO,
    );
    responder.ok(res, platillo, 'Platillo actualizado exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await platilloService.eliminar(Number(req.params['id']));
    responder.sinContenido(res);
  }

  /**
   * POST /api/v1/platillos/batch
   * Crea múltiples platillos en un solo request.
   * Responde 201 con el resumen del lote aunque algunos items hayan fallado —
   * el cliente decide si reintentar los errores usando el campo `errores[]`.
   */
  async crearLote(req: Request, res: Response): Promise<void> {
    const datos   = req.body as CrearPlatillosLoteDTO;
    const resultado = await platilloService.crearMuchos(datos);
    responder.creado(res, resultado, `Lote procesado: ${resultado.exitosos}/${resultado.procesados} creados`);
  }
}

export default new PlatilloController();
