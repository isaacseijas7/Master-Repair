import { useDebounce } from "@/hooks/useDebounce";
import { useStoreErrorToast } from "@/hooks/useStoreErrorToast";
import { useAuthStore } from "@/stores/auth.store";
import { useCategoryStore } from "@/stores/category.store";
import { useProductStore } from "@/stores/product.store";
import { useEffect, useState } from "react";
import { ProductFilters } from "./components/ProductFilters";
import { ProductsHeader } from "./components/ProductsHeader";
import { Pagination } from "../../components/Pagination";
import { ProductsTable } from "./components/ProductsTable";

export function Products() {
  const {
    products,
    pagination,
    isLoading,
    error,
    fetchProducts,
    deleteProduct,
    filters,
    setFilters,
    clearError,
  } = useProductStore();

  useStoreErrorToast(error, clearError);

  const { user } = useAuthStore();
  // El backend ya exige admin/manager para crear, editar, eliminar y
  // exportar productos (product.routes.ts); igual que en Categorías,
  // Proveedores y Clientes, el frontend antes mostraba estas acciones a
  // cualquier rol autenticado (ej. Cashier), que luego recibía un 403.
  const canManage = user?.role === "admin" || user?.role === "manager";

  const { activeCategories, fetchActiveCategories } = useCategoryStore();

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 500);

  // Efectos
  useEffect(() => {
    fetchActiveCategories();
  }, [fetchActiveCategories]);

  useEffect(() => {
    fetchProducts({ ...filters, search: debouncedSearch });
  }, [debouncedSearch, filters, fetchProducts]);

  // Handlers
  const handlePageChange = (page: number) => {
    fetchProducts({ ...filters, page });
  };

  // Nuevo handler para cambiar el límite. Antes también llamaba a
  // fetchProducts directamente además de setFilters, y como el efecto de
  // arriba ya reacciona a cambios en `filters`, cada cambio de límite
  // disparaba dos peticiones idénticas.
  const handleLimitChange = (limit: number) => {
    setFilters({ limit, page: 1 });
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar este producto?")) {
      await deleteProduct(id);
    }
  };

  const handleCategoryChange = (categoryId: string | undefined) => {
    setFilters({ category: categoryId });
  };

  const handleStatusChange = (status: boolean | undefined) => {
    setFilters({ isActive: status });
  };

  return (
    <div className="space-y-6">
      <ProductsHeader
        filters={filters}
        totalCount={pagination.total}
        canManage={canManage}
      />

      <ProductFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedCategory={filters.category}
        onCategoryChange={handleCategoryChange}
        isActive={filters.isActive}
        onStatusChange={handleStatusChange}
        categories={activeCategories}
      />

      <div className="space-y-4">
        <ProductsTable
          products={products}
          isLoading={isLoading}
          onDelete={handleDelete}
          canManage={canManage}
        />

        <Pagination
          pagination={pagination}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </div>
  );
}
