import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, MapPin, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '@/assets/logo.png';
import poweredByLogo from '@/assets/withhumble-logo.png';

export const Footer = () => {
  const { t } = useLanguage();

  const social = [
    { key: 'Ig', label: 'ig', href: '#' },
    { key: 'Fb', label: 'fb', href: '#' },
    { key: 'Wa', label: 'wa', href: '#' },
    { key: 'Tt', label: 'tt', href: '#' },
  ];

  return (
    <footer className="relative border-t border-primary/15 mt-8 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 grid-bg opacity-20" />
        <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-[120px]" />
        <div className="absolute -bottom-24 right-1/4 h-80 w-80 rounded-full bg-primary/10 blur-[140px]" />
      </div>

      <div className="relative container mx-auto px-4 py-16">
        {/* Main columns */}
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img src={logo} alt="AlJawad Trading" className="h-auto w-40 drop-shadow-[0_0_12px_hsl(195_65%_47%/0.35)]" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2.5 text-sm">
              {[
                { to: '/about', label: t('nav.about') },
                { to: '/services', label: t('nav.services') },
                { to: '/courses', label: t('nav.courses') },
                { to: '/blog', label: t('nav.blog') },
                { to: '/contact', label: t('nav.contact') },
              ].map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="group inline-flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    <span className="border-b border-transparent group-hover:border-primary/40 transition-colors">
                      {link.label}
                    </span>
                    <ArrowUpRight className="h-3 w-3 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all rtl:rotate-270" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('footer.contactUs')}</h4>
            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                {t('contact_section.address')}
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                {t('contact_section.phone_val')}
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                {t('contact_section.email_val')}
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-foreground">{t('footer.followUs')}</h4>
            <div className="flex gap-3">
              {social.map((s) => (
                <motion.a
                  key={s.key}
                  whileHover={{ y: -4, scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  href={s.href}
                  className="relative w-10 h-10 rounded-xl glass border border-primary/15 flex items-center justify-center text-xs font-semibold hover:border-primary/40 hover:text-primary transition-colors group"
                >
                  <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shadow-neon" />
                  <span className="relative">{s.label}</span>
                </motion.a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary/10 text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t('footer.rights')}</p>
          <p className="text-xs text-muted-foreground/60">{t('footer.disclaimer')}</p>
          <div className="flex items-center justify-center pt-2" dir="ltr">
            <span className="text-xs text-muted-foreground/60 tracking-wide">{t('footer.poweredBy')}</span>
            <img src={poweredByLogo} alt="withHUMBLE" className="h-32 w-auto opacity-80 hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>
    </footer>
  );
};
