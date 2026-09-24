import ExcelJS from "exceljs";
import { addBanner, applyBannerSize } from "./excelBanner";

export interface CatalogPriceColumn {
  key: string;
  header: string;
}

export interface CatalogBrandGroup {
  brand: string;
  screens: Array<{
    model: string;
    // Solo se usa cuando el libro incluye la columna TIPO.
    isMechanic?: boolean;
    values: Record<string, number | null | undefined>;
  }>;
}

const FONT_NAME = "Aptos Narrow";
const USD_FORMAT = '"$"#,##0.00';
const THIN = { style: "thin" as const, color: { argb: "FF000000" } };

// Ancho útil de una hoja carta vertical (8.5 in menos márgenes de 0.25 in) a
// 96 dpi. La tabla se reparte en todo ese ancho para no dejar la hoja impresa
// con espacio en blanco a la derecha.
const LETTER_PRINTABLE_PX = 768;
// exceljs no tipa Letter en su enum PaperSize; en el formato OOXML es 1.
const PAPER_SIZE_LETTER = 1 as ExcelJS.PaperSize;
const MODEL_SHARE = 0.4;
const TYPE_SHARE = 0.16;

// Inverso de colWidthPx: ancho de columna (en caracteres) para un ancho en px.
const pxToColWidth = (px: number) => (px - 5) / 7;

// Reparte el ancho de la hoja: Modelo, [Tipo] y una columna por cada precio.
function buildColumnWidths(priceCount: number, showType: boolean): number[] {
  const modelPx = LETTER_PRINTABLE_PX * MODEL_SHARE;
  const typePx = showType ? LETTER_PRINTABLE_PX * TYPE_SHARE : 0;
  const pricePx = (LETTER_PRINTABLE_PX - modelPx - typePx) / priceCount;
  return [
    pxToColWidth(modelPx),
    ...(showType ? [pxToColWidth(typePx)] : []),
    ...Array.from({ length: priceCount }, () => pxToColWidth(pricePx)),
  ];
}

const baseFont = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };

// Genera la "Lista de precios" del catálogo: banner con el logo, título y las
// marcas agrupadas, una debajo de la otra. Cada bloque de marca tiene la
// columna Modelo, opcionalmente una columna Tipo (Mecánico / Regular) y una
// columna por cada precio seleccionado (en USD):
//
//   [Modelo][Tipo?][Precio…]
//
// La tabla se ensancha hasta ocupar todo el ancho de una hoja carta.
export async function buildCatalogWorkbookBuffer(
  groups: CatalogBrandGroup[],
  priceColumns: CatalogPriceColumn[],
  { showType = false }: { showType?: boolean } = {},
): Promise<Buffer> {
  const columnWidths = buildColumnWidths(priceColumns.length, showType);
  const priceStart = showType ? 3 : 2;
  const totalColumns = columnWidths.length;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Catálogo", {
    pageSetup: {
      paperSize: PAPER_SIZE_LETTER,
      orientation: "portrait",
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.25, right: 0.25, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 },
    },
  });

  ws.columns = columnWidths.map((width) => ({ width }));
  ws.properties.defaultRowHeight = 15;

  // --- Banner (filas 1-2) ---
  const banner = addBanner(workbook, ws, columnWidths);

  // --- Título (fila 3) ---
  ws.mergeCells(3, 1, 3, totalColumns);
  const title = ws.getCell(3, 1);
  title.value = "LISTA DE PRECIOS";
  title.font = { name: FONT_NAME, size: 28, bold: true, color: { argb: "FF000000" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 30;
  ws.getRow(4).height = 12;

  // --- Un bloque por marca, uno debajo del otro ---
  let row = 5;
  for (const group of groups) {
    // Encabezado con el nombre de la marca (celdas combinadas).
    ws.getRow(row).height = 17.25;
    ws.mergeCells(row, 1, row, totalColumns);
    const brandCell = ws.getCell(row, 1);
    brandCell.value = group.brand.toUpperCase();
    brandCell.font = baseFont;
    brandCell.alignment = { horizontal: "center", vertical: "bottom" };
    for (let col = 1; col <= totalColumns; col++) {
      ws.getCell(row, col).border = { bottom: THIN };
    }

    // Encabezados de columnas.
    const headerRow = row + 1;
    ws.getRow(headerRow).height = 30;
    ["MODELO", ...(showType ? ["TIPO"] : []), ...priceColumns.map((p) => p.header)].forEach((text, k) => {
      const cell = ws.getCell(headerRow, 1 + k);
      cell.value = text;
      cell.font = baseFont;
      cell.alignment = { vertical: "bottom", wrapText: true };
      cell.border = { top: THIN, bottom: THIN };
    });

    // Filas de datos.
    group.screens.forEach((screen, n) => {
      const dataRow = headerRow + 1 + n;

      const modelCell = ws.getCell(dataRow, 1);
      modelCell.value = screen.model;
      modelCell.font = baseFont;
      modelCell.alignment = { vertical: "bottom" };
      modelCell.border = { bottom: THIN };

      if (showType) {
        const typeCell = ws.getCell(dataRow, 2);
        typeCell.value = screen.isMechanic ? "Mecánico" : "Regular";
        typeCell.font = baseFont;
        typeCell.alignment = { horizontal: "center", vertical: "bottom" };
        typeCell.border = { bottom: THIN };
      }

      priceColumns.forEach((column, k) => {
        const cell = ws.getCell(dataRow, priceStart + k);
        const value = screen.values[column.key];
        if (typeof value === "number") cell.value = value;
        cell.numFmt = USD_FORMAT;
        cell.font = baseFont;
        cell.alignment = { vertical: "bottom" };
        cell.border = { bottom: THIN };
      });
    });

    // Fila en blanco entre marcas.
    row = headerRow + group.screens.length + 2;
  }

  return applyBannerSize(Buffer.from(await workbook.xlsx.writeBuffer()), banner);
}
