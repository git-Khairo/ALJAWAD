import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wordmark } from '@/components/brand/Wordmark';
import poweredByLogo from '@/assets/withhumble-logo.png';

/**
 * Colophon.
 *
 * The risk disclaimer is set at body size in ink rather than shrunk to 60%
 * opacity micro-type. A firm whose entire pitch is transparency cannot bury
 * the one sentence that proves it (see PRODUCT.md, principle 6).
 */
export const Footer = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  const nav = [
    { to: '/about',    label: t('nav.about') },
    { to: '/services', label: t('nav.services') },
    { to: '/courses',  label: t('nav.courses') },
    { to: '/blog',     label: t('nav.blog') },
    { to: '/contact',  label: t('nav.contact') },
  ];

  const social = [
    { label: l('إنستغرام', 'Instagram'), href: '#' },
    { label: l('فيسبوك', 'Facebook'),    href: '#' },
    { label: l('واتساب', 'WhatsApp'),    href: '#' },
    { label: l('تيك توك', 'TikTok'),     href: '#' },
  ];

  const contact = [
    { term: l('العنوان', 'Address'), value: t('contact_section.address'), dir: undefined },
    { term: l('الهاتف', 'Phone'),   value: t('contact_section.phone_val'), dir: 'ltr', href: `tel:${t('contact_section.phone_val').replace(/\s/g, '')}` },
    { term: l('البريد', 'Email'),   value: t('contact_section.email_val'), dir: 'ltr', href: `mailto:${t('contact_section.email_val')}` },
  ];

  // No top margin: the rule and the surface step already separate this from
  // the last band, and a margin on top of both reads as a hole.
  return (
    <footer className="border-t border-rule-strong bg-surface-sunken">
      <div className="container py-16">
        {/* Asymmetric: the identity gets half the width, the indexes share the rest. */}
        <div className="grid gap-12 md:grid-cols-12 md:gap-8">
          <div className="md:col-span-5">
            <Wordmark size="md" asLink={false} />
            <p className="measure-narrow mt-6 text-sm leading-relaxed text-fg-muted">
              {t('footer.description')}
            </p>
          </div>

          <nav className="md:col-span-3 md:col-start-7" aria-label={l('روابط الموقع', 'Site links')}>
            <h2 className="eyebrow mb-5">{t('footer.quickLinks')}</h2>
            <ul className="flex flex-col gap-3 text-sm">
              {nav.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-3">
            <h2 className="eyebrow mb-5">{t('footer.contactUs')}</h2>
            <dl className="flex flex-col gap-4 text-sm">
              {contact.map((c) => (
                <div key={c.term}>
                  <dt className="text-xs text-fg-faint">{c.term}</dt>
                  <dd className="mt-0.5 text-fg-muted" dir={c.dir}>
                    {c.href ? (
                      <a
                        href={c.href}
                        className="font-mono underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
                      >
                        {c.value}
                      </a>
                    ) : (
                      c.value
                    )}
                  </dd>
                </div>
              ))}
            </dl>

            <h2 className="eyebrow mb-3 mt-8">{t('footer.followUs')}</h2>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    className="text-fg-muted underline-offset-4 transition-colors duration-120 hover:text-foreground hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* The disclaimer band. Set to be read, not to be technically present. */}
        <div className="mt-14 border-t border-rule pt-8">
          <p className="measure text-sm leading-relaxed text-fg-muted">
            <span className="font-semibold text-foreground">
              {l('تنبيه المخاطر: ', 'Risk warning: ')}
            </span>
            {t('footer.disclaimer')}
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-rule pt-6 text-xs text-fg-faint sm:flex-row sm:items-center sm:justify-between">
          <p>{t('footer.rights')}</p>
          <a
            href="https://withhumble.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 transition-opacity duration-120 hover:opacity-70"
            dir="ltr"
          >
            <span>{t('footer.poweredBy')}</span>
            {/* Was rendered at h-32: a 128px tall credit above the copyright. */}
            <img src={poweredByLogo} alt="withHUMBLE" className="h-5 w-auto" loading="lazy" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
