import ExcelJS from "exceljs";
import JSZip from "jszip";
import path from "path";

export interface CatalogBrandGroup {
  brand: string;
  phones: Array<{ model: string; price: number }>;
}

// Funciona igual desde src/ (tsx) y desde dist/ (node): ambos quedan a dos
// niveles de backend/assets.
const BANNER_DIR = path.resolve(__dirname, "../../assets/catalog");
// Logo recortado a 1080x600 px (franja central de la imagen original).
const BANNER_FILE = "banner.jpg";
const BANNER_SOURCE_PX = { width: 1080, height: 600 };

const FONT_NAME = "Aptos Narrow";
const USD_FORMAT = '"$"#,##0.00';
const THIN = { style: "thin" as const, color: { argb: "FF000000" } };

// Columnas: [A modelo][B precio][C separador][D modelo][E precio], igual que
// el formato de lista de precios del cliente.
const COLUMN_WIDTHS = [29.57, 14.29, 3.14, 32.29, 13.71];
const BLOCK_START_COLS = [1, 4];

const colWidthPx = (width: number) => Math.floor(width * 7 + 5);

const EMU_PER_PX = 9525;
const BANNER_HEIGHT_PX = 260;
const BANNER_WIDTH_PX = Math.round(
  (BANNER_HEIGHT_PX * BANNER_SOURCE_PX.width) / BANNER_SOURCE_PX.height,
);
const BANNER_ROW2_HEIGHT_PT = 27;
// Filas 1-2 = alto del banner (px → pt = px * 0.75).
const BANNER_ROW1_HEIGHT_PT = BANNER_HEIGHT_PX * 0.75 - BANNER_ROW2_HEIGHT_PT;

// Convierte un desplazamiento en píxeles desde el borde izquierdo en un
// ancla nativa (columna + EMU dentro de la columna).
function pxToAnchor(px: number, row: number): ExcelJS.Anchor {
  let remaining = px;
  let col = 0;
  while (col < COLUMN_WIDTHS.length - 1 && remaining >= colWidthPx(COLUMN_WIDTHS[col])) {
    remaining -= colWidthPx(COLUMN_WIDTHS[col]);
    col++;
  }
  return {
    nativeCol: col,
    nativeColOff: Math.round(remaining * EMU_PER_PX),
    nativeRow: row,
    nativeRowOff: 0,
  } as unknown as ExcelJS.Anchor;
}

// Genera la "Lista de precios" del catálogo: banner de imágenes, título y
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
  ws.getRow(1).height = BANNER_ROW1_HEIGHT_PT;
  ws.getRow(2).height = BANNER_ROW2_HEIGHT_PT;

  const tableWidthPx = COLUMN_WIDTHS.reduce((sum, w) => sum + colWidthPx(w), 0);
  const bannerLeftPx = Math.max(0, Math.round((tableWidthPx - BANNER_WIDTH_PX) / 2));
  const imageId = workbook.addImage({
    filename: path.join(BANNER_DIR, BANNER_FILE),
    extension: "jpeg",
  });
  // Anclaje de dos celdas. Las filas 1-2 miden exactamente
  // BANNER_HEIGHT_PX, así que la imagen termina en la fila 3.
  ws.addImage(imageId, {
    tl: pxToAnchor(bannerLeftPx, 0),
    br: pxToAnchor(bannerLeftPx + BANNER_WIDTH_PX, 2),
    editAs: "oneCell",
  });

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

  return withImageSize(Buffer.from(await workbook.xlsx.writeBuffer()), bannerLeftPx);
}

// exceljs escribe el bloque <a:xfrm> de la imagen con tamaño 0x0. Excel lo
// ignora y usa el ancla, pero otros visores (vista previa de macOS, etc.) no
// dibujan la imagen; se rellena con la posición y tamaño reales.
async function withImageSize(buffer: Buffer, leftPx: number): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const drawingPath = "xl/drawings/drawing1.xml";
  const drawing = zip.file(drawingPath);
  if (!drawing) return buffer;

  const xml = (await drawing.async("string")).replace(
    /<a:xfrm>.*?<\/a:xfrm>/,
    `<a:xfrm><a:off x="${leftPx * EMU_PER_PX}" y="0"/>` +
      `<a:ext cx="${BANNER_WIDTH_PX * EMU_PER_PX}" cy="${BANNER_HEIGHT_PX * EMU_PER_PX}"/></a:xfrm>`,
  );

  zip.file(drawingPath, xml);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
