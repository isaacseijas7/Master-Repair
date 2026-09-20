import ExcelJS from "exceljs";
import { addBanner, applyBannerSize } from "./excelBanner";

export interface CatalogPriceColumn {
  key: string;
  header: string;
}

export interface CatalogBrandGroup {
  brand: string;
  phones: Array<{ model: string; values: Record<string, number | null | undefined> }>;
}

const FONT_NAME = "Aptos Narrow";
const USD_FORMAT = '"$"#,##0.00';
const THIN = { style: "thin" as const, color: { argb: "FF000000" } };

const MODEL_WIDTH = 29.57;
const PRICE_WIDTH = 18;
const GAP_WIDTH = 3.14;
const BLOCKS_PER_BAND = 2;

const baseFont = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };

// Genera la "Lista de precios" del catálogo: banner con el logo, título y las
// marcas agrupadas de a dos por franja. Cada bloque tiene la columna Modelo y
// una columna por cada precio seleccionado (en USD):
//
//   [Modelo][Precio…] [separador] [Modelo][Precio…]
export async function buildCatalogWorkbookBuffer(
  groups: CatalogBrandGroup[],
  priceColumns: CatalogPriceColumn[],
): Promise<Buffer> {
  const blockWidth = 1 + priceColumns.length;
  const blockWidths = [MODEL_WIDTH, ...priceColumns.map(() => PRICE_WIDTH)];
  const columnWidths = [...blockWidths, GAP_WIDTH, ...blockWidths];
  const totalColumns = columnWidths.length;
  // Columna (base 1) donde empieza cada bloque de la franja.
  const blockStartCols = Array.from(
    { length: BLOCKS_PER_BAND },
    (_, i) => 1 + i * (blockWidth + 1),
  );

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Catálogo", {
    pageSetup: {
      orientation: totalColumns > 5 ? "landscape" : "portrait",
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

  // --- Bloques de marcas, de a dos por franja ---
  let row = 5;
  for (let i = 0; i < groups.length; i += BLOCKS_PER_BAND) {
    const band = groups.slice(i, i + BLOCKS_PER_BAND);

    // Encabezado con el nombre de la marca (celdas combinadas).
    ws.getRow(row).height = 17.25;
    band.forEach((group, blockIdx) => {
      const c = blockStartCols[blockIdx];
      ws.mergeCells(row, c, row, c + blockWidth - 1);
      const cell = ws.getCell(row, c);
      cell.value = group.brand.toUpperCase();
      cell.font = baseFont;
      cell.alignment = { horizontal: "center", vertical: "bottom" };
      for (let k = 0; k < blockWidth; k++) {
        ws.getCell(row, c + k).border = { bottom: THIN };
      }
    });

    // Encabezados de columnas.
    const headerRow = row + 1;
    ws.getRow(headerRow).height = 30;
    band.forEach((_, blockIdx) => {
      const c = blockStartCols[blockIdx];
      const headers = ["MODELO", ...priceColumns.map((p) => p.header)];
      headers.forEach((text, k) => {
        const cell = ws.getCell(headerRow, c + k);
        cell.value = text;
        cell.font = baseFont;
        cell.alignment = { vertical: "bottom", wrapText: true };
        cell.border = { top: THIN, bottom: THIN };
      });
    });

    // Filas de datos.
    const rowCount = Math.max(...band.map((g) => g.phones.length));
    for (let n = 0; n < rowCount; n++) {
      const dataRow = headerRow + 1 + n;
      band.forEach((group, blockIdx) => {
        const phone = group.phones[n];
        if (!phone) return;
        const c = blockStartCols[blockIdx];

        const modelCell = ws.getCell(dataRow, c);
        modelCell.value = phone.model;
        modelCell.font = baseFont;
        modelCell.alignment = { vertical: "bottom" };
        modelCell.border = { bottom: THIN };

        priceColumns.forEach((column, k) => {
          const cell = ws.getCell(dataRow, c + 1 + k);
          const value = phone.values[column.key];
          if (typeof value === "number") cell.value = value;
          cell.numFmt = USD_FORMAT;
          cell.font = baseFont;
          cell.alignment = { vertical: "bottom" };
          cell.border = { bottom: THIN };
        });
      });
    }

    // Fila en blanco entre franjas.
    row = headerRow + rowCount + 2;
  }

  return applyBannerSize(Buffer.from(await workbook.xlsx.writeBuffer()), banner);
}
