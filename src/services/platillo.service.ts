import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { buscarOError, verificarNoExiste } from '@/utils/prisma.utils';
import { paginar } from '@/utils/paginacion.utils';
import { insertarEnLotes, type ResultadoBatch } from '@/utils/batch.utils';
import type { OpcionesPaginacion } from '@/utils/paginacion.utils';
import type { ResultadoPaginado } from '@/types';
import type {
  CrearPlatilloDTO,
  ActualizarPlatilloDTO,
  FiltrosPlatillos,
} from '@/schemas/platillo.schema';
import { CAMPOS_ORDENABLES_PLATILLO } from '@/schemas/platillo.schema';
import { PAGINACION, INCLUDE_PLATILLO_CATEGORIA } from '@/constants';

// ── Tipo de retorno preciso ───────────────────────────────────────────────────

type PlatilloConCategoria = Prisma.ct_platilloGetPayload<{
  include: typeof INCLUDE_PLATILLO_CATEGORIA;
}>;

// ── Servicio ──────────────────────────────────────────────────────────────────

class PlatilloService {
  async obtenerTodos(filtros: FiltrosPlatillos): Promise<ResultadoPaginado<PlatilloConCategoria>> {
    const opciones: OpcionesPaginacion = {
      pagina: Number(filtros.pagina) || PAGINACION.PAGINA_POR_DEFECTO,
      limite: Number(filtros.limite) || PAGINACION.LIMITE_POR_DEFECTO,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_PLATILLO[0],
      orden: filtros.orden ?? 'asc',
    };

    const where: Prisma.ct_platilloWhereInput = {};

    if (filtros.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda } },
        { descripcion: { contains: filtros.busqueda } },
      ];
    }
    if (filtros.id_ct_categoria !== undefined)
      where.id_ct_categoria = Number(filtros.id_ct_categoria);
    if (filtros.estado !== undefined) where.estado = String(filtros.estado) === 'true';

    return paginar(prisma.ct_platillo, where, opciones, INCLUDE_PLATILLO_CATEGORIA) as Promise<
      ResultadoPaginado<PlatilloConCategoria>
    >;
  }

  async obtenerPorId(id: number): Promise<PlatilloConCategoria> {
    return buscarOError(
      prisma.ct_platillo.findUnique({
        where: { id_ct_platillo: id },
        include: INCLUDE_PLATILLO_CATEGORIA,
      }),
      'Platillo',
    );
  }

  async crear(id_ct_usuario_reg: number, datos: CrearPlatilloDTO): Promise<PlatilloConCategoria> {
    // Verifica unicidad solo entre platillos activos — permite reusar nombres de inactivos
    await verificarNoExiste(
      prisma.ct_platillo.findFirst({
        where: { nombre: datos.nombre, estado: true },
      }),
      'Ya existe un platillo activo con ese nombre',
    );

    return prisma.ct_platillo.create({
      data: {
        id_ct_categoria: datos.id_ct_categoria,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precio,
        imagen_url: datos.imagen_url,
        id_ct_usuario_reg,
      },
      include: INCLUDE_PLATILLO_CATEGORIA,
    });
  }

  async actualizar(
    id_ct_usuario_mod: number,
    id: number,
    datos: ActualizarPlatilloDTO,
  ): Promise<PlatilloConCategoria> {
    // Verifica existencia antes de intentar el update (P2025 evitado con mensaje claro)
    await buscarOError(
      prisma.ct_platillo.findUnique({ where: { id_ct_platillo: id } }),
      'Platillo',
    );

    return prisma.ct_platillo.update({
      where: { id_ct_platillo: id },
      data: { ...datos, id_ct_usuario_mod, fecha_mod: new Date() },
      include: INCLUDE_PLATILLO_CATEGORIA,
    });
  }

  async eliminar(id_ct_usuario_mod: number, id: number): Promise<void> {
    await buscarOError(
      prisma.ct_platillo.findUnique({ where: { id_ct_platillo: id } }),
      'Platillo',
    );

    // Soft delete — preserva historial en dt_detalle_orden
    await prisma.ct_platillo.update({
      where: { id_ct_platillo: id },
      data: { estado: false, id_ct_usuario_mod, fecha_mod: new Date() },
    });
  }

  /**
   * Crea múltiples platillos en lotes.
   * Usa insertarEnLotes para no saturar la BD con un INSERT masivo de golpe.
   * skipDuplicates evita que un nombre repetido aborte todo el lote.
   *
   * Nota: createMany no devuelve los registros creados (limitación de Prisma/MariaDB),
   * solo el conteo. Si necesitas los registros, usa procesarEnLotes con create individual.
   *
   * @example
   * POST /api/platillos/batch
   * Body: [{ nombre: "Tacos", precio: 25, ... }, ...]
   */
  async crearMuchos(id_ct_usuario_reg: number, datos: CrearPlatilloDTO[]): Promise<ResultadoBatch> {
    return insertarEnLotes(
      prisma.ct_platillo,
      datos.map((d) => ({
        id_ct_categoria: d.id_ct_categoria,
        nombre: d.nombre,
        descripcion: d.descripcion,
        precio: d.precio,
        imagen_url: d.imagen_url,
        id_ct_usuario_reg,
      })),
      { tamanioLote: 50 },
    );
  }
}

export default new PlatilloService();
