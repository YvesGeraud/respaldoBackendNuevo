import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '@/config/servidor.config';
import type { PayloadJWT } from '@/types';

/**
 * Genera el access token de corta vida (15 min por defecto).
 * Se envía como cookie httpOnly en cada respuesta de auth.
 */
export function generarAccessToken(payload: PayloadJWT): string {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiracion,
  } as jwt.SignOptions);
}

/**
 * Genera el refresh token de larga vida (7 días por defecto).
 * Solo se usa para renovar el access token silenciosamente.
 * Incluye un `jti` (JWT ID) único para garantizar que dos tokens
 * generados en el mismo segundo nunca tengan el mismo hash en BD.
 */
export function generarRefreshToken(payload: PayloadJWT): string {
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiracion,
  } as jwt.SignOptions);
}

/**
 * Verifica y decodifica un access token.
 * Lanza TokenExpiredError o JsonWebTokenError si no es válido.
 * El error middleware global los captura y responde 401.
 */
export function verificarAccessToken(token: string): PayloadJWT {
  return jwt.verify(token, config.jwt.secret) as PayloadJWT;
}

/**
 * Verifica y decodifica un refresh token.
 * Lanza TokenExpiredError o JsonWebTokenError si no es válido.
 */
export function verificarRefreshToken(token: string): PayloadJWT {
  return jwt.verify(token, config.jwt.refreshSecret) as PayloadJWT;
}

/**
 * SHA-256 hex del token. Se usa para identificar tokens en BD sin
 * almacenar el valor real — si la BD es comprometida los hashes
 * no pueden usarse para forjar nuevas peticiones.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
