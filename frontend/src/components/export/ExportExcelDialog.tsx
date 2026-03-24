import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { productService } from "@/services/product.service";
import type { ProductFilters } from "@/types";
import { toast } from "sonner";

interface ExportExcelDialogProps {
  filters: ProductFilters;
  totalCount: number;
}

const AVAILABLE_COLUMNS = [
  { id: "sku", label: "SKU", default: true },
  { id: "name", label: "Nombre del Producto", default: true },
  { id: "category", label: "Categoría", default: true },
  { id: "description", label: "Descripción", default: false },
  { id: "unitPrice", label: "Precio Unitario", default: true },
//   { id: "wholesalePrice", label: "Precio Mayorista", default: false },
  { id: "stock", label: "Stock Actual", default: true },
  { id: "minStock", label: "Stock Mínimo", default: false },
//   { id: "maxStock", label: "Stock Máximo", default: false },
  { id: "supplier", label: "Proveedor", default: false },
//   { id: "location", label: "Ubicación", default: false },
//   { id: "barcode", label: "Código de Barras", default: false },
  { id: "isActive", label: "Estado (Activo/Inactivo)", default: true },
  { id: "createdAt", label: "Fecha de Creación", default: false },
];

export function ExportExcelDialog({
  filters,
  totalCount,
}: ExportExcelDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    AVAILABLE_COLUMNS.filter((col) => col.default).map((col) => col.id),
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleToggleColumn = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId],
    );
  };

  const handleSelectAll = () => {
    setSelectedColumns(AVAILABLE_COLUMNS.map((col) => col.id));
  };

  const handleDeselectAll = () => {
    setSelectedColumns([]);
  };

  const handleExport = async () => {
    if (selectedColumns.length === 0) {
      toast.error("Debes seleccionar al menos una columna");
      return;
    }

    if (totalCount === 0) {
      toast.error("No hay productos para exportar con los filtros actuales");
      return;
    }

    setIsExporting(true);
    try {
      // Preparar filtros (excluir paginación)
      const exportFilters = {
        search: filters.search,
        category: filters.category,
        supplier: filters.supplier,
        isActive: filters.isActive,
        minPrice: filters.minPrice,
        maxPrice: filters.maxPrice,
        minStock: filters.minStock,
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
      };

      await productService.exportToExcel(exportFilters, selectedColumns);
      toast.success(`Excel generado con ${totalCount} productos`);
      setOpen(false);
    } catch (error) {
      toast.error("Error al generar el archivo Excel");
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileSpreadsheet className="w-4 h-4" />
          Exportar Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-green-600" />
            Exportar Productos a Excel
          </DialogTitle>
          <DialogDescription>
            Se exportarán <strong>{totalCount}</strong> productos que coinciden
            con los filtros actuales
            {filters.category && " (filtrado por categoría seleccionada)"}.
            Selecciona las columnas que deseas incluir:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex justify-between items-center pb-2 border-b">
            <span className="text-sm font-medium text-gray-700">
              Columnas disponibles
            </span>
            <div className="space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                type="button"
              >
                Seleccionar todo
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDeselectAll}
                type="button"
              >
                Quitar todo
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {AVAILABLE_COLUMNS.map((column) => (
              <div key={column.id} className="flex items-start space-x-2">
                <Checkbox
                  id={column.id}
                  checked={selectedColumns.includes(column.id)}
                  onCheckedChange={() => handleToggleColumn(column.id)}
                />
                <Label
                  htmlFor={column.id}
                  className="text-sm font-normal cursor-pointer leading-tight"
                >
                  {column.label}
                </Label>
              </div>
            ))}
          </div>

          {selectedColumns.length === 0 && (
            <p className="text-sm text-red-500 text-center">
              Selecciona al menos una columna para continuar
            </p>
          )}
        </div>

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
            disabled={isExporting || selectedColumns.length === 0}
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
