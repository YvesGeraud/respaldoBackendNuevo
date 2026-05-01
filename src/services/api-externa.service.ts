/**
 * @file api-externa.service.ts
 * @description Servicio de EJEMPLO para consumir una API externa usando http.utils.
 *
 * Este archivo sirve como referencia/plantilla. Cuando implementes tu propio
 * servicio de API externa, copia este patrón y adapta los tipos y rutas.
 *
 * Flujo general:
 *   1. Define las interfaces que representan lo que devuelve la API.
 *   2. Importa el cliente desde `api-externa.config.ts` (ya tiene la baseURL y headers).
 *   3. Crea métodos tipados por cada endpoint que necesites consumir.
 *   4. Maneja errores específicos si los necesitas (o deja que AppError lo haga solo).
 */

import { apiExterna } from '@/config/api-externa.config';

// ── 1. Interfaces (ajusta a la respuesta real de tu API) ──────────────────────

/** Respuesta típica de una API con envelope { data: [...] } */
interface RespuestaListado<T> {
  data: T[];
  total?: number;
}

/** Ejemplo: tipo de documento que devuelve la API */
export interface TipoDocumento {
  id: number;
  nombre: string;
  descripcion?: string;
  activo: boolean;
}

// ── 2. Servicio ───────────────────────────────────────────────────────────────

class ApiExternaService {
  /**
   * Obtiene todos los tipos de documento desde la API externa.
   *
   * @example
   * // En un controller:
   * const tipos = await apiExternaService.obtenerTiposDocumento();
   */
  async obtenerTiposDocumento(): Promise<TipoDocumento[]> {
    // Si la API devuelve directamente un arreglo:
    return apiExterna.get<TipoDocumento[]>('/ct_tipo_documento').then((r) => r.data);

    // Si la API devuelve un envelope { data: [...] }, usa esto en su lugar:
    // return apiExterna.get<RespuestaListado<TipoDocumento>>('/ct_tipo_documento')
    //   .then((r) => r.data.data);
  }

  /**
   * Obtiene un tipo de documento por ID.
   *
   * @param id - ID del recurso en la API externa
   */
  async obtenerTipoDocumentoPorId(id: number): Promise<TipoDocumento> {
    return apiExterna.get<TipoDocumento>(`/ct_tipo_documento/${id}`).then((r) => r.data);
  }

  /**
   * Envía datos a la API externa (POST).
   *
   * @param payload - Cuerpo de la petición
   */
  async crearTipoDocumento(payload: Omit<TipoDocumento, 'id'>): Promise<TipoDocumento> {
    return apiExterna.post<TipoDocumento>('/ct_tipo_documento', payload).then((r) => r.data);
  }
}

// ── Exportación del servicio como singleton ───────────────────────────────────

export default new ApiExternaService();

// ── Referencia de importación ─────────────────────────────────────────────────
// import apiExternaService from '@/services/api-externa.service';
