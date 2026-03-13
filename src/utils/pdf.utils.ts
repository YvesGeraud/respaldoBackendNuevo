import PDFDocument from 'pdfkit';
import type { Response } from 'express';

// @types/pdfkit exporta PDFDocument como constructor (valor), no como clase con tipo
// de instancia. InstanceType<typeof PDFDocument> extrae el tipo del objeto creado con `new`.
type Doc = InstanceType<typeof PDFDocument>;

// ── Tipos ─────────────────────────────────────────────────────────────────────

export interface ColumnaPDF {
  encabezado: string;
  /** Nombre de la propiedad en el objeto fila */
  propiedad:  string;
  /** Fracción del ancho total (0–1). Si se omite, se distribuye el espacio restante */
  ancho?:     number;
  alinear?:   'left' | 'center' | 'right';
}

export interface OpcionesTabla {
  colorEncabezado?:  string;   // default: '#1a3c5e'
  colorFilaAlterna?: string;   // default: '#f0f4f8'
  colorTexto?:       string;   // default: '#333333'
  alturaFilaMin?:    number;   // altura mínima de fila en pts. default: 22
  paddingVertical?:  number;   // espacio interno arriba/abajo. default: 6
}

export interface OpcionesDocumento {
  titulo:     string;
  subtitulo?: string;
  autor?:     string;
  margen?:    number;   // default: 50
}

// ── Documento ─────────────────────────────────────────────────────────────────

/**
 * Crea un PDFDocument A4 preconfigurado.
 * bufferPages: true → permite agregar números de página al final con un solo recorrido.
 */
export function crearDocumento(opciones: OpcionesDocumento): Doc {
  return new PDFDocument({
    size:        'A4',
    margin:      opciones.margen ?? 50,
    bufferPages: true,
    info: {
      Title:   opciones.titulo,
      Author:  opciones.autor ?? 'Sistema de Restaurante Escolar',
      Creator: 'Sistema de Restaurante Escolar',
    },
  });
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

/**
 * Conecta el PDF al response HTTP con las cabeceras correctas.
 * Llama esto ANTES de escribir contenido y doc.end() cuando termines.
 *
 * @param descargar - true: descarga el archivo | false: lo muestra en el navegador
 */
export function enviarPDF(
  res:           Response,
  doc:           Doc,
  nombreArchivo: string,
  descargar = true,
): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `${descargar ? 'attachment' : 'inline'}; filename="${encodeURIComponent(nombreArchivo)}.pdf"`,
  );
  doc.pipe(res);
}

// ── Bloques de contenido ──────────────────────────────────────────────────────

/**
 * Encabezado estándar: título + subtítulo + línea divisoria.
 */
export function escribirEncabezado(doc: Doc, titulo: string, subtitulo?: string): void {
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor('#1a3c5e')
    .text(titulo, { align: 'center' });

  if (subtitulo) {
    doc
      .fontSize(11)
      .font('Helvetica')
      .fillColor('#666666')
      .text(subtitulo, { align: 'center' });
  }

  doc
    .moveDown(0.5)
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor('#1a3c5e')
    .lineWidth(1.5)
    .stroke()
    .moveDown(0.8)
    .fillColor('#333333');
}

/**
 * Par etiqueta–valor en una sola línea. Útil para fichas y tickets.
 *
 * @example
 * escribirCampo(doc, 'Total', '$245.00', { colorValor: '#2e7d32', negrita: true });
 */
export function escribirCampo(
  doc:      Doc,
  etiqueta: string,
  valor:    string,
  opciones: { colorValor?: string; negrita?: boolean } = {},
): void {
  doc
    .fontSize(10)
    .font('Helvetica-Bold')
    .fillColor('#555555')
    .text(`${etiqueta}: `, { continued: true });
  doc
    .font(opciones.negrita ? 'Helvetica-Bold' : 'Helvetica')
    .fillColor(opciones.colorValor ?? '#333333')
    .text(valor);
}

/**
 * Tabla genérica con:
 * - Encabezado coloreado
 * - Filas de altura DINÁMICA (el texto largo envuelve en lugar de desbordarse)
 * - Fondo alterno en filas pares
 * - Salto de página automático con encabezado repetido
 */
