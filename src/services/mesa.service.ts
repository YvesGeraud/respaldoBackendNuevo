import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { buscarOError } from '@/utils/prisma.utils';
import { paginar } from '@/utils/paginacion.utils';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import type { ResultadoPaginado } from '@/types';
import {
  CrearMesaDTO,
  ActualizarMesaDTO,
  FiltrosMesas,
  CAMPOS_ORDENABLES_MESA,
} from '@/schemas/mesa.schema';
import { PAGINACION } from '@/constants';
import { ErrorDuplicado } from '@/utils/errores.utils';

class MesaService {
  async obtenerTodas(
    filtros: FiltrosMesas,
  ): Promise<ResultadoPaginado<Prisma.ct_mesaGetPayload<object>>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_MESA[0],
      orden: filtros.orden ?? 'asc',
    };

    const where: Prisma.ct_mesaWhereInput = {};

    if (filtros.codigo) {
      where.codigo = { contains: filtros.codigo };
    }

    if (filtros.busqueda) {
      where.OR = [
        { codigo: { contains: filtros.busqueda } },
        // Aquí podrías agregar más campos de búsqueda si existieran
      ];
    }

    if (filtros.status !== undefined) where.status = filtros.status;
    if (filtros.estado !== undefined) where.estado = filtros.estado;

    return paginar(prisma.ct_mesa, where, opciones) as Promise<
      ResultadoPaginado<Prisma.ct_mesaGetPayload<object>>
    >;
  }

  async obtenerPorId(id: number): Promise<Prisma.ct_mesaGetPayload<object>> {
    return buscarOError(
      prisma.ct_mesa.findUnique({
        where: { id_ct_mesa: id },
      }),
      'Mesa',
    );
  }

  async crear(
    id_ct_usuario_reg: number,
    datos: CrearMesaDTO,
  ): Promise<Prisma.ct_mesaGetPayload<object>> {
    // Validar código único
    const existe = await prisma.ct_mesa.findUnique({ where: { codigo: datos.codigo } });
    if (existe) throw new ErrorDuplicado(`Ya existe una mesa con el código ${datos.codigo}`);

    return prisma.ct_mesa.create({
      data: {
        ...datos,
        id_ct_usuario_reg,
      },
    });
  }

  async actualizar(
    id_ct_usuario_mod: number,
    id: number,
    datos: ActualizarMesaDTO,
  ): Promise<Prisma.ct_mesaGetPayload<object>> {
    await this.obtenerPorId(id);

    if (datos.codigo) {
      const existe = await prisma.ct_mesa.findFirst({
        where: { codigo: datos.codigo, id_ct_mesa: { not: id } },
      });
      if (existe) throw new ErrorDuplicado(`Ya existe otra mesa con el código ${datos.codigo}`);
    }

    return prisma.ct_mesa.update({
      where: { id_ct_mesa: id },
      data: {
        ...datos,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }

  async eliminar(id_ct_usuario_mod: number, id: number): Promise<void> {
    await this.obtenerPorId(id);

    // Soft delete para mesas
    await prisma.ct_mesa.update({
      where: { id_ct_mesa: id },
      data: {
        estado: false,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }
}

export default new MesaService();
