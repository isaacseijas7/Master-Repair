import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TableCell, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, Edit, MoreHorizontal, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Category {
  _id: string;
  name: string;
  color: string;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  sku: string;
  category?: Category | string;
  unitPrice: number;
  stock: number;
  minStock: number;
  isActive: boolean;
}

interface ProductRowProps {
  product: Product;
  onDelete: (id: string) => void;
}

export function ProductRow({ product, onDelete }: ProductRowProps) {
  const navigate = useNavigate();

  const isLowStock = product.stock <= product.minStock;
  const category =
    typeof product.category === "object" ? product.category : null;

  return (
    <TableRow className="hover:bg-gray-50">
      <TableCell>
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          {product.description && (
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {product.description}
            </p>
          )}
        </div>
      </TableCell>

      <TableCell>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">
          {product.sku}
        </code>
      </TableCell>

      <TableCell>
        {category ? (
          <Badge
            style={{
              backgroundColor: category.color + "20",
              color: category.color,
              borderColor: category.color,
            }}
            variant="outline"
          >
            {category.name}
          </Badge>
        ) : (
          "-"
        )}
      </TableCell>

      <TableCell className="text-right font-medium">
        {formatCurrency(product.unitPrice)}
      </TableCell>

      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-2">
          {isLowStock && <AlertTriangle className="w-4 h-4 text-amber-500" />}
          <span className={isLowStock ? "text-amber-600 font-medium" : ""}>
            {product.stock}
          </span>
        </div>
      </TableCell>

      <TableCell>
        <Badge
          variant={product.isActive ? "default" : "secondary"}
          className={
            product.isActive
              ? "bg-green-100 text-green-800 hover:bg-green-100"
              : "bg-gray-100 text-gray-800"
          }
        >
          {product.isActive ? "Activo" : "Inactivo"}
        </Badge>
      </TableCell>

      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => navigate(`/products/${product._id}`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(product._id)}
              className="text-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
