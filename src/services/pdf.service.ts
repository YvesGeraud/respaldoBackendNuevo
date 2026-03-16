import type { Response } from 'express';
import { prisma } from '@/config/database.config';
import {
  crearDocumento,
  enviarPDF,
  escribirEncabezado,
  escribirCampo,
  escribirTabla,
  escribirNumeroDePaginas,
} from '@/utils/pdf.utils';

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
      include: { categoria: { select: { nombre: true } } },
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
        categoria_nombre: p.categoria?.nombre ?? '—',
        descripcion: p.descripcion ?? '',
        precio_formato: `$${Number(p.precio).toFixed(2)}`,
      })),
    );

    escribirNumeroDePaginas(doc);
    doc.end();
  }
}

export default new PdfService();
