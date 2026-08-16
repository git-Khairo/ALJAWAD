import { cn } from '@/lib/utils';

/**
 * The composed empty state for the whole site.
 *
 * An empty state's job is to say what would be here and how to make it
 * appear, so it always takes an action when one exists. Deliberately not a
 * card: a hairline rule and space, matching everything else.
 */
export function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center border border-dashed border-rule-strong px-6 py-16 text-center',
        className,
      )}
    >
      {Icon && (
        <Icon className="mb-4 h-6 w-6 text-fg-faint" strokeWidth={1.5} aria-hidden="true" />
      )}
      <p className="font-display text-display-xs text-foreground">{title}</p>
      {description && (
        <p className="measure-narrow mt-2 text-sm leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export default EmptyState;
