import path from 'path';
import {
  UPLOADS_DIR,
  deduplicarArchivo,
  descargarArchivo,
  eliminarArchivo,
  rutaEnUploads,
} from '@/utils/archivo.utils';
import { ErrorNoEncontrado } from '@/utils/errores.utils';
import type { Response } from 'express';
import fs from 'fs';

// ── Tipos ─────────────────────────────────────────────────────────────────────

/**
 * Información devuelta tras una subida exitosa.
 * El campo `duplicado` permite al cliente saber si ya teníamos ese archivo.
 */
export interface ResultadoSubida {
  nombreArchivo: string; // solo el nombre, ej: "abc123...def.png"
  rutaRelativa: string; // ruta desde uploads/, ej: "imagenes/abc123...def.png"
  hash: string; // SHA-256 del contenido
  duplicado: boolean; // true = el mismo archivo ya existía en disco
  tamanioBytes: number;
  mimeType: string;
}

// Subdirectorios manejados — centralizado para que el controller no necesite
// conocer la estructura interna de carpetas
export const SUBTIPOS = {
  IMAGENES: 'imagenes',
  DOCUMENTOS: 'documentos',
  EXCEL: 'excel',
} as const;

export type SubtipoArchivo = (typeof SUBTIPOS)[keyof typeof SUBTIPOS];

// ── Servicio ──────────────────────────────────────────────────────────────────

class ArchivoService {
  /**
   * Procesa un archivo subido por Multer:
   *   1. Calcula el SHA-256 del contenido (via stream)
   *   2. Si ya existe un archivo con ese hash → elimina el temporal y reutiliza el existente
   *   3. Si es nuevo → renombra el temporal a {hash}{ext} para que sea su nombre definitivo
   *
   * De esta forma dos uploads del mismo archivo (aunque tengan distinto nombre)
   * comparten un único registro en disco.
   *
   * @param file    - Objeto que deja Multer en req.file
   * @param subtipo - Subcarpeta de destino (SUBTIPOS.IMAGENES, etc.)
   */
  async subir(file: Express.Multer.File, subtipo: SubtipoArchivo): Promise<ResultadoSubida> {
    const directorio = rutaEnUploads(subtipo);
    const resultado = await deduplicarArchivo(file.path, directorio);

    return {
      nombreArchivo: path.basename(resultado.ruta),
      rutaRelativa: path.relative(UPLOADS_DIR, resultado.ruta),
      hash: resultado.hash,
      duplicado: resultado.duplicado,
      tamanioBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Envía un archivo al cliente via stream.
   * Lanza ErrorNoEncontrado si el archivo no existe en el subtipo indicado.
   *
   * @param res            - Response de Express
   * @param nombreArchivo  - Nombre del archivo (con extensión), tal como lo devolvió subir()
   * @param subtipo        - Subcarpeta donde está guardado
   * @param descargar      - true: attachment | false: inline (útil para imágenes/PDF)
   */
  async enviar(
    res: Response,
    nombreArchivo: string,
    subtipo: SubtipoArchivo,
    descargar = false,
  ): Promise<void> {
    // Sanitizar: extraer solo el basename para que no puedan hacer path traversal
    // con nombres como "../../config/.env"
    const nombreSanitizado = path.basename(nombreArchivo);
    const rutaAbsoluta = rutaEnUploads(subtipo, nombreSanitizado);
    await descargarArchivo(res, rutaAbsoluta, nombreSanitizado, descargar);
  }

  /**
   * Elimina un archivo del subtipo dado.
   * No lanza error si el archivo ya no existe (idempotente).
   */
  async eliminar(nombreArchivo: string, subtipo: SubtipoArchivo): Promise<void> {
    const nombreSanitizado = path.basename(nombreArchivo);
    const rutaAbsoluta = rutaEnUploads(subtipo, nombreSanitizado);

    // Verificar que el archivo existe antes de intentar eliminar,
    // para devolver 404 en lugar de silencio si el nombre es incorrecto
    const existe = await fs.promises
      .access(rutaAbsoluta, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!existe) throw new ErrorNoEncontrado(`Archivo no encontrado: ${nombreSanitizado}`);

    await eliminarArchivo(rutaAbsoluta);
  }
}

export default new ArchivoService();
