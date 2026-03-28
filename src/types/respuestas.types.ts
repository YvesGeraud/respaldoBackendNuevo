import type { Meta } from '@/utils/respuestas.utils';

/**
 * Alias de conveniencia para el resultado paginado.
 * Compatible con `responder.paginado(res, datos, meta)`.
 *
 * Uso: const resultado: ResultadoPaginado<Platillo> = await paginar(...)
 */
export type ResultadoPaginado<T> = { datos: T[] } & Meta;
