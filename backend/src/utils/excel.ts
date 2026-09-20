import ExcelJS from "exceljs";

export interface SheetColumn {
  header: string;
  key: string;
  width: number;
  numFmt?: string;
}

export const USD_FORMAT = '"$"#,##0.00';
export const DATE_FORMAT = "dd/mm/yyyy hh:mm";

// Genera un .xlsx de una sola hoja con encabezado resaltado, primera fila
// congelada y autofiltro.
export async function buildWorkbookBuffer(
  sheetName: string,
  columns: SheetColumn[],
  rows: Record<string, unknown>[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sheetName);

  worksheet.columns = columns.map(({ header, key, width, numFmt }) => ({
    header,
    key,
    width,
    ...(numFmt ? { style: { numFmt } } : {}),
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, size: 12 };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFE0E0E0" },
  };

  rows.forEach((row) => worksheet.addRow(row));

  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: columns.length },
  };
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
