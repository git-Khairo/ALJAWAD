import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { HorseMark } from './HorseMark';
import { cn } from '@/lib/utils';

/**
 * The masthead lockup: mark, name, descriptor.
 *
 * The supplied logo.png sets the name in white, which disappears against
 * paper, so the name is typeset here instead. That also makes the lockup
 * resolution-independent, themeable, bilingual, and about 40kB lighter than
 * the raster it replaces.
 *
 * The descriptor is mono and tracked in Latin, and sans and untracked in
 * Arabic, because tracking breaks the cursive joins.
 */
const SIZES = {
  sm: { mark: 'h-7 w-7',   name: 'text-xl',        desc: 'text-[0.5625rem]', gap: 'gap-2.5' },
  md: { mark: 'h-9 w-9',   name: 'text-2xl',       desc: 'text-[0.625rem]',  gap: 'gap-3'   },
  lg: { mark: 'h-14 w-14', name: 'text-display-xs',desc: 'text-[0.6875rem]', gap: 'gap-4'   },
};

export function Wordmark({ size = 'sm', to = '/', className, asLink = true, showDescriptor = true }) {
  const { language } = useLanguage();
  const s = SIZES[size] ?? SIZES.sm;
  const isAr = language === 'ar';

  const inner = (
    <span className={cn('inline-flex items-center', s.gap, className)}>
      <HorseMark className={cn(s.mark, 'shrink-0 text-brand')} />
      <span className="flex flex-col leading-none">
        <span className={cn('font-display text-foreground', s.name)}>
          {isAr ? 'الجواد' : 'AlJawad'}
        </span>
        {showDescriptor && (
          <span
            className={cn(
              'mt-1 font-medium text-fg-faint',
              s.desc,
              // Latin can take the tracking; Arabic cannot without breaking
              // its cursive joins.
              isAr ? '' : 'uppercase tracking-[0.22em]',
            )}
          >
            {isAr ? 'للتداول' : 'Trading'}
          </span>
        )}
      </span>
    </span>
  );

  if (!asLink) return inner;

  return (
    <Link
      to={to}
      className="inline-flex rounded-sm transition-opacity duration-120 hover:opacity-70"
      aria-label={isAr ? 'الجواد للتداول، الصفحة الرئيسية' : 'AlJawad Trading, home'}
    >
      {inner}
    </Link>
  );
}

export default Wordmark;
