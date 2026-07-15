import { Card, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, Search } from "lucide-react";

interface Category {
  _id: string;
  name: string;
}

interface ProductFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedCategory: string | undefined;
  onCategoryChange: (categoryId: string | undefined) => void;
  isActive: boolean | undefined;
  onStatusChange: (status: boolean | undefined) => void;
  categories: Category[];
}

export function ProductFilters({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  isActive,
  onStatusChange,
  categories,
}: ProductFiltersProps) {
  const filtersContent = (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Buscar por nombre, SKU o descripción..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      <Select
        value={selectedCategory || "all"}
        onValueChange={(value) =>
          onCategoryChange(value === "all" ? undefined : value)
        }
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Todas las categorías" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas las categorías</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat._id} value={cat._id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={
          isActive === undefined ? "all" : isActive ? "active" : "inactive"
        }
        onValueChange={(value) =>
          onStatusChange(value === "all" ? undefined : value === "active")
        }
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Estado" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todos</SelectItem>
          <SelectItem value="active">Activos</SelectItem>
          <SelectItem value="inactive">Inactivos</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <>
      <Card className="sm:hidden">
        <CardContent className="flex items-center gap-3 p-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar productos..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
          <Drawer>
            <DrawerTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir filtros de productos">
                <Filter className="h-4 w-4" />
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filtrar productos</DrawerTitle>
                <DrawerDescription>Acota la lista por categoría y estado.</DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-6">{filtersContent}</div>
            </DrawerContent>
          </Drawer>
        </CardContent>
      </Card>

      <Card className="hidden sm:block">
        <CardContent className="p-4">{filtersContent}</CardContent>
      </Card>
    </>
  );
}
