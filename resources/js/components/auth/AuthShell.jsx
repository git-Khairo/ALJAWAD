import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wordmark } from '@/components/brand/Wordmark';

/**
 * Shared shell for every auth screen.
 *
 * A split rather than a single centred card floating on a gradient: the left
 * band keeps the firm present while you type, and carries the risk line,
 * which is the one thing worth reading before opening an account.
 */
export function AuthShell({ title, subtitle, children, footer }) {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Identity band */}
      <aside className="relative hidden overflow-hidden border-e border-rule bg-surface-sunken lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="relative">
          <Wordmark size="md" />
        </div>

        <div className="relative">
          <p className="measure-narrow font-display text-display-xs font-bold leading-snug text-foreground">
            {l(
              'بيئة تداول نزيهة وشفافة، بعيدة عن الضبابية والتضليل.',
              'An honest, transparent trading environment, free of obfuscation and misleading practice.',
            )}
          </p>
          <p className="mt-5 text-sm text-fg-muted">
            {l('دمشق وطرطوس · منذ 2015', 'Damascus and Tartus · Since 2015')}
          </p>
        </div>

        <p className="measure-narrow relative border-t border-rule pt-6 text-xs leading-relaxed text-fg-faint">
          {t('footer.disclaimer')}
        </p>
      </aside>

      {/* Form band */}
      <main className="flex flex-col px-5 py-8 sm:px-8 lg:px-12 lg:py-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Wordmark size="sm" showDescriptor={false} />
          </div>
          <Link
            to="/"
            className="ms-auto inline-flex items-center gap-2 text-sm text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('nav.home')}
          </Link>
        </div>

        <div className="flex flex-1 items-center">
          <div className="w-full max-w-sm animate-rise py-12">
            <h1 className="font-display text-display-xs font-bold text-foreground">{title}</h1>
            {subtitle && (
              <p className="mt-3 text-sm leading-relaxed text-fg-muted">{subtitle}</p>
            )}

            <div className="mt-9">{children}</div>

            {footer && (
              <div className="mt-8 border-t border-rule pt-6 text-sm text-fg-muted">{footer}</div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default AuthShell;
