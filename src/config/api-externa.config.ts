import { crearClienteHttp } from '@/utils/http.utils';
import { config } from '@/config/servidor.config';
import { AppError } from '@/utils/errores.utils';

// ── Validación de URL ─────────────────────────────────────────────────────────

if (!config.apiExternaUrl) {
  throw new AppError('API_EXTERNA_URL no está definida en el archivo .env', 500, 'INTERNAL_ERROR');
}

// ── Cliente HTTP preconfigurado ───────────────────────────────────────────────

/**
 * Cliente axios listo para consumir la API externa.
 * La baseURL se lee de API_EXTERNA_URL en el .env.
 *
 * Agregar aquí headers fijos como Authorization, API-Key, etc.
 *
 * @example
 * import { apiExterna } from '@/config/api-externa.config';
 * const datos = await apiExterna.get<MiTipo>('/ruta');
 */
export const apiExterna = crearClienteHttp(config.apiExternaUrl, {
  etiqueta: 'API_EXTERNA',
  // headers: { Authorization: `Bearer ${config.apiExternaToken}` },
});
