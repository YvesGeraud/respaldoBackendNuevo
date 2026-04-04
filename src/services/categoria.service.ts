import { Prisma } from '@/generated/prisma/client';
import { prisma } from '@/config/database.config';
import { buscarOError } from '@/utils/prisma.utils';
import { paginar } from '@/utils/paginacion.utils';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import type { ResultadoPaginado } from '@/types';
import type {
  CrearCategoriaDTO,
  ActualizarCategoriaDTO,
  FiltrosCategorias,
} from '@/schemas/categoria.schema';
import { CAMPOS_ORDENABLES_CATEGORIA } from '@/schemas/categoria.schema';
import { PAGINACION } from '@/constants';

class CategoriaService {
  async obtenerTodos(
    filtros: FiltrosCategorias,
  ): Promise<ResultadoPaginado<Prisma.ct_categoriaGetPayload<Record<string, never>>>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_CATEGORIA[0],
      orden: filtros.orden ?? 'asc',
    };

    const where: Prisma.ct_categoriaWhereInput = {};

    if (filtros.busqueda) {
      where.nombre = { contains: String(filtros.busqueda) };
    }

    // Express 5 strict query strings stringifican incluso si Zod los parseó previamente.
    if (filtros.estado !== undefined) {
      where.estado = String(filtros.estado) === 'true';
    }

    return paginar(prisma.ct_categoria, where, opciones) as Promise<
      ResultadoPaginado<Prisma.ct_categoriaGetPayload<Record<string, never>>>
    >;
  }

  async obtenerPorId(id: number) {
    return buscarOError(
      prisma.ct_categoria.findUnique({
        where: { id_ct_categoria: id },
      }),
      'Categoría',
    );
  }

  async crear(data: CrearCategoriaDTO) {
    return prisma.ct_categoria.create({
      data,
    });
  }

  async actualizar(id_ct_categoria: number, data: ActualizarCategoriaDTO) {
    // Verificar existencia
    await this.obtenerPorId(id_ct_categoria);

    return prisma.ct_categoria.update({
      where: { id_ct_categoria },
      data,
    });
  }

  async eliminar(id_ct_categoria: number) {
    // En lugar de borrar físico, usualmente se hace borrado lógico (estado = false)
    // Pero si quieren borrar, sería esto. Acá usamos borrado lógico según schema.
    await this.obtenerPorId(id_ct_categoria);
    await prisma.ct_categoria.update({
      where: { id_ct_categoria },
      data: { estado: false },
    });
  }
}

export default new CategoriaService();
