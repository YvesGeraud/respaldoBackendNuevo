import bcrypt from 'bcrypt';
import { prisma } from '@/config/database.config';
import { ErrorNoAutenticado } from '@/utils/errores.utils';
import {
  generarAccessToken,
  generarRefreshToken,
  verificarAccessToken,
  verificarRefreshToken,
} from '@/utils/jwt.utils';
import type { PayloadJWT } from '@/types';

interface TokensPar {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
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
      id_usuario: encontrado.id_usuario,
      usuario: encontrado.usuario,
      email: encontrado.email,
      rol: encontrado.rol,
    };

    return {
      usuario: this.sanitizarUsuario(encontrado),
      tokens: {
        accessToken: generarAccessToken(payload),
        refreshToken: generarRefreshToken(payload),
      },
    };
  }

  async refrescarTokens(refreshToken: string): Promise<TokensPar> {
    // verificarRefreshToken lanza TokenExpiredError / JsonWebTokenError si no es válido
    const payload = verificarRefreshToken(refreshToken);

    const usuario = await prisma.ct_usuario.findUnique({
      where: { id_usuario: payload.id_usuario },
    });

    if (!usuario || !usuario.estado) {
      throw new ErrorNoAutenticado('Sesión inválida');
    }

    const nuevoPayload: PayloadJWT = {
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      email: usuario.email,
      rol: usuario.rol,
    };

    return {
      accessToken: generarAccessToken(nuevoPayload),
      refreshToken: generarRefreshToken(nuevoPayload),
    };
  }

  /**
   * Devuelve los datos del usuario para GET /api/v1/auth/me.
   * El middleware ya verificó el token — aquí consultamos la BD
   * para devolver datos frescos (por si cambió rol, email, etc.).
   */
  async obtenerSesionActual(id_usuario: number) {
    const usuario = await prisma.ct_usuario.findUnique({
      where: { id_usuario },
    });

    if (!usuario || !usuario.estado) {
      throw new ErrorNoAutenticado('Sesión expirada');
    }

    return this.sanitizarUsuario(usuario);
  }

  /**
   * Expuesto para el middleware de autenticación.
   * Delegado a jwt.utils para mantener el servicio enfocado en lógica de negocio.
   */
  verificarAccessToken(token: string): PayloadJWT {
    return verificarAccessToken(token);
  }

  /** Elimina la contraseña y devuelve solo los campos seguros para el cliente. */
  private sanitizarUsuario(usuario: {
    id_usuario: number;
    usuario: string;
    email: string | null;
    nombre_completo: string;
    rol: string;
  }) {
    return {
      id_usuario: usuario.id_usuario,
      usuario: usuario.usuario,
      email: usuario.email,
      nombre_completo: usuario.nombre_completo,
      rol: usuario.rol,
    };
  }
}

export default new AuthService();
