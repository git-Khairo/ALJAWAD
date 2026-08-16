import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Live quotes, set as a ledger.
 *
 * Prices are always LTR and always tabular mono, so decimal points stack down
 * the column and a rising digit never reflows the row. In Arabic the labels
 * flip but the numerals do not, which is how prices are actually read here.
 */

/** Forex needs four places, indices need none. Match the instrument. */
export const fmtPrice = (p) => {
  if (typeof p !== 'number' || Number.isNaN(p)) return '—';
  if (p >= 1000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 100) return p.toFixed(2);
  return p.toFixed(4);
};

export const fmtChange = (c) => `${c >= 0 ? '+' : '−'}${Math.abs(c).toFixed(2)}%`;

/* ── The hero ledger ─────────────────────────────────────────────────── */

export function MarketLedger({ quotes, isLoading, limit = 6, className = '' }) {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const rows = (quotes ?? []).slice(0, limit);
  const anyOpen = rows.some((r) => r.is_market_open ?? true);

  return (
    <div className={`border border-rule bg-surface-raised ${className}`}>
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <span className="eyebrow">{l('السوق الآن', 'Market now')}</span>
        <span className="inline-flex items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.12em] text-fg-muted">
          <span
            className={`h-1.5 w-1.5 rounded-full ${anyOpen ? 'animate-pulse-glow bg-chart-up' : 'bg-fg-faint'}`}
            aria-hidden="true"
          />
          {anyOpen ? l('مفتوح', 'Open') : l('مغلق', 'Closed')}
        </span>
      </div>

      {isLoading && rows.length === 0 ? (
        <div className="divide-y divide-rule">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-3.5 w-28" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-fg-faint">
          {l('تعذّر جلب الأسعار الآن.', 'Quotes are unavailable right now.')}
        </p>
      ) : (
        <ul className="divide-y divide-rule">
          {rows.map((q) => {
            const up = q.change >= 0;
            const closed = !(q.is_market_open ?? true);
            return (
              <li key={q.symbol} className="flex items-baseline gap-3 px-4 py-3">
                <span className="font-mono text-sm font-medium text-foreground" dir="ltr">
                  {q.symbol}
                </span>
                {closed && (
                  <span className="text-[0.625rem] uppercase text-fg-faint">
                    {l('مغلق', 'closed')}
                  </span>
                )}
                <span className="ms-auto ledger-num text-sm text-foreground" dir="ltr">
                  {fmtPrice(q.price)}
                </span>
                <span
                  className={`inline-flex w-[4.75rem] items-center justify-end gap-0.5 ledger-num text-sm ${
                    up ? 'text-chart-up' : 'text-chart-down'
                  }`}
                  dir="ltr"
                >
                  {up ? (
                    <ArrowUpRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  ) : (
                    <ArrowDownRight className="h-3 w-3 shrink-0" aria-hidden="true" />
                  )}
                  {fmtChange(q.change)}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <p className="border-t border-rule px-4 py-2.5 text-[0.6875rem] leading-relaxed text-fg-faint">
        {l(
          'أسعار إرشادية تُحدَّث كل دقيقة، وليست عروض تنفيذ.',
          'Indicative prices, refreshed each minute. Not executable quotes.',
        )}
      </p>
    </div>
  );
}

/* ── The running tape ────────────────────────────────────────────────── */

export function MarketTape({ quotes }) {
  const { language } = useLanguage();
  const rows = quotes ?? [];
  if (rows.length === 0) return null;

  // Duplicated once so the -50% translate loops seamlessly.
  const doubled = [...rows, ...rows];

  return (
    <section
      className="overflow-hidden border-y border-rule bg-surface-sunken py-2.5"
      aria-label={language === 'ar' ? 'شريط الأسعار' : 'Price tape'}
    >
      <div
        className={`mask-fade-x flex w-max whitespace-nowrap ${
          language === 'ar' ? 'animate-ticker-rtl' : 'animate-ticker'
        }`}
        dir="ltr"
      >
        {doubled.map((q, i) => (
          <span key={i} className="inline-flex items-baseline gap-2.5 px-5 font-mono text-xs">
            <span className="text-fg-muted">{q.symbol}</span>
            <span className="tabular-nums text-foreground">{fmtPrice(q.price)}</span>
            <span className={`tabular-nums ${q.change >= 0 ? 'text-chart-up' : 'text-chart-down'}`}>
              {fmtChange(q.change)}
            </span>
            <span className="text-rule-strong" aria-hidden="true">/</span>
          </span>
        ))}
      </div>
    </section>
  );
}