export function escribirTabla<T extends Record<string, unknown>>(
  doc:      Doc,
  columnas: ColumnaPDF[],
  filas:    T[],
  opciones: OpcionesTabla = {},
): void {
  const {
    colorEncabezado  = '#1a3c5e',
    colorFilaAlterna = '#f0f4f8',
    colorTexto       = '#333333',
    alturaFilaMin    = 22,
    paddingVertical  = 6,
  } = opciones;

  const xInicio    = doc.page.margins.left;
  const anchoTotal = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const anchos     = calcularAnchos(columnas, anchoTotal);

  // ── Función interna para dibujar el encabezado de la tabla ──
  const dibujarEncabezado = () => {
    const alturaEnc = alturaFilaMin + 4;
    const y = doc.y;

    doc.rect(xInicio, y, anchoTotal, alturaEnc).fill(colorEncabezado);
    doc.fontSize(9).font('Helvetica-Bold').fillColor('#ffffff');

    let x = xInicio;
    columnas.forEach((col, i) => {
      doc.text(col.encabezado, x + 5, y + paddingVertical + 2, {
        width:     anchos[i]! - 10,
        align:     col.alinear ?? 'left',
        lineBreak: false,
      });
      x += anchos[i]!;
    });

    doc.y = y + alturaEnc;
  };

  dibujarEncabezado();

  // ── Filas de datos ──
  filas.forEach((fila, idx) => {
    // Preparar los textos de la fila antes de dibujar
    const textos = columnas.map((col) => {
      const v = fila[col.propiedad];
      return v !== null && v !== undefined ? String(v) : '—';
    });

    // Calcular la altura real necesaria para esta fila (la más alta de todas las celdas)
    doc.fontSize(9).font('Helvetica');
    const alturaReal = calcularAlturaFila(doc, textos, anchos, alturaFilaMin, paddingVertical);

    // Salto de página: si la fila no cabe, nueva página con encabezado repetido
    if (doc.y + alturaReal > doc.page.height - doc.page.margins.bottom - 10) {
      doc.addPage();
      dibujarEncabezado();
    }

    const yFila = doc.y;

    // Fondo alterno en filas impares (idx 1, 3, 5…)
    if (idx % 2 === 1) {
      doc.rect(xInicio, yFila, anchoTotal, alturaReal).fill(colorFilaAlterna);
    }

    // Línea inferior de la fila
    doc
      .moveTo(xInicio, yFila + alturaReal)
      .lineTo(xInicio + anchoTotal, yFila + alturaReal)
      .strokeColor('#d0d7de')
      .lineWidth(0.3)
      .stroke();

    // Texto de cada celda con altura limitada para que no desborde al siguiente bloque
    doc.fillColor(colorTexto).fontSize(9).font('Helvetica');
    let x = xInicio;
    columnas.forEach((col, i) => {
      doc.text(textos[i]!, x + 5, yFila + paddingVertical, {
        width:     anchos[i]! - 10,
        height:    alturaReal - paddingVertical * 2, // limita el área de texto
        align:     col.alinear ?? 'left',
        lineBreak: true,  // permite salto de línea dentro de la celda
        ellipsis:  true,  // si aun así no cabe, añade "…" al final
      });
      x += anchos[i]!;
    });

    // Fijar doc.y al final exacto de la fila, independiente de dónde quedó el cursor
    doc.y = yFila + alturaReal;
  });

  // Solo avanzamos si hay espacio; si no, el siguiente contenido irá a nueva página por sí solo
  const espacioRestante = doc.page.height - doc.page.margins.bottom - doc.y;
  if (espacioRestante > doc.currentLineHeight() * 0.8) {
    doc.moveDown(0.8);
  }
  doc.fillColor('#333333');
}

/**
 * Agrega "Página N de M" al pie de cada página.
 * Llamar justo antes de doc.end() — requiere bufferPages: true en crearDocumento().
 *
 * save()/restore() preservan el estado gráfico al cambiar entre páginas
 * y lineBreak: false impide que PDFKit cree páginas extra al escribir en el pie.
 */
export function escribirNumeroDePaginas(doc: Doc): void {
  const rango = doc.bufferedPageRange();
  const total = rango.count;

  for (let i = 0; i < total; i++) {
    doc.switchToPage(rango.start + i);

    const margenIzq = doc.page.margins.left;
    const ancho     = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    // Escribe dentro del margen inferior (entre fin del contenido y borde físico)
    const y = doc.page.height - doc.page.margins.bottom + 12;

    doc
      .save()                   // preserva estado: posición, fuente, color
      .fontSize(8)
      .font('Helvetica')
      .fillColor('#999999')
      .text(`Página ${i + 1} de ${total}`, margenIzq, y, {
        align:     'right',
        width:     ancho,
        lineBreak: false,       // impide que se cree una nueva página accidentalmente
      })
      .restore();               // restaura el estado del documento
  }
}

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Distribuye el ancho total entre las columnas.
 * Las columnas con `ancho` definido (0–1) se respetan; el resto se reparte a partes iguales.
 */
function calcularAnchos(columnas: ColumnaPDF[], anchoTotal: number): number[] {
  const usados   = columnas.reduce((s, c) => s + (c.ancho ?? 0), 0);
  const sinAncho = columnas.filter((c) => c.ancho === undefined).length;
  const resto    = sinAncho > 0 ? (anchoTotal * (1 - usados)) / sinAncho : 0;
  return columnas.map((c) => (c.ancho !== undefined ? c.ancho * anchoTotal : resto));
}

/**
 * Calcula la altura real necesaria para una fila usando doc.heightOfString(),
 * que mide exactamente cómo PDFKit va a renderizar el texto (respeta word-wrap).
 */
function calcularAlturaFila(
  doc:             Doc,
  textos:          string[],
  anchos:          number[],
  alturaMinima:    number,
  paddingVertical: number,
): number {
  const alturaMaxCelda = textos.reduce((max, texto, i) => {
    const anchoUtil = anchos[i]! - 10; // 5px padding a cada lado
    // heightOfString mide el bloque exacto que ocupará el texto con esa anchura
    const alturaTexto = doc.heightOfString(texto, { width: anchoUtil, lineBreak: true });
    const alturaCelda = alturaTexto + paddingVertical * 2;
    return Math.max(max, alturaCelda);
  }, alturaMinima);

  return Math.max(alturaMinima, alturaMaxCelda);
}
