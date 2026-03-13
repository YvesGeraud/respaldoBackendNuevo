import jwt from 'jsonwebtoken';
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
 */
export function generarRefreshToken(payload: PayloadJWT): string {
  return jwt.sign(payload, config.jwt.refreshSecret, {
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
