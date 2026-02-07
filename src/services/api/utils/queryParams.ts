/**
 * Query parameter utilities for API requests
 */

/**
 * Build a query string from an object of parameters
 * Filters out undefined and null values
 */
export const buildQueryString = (params: Record<string, string | number | boolean | undefined | null>): string => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
};

/**
 * Append query string to endpoint if params exist
 */
export const appendQueryParams = (
  endpoint: string,
  params: Record<string, string | number | boolean | undefined | null>
): string => {
  const queryString = buildQueryString(params);
  return `${endpoint}${queryString}`;
};
