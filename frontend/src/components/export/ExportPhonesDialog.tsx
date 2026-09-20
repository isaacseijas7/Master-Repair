import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { phoneService } from "@/services/phone.service";
import { useBrandStore } from "@/stores/brand.store";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ExportPhonesDialogProps {
  // Marca filtrada en el listado; si existe, llega preseleccionada.
  currentBrandId?: string;
}

// Solo las marcas con teléfonos aportan filas al archivo.
export function ExportPhonesDialog({ currentBrandId }: ExportPhonesDialogProps) {
  const { allBrands, fetchAllBrands } = useBrandStore();
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [isExporting, setIsExporting] = useState(false);

  const exportableBrands = allBrands.filter((b) => (b.phoneCount ?? 0) > 0);
  const allSelected =
    exportableBrands.length > 0 && selected.length === exportableBrands.length;
  const selectedPhones = exportableBrands
    .filter((b) => selected.includes(b._id))
    .reduce((sum, b) => sum + (b.phoneCount ?? 0), 0);

  const handleOpenChange = async (next: boolean) => {
    setOpen(next);
    if (!next) return;
    // Refresca los conteos por si se agregaron o eliminaron teléfonos.
    await fetchAllBrands();
    const brands = useBrandStore.getState().allBrands;
    const withPhones = brands.filter((b) => (b.phoneCount ?? 0) > 0);
    const preselected = withPhones.find((b) => b._id === currentBrandId);
    setSelected(
      preselected ? [preselected._id] : withPhones.map((b) => b._id),
    );
  };

  const toggleBrand = (id: string) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const toggleAll = () =>
    setSelected(allSelected ? [] : exportableBrands.map((b) => b._id));

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Todas las marcas seleccionadas equivale a no filtrar.
      await phoneService.exportToExcel(allSelected ? [] : selected);
      toast.success(`Excel generado con ${selectedPhones} teléfonos`);
      setOpen(false);
    } catch (error) {
      toast.error("Error al generar el archivo Excel");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Exportar catálogo a Excel
          </DialogTitle>
          <DialogDescription>
            Selecciona las marcas que quieres incluir en el archivo.
          </DialogDescription>
        </DialogHeader>

        {exportableBrands.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            No hay teléfonos registrados para exportar.
          </p>
        ) : (
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2 border-b pb-3">
              <Checkbox
                id="export-all-brands"
                checked={allSelected}
                onCheckedChange={toggleAll}
              />
              <Label
                htmlFor="export-all-brands"
                className="cursor-pointer font-medium"
              >
                Todas las marcas
              </Label>
            </div>
            <div className="max-h-64 space-y-3 overflow-y-auto">
              {exportableBrands.map((brand) => (
                <div key={brand._id} className="flex items-center gap-2">
                  <Checkbox
                    id={`export-brand-${brand._id}`}
                    checked={selected.includes(brand._id)}
                    onCheckedChange={() => toggleBrand(brand._id)}
                  />
                  <Label
                    htmlFor={`export-brand-${brand._id}`}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {brand.name}
                  </Label>
                  <span className="text-xs text-gray-500">
                    {brand.phoneCount}{" "}
                    {brand.phoneCount === 1 ? "teléfono" : "teléfonos"}
                  </span>
                </div>
              ))}
            </div>
            {selected.length === 0 && (
              <p className="text-center text-sm text-red-500">
                Selecciona al menos una marca para continuar
              </p>
            )}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isExporting}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting || selected.length === 0}
            className="gap-2 bg-green-600 hover:bg-green-700"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Descargar Excel
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
