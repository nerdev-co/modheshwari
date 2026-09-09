/**
 * Pagination utilities
 */

export interface PaginationParams {
  page?: number | string | null;
  limit?: number | string | null;
  skip?: number;
  take?: number;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

/**
 * Parse and validate pagination parameters
 */
export function parsePagination(
  params: PaginationParams,
  defaultLimit = 20,
  maxLimit = 100,
): { skip: number; take: number; page: number; limit: number } {
  let page =
    typeof params.page === "string"
      ? parseInt(params.page, 10)
      : params.page || 1;
  let limit =
    typeof params.limit === "string"
      ? parseInt(params.limit, 10)
      : params.limit || defaultLimit;

  // Validate page
  if (!Number.isFinite(page) || page < 1) page = 1;

  // Validate limit
  if (!Number.isFinite(limit) || limit < 1) limit = defaultLimit;
  if (limit > maxLimit) limit = maxLimit;

  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
}

/**
 * Build pagination response
 */
export function buildPaginationResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginationResponse<T> {
  const totalPages = Math.ceil(total / limit);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}
