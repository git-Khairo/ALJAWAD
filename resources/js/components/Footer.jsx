import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { Mail, Phone, MapPin } from 'lucide-react';
import logo from '@/assets/logo.png';

export const Footer = () => {
  const { t, language } = useLanguage();
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <div className="flex items-center justify-center mb-3">
              <img src={logo} alt="AlJawad Trading" className="h-auto w-40" />
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{t('footer.description')}</p>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t('footer.quickLinks')}</h4>
            <div className="space-y-2 text-sm">
              <Link to="/about" className="block text-muted-foreground hover:text-primary transition-colors">{t('nav.about')}</Link>
              <Link to="/services" className="block text-muted-foreground hover:text-primary transition-colors">{t('nav.services')}</Link>
              <Link to="/courses" className="block text-muted-foreground hover:text-primary transition-colors">{t('nav.courses')}</Link>
              <Link to="/blog" className="block text-muted-foreground hover:text-primary transition-colors">{t('nav.blog')}</Link>
              <Link to="/contact" className="block text-muted-foreground hover:text-primary transition-colors">{t('nav.contact')}</Link>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t('footer.contactUs')}</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{t('contact_section.address')}</div>
              <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" />{t('contact_section.phone_val')}</div>
              <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" />{t('contact_section.email_val')}</div>
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-3">{t('footer.followUs')}</h4>
            <div className="flex gap-3">
              {['X', 'Li', 'Ig', 'Tg'].map(s => (
                <div key={s} className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-xs hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors">{s}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="border-t mt-8 pt-6">
          <p className="text-center text-sm text-muted-foreground mb-2">{t('footer.rights')}</p>
          <p className="text-center text-xs text-muted-foreground/60">{t('footer.disclaimer')}</p>
        </div>
      </div>
    </footer>
  );
};
