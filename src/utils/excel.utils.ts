import ExcelJS from 'exceljs';
import type { Response } from 'express';

// ExcelJS exporta Workbook/Worksheet como tipos y como valores.
// Usamos las instancias directamente; los tipos los inferimos de ellas.
type Libro = ExcelJS.Workbook;
type Hoja  = ExcelJS.Worksheet;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ColumnaExcel {
  encabezado: string;
  /** Nombre de la propiedad en el objeto fila */
  propiedad:  string;
  /**
   * Ancho en caracteres. Si se omite se calcula automáticamente según el contenido.
   * Rango útil: 10–60 caracteres.
   */
  ancho?:    number;
  /**
   * Formato numérico de Excel (numFmt).
   * Ejemplos: '"$"#,##0.00'  |  'DD/MM/YYYY'  |  '0.00%'
   */
  formato?:  string;
  alinear?:  'left' | 'center' | 'right';
}

export interface OpcionesHoja {
  /**
   * Texto que se muestra en A1 como fila de título fusionada y destacada.
   * Si se omite, la primera fila es directamente el encabezado de columnas.
   */
  titulo?:             string;
  subtitulo?:          string;
  /** Congela la fila de encabezados para que siempre sea visible al hacer scroll. Default: true */
  congelarEncabezado?: boolean;
  /** Agrega auto-filtro a la fila de encabezados. Default: true */
  autoFiltro?:         boolean;
  /** Color de fondo del encabezado en hex sin #. Default: '1a3c5e' */
  colorEncabezado?:    string;
  /** Color de fondo de filas alternas en hex sin #. Default: 'f0f4f8' */
  colorFilaAlterna?:   string;
}

// ── Libro ─────────────────────────────────────────────────────────────────────

/**
 * Crea un Workbook preconfigurado con metadatos del sistema.
 * Un libro puede contener múltiples hojas (agregarHoja).
 */
export function crearLibro(): Libro {
  const libro        = new ExcelJS.Workbook();
  libro.creator      = 'Sistema de Restaurante Escolar';
  libro.lastModifiedBy = 'Sistema de Restaurante Escolar';
  libro.created      = new Date();
  libro.modified     = new Date();
  return libro;
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

/**
 * Envía el libro Excel al cliente vía stream.
 * No se guarda en disco — libro.xlsx.write(res) escribe directamente al response.
 *
 * Como el tamaño final no se conoce de antemano, no se envía Content-Length
 * (el navegador no muestra barra de progreso, pero la descarga funciona correctamente).
 *
 * @param descargar - true: attachment (descarga) | false: inline (algunos browsers lo abren)
 *
 * @example
 * const libro = crearLibro();
 * agregarHoja(libro, 'Reporte', columnas, datos, { titulo: 'Reporte Mensual' });
 * await enviarExcel(res, libro, 'reporte-2026-03');
 */
export async function enviarExcel(
  res:           Response,
  libro:         Libro,
  nombreArchivo: string,
  descargar = true,
): Promise<void> {
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    `${descargar ? 'attachment' : 'inline'}; filename="${encodeURIComponent(nombreArchivo)}.xlsx"`,
  );
  await libro.xlsx.write(res);
}

// ── Hojas ─────────────────────────────────────────────────────────────────────

/**
 * Agrega una hoja con datos al libro, incluyendo:
 *   - Fila de título fusionada (opcional)
 *   - Fila de subtítulo (opcional)
 *   - Encabezados estilizados con color de fondo
 *   - Filas de datos con fondo alterno
 *   - Auto-filtro en encabezados
 *   - Primera fila congelada (scroll sin perder encabezados)
 *   - Ancho de columnas calculado automáticamente si no se especifica
 *
 * @returns La hoja creada, por si se necesita personalización adicional.
 *
 * @example
 * agregarHoja(libro, 'Platillos', [
 *   { encabezado: 'Nombre',   propiedad: 'nombre',  ancho: 30 },
 *   { encabezado: 'Precio',   propiedad: 'precio',  ancho: 12, formato: '"$"#,##0.00', alinear: 'right' },
 *   { encabezado: 'Categoría', propiedad: 'categoria' },
 * ], platillos, { titulo: 'Catálogo de Platillos' });
 */
