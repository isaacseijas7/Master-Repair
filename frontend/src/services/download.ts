import { saveAs } from "file-saver";
import apiClient from "./api.service";

const XLSX_MIME =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

// Descarga un .xlsx generado por el backend (GET) y lo guarda con el
// nombre indicado más la fecha del día.
export async function downloadExcel(
  path: string,
  filenamePrefix: string,
): Promise<void> {
  const response = await apiClient.get(path, {
    responseType: "blob",
    headers: { Accept: XLSX_MIME },
  });

  const blob = new Blob([response.data], { type: XLSX_MIME });
  const timestamp = new Date().toISOString().split("T")[0];
  saveAs(blob, `${filenamePrefix}-${timestamp}.xlsx`);
}
