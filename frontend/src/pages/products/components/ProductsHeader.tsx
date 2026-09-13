import { ExportExcelDialog } from "@/components/export/ExportExcelDialog";
import { Button } from "@/components/ui/button";
import type { ProductFilters } from "@/types";
import { productsOverviewGuide } from "@/lib/tour/guides/products.guides";
import { useTourRunner } from "@/lib/tour/useTourRunner";
import { CircleHelp, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProductsHeaderProps {
  filters: ProductFilters;
  totalCount: number;
  canManage: boolean;
}

export function ProductsHeader({
  filters,
  totalCount,
  canManage,
}: ProductsHeaderProps) {
  const navigate = useNavigate();
  const { startTour } = useTourRunner();

  return (
    <div
      data-tour="products.page-title"
      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
    >
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <button
            type="button"
            onClick={() => startTour(productsOverviewGuide)}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Ver recorrido de esta pantalla"
          >
            <CircleHelp className="w-4 h-4" />
          </button>
        </div>
        <p className="text-gray-500">Gestiona tu inventario de productos</p>
      </div>
      {canManage && (
        <div>
          <ExportExcelDialog filters={filters} totalCount={totalCount} />
          <Button
            data-tour="products.create-button"
            className="ml-6"
            onClick={() => navigate("/products/new")}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      )}
    </div>
  );
}
