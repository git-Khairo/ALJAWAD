import { cn } from '@/lib/utils';

/**
 * Masthead for a section band.
 *
 * Left-aligned by default and deliberately not centred: centred eyebrow +
 * heading + subheading stacked in the middle of the viewport is the single
 * most recognisable marketing-page reflex there is. Pass `align="split"` to
 * hang the heading opposite its supporting copy across the measure.
 */
export function SectionHead({ eyebrow, title, children, align = 'start', className, id }) {
  if (align === 'split') {
    return (
      <div className={cn('grid gap-6 md:grid-cols-12 md:gap-10', className)}>
        <div className="md:col-span-7">
          {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
          <h2 id={id} className="font-display text-display-sm md:text-display-md text-foreground">
            {title}
          </h2>
        </div>
        {children && (
          <div className="self-end md:col-span-4 md:col-start-9">
            <p className="text-base leading-relaxed text-fg-muted">{children}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && <p className="eyebrow mb-4">{eyebrow}</p>}
      <h2 id={id} className="font-display text-display-sm md:text-display-md text-foreground">
        {title}
      </h2>
      {children && (
        <p className="measure mt-4 text-base leading-relaxed text-fg-muted">{children}</p>
      )}
    </div>
  );
}

export default SectionHead;
