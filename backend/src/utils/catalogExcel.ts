import ExcelJS from "exceljs";
import { addBanner, applyBannerSize } from "./excelBanner";

export interface CatalogBrandGroup {
  brand: string;
  phones: Array<{ model: string; price: number }>;
}

const FONT_NAME = "Aptos Narrow";
const USD_FORMAT = '"$"#,##0.00';
const THIN = { style: "thin" as const, color: { argb: "FF000000" } };

// Columnas: [A modelo][B precio][C separador][D modelo][E precio], igual que
// el formato de lista de precios del cliente.
const COLUMN_WIDTHS = [29.57, 14.29, 3.14, 32.29, 13.71];
const BLOCK_START_COLS = [1, 4];

// Genera la "Lista de precios" del catálogo: banner con el logo, título y
// las marcas agrupadas de a dos por fila (Modelo / Precio en USD).
export async function buildCatalogWorkbookBuffer(
  groups: CatalogBrandGroup[],
): Promise<Buffer> {
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

  ws.columns = COLUMN_WIDTHS.map((width) => ({ width }));
  ws.properties.defaultRowHeight = 15;

  // --- Banner (filas 1-2) ---
  const banner = addBanner(workbook, ws, COLUMN_WIDTHS);

  // --- Título (fila 3) ---
  ws.mergeCells("A3:E3");
  const title = ws.getCell("A3");
  title.value = "LISTA DE PRECIOS";
  title.font = { name: FONT_NAME, size: 28, bold: true, color: { argb: "FF000000" } };
  title.alignment = { horizontal: "center", vertical: "middle" };
  ws.getRow(3).height = 30;
  ws.getRow(4).height = 12;

  // --- Bloques de marcas, de a dos por franja ---
  let row = 5;
  for (let i = 0; i < groups.length; i += 2) {
    const band = groups.slice(i, i + 2);

    // Encabezado con el nombre de la marca (celdas combinadas).
    ws.getRow(row).height = 17.25;
    band.forEach((group, blockIdx) => {
      const c = BLOCK_START_COLS[blockIdx];
      ws.mergeCells(row, c, row, c + 1);
      const cell = ws.getCell(row, c);
      cell.value = group.brand.toUpperCase();
      cell.font = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };
      cell.alignment = { horizontal: "center", vertical: "bottom" };
      cell.border = { bottom: THIN };
      ws.getCell(row, c + 1).border = { bottom: THIN };
    });

    // Encabezados de columnas.
    const headerRow = row + 1;
    band.forEach((_, blockIdx) => {
      const c = BLOCK_START_COLS[blockIdx];
      [
        [c, "MODELO"],
        [c + 1, "PRECIO (USD)"],
      ].forEach(([col, text]) => {
        const cell = ws.getCell(headerRow, col as number);
        cell.value = text as string;
        cell.font = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };
        cell.alignment = { vertical: "bottom" };
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
        const c = BLOCK_START_COLS[blockIdx];

        const modelCell = ws.getCell(dataRow, c);
        modelCell.value = phone.model;
        modelCell.font = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };
        modelCell.alignment = { vertical: "bottom" };
        modelCell.border = { bottom: THIN };

        const priceCell = ws.getCell(dataRow, c + 1);
        priceCell.value = phone.price;
        priceCell.numFmt = USD_FORMAT;
        priceCell.font = { name: FONT_NAME, size: 11, color: { argb: "FF000000" } };
        priceCell.alignment = { vertical: "bottom" };
        priceCell.border = { bottom: THIN };
      });
    }

    // Fila en blanco entre franjas.
    row = headerRow + rowCount + 2;
  }

  return applyBannerSize(Buffer.from(await workbook.xlsx.writeBuffer()), banner);
}
