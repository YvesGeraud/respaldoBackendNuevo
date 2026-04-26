import type { Request, Response } from 'express';
import usuarioService, { UsuarioConRol } from '@/services/usuario.service';
import { responder } from '@/utils/respuestas.utils';
import { FiltrosUsuarios, CrearUsuarioDTO, ActualizarUsuarioDTO } from '@/schemas/usuario.schema';

/**
 * Helper para omitir campos sensibles de forma tipada
 */
function quitarCamposSensibles(usuario: UsuarioConRol) {
  const usuarioSinPass: Partial<UsuarioConRol> = { ...usuario };
  delete usuarioSinPass.contrasena;
  return usuarioSinPass;
}

class UsuarioController {
  async listar(req: Request, res: Response): Promise<void> {
    const { datos, ...meta } = await usuarioService.obtenerTodos(
      req.query as unknown as FiltrosUsuarios,
    );

    const datosLimpios = datos.map(quitarCamposSensibles);
    responder.paginado(res, datosLimpios, meta);
  }

  async obtenerPorId(req: Request, res: Response): Promise<void> {
    const usuario = await usuarioService.obtenerPorId(Number(req.params['id']));
    responder.ok(res, quitarCamposSensibles(usuario));
  }

  async crear(req: Request, res: Response): Promise<void> {
    const usuario = await usuarioService.crear(
      req.usuario!.id_ct_usuario,
      req.body as CrearUsuarioDTO,
    );
    responder.creado(res, quitarCamposSensibles(usuario), 'Usuario creado exitosamente');
  }

  async actualizar(req: Request, res: Response): Promise<void> {
    const usuario = await usuarioService.actualizar(
      req.usuario!.id_ct_usuario,
      Number(req.params['id']),
      req.body as ActualizarUsuarioDTO,
    );
    responder.ok(res, quitarCamposSensibles(usuario), 'Usuario actualizado exitosamente');
  }

  async eliminar(req: Request, res: Response): Promise<void> {
    await usuarioService.eliminar(req.usuario!.id_ct_usuario, Number(req.params['id']));
    responder.ok(res, null, 'Usuario desactivado exitosamente');
  }

  async listarRoles(req: Request, res: Response): Promise<void> {
    const roles = await usuarioService.listarRoles();
    responder.ok(res, roles);
  }
}

export default new UsuarioController();
