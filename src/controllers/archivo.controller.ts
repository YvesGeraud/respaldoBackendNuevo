import type { Request, Response } from 'express';
import archivoService from '@/services/archivo.service';
import type { SubtipoArchivo } from '@/types';
import { responder } from '@/utils/respuestas.utils';
import { ErrorNegocio } from '@/utils/errores.utils';

class ArchivoController {
  /**
   * POST /api/v1/archivos/:subtipo
   * Recibe un archivo del campo "archivo" en el form-data.
   * Multer ya validó tipo MIME y tamaño — aquí solo orquestamos.
   *
   * Respuesta 201:
   * {
   *   nombreArchivo: "d4e5f6...abc.png",
   *   rutaRelativa:  "imagenes/d4e5f6...abc.png",
   *   hash:          "d4e5f6...",
   *   duplicado:     false,
   *   tamanioBytes:  102400,
   *   mimeType:      "image/png"
   * }
   */
  async subir(req: Request, res: Response): Promise<void> {
    if (!req.file) throw new ErrorNegocio('No se recibió ningún archivo en el campo "archivo"');

    if (!req.usuario) {
      throw new ErrorNegocio('Usuario no autenticado');
    }

    const subtipo = req.params['subtipo'] as SubtipoArchivo;
    const resultado = await archivoService.subir(req.file, subtipo, req.usuario.id_ct_usuario);

    const mensaje = resultado.duplicado
      ? 'El archivo ya existía — se reutilizó el existente'
      : 'Archivo subido correctamente';

    responder.creado(res, resultado, mensaje);
  }

  /**
   * GET /api/v1/archivos/:subtipo/:nombre
   * Devuelve el archivo inline (para imágenes y PDFs) o como descarga
   * según el query param ?descargar=1
   *
   * Ejemplos:
   *   GET /api/v1/archivos/imagenes/abc123.png          → inline (muestra en navegador)
   *   GET /api/v1/archivos/documentos/abc123.pdf?descargar=1 → attachment (fuerza descarga)
   */
  async obtener(req: Request, res: Response): Promise<void> {
    const subtipo = req.params['subtipo'] as SubtipoArchivo;
    const nombreArchivo = req.params['nombre'] as string;
    const descargar = req.query['descargar'] === '1';

    await archivoService.enviar(res, nombreArchivo, subtipo, descargar);
  }

  /**
   * DELETE /api/v1/archivos/:subtipo/:nombre
   * Elimina el archivo del disco. Requiere rol ADMIN.
   */
  async eliminar(req: Request, res: Response): Promise<void> {
    const subtipo = req.params['subtipo'] as SubtipoArchivo;
    const nombreArchivo = req.params['nombre'] as string;

    await archivoService.eliminar(nombreArchivo, subtipo);
    responder.ok(res, null, 'Archivo eliminado exitosamente');
  }
}

export default new ArchivoController();
