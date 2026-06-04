import { Link } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { ArrowLeft } from 'lucide-react';

const NotFound = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center px-4">
      <p className="text-7xl font-extrabold text-primary mb-4">404</p>
      <h1 className="text-2xl font-bold mb-2">
        {l('الصفحة غير موجودة', 'Page not found')}
      </h1>
      <p className="text-muted-foreground text-sm mb-8 max-w-xs">
        {l(
          'الرابط الذي طلبته غير موجود أو تم نقله.',
          'The link you requested does not exist or has been moved.'
        )}
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-gold text-primary-foreground font-semibold text-sm hover:opacity-90 transition"
      >
        <ArrowLeft className={`h-4 w-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
        {l('العودة للرئيسية', 'Back to Home')}
      </Link>
    </div>
  );
};

export default NotFound;
