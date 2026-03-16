import bcrypt from 'bcrypt';
import { prisma } from '@/config/database.config';
import { ErrorNoAutenticado } from '@/utils/errores.utils';
import {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
  verificarAccessToken,
  hashToken,
} from '@/utils/jwt.utils';
import type { PayloadJWT } from '@/types';

// ── Constantes ────────────────────────────────────────────────────────────────

/** 7 días en milisegundos — debe coincidir con JWT_REFRESH_EXPIRES_IN */
const REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1_000;

// ── Tipos internos ────────────────────────────────────────────────────────────

interface TokensPar {
  accessToken: string;
  refreshToken: string;
}

// ── Servicio ──────────────────────────────────────────────────────────────────

class AuthService {
  // ── Login ─────────────────────────────────────────────────────────────────

  async login(
    usuario: string,
    contrasena: string,
  ): Promise<{
    usuario: ReturnType<AuthService['sanitizarUsuario']>;
    tokens: TokensPar;
  }> {
    const encontrado = await prisma.ct_usuario.findUnique({ where: { usuario } });

    // Mismo mensaje para usuario no encontrado y contraseña incorrecta
    // → no da pistas a un atacante sobre qué campo está mal
    if (!encontrado || !encontrado.estado) {
      throw new ErrorNoAutenticado('Credenciales inválidas');
    }

    const contrasenaValida = await bcrypt.compare(contrasena, encontrado.contrasena);
    if (!contrasenaValida) {
      throw new ErrorNoAutenticado('Credenciales inválidas');
    }

    const payload: PayloadJWT = {
      id_ct_usuario: encontrado.id_ct_usuario,
      usuario: encontrado.usuario,
      email: encontrado.email,
      rol: encontrado.rol,
    };

    const tokens = await this.emitirTokens(payload);

    return {
      usuario: this.sanitizarUsuario(encontrado),
      tokens,
    };
  }

  // ── Renovación con rotación segura ────────────────────────────────────────

  /**
   * Rota el refresh token:
   *   1. Verifica la firma JWT (detecta tokens manipulados o expirados).
   *   2. Busca el hash en BD:
   *      - No existe   → token fabricado o ya limpiado   → 401
   *      - Revocado    → reutilización detectada          → invalida toda la familia → 401
   *      - Activo      → rota: revoca el actual, emite nuevo par
   *   3. Actualiza `reemplazado_por` para trazabilidad de la cadena.
   */
  async refrescarTokens(refreshToken: string): Promise<TokensPar> {
    // 1 — Verificar firma JWT (lanza TokenExpiredError / JsonWebTokenError si falla)
    // No usamos el payload decodificado — los datos del usuario se leen de BD (más seguro y fresco)
    verificarRefreshToken(refreshToken);

    // 2 — Buscar en BD por hash
    const hashActual = hashToken(refreshToken);
    const registro = await prisma.dt_refresh_token.findUnique({
      where: { token_hash: hashActual },
    });

    if (!registro) {
      // Token válido criptográficamente pero no en BD (ya limpiado o nunca existió)
      throw new ErrorNoAutenticado('Sesión inválida. Vuelve a iniciar sesión.');
    }

    if (registro.revocado) {
      // Reutilización detectada: el token ya fue rotado pero alguien lo volvió a usar.
      // Invalida TODAS las sesiones del usuario para forzar nuevo login.
      await prisma.dt_refresh_token.updateMany({
        where: { id_ct_usuario: registro.id_ct_usuario },
        data: { revocado: true, revocado_en: new Date() },
      });
      throw new ErrorNoAutenticado(
        'Sesión inválida. Se detectó uso de credenciales antiguas. Vuelve a iniciar sesión.',
      );
    }

    // 3 — Verificar que el usuario sigue activo en BD
    const usuario = await prisma.ct_usuario.findUnique({
      where: { id_ct_usuario: registro.id_ct_usuario },
    });

    if (!usuario || !usuario.estado) {
      throw new ErrorNoAutenticado('Sesión inválida');
    }

    // 4 — Emitir nuevo par y revocar el token actual en una transacción
    const nuevoPayload: PayloadJWT = {
      id_ct_usuario: usuario.id_ct_usuario,
      usuario: usuario.usuario,
      email: usuario.email,
      rol: usuario.rol,
    };

    const nuevosTokens = await this.emitirTokens(nuevoPayload);

    // Revocar el token anterior y apuntar al sucesor para trazabilidad
    const nuevoHash = hashToken(nuevosTokens.refreshToken);
    const nuevoRegistro = await prisma.dt_refresh_token.findUnique({
      where: { token_hash: nuevoHash },
    });

    await prisma.dt_refresh_token.update({
      where: { id_dt_refresh_token: registro.id_dt_refresh_token },
      data: {
        revocado: true,
        revocado_en: new Date(),
        reemplazado_por: nuevoRegistro?.id_dt_refresh_token ?? null,
      },
    });

    return nuevosTokens;
  }

  // ── Logout ────────────────────────────────────────────────────────────────

  /**
   * Revoca el refresh token activo.
   * Si el token no existe en BD (ya expiró o fue limpiado) simplemente ignora.
   */
  async logout(refreshToken: string): Promise<void> {
    const hash = hashToken(refreshToken);
    await prisma.dt_refresh_token.updateMany({
      where: { token_hash: hash, revocado: false },
      data: { revocado: true, revocado_en: new Date() },
    });
  }

  // ── Me ────────────────────────────────────────────────────────────────────

  /**
   * Devuelve datos frescos del usuario para GET /api/auth/me.
   * El middleware ya verificó el token — aquí consultamos la BD
   * para devolver datos actualizados (por si cambió rol, email, etc.).
   */
  async obtenerSesionActual(id_ct_usuario: number) {
    const usuario = await prisma.ct_usuario.findUnique({ where: { id_ct_usuario } });

    if (!usuario || !usuario.estado) {
      throw new ErrorNoAutenticado('Sesión expirada');
    }

    return this.sanitizarUsuario(usuario);
  }

  // ── Expuesto para el middleware de autenticación ──────────────────────────

  verificarAccessToken(token: string): PayloadJWT {
    return verificarAccessToken(token);
  }

  // ── Privados ──────────────────────────────────────────────────────────────

  /**
   * Genera accessToken + refreshToken y persiste el hash del refresh en BD.
   * Centraliza la lógica de emisión para login y rotación.
   */
  private async emitirTokens(payload: PayloadJWT): Promise<TokensPar> {
    const accessToken = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(payload);

    await prisma.dt_refresh_token.create({
      data: {
        token_hash: hashToken(refreshToken),
        id_ct_usuario: payload.id_ct_usuario,
        expira_en: new Date(Date.now() + REFRESH_TTL_MS),
      },
    });

    return { accessToken, refreshToken };
  }

  /** Elimina la contraseña y devuelve solo los campos seguros para el cliente. */
  private sanitizarUsuario(usuario: {
    id_ct_usuario: number;
    usuario: string;
    email: string | null;
    nombre_completo: string;
    rol: string;
  }) {
    return {
      id_ct_usuario: usuario.id_ct_usuario,
      usuario: usuario.usuario,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
    };
  }
}

export default new AuthService();
