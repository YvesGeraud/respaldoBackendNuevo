import axios, { type AxiosRequestConfig, type AxiosResponse, isAxiosError } from 'axios';
import { StatusCodes } from 'http-status-codes';
import { AppError } from '@/utils/errores.utils';
import { logger } from '@/utils/logger.utils';

// ── Tipos ──────────────────────────────────────────────────────────────────────

export interface OpcionesHttp extends AxiosRequestConfig {
  /** Etiqueta que aparece en los logs (ej: 'FacturacionAPI', 'PagosAPI') */
  etiqueta?: string;
}

// ── Instancia base ─────────────────────────────────────────────────────────────

/**
 * Instancia de axios preconfigurada.
 * Puedes usarla directamente o crear instancias adicionales con `crearClienteHttp`.
 */
export const clienteHttp = axios.create({
  timeout: 10_000, // 10 segundos por defecto
  headers: { 'Content-Type': 'application/json' },
});

// ── Factory ────────────────────────────────────────────────────────────────────

/**
 * Crea una instancia de axios con baseURL y opciones personalizadas.
 *
 * @example
 * const api = crearClienteHttp('https://api.tercero.com/v1', { etiqueta: 'TerceroAPI' });
 * const datos = await api.get<MiTipo>('/recurso');
 */
export function crearClienteHttp(baseURL: string, opciones: OpcionesHttp = {}) {
  const { etiqueta = 'API_EXTERNA', ...axiosOpciones } = opciones;

  const instancia = axios.create({
    baseURL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
    ...axiosOpciones,
  });

  // Interceptor de respuesta: loguea y normaliza errores
  instancia.interceptors.response.use(
    (response: AxiosResponse) => {
      logger.debug(`[${etiqueta}] ${response.config.method?.toUpperCase()} ${response.config.url} → ${response.status}`);
      return response;
    },
    (error: unknown) => {
      if (isAxiosError(error)) {
        const status = error.response?.status;
        const url = error.config?.url ?? '(desconocida)';
        const method = error.config?.method?.toUpperCase() ?? 'HTTP';

        logger.warn(`[${etiqueta}] ${method} ${url} falló con status ${status ?? 'sin respuesta'}`);

        // Tiempo de espera agotado / sin conexión
        if (error.code === 'ECONNABORTED' || !error.response) {
          throw new AppError(
            `El servicio externo (${etiqueta}) no respondió a tiempo`,
            StatusCodes.GATEWAY_TIMEOUT,
            'INTERNAL_ERROR',
          );
        }

        // El servicio externo respondió con un error (4xx / 5xx)
        const mensajeExterno: string =
          (error.response.data as Record<string, unknown>)?.message as string ||
          (error.response.data as Record<string, unknown>)?.error as string ||
          error.message ||
          'Error en servicio externo';

        throw new AppError(
          `[${etiqueta}] ${mensajeExterno}`,
          StatusCodes.BAD_GATEWAY,
          'INTERNAL_ERROR',
        );
      }

      // Error inesperado (no es de axios)
      throw error;
    },
  );

  return instancia;
}

// ── Helpers funcionales ────────────────────────────────────────────────────────

/**
 * GET tipado a una URL absoluta.
 *
 * @example
 * const datos = await httpGet<{ id: number }>('https://api.ejemplo.com/items/1');
 */
export async function httpGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await clienteHttp.get<T>(url, config);
  return data;
}

/**
 * POST tipado a una URL absoluta.
 *
 * @example
 * const resultado = await httpPost<RespuestaAPI>('https://api.ejemplo.com/items', payload);
 */
export async function httpPost<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await clienteHttp.post<T>(url, body, config);
  return data;
}

/**
 * PUT tipado a una URL absoluta.
 */
export async function httpPut<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await clienteHttp.put<T>(url, body, config);
  return data;
}

/**
 * PATCH tipado a una URL absoluta.
 */
export async function httpPatch<T>(url: string, body: unknown, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await clienteHttp.patch<T>(url, body, config);
  return data;
}

/**
 * DELETE tipado a una URL absoluta.
 */
export async function httpDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const { data } = await clienteHttp.delete<T>(url, config);
  return data;
}
