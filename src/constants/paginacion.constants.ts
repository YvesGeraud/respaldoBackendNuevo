/**
 * Configuración de paginación por defecto para todas las consultas.
 * Garantiza consistencia en toda la API.
 */
export const PAGINACION = {
  PAGINA_POR_DEFECTO: 1,
  LIMITE_POR_DEFECTO: 20,
  LIMITE_MAXIMO: 100,
} as const;

export type PaginationDefaults = typeof PAGINACION;
