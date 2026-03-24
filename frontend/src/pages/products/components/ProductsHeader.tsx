import { ExportExcelDialog } from "@/components/export/ExportExcelDialog";
import { Button } from "@/components/ui/button";
import type { ProductFilters } from "@/types";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductsHeaderProps {
  filters: ProductFilters;
  totalCount: number;
}

export function ProductsHeader({ filters, totalCount }: ProductsHeaderProps) {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <p className="text-gray-500">Gestiona tu inventario de productos</p>
      </div>
      <div>
        <ExportExcelDialog filters={filters} totalCount={totalCount} />
        <Button className="ml-6" onClick={() => navigate("/products/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Producto
        </Button>
      </div>
    </div>
  );
}
