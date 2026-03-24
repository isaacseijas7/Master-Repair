import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProductsHeader() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
        <p className="text-gray-500">Gestiona tu inventario de productos</p>
      </div>
      <Button onClick={() => navigate("/products/new")}>
        <Plus className="w-4 h-4 mr-2" />
        Nuevo Producto
      </Button>
    </div>
  );
}
