import { prisma } from '@/config/database.config';
import { Prisma } from '@prisma/client';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import { paginar } from '@/utils/paginacion.utils';
import { buscarOError } from '@/utils/prisma.utils';
import { PAGINACION } from '@/constants';
import { ErrorNoEncontrado } from '@/utils/errores.utils';
import type { ResultadoPaginado } from '@/types';
import {
  FiltrosReservaciones,
  CrearReservacionDTO,
  ActualizarReservacionDTO,
  CAMPOS_ORDENABLES_RESERVACION,
} from '@/schemas/reservacion.schema';
import { INCLUDE_RESERVACION_TODO } from '@/constants/prisma_include.constants';

type ReservacionCompleta = Prisma.rl_reservacionGetPayload<{
  include: typeof INCLUDE_RESERVACION_TODO;
}>;

class ReservacionService {
  /**
   * Obtiene todas las reservaciones con filtros y paginación.
   */
  async obtenerTodos(
    filtros: FiltrosReservaciones,
  ): Promise<ResultadoPaginado<ReservacionCompleta>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_RESERVACION[0],
      orden: filtros.orden ?? 'desc',
    };

    const where: Prisma.rl_reservacionWhereInput = {};

    if (filtros.id_ct_cliente) where.id_ct_cliente = Number(filtros.id_ct_cliente);
    if (filtros.id_ct_mesa) where.id_ct_mesa = Number(filtros.id_ct_mesa);
    if (filtros.estado) where.estado = filtros.estado;

    return paginar(prisma.rl_reservacion, where, opciones, INCLUDE_RESERVACION_TODO) as Promise<
      ResultadoPaginado<ReservacionCompleta>
    >;
  }

  /**
   * Obtiene una reservación por ID.
   */
  async obtenerPorId(id: number): Promise<ReservacionCompleta> {
    return buscarOError(
      prisma.rl_reservacion.findUnique({
        where: { id_rl_reservacion: id },
        include: INCLUDE_RESERVACION_TODO,
      }),
      'Reservación',
    );
  }

  /**
   * Crea una nueva reservación.
   */
  async crear(id_ct_usuario_reg: number, datos: CrearReservacionDTO): Promise<ReservacionCompleta> {
    // Validar que el cliente exista
    const cliente = await prisma.ct_cliente.findUnique({
      where: { id_ct_cliente: datos.id_ct_cliente },
    });

    if (!cliente) {
      throw new ErrorNoEncontrado('Cliente');
    }

    return prisma.rl_reservacion.create({
      data: {
        ...datos,
        id_ct_usuario_reg,
      },
      include: INCLUDE_RESERVACION_TODO,
    });
  }

  /**
   * Actualiza una reservación existente.
   */
  async actualizar(
    id_rl_reservacion: number,
    id_ct_usuario_mod: number,
    datos: ActualizarReservacionDTO,
  ): Promise<ReservacionCompleta> {
    // Validar existencia
    await this.obtenerPorId(id_rl_reservacion);

    return prisma.rl_reservacion.update({
      where: { id_rl_reservacion },
      data: {
        ...datos,
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
      include: INCLUDE_RESERVACION_TODO,
    });
  }

  /**
   * Cancela una reservación (Soft Delete).
   */
  async eliminar(id: number, id_ct_usuario_mod: number): Promise<void> {
    await this.obtenerPorId(id);

    await prisma.rl_reservacion.update({
      where: { id_rl_reservacion: id },
      data: {
        estado: 'CANCELADA',
        id_ct_usuario_mod,
        fecha_mod: new Date(),
      },
    });
  }
}

export default new ReservacionService();
