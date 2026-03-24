import { useDebounce } from "@/hooks/useDebounce";
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
    fetchProducts,
    deleteProduct,
    filters,
    setFilters,
  } = useProductStore();

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

  // Nuevo handler para cambiar el límite
  const handleLimitChange = (limit: number) => {
    setFilters({ limit, page: 1 }); // Resetear a página 1 al cambiar el límite
    fetchProducts({ ...filters, limit, page: 1, search: debouncedSearch });
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
      <ProductsHeader />

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
