import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';

interface FiltrosReporte {
  fecha_inicio?: string;
  fecha_fin?: string;
}

class ReporteService {
  async obtenerEstadisticas(filtros: FiltrosReporte) {
    const where: Prisma.rl_ordenWhereInput = { estado: 'PAGADA' };

    if (filtros.fecha_inicio || filtros.fecha_fin) {
      where.fecha_reg = {};
      if (filtros.fecha_inicio) where.fecha_reg.gte = new Date(filtros.fecha_inicio);
      if (filtros.fecha_fin) where.fecha_reg.lte = new Date(filtros.fecha_fin);
    }

    // 1. Ventas Totales y Cantidad de Órdenes
    const resumen = await prisma.rl_orden.aggregate({
      where,
      _sum: { total: true },
      _count: { id_rl_orden: true }
    });

    // 2. Platillo Top (El más vendido en cantidad)
    // Agrupamos los detalles de las órdenes que cumplen el filtro
    const topPlatilloRaw = await prisma.dt_detalle_orden.groupBy({
      by: ['id_ct_platillo'],
      where: {
        rl_orden: where
      },
      _sum: { cantidad: true },
      orderBy: {
        _sum: { cantidad: 'desc' }
      },
      take: 1
    });

    let platilloFavorito = 'N/A';
    if (topPlatilloRaw.length > 0) {
      const platillo = await prisma.ct_platillo.findUnique({
        where: { id_ct_platillo: topPlatilloRaw[0].id_ct_platillo },
        select: { nombre: true }
      });
      platilloFavorito = platillo?.nombre || 'N/A';
    }

    const totalVentas = Number(resumen._sum.total || 0);
    const totalOrdenes = resumen._count.id_rl_orden || 0;

    return {
      totalVentas,
      totalOrdenes,
      ticketPromedio: totalOrdenes > 0 ? totalVentas / totalOrdenes : 0,
      platilloFavorito
    };
  }

  async obtenerDashboardStats() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // 1. Ventas de Hoy
    const ventasHoyAgg = await prisma.rl_orden.aggregate({
      where: {
        estado: 'PAGADA',
        fecha_reg: { gte: hoy }
      },
      _sum: { total: true },
      _count: { id_rl_orden: true }
    });
    const ventasHoy = Number(ventasHoyAgg._sum.total || 0);
    const ordenesHoy = ventasHoyAgg._count.id_rl_orden;

    // 2. Ocupación de Mesas
    const totalMesas = await prisma.ct_mesa.count();
    // Mesas que tienen al menos una orden activa
    const ordenesActivas = await prisma.rl_orden.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PROCESO', 'LISTO', 'ENTREGADO'] },
        id_ct_mesa: { not: null }
      },
      select: { id_ct_mesa: true },
      distinct: ['id_ct_mesa']
    });
    const mesasOcupadas = ordenesActivas.length;

    // 3. Top 5 Platillos (Histórico o Últimos 30 días, usaremos histórico para tener datos)
    const topPlatillosRaw = await prisma.dt_detalle_orden.groupBy({
      by: ['id_ct_platillo'],
      where: {
        rl_orden: { estado: 'PAGADA' }
      },
      _sum: { cantidad: true },
      orderBy: { _sum: { cantidad: 'desc' } },
      take: 5
    });

    const top5Platillos = await Promise.all(
      topPlatillosRaw.map(async (raw) => {
        const p = await prisma.ct_platillo.findUnique({
          where: { id_ct_platillo: raw.id_ct_platillo },
          select: { nombre: true }
        });
        return {
          nombre: p?.nombre || 'Desconocido',
          cantidad: raw._sum.cantidad || 0
        };
      })
    );

    // 4. Ventas últimos 7 días
    const hace7Dias = new Date();
    hace7Dias.setDate(hace7Dias.getDate() - 6);
    hace7Dias.setHours(0, 0, 0, 0);

    const ordenes7Dias = await prisma.rl_orden.findMany({
      where: {
        estado: 'PAGADA',
        fecha_reg: { gte: hace7Dias }
      },
      select: { fecha_reg: true, total: true }
    });

    // Agrupar por fecha 'YYYY-MM-DD'
    const ventasPorDiaMap = new Map<string, number>();
    
    // Inicializar los últimos 7 días con 0
    for (let i = 0; i < 7; i++) {
      const d = new Date(hace7Dias);
      d.setDate(d.getDate() + i);
      const fechaStr = d.toISOString().split('T')[0];
      ventasPorDiaMap.set(fechaStr, 0);
    }

    ordenes7Dias.forEach(o => {
      const fechaStr = o.fecha_reg.toISOString().split('T')[0];
      if (ventasPorDiaMap.has(fechaStr)) {
        ventasPorDiaMap.set(fechaStr, ventasPorDiaMap.get(fechaStr)! + Number(o.total));
      }
    });

    const ventasUltimos7Dias = Array.from(ventasPorDiaMap.entries()).map(([fecha, total]) => ({
      fecha,
      total
    })).sort((a, b) => a.fecha.localeCompare(b.fecha));

    return {
      ventasHoy,
      ordenesHoy,
      ticketPromedioHoy: ordenesHoy > 0 ? ventasHoy / ordenesHoy : 0,
      ocupacionMesas: {
        ocupadas: mesasOcupadas,
        total: totalMesas,
        porcentaje: totalMesas > 0 ? Math.round((mesasOcupadas / totalMesas) * 100) : 0
      },
      top5Platillos,
      ventasUltimos7Dias
    };
  }
}

export default new ReporteService();
