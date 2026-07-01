import { useState, useEffect } from 'react';

/**
 * Client-side pagination helper.
 *
 * @param {Array}  data      - The full filtered dataset
 * @param {number} pageSize  - Rows per page (default 15)
 * @param {*}      resetKey  - When this value changes, page resets to 1
 *                             Pass the filter/search string so page resets on each new query.
 *
 * @returns {{ page, setPage, paginated, totalPages, from, to, total }}
 */
export function usePagination(data, pageSize = 15, resetKey) {
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the dataset or filters change.
  useEffect(() => {
    setPage(1);
  }, [resetKey, data.length]);

  const total      = data.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage   = Math.min(page, totalPages);
  const from       = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to         = Math.min(safePage * pageSize, total);
  const paginated  = data.slice((safePage - 1) * pageSize, safePage * pageSize);

  return { page: safePage, setPage, paginated, totalPages, from, to, total };
}
