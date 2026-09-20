export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Los query params llegan como string; normaliza page/limit a enteros
// positivos con un tope para no traer colecciones enteras por accidente.
export function parsePagination(
  rawPage: unknown,
  rawLimit: unknown,
): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(String(rawPage ?? 1), 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(String(rawLimit ?? 10), 10) || 10),
  );
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPagination(page: number, limit: number, total: number) {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}
