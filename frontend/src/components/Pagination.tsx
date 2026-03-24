import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  onLimitChange?: (limit: number) => void;
}

const LIMIT_OPTIONS = [10, 20, 30, 40, 50, 100];

export function Pagination({
  pagination,
  onPageChange,
  onLimitChange,
}: PaginationProps) {
  if (pagination.totalPages <= 1 && pagination.total <= 10) return null;

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  const handleLimitChange = (value: string) => {
    const newLimit = parseInt(value, 10);
    onLimitChange?.(newLimit);
  };

  return (
    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-200">
      <div className="flex items-center gap-4">
        <p className="text-sm text-gray-500">
          Mostrando {startItem} a {endItem} de {pagination.total}
        </p>
        
        {/* Selector de resultados por página */}
        {onLimitChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Resultados por página:</span>
            <Select
              value={pagination.limit.toString()}
              onValueChange={handleLimitChange}
            >
              <SelectTrigger className="w-20 h-8 text-sm">
                <SelectValue placeholder={pagination.limit.toString()} />
              </SelectTrigger>
              <SelectContent>
                {LIMIT_OPTIONS.map((limit) => (
                  <SelectItem key={limit} value={limit.toString()}>
                    {limit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

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