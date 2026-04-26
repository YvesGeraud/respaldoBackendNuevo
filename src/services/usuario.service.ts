import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { buscarOError } from '@/utils/prisma.utils';
import { paginar } from '@/utils/paginacion.utils';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import type { ResultadoPaginado } from '@/types';
import {
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  FiltrosUsuarios,
  CAMPOS_ORDENABLES_USUARIO,
} from '@/schemas/usuario.schema';
import { PAGINACION } from '@/constants';
import { ErrorDuplicado } from '@/utils/errores.utils';

const INCLUDE_USUARIO_ROL = {
  ct_rol: {
    select: {
      id_ct_rol: true,
      nombre: true,
      descripcion: true,
    },
  },
} as const;

export type UsuarioConRol = Prisma.ct_usuarioGetPayload<{
  include: typeof INCLUDE_USUARIO_ROL;
}>;

class UsuarioService {
  async obtenerTodos(filtros: FiltrosUsuarios): Promise<ResultadoPaginado<UsuarioConRol>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_USUARIO[0],
      orden: filtros.orden ?? 'desc',
    };

    const where: Prisma.ct_usuarioWhereInput = {};

    if (filtros.usuario) where.usuario = { contains: filtros.usuario };
    if (filtros.email) where.email = { contains: filtros.email };
    if (filtros.id_ct_rol) where.id_ct_rol = filtros.id_ct_rol;
    if (filtros.estado !== undefined) where.estado = filtros.estado;

    return paginar(prisma.ct_usuario, where, opciones, INCLUDE_USUARIO_ROL) as Promise<
      ResultadoPaginado<UsuarioConRol>
    >;
  }

  async obtenerPorId(id: number): Promise<UsuarioConRol> {
    return buscarOError(
      prisma.ct_usuario.findUnique({
        where: { id_ct_usuario: id },
        include: INCLUDE_USUARIO_ROL,
      }),
      'Usuario',
    );
  }

  async crear(id_ct_usuario_reg: number, datos: CrearUsuarioDTO): Promise<UsuarioConRol> {
    // Verificar si el usuario o email ya existen
    const existente = await prisma.ct_usuario.findFirst({
      where: {
        OR: [{ usuario: datos.usuario }, { email: datos.email || undefined }],
      },
    });

    if (existente) {
      const campo = existente.usuario === datos.usuario ? 'usuario' : 'email';
      throw new ErrorDuplicado(`El ${campo} ya está en uso.`);
    }

    const contrasenaHash = await bcrypt.hash(datos.contrasena, 12);

    return prisma.ct_usuario.create({
      data: {
        ...datos,
        contrasena: contrasenaHash,
        id_ct_usuario_reg,
      },
      include: INCLUDE_USUARIO_ROL,
    });
  }

  async actualizar(
    id_ct_usuario_mod: number,
    id: number,
    datos: ActualizarUsuarioDTO,
  ): Promise<UsuarioConRol> {
    await this.obtenerPorId(id);

    const data = {
      ...datos,
      id_ct_usuario_mod,
      fecha_mod: new Date(),
    };

    if (datos.contrasena) {
      data.contrasena = await bcrypt.hash(datos.contrasena, 12);
    }

    return prisma.ct_usuario.update({
      where: { id_ct_usuario: id },
      data,
      include: INCLUDE_USUARIO_ROL,
    });
  }

  async eliminar(id_ct_usuario_mod: number, id: number): Promise<void> {
    await this.obtenerPorId(id);

    // Soft delete
    await prisma.ct_usuario.update({
      where: { id_ct_usuario: id },
      data: {
        estado: false,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }

  /**
   * Lista todos los roles disponibles para el frontend.
   */
  async listarRoles() {
    return prisma.ct_rol.findMany({
      where: { estado: true },
      select: {
        id_ct_rol: true,
        nombre: true,
        descripcion: true,
      },
    });
  }
}

export default new UsuarioService();
