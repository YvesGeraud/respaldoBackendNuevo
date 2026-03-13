import { Prisma } from '@/generated/prisma/client';
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

// ── Tipo de retorno preciso ───────────────────────────────────────────────────

/**
 * ct_platillo con la relación categoria incluida.
 * Prisma.ct_platilloGetPayload calcula el tipo exacto según el include,
 * evitando casteos manuales o tipos definidos a mano.
 */
const incluirCategoria = {
  categoria: { select: { id_categoria: true, nombre: true } },
} as const;

type PlatilloConCategoria = Prisma.ct_platilloGetPayload<{
  include: typeof incluirCategoria;
}>;

// ── Servicio ──────────────────────────────────────────────────────────────────

class PlatilloService {
  async obtenerTodos(filtros: FiltrosPlatillos): Promise<ResultadoPaginado<PlatilloConCategoria>> {
    // filtros ya fue validado y tipado por Zod en el middleware — no necesita parsearPaginacion
    const opciones: OpcionesPaginacion = {
      pagina: filtros.pagina ?? 1,
      limite: filtros.limite ?? 20,
      ordenarPor: filtros.ordenar_por ?? CAMPOS_ORDENABLES_PLATILLO[0],
      orden: filtros.orden ?? 'asc',
    };

    // Prisma.ct_platilloWhereInput da type-safety en el where (detecta typos en nombres de campo)
    const where: Prisma.ct_platilloWhereInput = {};

    if (filtros.busqueda) {
      where.OR = [
        { nombre: { contains: filtros.busqueda } },
        { descripcion: { contains: filtros.busqueda } },
      ];
    }
    if (filtros.id_categoria !== undefined) where.id_categoria = filtros.id_categoria;
    if (filtros.estado !== undefined) where.estado = filtros.estado;

    // paginar devuelve ct_platillo[], pero el include garantiza que categoria esté presente.
    // El cast es seguro porque siempre pasamos incluirCategoria.
    return paginar(prisma.ct_platillo, where, opciones, incluirCategoria) as Promise<
      ResultadoPaginado<PlatilloConCategoria>
    >;
  }

  async obtenerPorId(id: number): Promise<PlatilloConCategoria> {
    return buscarOError(
      prisma.ct_platillo.findUnique({
        where: { id_platillo: id },
        include: incluirCategoria,
      }),
      'Platillo',
    );
  }

  async crear(datos: CrearPlatilloDTO): Promise<PlatilloConCategoria> {
    // Verifica unicidad solo entre platillos activos — permite reusar nombres de inactivos
    await verificarNoExiste(
      prisma.ct_platillo.findFirst({
        where: { nombre: datos.nombre, estado: true },
      }),
      'Ya existe un platillo activo con ese nombre',
    );

    return prisma.ct_platillo.create({
      data: {
        id_categoria: datos.id_categoria,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
        precio: datos.precio,
        imagen_url: datos.imagen_url,
      },
      include: incluirCategoria,
    });
  }

  async actualizar(id: number, datos: ActualizarPlatilloDTO): Promise<PlatilloConCategoria> {
    // Verifica existencia antes de intentar el update (P2025 evitado con mensaje claro)
    await buscarOError(prisma.ct_platillo.findUnique({ where: { id_platillo: id } }), 'Platillo');

    return prisma.ct_platillo.update({
      where: { id_platillo: id },
      data: datos,
      include: incluirCategoria,
    });
  }

  async eliminar(id: number): Promise<void> {
    await buscarOError(prisma.ct_platillo.findUnique({ where: { id_platillo: id } }), 'Platillo');

    // Soft delete — preserva historial en dt_detalle_orden
    await prisma.ct_platillo.update({
      where: { id_platillo: id },
      data: { estado: false },
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
  async crearMuchos(datos: CrearPlatilloDTO[]): Promise<ResultadoBatch> {
    return insertarEnLotes(
      prisma.ct_platillo,
      datos.map((d) => ({
        id_categoria: d.id_categoria,
        nombre: d.nombre,
        descripcion: d.descripcion,
        precio: d.precio,
        imagen_url: d.imagen_url,
      })),
      { tamanioLote: 50 },
    );
  }
}

export default new PlatilloService();
