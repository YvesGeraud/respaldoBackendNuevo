import { describe, it, expect } from 'vitest';
import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken';
import {
  generarAccessToken,
  generarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken,
} from '@/utils/jwt.utils';
import type { PayloadJWT } from '@/types';
import type { RolUsuario } from '@/generated/prisma/client';

// ── Fixture ────────────────────────────────────────────────────────────────────

const PAYLOAD: PayloadJWT = {
  id_ct_usuario: 42,
  usuario: 'docente01',
  email: 'docente@escuela.edu.mx',
  rol: 'DOCENTE' as RolUsuario,
};

// ── generarAccessToken ─────────────────────────────────────────────────────────

describe('generarAccessToken', () => {
  it('devuelve un string con formato JWT (header.payload.firma)', () => {
    const token = generarAccessToken(PAYLOAD);
    expect(typeof token).toBe('string');
    expect(token.split('.')).toHaveLength(3);
  });

  it('el token contiene el payload correcto al verificarlo', () => {
    const token = generarAccessToken(PAYLOAD);
    const decoded = verificarAccessToken(token);

    expect(decoded.id_ct_usuario).toBe(PAYLOAD.id_ct_usuario);
    expect(decoded.usuario).toBe(PAYLOAD.usuario);
    expect(decoded.rol).toBe(PAYLOAD.rol);
  });

  it('dos tokens generados en el mismo ms tienen el mismo payload pero pueden diferir', () => {
    const t1 = generarAccessToken(PAYLOAD);
    const t2 = generarAccessToken(PAYLOAD);
    // El payload debe ser idéntico; la firma puede variar si la librería añade jti/iat aleatorio
    const d1 = verificarAccessToken(t1);
    const d2 = verificarAccessToken(t2);
    expect(d1.id_ct_usuario).toBe(d2.id_ct_usuario);
  });
});

// ── verificarAccessToken ───────────────────────────────────────────────────────

describe('verificarAccessToken', () => {
  it('lanza JsonWebTokenError con un string que no es JWT', () => {
    expect(() => verificarAccessToken('esto.no.es.un.jwt')).toThrow(JsonWebTokenError);
  });

  it('lanza JsonWebTokenError con firma de un secreto diferente', () => {
    const tokenFalso = jwt.sign(PAYLOAD, 'secreto-totalmente-diferente');
    expect(() => verificarAccessToken(tokenFalso)).toThrow(JsonWebTokenError);
  });

  it('lanza TokenExpiredError con un token ya expirado', () => {
    // expiresIn: 0 → expira inmediatamente
    const tokenExpirado = jwt.sign(PAYLOAD, process.env['JWT_SECRET']!, { expiresIn: 0 });
    expect(() => verificarAccessToken(tokenExpirado)).toThrow(TokenExpiredError);
  });
});

// ── generarRefreshToken / verificarRefreshToken ────────────────────────────────

describe('generarRefreshToken + verificarRefreshToken', () => {
  it('el refresh token es válido y contiene el payload', () => {
    const token = generarRefreshToken(PAYLOAD);
    const decoded = verificarRefreshToken(token);
    expect(decoded.id_ct_usuario).toBe(PAYLOAD.id_ct_usuario);
    expect(decoded.usuario).toBe(PAYLOAD.usuario);
  });

  it('el refresh token NO puede verificarse con el access secret', () => {
    // Los dos tokens usan secretos distintos — no son intercambiables
    const refresh = generarRefreshToken(PAYLOAD);
    expect(() => verificarAccessToken(refresh)).toThrow(JsonWebTokenError);
  });

  it('el access token NO puede verificarse con el refresh secret', () => {
    const access = generarAccessToken(PAYLOAD);
    expect(() => verificarRefreshToken(access)).toThrow(JsonWebTokenError);
  });
});
