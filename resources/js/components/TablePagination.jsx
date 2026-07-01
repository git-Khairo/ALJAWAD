import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Pagination bar for data tables.
 *
 * Props:
 *   page        {number}   - Current page (1-based)
 *   totalPages  {number}
 *   from        {number}   - First row index on this page (1-based)
 *   to          {number}   - Last row index on this page
 *   total       {number}   - Total row count
 *   onPage      {fn}       - Called with the new page number
 *   labelAr     {string?}  - Singular label in Arabic  (default "سجل")
 *   labelEn     {string?}  - Singular label in English (default "record")
 *   language    {string?}  - "ar" | "en" (default "en")
 */
export default function TablePagination({
  page,
  totalPages,
  from,
  to,
  total,
  onPage,
  labelAr  = 'سجل',
  labelEn  = 'record',
  language = 'en',
}) {
  if (totalPages <= 1 && total === 0) return null;

  const l = (ar, en) => language === 'ar' ? ar : en;

  // Build page window: always show first, last, current±1, with ellipsis gaps.
  const pages = [];
  const window = new Set([1, totalPages, page, page - 1, page + 1].filter(n => n >= 1 && n <= totalPages));
  const sorted = [...window].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i] - sorted[i - 1] > 1) pages.push('…');
    pages.push(sorted[i]);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 pb-1 text-sm text-muted-foreground border-t border-border/40 mt-2">
      {/* Row count */}
      <span>
        {total === 0
          ? l('لا توجد نتائج', 'No results')
          : l(
              `${from}–${to} من ${total} ${labelAr}`,
              `${from}–${to} of ${total} ${labelEn}${total !== 1 ? 's' : ''}`,
            )}
      </span>

      {/* Page buttons */}
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPage(page - 1)}
            disabled={page === 1}
            className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={l('السابق', 'Previous')}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          {pages.map((p, i) =>
            p === '…' ? (
              <span key={`e${i}`} className="px-1">…</span>
            ) : (
              <button
                key={p}
                onClick={() => onPage(p)}
                className={`min-w-[32px] h-8 px-2 rounded-md text-sm font-medium transition-colors ${
                  p === page
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() => onPage(page + 1)}
            disabled={page === totalPages}
            className="p-1.5 rounded-md hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            aria-label={l('التالي', 'Next')}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}
