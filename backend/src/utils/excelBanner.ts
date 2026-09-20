import ExcelJS from "exceljs";
import JSZip from "jszip";
import path from "path";

// Funciona igual desde src/ (tsx) y desde dist/ (node): ambos quedan a dos
// niveles de backend/assets.
const BANNER_PATH = path.resolve(__dirname, "../../assets/catalog/banner.jpg");
// Logo recortado a 1080x600 px (franja central de la imagen original).
const BANNER_SOURCE_PX = { width: 1080, height: 600 };
const MAX_BANNER_HEIGHT_PX = 260;
const EMU_PER_PX = 9525;

// El banner ocupa siempre las filas 1 y 2 de la hoja.
export const BANNER_ROWS = 2;

export const colWidthPx = (width: number) => Math.floor(width * 7 + 5);

export interface BannerPlacement {
  leftPx: number;
  widthPx: number;
  heightPx: number;
}

// Convierte un desplazamiento en píxeles desde el borde izquierdo en un
// ancla nativa (columna + EMU dentro de la columna).
function pxToAnchor(px: number, row: number, columnWidths: number[]): ExcelJS.Anchor {
  let remaining = px;
  let col = 0;
  while (col < columnWidths.length - 1 && remaining >= colWidthPx(columnWidths[col])) {
    remaining -= colWidthPx(columnWidths[col]);
    col++;
  }
  return {
    nativeCol: col,
    nativeColOff: Math.round(remaining * EMU_PER_PX),
    nativeRow: row,
    nativeRowOff: 0,
  } as unknown as ExcelJS.Anchor;
}

// Inserta el logo en las filas 1-2, centrado sobre la tabla o alineado a la
// izquierda (útil en tablas anchas, donde un banner centrado quedaría fuera
// de la primera pantalla). Si la tabla es más angosta que el banner, este se
// reduce para no salirse de las columnas.
export function addBanner(
  workbook: ExcelJS.Workbook,
  worksheet: ExcelJS.Worksheet,
  columnWidths: number[],
  align: "center" | "left" = "center",
): BannerPlacement {
  const tableWidthPx = columnWidths.reduce((sum, w) => sum + colWidthPx(w), 0);
  const maxWidthPx = Math.round(
    (MAX_BANNER_HEIGHT_PX * BANNER_SOURCE_PX.width) / BANNER_SOURCE_PX.height,
  );
  const widthPx = Math.min(maxWidthPx, tableWidthPx);
  const heightPx = Math.round((widthPx * BANNER_SOURCE_PX.height) / BANNER_SOURCE_PX.width);
  const leftPx =
    align === "left" ? 0 : Math.max(0, Math.round((tableWidthPx - widthPx) / 2));

  // Filas 1-2 = alto del banner (px → pt = px * 0.75).
  const totalPt = heightPx * 0.75;
  const row2Pt = Math.min(27, totalPt * 0.2);
  worksheet.getRow(1).height = totalPt - row2Pt;
  worksheet.getRow(2).height = row2Pt;

  const imageId = workbook.addImage({ filename: BANNER_PATH, extension: "jpeg" });
  // Anclaje de dos celdas: la imagen termina exactamente al final de la fila 2.
  worksheet.addImage(imageId, {
    tl: pxToAnchor(leftPx, 0, columnWidths),
    br: pxToAnchor(leftPx + widthPx, BANNER_ROWS, columnWidths),
    editAs: "oneCell",
  });

  return { leftPx, widthPx, heightPx };
}

// exceljs escribe el bloque <a:xfrm> de la imagen con tamaño 0x0. Excel lo
// ignora y usa el ancla, pero otros visores (vista previa de macOS, etc.) no
// dibujan la imagen; se rellena con la posición y tamaño reales. Debe
// llamarse con el buffer del libro ya generado.
export async function applyBannerSize(
  buffer: Buffer,
  { leftPx, widthPx, heightPx }: BannerPlacement,
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);
  const drawingPath = "xl/drawings/drawing1.xml";
  const drawing = zip.file(drawingPath);
  if (!drawing) return buffer;

  const xml = (await drawing.async("string")).replace(
    /<a:xfrm>.*?<\/a:xfrm>/,
    `<a:xfrm><a:off x="${leftPx * EMU_PER_PX}" y="0"/>` +
      `<a:ext cx="${widthPx * EMU_PER_PX}" cy="${heightPx * EMU_PER_PX}"/></a:xfrm>`,
  );

  zip.file(drawingPath, xml);
  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
