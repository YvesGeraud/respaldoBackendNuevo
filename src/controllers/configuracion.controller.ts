import type { Request, Response } from 'express';
import configuracionService from '@/services/configuracion.service';
import { responder } from '@/utils/respuestas.utils';
import { ActualizarConfiguracionDTO } from '@/schemas/configuracion.schema';

class ConfiguracionController {
  async obtener(req: Request, res: Response): Promise<void> {
    const config = await configuracionService.obtener();
    responder.ok(res, config);
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const config = await configuracionService.actualizar(
      req.usuario!.id_ct_usuario,
      req.body as ActualizarConfiguracionDTO,
    );
    responder.ok(res, config, 'Configuración actualizada exitosamente');
  }
}

export default new ConfiguracionController();
