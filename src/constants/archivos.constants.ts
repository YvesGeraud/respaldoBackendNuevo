/**
 * Define las categorías de archivos permitidas en el sistema.
 * Se usa para organizar la estructura de carpetas en 'uploads/'.
 * Centralizado aquí para evitar typos en servicios y controladores.
 */
export const SUBTIPOS = {
  IMAGENES: 'imagenes',
  DOCUMENTOS: 'documentos',
  EXCEL: 'excel',
  PDF: 'pdf',
} as const;

export type SubtipoArchivo = (typeof SUBTIPOS)[keyof typeof SUBTIPOS];
