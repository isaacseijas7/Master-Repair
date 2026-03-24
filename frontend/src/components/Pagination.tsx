import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface PaginationProps {
  pagination: Pagination;
  onPageChange: (page: number) => void;
}

export function Pagination({
  pagination,
  onPageChange,
}: PaginationProps) {
  if (pagination.totalPages <= 1) return null;

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
      <p className="text-sm text-gray-500">
        Mostrando {startItem} a {endItem} de {pagination.total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Number(pagination.page) - 1)}
          disabled={!pagination.hasPrev}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-600">
          Página {pagination.page} de {pagination.totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Number(pagination.page) + 1)}
          disabled={!pagination.hasNext}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
