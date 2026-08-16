import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import logo from '@/assets/logo.png';

/**
 * The masthead lockup: the supplied logo.png.
 *
 * The asset already carries the horse and the name in both scripts, so
 * nothing is typeset here. Its text is white, which is why it needs the dark
 * ground: do not place this on a light surface without a dark variant of the
 * file.
 *
 * Sized by width, not height: the artwork is a wide lockup (roughly 2.8:1)
 * whose name occupies most of that width, so constraining the height makes
 * the text unreadable long before the mark looks small.
 */
const SIZES = {
  sm: 'w-32',
  md: 'w-40',
  lg: 'w-56',
};

export function Wordmark({ size = 'sm', to = '/', className, asLink = true }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const alt = isAr ? 'الجواد للتداول' : 'AlJawad Trading';

  const img = (
    <img
      src={logo}
      alt={alt}
      className={cn('h-auto shrink-0 object-contain', SIZES[size] ?? SIZES.sm, className)}
    />
  );

  if (!asLink) return img;

  return (
    <Link
      to={to}
      className="inline-flex rounded-sm transition-opacity duration-120 hover:opacity-80"
      aria-label={isAr ? 'الجواد للتداول، الصفحة الرئيسية' : 'AlJawad Trading, home'}
    >
      {img}
    </Link>
  );
}

export default Wordmark;
