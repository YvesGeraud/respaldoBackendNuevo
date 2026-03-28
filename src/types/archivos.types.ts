import { SubtipoArchivo } from '@/constants/archivos.constants';

/**
 * Información devuelta después de subir exitosamente un archivo físico y lógico.
 */
export interface ResultadoSubida {
  id_documento: number;
  nombreArchivo: string;
  rutaRelativa: string;
  hash: string;
  duplicado: boolean;
  tamanioBytes: number;
  mimeType: string;
}

export { SubtipoArchivo };
