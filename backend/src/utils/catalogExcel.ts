import ExcelJS from "exceljs";
import { addBanner, applyBannerSize } from "./excelBanner";

export interface CatalogPriceColumn {
  key: string;
  header: string;
}

export interface CatalogBrandGroup {
  brand: string;
  screens: Array<{ model: string; values: Record<string, number | null | undefined> }>;
}

const FONT_NAME = "Aptos Narrow";
const USD_FORMAT = '"$"#,##0.00';
const THIN = { style: "thin" as const, color: { argb: "FF000000" } };

const MODEL_WIDTH = 32;
const PRICE_WIDTH = 18;

const baseFont = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };

// Genera la "Lista de precios" del catálogo: banner con el logo, título y las
// marcas agrupadas, una debajo de la otra. Cada bloque de marca tiene la
// columna Modelo y una columna por cada precio seleccionado (en USD):
//
//   [Modelo][Precio…]
export async function buildCatalogWorkbookBuffer(
  groups: CatalogBrandGroup[],
  priceColumns: CatalogPriceColumn[],
): Promise<Buffer> {
  const columnWidths = [MODEL_WIDTH, ...priceColumns.map(() => PRICE_WIDTH)];
  const totalColumns = columnWidths.length;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet("Catálogo", {
    pageSetup: {
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
    ["MODELO", ...priceColumns.map((p) => p.header)].forEach((text, k) => {
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

      priceColumns.forEach((column, k) => {
        const cell = ws.getCell(dataRow, 2 + k);
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
