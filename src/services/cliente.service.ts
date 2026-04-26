import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { buscarOError } from '@/utils/prisma.utils';
import { paginar } from '@/utils/paginacion.utils';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import type { ResultadoPaginado } from '@/types';
import {
  CrearClienteDTO,
  ActualizarClienteDTO,
  FiltrosClientes,
  CAMPOS_ORDENABLES_CLIENTE,
} from '@/schemas/cliente.schema';
import { PAGINACION } from '@/constants';

class ClienteService {
  async obtenerTodos(filtros: FiltrosClientes): Promise<ResultadoPaginado<Prisma.ct_clienteGetPayload<object>>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_CLIENTE[0],
      orden: filtros.orden ?? 'desc',
    };

    const where: Prisma.ct_clienteWhereInput = {};

    if (filtros.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda } },
        { correo: { contains: filtros.busqueda } },
      ];
    }
    
    if (filtros.estado !== undefined) where.estado = filtros.estado;

    return paginar(
      prisma.ct_cliente,
      where,
      opciones
    ) as Promise<ResultadoPaginado<Prisma.ct_clienteGetPayload<object>>>;
  }

  async obtenerPorId(id: number): Promise<Prisma.ct_clienteGetPayload<object>> {
    return buscarOError(
      prisma.ct_cliente.findUnique({
        where: { id_ct_cliente: id },
      }),
      'Cliente',
    );
  }

  async crear(id_ct_usuario_reg: number, datos: CrearClienteDTO): Promise<Prisma.ct_clienteGetPayload<object>> {
    return prisma.ct_cliente.create({
      data: {
        ...datos,
        id_ct_usuario_reg,
      },
    });
  }

  async actualizar(
    id_ct_usuario_mod: number,
    id: number,
    datos: ActualizarClienteDTO
  ): Promise<Prisma.ct_clienteGetPayload<object>> {
    await this.obtenerPorId(id);

    return prisma.ct_cliente.update({
      where: { id_ct_cliente: id },
      data: {
        ...datos,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }

  async eliminar(id_ct_usuario_mod: number, id: number): Promise<void> {
    await this.obtenerPorId(id);

    // Soft delete para clientes
    await prisma.ct_cliente.update({
      where: { id_ct_cliente: id },
      data: { 
        estado: false, 
        id_ct_usuario_mod, 
        fecha_mod: new Date() 
      },
    });
  }
}

export default new ClienteService();
