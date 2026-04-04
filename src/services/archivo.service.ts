import path from 'path';
import {
  UPLOADS_DIR,
  deduplicarArchivo,
  descargarArchivo,
  eliminarArchivo,
  rutaEnUploads,
} from '@/utils/archivo.utils';
import { ErrorNoEncontrado, ErrorNegocio } from '@/utils/errores.utils';
import type { Response } from 'express';
import fs from 'fs';
import { prisma } from '@/config/database.config';
import type { SubtipoArchivo, ResultadoSubida } from '@/types';

// ── Servicio ──────────────────────────────────────────────────────────────────

class ArchivoService {
  /**
   * Procesa un archivo subido por Multer, validando contra la BD y deduplicando.
   */
  async subir(
    file: Express.Multer.File,
    subtipo: SubtipoArchivo,
    id_usuario: number,
  ): Promise<ResultadoSubida> {
    // 1. Consultar tipo de documento en BD
    const tipoDato = await prisma.ct_tipo_documento.findUnique({
      where: { clave: subtipo },
    });

    if (!tipoDato || !tipoDato.estado) {
      await eliminarArchivo(file.path);
      throw new ErrorNegocio(
        `El tipo de documento '${subtipo}' no está configurado o está inactivo.`,
      );
    }

    // 2. Validar tamaño
    if (file.size > tipoDato.max_size_bytes) {
      await eliminarArchivo(file.path);
      throw new ErrorNegocio(
        `El archivo excede el tamaño máximo permitido de ${
          Math.round((tipoDato.max_size_bytes / 1024 / 1024) * 100) / 100
        } MB.`,
      );
    }

    // 3. Validar extensión permitida
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    let permitidas: string[] = [];

    try {
      // Intenta parsear si la base de datos lo guardó como JSON (ej: '["jpg", "png"]')
      const arrayJson = JSON.parse(tipoDato.extensiones_permitidas);
      if (Array.isArray(arrayJson)) {
        permitidas = arrayJson.map((e: string) => e.toLowerCase());
      }
    } catch {
      // Fallback si lo guardaron separado por comas (ej: "jpg,png,pdf")
      permitidas = tipoDato.extensiones_permitidas
        .split(',')
        .map((e: string) => e.trim().toLowerCase());
    }

    if (!permitidas.includes(ext)) {
      await eliminarArchivo(file.path);
      throw new ErrorNegocio(
        `La extensión '${ext}' no está permitida. Solo se permiten: ${tipoDato.extensiones_permitidas}.`,
      );
    }

    // 4. Deduplicar archivo físico en disco
    const directorio = rutaEnUploads(subtipo);
    const resultado = await deduplicarArchivo(file.path, directorio);

    const rutaRelativa = path.relative(UPLOADS_DIR, resultado.ruta);
    const nombreArchivo = path.basename(resultado.ruta);

    // 5. Buscar si ya existe el registro lógico en BD (Deduplicación estricta)
    let doc = await prisma.dt_documento.findFirst({
      where: { hash: resultado.hash },
    });

    // Si el documento (hash) no existe aún en la base de datos, lo creamos
    if (!doc) {
      doc = await prisma.dt_documento.create({
        data: {
          nombre_original: file.originalname,
          nombre_sistema: nombreArchivo,
          ruta_relativa: rutaRelativa,
          mime_type: file.mimetype,
          tama_o_bytes: file.size,
          hash: resultado.hash,
          modulo: subtipo,
          id_ct_tipo_documento: tipoDato.id_ct_tipo_documento,
          id_ct_usuario_in: id_usuario,
        },
      });
    }

    return {
      id_documento: doc.id_dt_documento,
      nombreArchivo,
      rutaRelativa,
      hash: resultado.hash,
      duplicado: resultado.duplicado,
      tamanioBytes: file.size,
      mimeType: file.mimetype,
    };
  }

  async enviar(
    res: Response,
    nombreArchivo: string,
    subtipo: SubtipoArchivo,
    descargar = false,
  ): Promise<void> {
    const nombreSanitizado = path.basename(nombreArchivo);
    const rutaAbsoluta = rutaEnUploads(subtipo, nombreSanitizado);
    await descargarArchivo(res, rutaAbsoluta, nombreSanitizado, descargar);
  }

  async eliminar(nombreArchivo: string, subtipo: SubtipoArchivo): Promise<void> {
    const nombreSanitizado = path.basename(nombreArchivo);
    const rutaAbsoluta = rutaEnUploads(subtipo, nombreSanitizado);

    const existe = await fs.promises
      .access(rutaAbsoluta, fs.constants.F_OK)
      .then(() => true)
      .catch(() => false);

    if (!existe) throw new ErrorNoEncontrado(`Archivo no encontrado: ${nombreSanitizado}`);

    await eliminarArchivo(rutaAbsoluta);
  }
}

export default new ArchivoService();
