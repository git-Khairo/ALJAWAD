import { cn } from '@/lib/utils';

/**
 * Standard head for a dashboard page: title, optional one-line explanation,
 * optional actions, and a rule closing it off. Every page uses this so the
 * top of the content column lands in the same place on every route.
 */
export function PageHeader({ title, description, actions, className }) {
  return (
    <div className={cn('mb-8 border-b border-rule pb-5', className)}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          {description && (
            <p className="measure mt-1.5 text-sm leading-relaxed text-fg-muted">{description}</p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export default PageHeader;
