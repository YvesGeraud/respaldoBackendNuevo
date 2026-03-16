import type { Response } from 'express';
import { prisma } from '@/config/database.config';
import { crearLibro, agregarHoja, agregarPie, enviarExcel } from '@/utils/excel.utils';

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
      include: { categoria: { select: { nombre: true } } },
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
        categoria_nombre: p.categoria?.nombre ?? '—',
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
}

export default new ExcelService();