export function agregarHoja<T extends Record<string, unknown>>(
  libro:    Libro,
  nombre:   string,
  columnas: ColumnaExcel[],
  datos:    T[],
  opciones: OpcionesHoja = {},
): Hoja {
  const {
    titulo,
    subtitulo,
    congelarEncabezado = true,
    autoFiltro         = true,
    colorEncabezado    = '1a3c5e',
    colorFilaAlterna   = 'f0f4f8',
  } = opciones;

  const hoja = libro.addWorksheet(nombre, {
    // Propiedades de la pestaña
    properties: { tabColor: { argb: 'FF' + colorEncabezado } },
  });

  let filaActual = 1;

  // ── Fila de título ────────────────────────────────────────────────────────
  if (titulo) {
    hoja.mergeCells(filaActual, 1, filaActual, columnas.length);
    const celda   = hoja.getCell(filaActual, 1);
    celda.value   = titulo;
    celda.font    = { bold: true, size: 14, color: { argb: 'FF' + colorEncabezado } };
    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    hoja.getRow(filaActual).height = 32;
    filaActual++;
  }

  // ── Fila de subtítulo ─────────────────────────────────────────────────────
  if (subtitulo) {
    hoja.mergeCells(filaActual, 1, filaActual, columnas.length);
    const celda   = hoja.getCell(filaActual, 1);
    celda.value   = subtitulo;
    celda.font    = { italic: true, size: 10, color: { argb: 'FF666666' } };
    celda.alignment = { horizontal: 'center', vertical: 'middle' };
    hoja.getRow(filaActual).height = 20;
    filaActual++;
  }

  const filaEncabezado = filaActual;

  // ── Fila de encabezados ───────────────────────────────────────────────────
  const rowEnc = hoja.getRow(filaEncabezado);
  rowEnc.height = 26;

  columnas.forEach((col, i) => {
    const celda     = rowEnc.getCell(i + 1);
    celda.value     = col.encabezado;
    celda.font      = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    celda.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + colorEncabezado } };
    celda.alignment = { horizontal: col.alinear ?? 'center', vertical: 'middle', wrapText: false };
    celda.border    = { bottom: { style: 'medium', color: { argb: 'FF' + colorEncabezado } } };
  });

  // ── Auto-filtro ───────────────────────────────────────────────────────────
  if (autoFiltro) {
    hoja.autoFilter = {
      from: { row: filaEncabezado, column: 1 },
      to:   { row: filaEncabezado, column: columnas.length },
    };
  }

  // ── Congelar encabezado ───────────────────────────────────────────────────
  if (congelarEncabezado) {
    hoja.views = [{ state: 'frozen', ySplit: filaEncabezado, xSplit: 0 }];
  }

  // ── Filas de datos ────────────────────────────────────────────────────────
  datos.forEach((fila, idx) => {
    const numFila  = filaEncabezado + 1 + idx;
    const excelRow = hoja.getRow(numFila);
    const esAlterna = idx % 2 === 1;

    columnas.forEach((col, i) => {
      const celda = excelRow.getCell(i + 1);

      // Asignar valor directamente — ExcelJS maneja string, number, Date, boolean
      celda.value = (fila[col.propiedad] ?? null) as ExcelJS.CellValue;

      if (col.formato)  celda.numFmt    = col.formato;
      if (col.alinear)  celda.alignment = { horizontal: col.alinear, vertical: 'middle' };

      if (esAlterna) {
        celda.fill = {
          type: 'pattern', pattern: 'solid',
          fgColor: { argb: 'FF' + colorFilaAlterna },
        };
      }

      celda.border = { bottom: { style: 'hair', color: { argb: 'FFd0d7de' } } };
    });

    excelRow.height = 18;
  });

  // ── Anchos de columna ─────────────────────────────────────────────────────
  // Si no se especifica ancho, se calcula basado en el contenido más largo
  hoja.columns = columnas.map((col, i) => ({
    key:   String(i + 1),
    width: col.ancho ?? calcularAncho(col, datos),
  }));

  return hoja;
}

/**
 * Agrega una fila de pie de página (fuera de la tabla de datos).
 * Útil para totales, fechas de generación, notas, etc.
 *
 * @example
 * agregarPie(hoja, columnas.length, [
 *   { col: 1, texto: `Generado el ${new Date().toLocaleDateString('es-MX')}`, cursiva: true },
 *   { col: 4, texto: `Total: $${total.toFixed(2)}`, negrita: true, alinear: 'right' },
 * ]);
 */
export function agregarPie(
  hoja:          Hoja,
  totalColumnas: number,
  celdas: Array<{
    col:      number;
    texto:    string;
    negrita?: boolean;
    cursiva?: boolean;
    alinear?: 'left' | 'center' | 'right';
  }>,
): void {
  // La fila siguiente a la última con datos
  const ultimaFila = hoja.lastRow?.number ?? 1;
  const filaPie    = hoja.getRow(ultimaFila + 2); // dejamos una fila de espacio

  // Separador visual
  for (let c = 1; c <= totalColumnas; c++) {
    filaPie.getCell(c).border = { top: { style: 'thin', color: { argb: 'FFaaaaaa' } } };
  }

  celdas.forEach(({ col, texto, negrita, cursiva, alinear }) => {
    const celda     = filaPie.getCell(col);
    celda.value     = texto;
    celda.font      = { bold: negrita ?? false, italic: cursiva ?? false, color: { argb: 'FF555555' }, size: 9 };
    celda.alignment = { horizontal: alinear ?? 'left' };
  });
}

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Calcula el ancho óptimo de una columna midiendo:
 *   - El texto del encabezado
 *   - El valor más largo en los datos
 * Resultado limitado entre 10 y 60 para evitar columnas absurdamente anchas.
 */
function calcularAncho<T extends Record<string, unknown>>(
  col:   ColumnaExcel,
  datos: T[],
): number {
  const anchoEncabezado = col.encabezado.length;
  const anchoMax = datos.reduce((max, fila) => {
    const val = String(fila[col.propiedad] ?? '');
    return Math.max(max, val.length);
  }, anchoEncabezado);

  // +3 de margen interno que Excel añade a cada celda
  return Math.min(60, Math.max(10, anchoMax + 3));
}
