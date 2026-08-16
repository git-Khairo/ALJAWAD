import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A figure and its label.
 *
 * Deliberately not a card: these appear in rows of three or four, and four
 * boxed, glowing, hover-lifting tiles is the hero-metric template. Here they
 * share one ruled grid, so the numbers line up and the row reads as a single
 * statement rather than four competing objects.
 *
 * The number is not animated. A count-up on a figure that is already correct
 * costs a render loop and makes the value unreadable for its first second,
 * which is exactly when someone is trying to read it.
 */
export const KPICard = ({ title, value, icon, change, prefix = '', suffix = '', hint, className }) => {
  const positive = typeof change === 'string' && change.trim().startsWith('+');
  const negative = typeof change === 'string' && change.trim().startsWith('-');

  // Bordered on its own, because the admin pages that have not been rebuilt
  // yet drop these straight into a `gap-4` grid and need a self-contained
  // surface. KPIRow strips the border back off to draw shared hairlines.
  return (
    <div className={cn('border border-rule bg-background p-5', className)}>
      <div className="flex items-center gap-2 text-fg-muted">
        {icon && <span className="shrink-0 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>}
        <p className="text-xs font-medium uppercase tracking-[0.08em]">{title}</p>
      </div>

      <p className="ledger-num mt-3 text-2xl text-foreground md:text-3xl" dir="ltr">
        {prefix}{value}{suffix}
      </p>

      {(change || hint) && (
        <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
          {change && (
            <span
              className={cn(
                'ledger-num inline-flex items-center gap-0.5 text-xs',
                positive ? 'text-chart-up' : negative ? 'text-chart-down' : 'text-fg-muted',
              )}
              dir="ltr"
            >
              {positive && <ArrowUpRight className="h-3 w-3" aria-hidden="true" />}
              {negative && <ArrowDownRight className="h-3 w-3" aria-hidden="true" />}
              {change}
            </span>
          )}
          {hint && <span className="text-xs text-fg-faint">{hint}</span>}
        </div>
      )}
    </div>
  );
};

/**
 * Turns a set of KPICards into one ruled grid: the children lose their own
 * borders and the gap-px over a rule-coloured ground draws the hairlines
 * between them instead, so the row reads as a single object.
 */
export const KPIRow = ({ children, className }) => (
  <div
    className={cn(
      'grid gap-px border border-rule bg-rule [&>*]:border-0',
      'sm:grid-cols-2 lg:grid-cols-4',
      className,
    )}
  >
    {children}
  </div>
);

export default KPICard;
