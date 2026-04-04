import { prisma } from '@/config/database.config';
import { logger } from '@/utils/logger.utils';

// ── Constantes ────────────────────────────────────────────────────────────────

/** Tokens revocados con más de N días se eliminan físicamente para no crecer indefinidamente. */
const DIAS_RETENCION_REVOCADOS = 30;

// ── Job ───────────────────────────────────────────────────────────────────────

/**
 * Elimina tokens de la tabla dt_refresh_token que ya no son útiles:
 *   - Expirados (cualquier estado): la firma JWT ya no es válida de todas formas.
 *   - Revocados con más de 30 días: fueron revocados en logout/rotación pero
 *     se retienen brevemente para análisis de seguridad si se detecta reutilización.
 *
 * Recomendado: ejecutar cada 24 horas desde server.ts con setInterval.
 *
 * @example
 * // En server.ts — después de iniciar el servidor:
 * setInterval(() => void limpiarTokensExpirados(), 24 * 60 * 60 * 1_000);
 */
export async function limpiarTokensExpirados(): Promise<void> {
  const ahora = new Date();
  const limiteRevocados = new Date(
    ahora.getTime() - DIAS_RETENCION_REVOCADOS * 24 * 60 * 60 * 1_000,
  );

  try {
    const { count } = await prisma.dt_refresh_token.deleteMany({
      where: {
        OR: [
          // Expirados: la firma JWT ya es inválida, el registro no tiene utilidad
          { expira_en: { lt: ahora } },
          // Revocados hace más de 30 días: ya sirvieron para detectar reutilización
          { revocado: true, revocado_en: { lt: limiteRevocados } },
        ],
      },
    });

    if (count > 0) {
      logger.info(`[tokens.job] Tokens eliminados en limpieza periódica: ${count}`);
    }
  } catch (err) {
    // No propaga el error — un job de limpieza no debe tumbar el servidor
    logger.error('[tokens.job] Error en limpieza de tokens', { error: err });
  }
}
