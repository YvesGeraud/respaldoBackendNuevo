import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import { crearLibro, agregarHoja, agregarPie, enviarExcel } from '@/utils/excel.utils';

interface FiltrosVentas {
  fecha_inicio?: string;
  fecha_fin?: string;
}

class ExcelService {
  /**
   * Genera el Excel del menú del día con todos los platillos activos.
   * El archivo se envía directamente al response vía stream — no se guarda en disco.
   *
   * GET /api/excel/menu
   */
  async menuDelDia(res: Response): Promise<void> {
    const platillos = await prisma.ct_platillo.findMany({
      where: { estado: true },
      include: { ct_categoria: { select: { nombre: true } } },
      orderBy: [{ id_ct_categoria: 'asc' }, { nombre: 'asc' }],
    });

    const fechaCorta = new Date().toISOString().slice(0, 10);
    const fechaLarga = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const libro = crearLibro();

    const hoja = agregarHoja(
      libro,
      'Menú del Día',
      [
        { encabezado: 'Platillo', propiedad: 'nombre', ancho: 30 },
        { encabezado: 'Categoría', propiedad: 'categoria_nombre', ancho: 20 },
        { encabezado: 'Descripción', propiedad: 'descripcion', ancho: 40 },
        {
          encabezado: 'Precio',
          propiedad: 'precio',
          ancho: 12,
          formato: '"$"#,##0.00',
          alinear: 'right',
        },
        { encabezado: 'Disponible', propiedad: 'disponible', ancho: 12, alinear: 'center' },
      ],
      // Aplanamos la relación anidada — igual que en el PDF
      platillos.map((p) => ({
        nombre: p.nombre,
        categoria_nombre: p.ct_categoria?.nombre ?? '—',
        descripcion: p.descripcion ?? '',
        precio: Number(p.precio), // número real para que aplique el formato de Excel
        disponible: p.estado ? 'Sí' : 'No',
      })),
      { titulo: 'Menú del Día', subtitulo: fechaLarga },
    );

    // Fila de totales al pie de la tabla
    agregarPie(hoja, 5, [
      {
        col: 1,
        texto: `Total de platillos: ${platillos.length}`,
        negrita: true,
      },
      {
        col: 5,
        texto: `Generado el ${fechaLarga}`,
        cursiva: true,
        alinear: 'right',
      },
    ]);

    await enviarExcel(res, libro, `menu-${fechaCorta}`);
  }

  /**
   * Genera un reporte de ventas en Excel.
   */
  async reporteVentas(res: Response, filtros: FiltrosVentas): Promise<void> {
    const where: Prisma.rl_ordenWhereInput = { estado: 'PAGADA' };

    if (filtros.fecha_inicio || filtros.fecha_fin) {
      where.fecha_reg = {};
      if (filtros.fecha_inicio) where.fecha_reg.gte = new Date(filtros.fecha_inicio);
      if (filtros.fecha_fin) where.fecha_reg.lte = new Date(filtros.fecha_fin);
    }

    const ordenes = await prisma.rl_orden.findMany({
      where,
      include: {
        usuario: { select: { nombre_completo: true } },
        ct_mesa: { select: { codigo: true } },
      },
      orderBy: { fecha_reg: 'desc' },
    });

    const libro = crearLibro();
    const fechaCorta = new Date().toISOString().slice(0, 10);

    const hoja = agregarHoja(
      libro,
      'Reporte de Ventas',
      [
        { encabezado: 'Folio', propiedad: 'folio', ancho: 12 },
        { encabezado: 'Fecha', propiedad: 'fecha', ancho: 20 },
        { encabezado: 'Mesa', propiedad: 'mesa', ancho: 15 },
        { encabezado: 'Mesero', propiedad: 'mesero', ancho: 25 },
        {
          encabezado: 'Total',
          propiedad: 'total',
          ancho: 15,
          formato: '"$"#,##0.00',
          alinear: 'right',
        },
      ],
      ordenes.map((o) => ({
        folio: `#ORD-${o.id_rl_orden}`,
        fecha: o.fecha_reg.toLocaleString('es-MX'),
        mesa: o.ct_mesa?.codigo ?? 'Para llevar',
        mesero: o.usuario.nombre_completo,
        total: Number(o.total),
      })),
      { titulo: 'Reporte de Ventas', subtitulo: `Generado el ${new Date().toLocaleString()}` },
    );

    const granTotal = ordenes.reduce((acc, o) => acc + Number(o.total), 0);

    agregarPie(hoja, 5, [
      {
        col: 4,
        texto: 'GRAN TOTAL:',
        negrita: true,
        alinear: 'right',
      },
      {
        col: 5,
        texto: granTotal,
        negrita: true,
        formato: '"$"#,##0.00',
        alinear: 'right',
      },
    ]);

    await enviarExcel(res, libro, `reporte-ventas-${fechaCorta}`);
  }
}

export default new ExcelService();
