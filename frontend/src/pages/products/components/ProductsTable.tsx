import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Edit, Package, Trash2 } from "lucide-react";
import { ProductRow } from "./ProductRow";
import { ProductSkeleton } from "./ProductSkeleton";
import { useNavigate } from "react-router-dom";

interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  category?: any;
  unitPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
}

interface ProductsTableProps {
  products: Product[];
  isLoading: boolean;
  onDelete: (id: string) => void;
}

export function ProductsTable({
  products,
  isLoading,
  onDelete,
}: ProductsTableProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent className="p-0">
        <div className="space-y-3 p-4 md:hidden">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="rounded-2xl border border-gray-200 p-4">
                  <div className="h-5 w-2/3 animate-pulse rounded bg-gray-200" />
                  <div className="mt-3 h-4 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="py-8 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No se encontraron productos</p>
            </div>
          ) : (
            products.map((product) => {
              const category = typeof product.category === "object" ? product.category : null;
              const isLowStock = product.stock <= product.minStock;

              return (
                <article key={product._id} className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate text-base font-semibold text-gray-900">{product.name}</h3>
                      <p className="mt-1 text-xs text-gray-500">SKU: {product.sku}</p>
                    </div>
                    <Badge
                      variant={product.isActive ? "default" : "secondary"}
                      className={product.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "bg-gray-100 text-gray-700"}
                    >
                      {product.isActive ? "Activo" : "Inactivo"}
                    </Badge>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Precio</p>
                      <p className="mt-1 font-semibold text-gray-900">{formatCurrency(product.unitPrice)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 p-3">
                      <p className="text-xs uppercase tracking-wide text-gray-500">Stock</p>
                      <p className="mt-1 flex items-center gap-2 font-semibold text-gray-900">
                        {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                        <span className={isLowStock ? "text-amber-600" : ""}>{product.stock} uds.</span>
                      </p>
                    </div>
                  </div>

                  {category && (
                    <div className="mt-3">
                      <Badge
                        style={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                          borderColor: category.color,
                        }}
                        variant="outline"
                      >
                        {category.name}
                      </Badge>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1" variant="outline" onClick={() => navigate(`/products/${product._id}`)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                    <Button className="flex-1" variant="destructive" onClick={() => onDelete(product._id)}>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Producto</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead className="text-right">Precio</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <ProductSkeleton />
              ) : products.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron productos</p>
                  </TableCell>
                </TableRow>
              ) : (
                products.map((product) => (
                  <ProductRow
                    key={product._id}
                    product={product}
                    onDelete={onDelete}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
