import type { Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '@/config/database.config';
import {
  crearDocumento,
  enviarPDF,
  escribirEncabezado,
  escribirCampo,
  escribirTabla,
  escribirNumeroDePaginas,
} from '@/utils/pdf.utils';

interface FiltrosVentas {
  fecha_inicio?: string;
  fecha_fin?: string;
}

class PdfService {
  /**
   * Genera el PDF del menú del día con todos los platillos activos.
   * El PDF se envía directamente al response (streaming) — no se guarda en disco.
   *
   * GET /api/pdf/menu
   */
  async menuDelDia(res: Response): Promise<void> {
    const platillos = await prisma.ct_platillo.findMany({
      where: { estado: true },
      include: { ct_categoria: { select: { nombre: true } } },
      orderBy: [{ id_ct_categoria: 'asc' }, { nombre: 'asc' }],
    });

    const fecha = new Date().toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const doc = crearDocumento({ titulo: 'Menú del Día', subtitulo: fecha });
    enviarPDF(res, doc, `menu-${new Date().toISOString().slice(0, 10)}`, false);

    escribirEncabezado(doc, 'Menú del Día', fecha);

    escribirCampo(doc, 'Total de platillos', String(platillos.length));
    doc.moveDown(0.5);

    escribirTabla(
      doc,
      [
        { encabezado: 'Platillo', propiedad: 'nombre', ancho: 0.4 },
        { encabezado: 'Categoría', propiedad: 'categoria_nombre', ancho: 0.25 },
        { encabezado: 'Descripción', propiedad: 'descripcion', ancho: 0.25 },
        { encabezado: 'Precio', propiedad: 'precio_formato', ancho: 0.1, alinear: 'right' },
      ],
      platillos.map((p) => ({
        nombre: p.nombre,
        categoria_nombre: p.ct_categoria?.nombre ?? '—',
        descripcion: p.descripcion ?? '',
        precio_formato: `$${Number(p.precio).toFixed(2)}`,
      })),
    );

    escribirNumeroDePaginas(doc);
    doc.end();
  }

  /**
   * Genera un reporte de ventas en PDF.
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

    const doc = crearDocumento({
      titulo: 'Reporte de Ventas',
      subtitulo: `Generado el ${new Date().toLocaleString()}`,
    });
    enviarPDF(res, doc, `reporte-ventas-${new Date().toISOString().slice(0, 10)}`, false);

    escribirEncabezado(doc, 'Reporte de Ventas', `Período: ${filtros.fecha_inicio || 'Inicio'} al ${filtros.fecha_fin || 'Hoy'}`);

    escribirCampo(doc, 'Total de órdenes pagadas', String(ordenes.length));
    const granTotal = ordenes.reduce((acc, o) => acc + Number(o.total), 0);
    escribirCampo(doc, 'Monto Total Recaudado', `$${granTotal.toFixed(2)}`);
    doc.moveDown(0.5);

    escribirTabla(
      doc,
      [
        { encabezado: 'Folio', propiedad: 'folio', ancho: 0.15 },
        { encabezado: 'Fecha', propiedad: 'fecha', ancho: 0.3 },
        { encabezado: 'Mesa', propiedad: 'mesa', ancho: 0.15 },
        { encabezado: 'Mesero', propiedad: 'mesero', ancho: 0.25 },
        { encabezado: 'Total', propiedad: 'total_formato', ancho: 0.15, alinear: 'right' },
      ],
      ordenes.map((o) => ({
        folio: `#ORD-${o.id_rl_orden}`,
        fecha: o.fecha_reg.toLocaleString('es-MX'),
        mesa: o.ct_mesa?.codigo ?? 'P. Llevar',
        mesero: o.usuario.nombre_completo,
        total_formato: `$${Number(o.total).toFixed(2)}`,
      })),
    );

    escribirNumeroDePaginas(doc);
    doc.end();
  }
}

export default new PdfService();
