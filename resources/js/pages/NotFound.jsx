import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

const NotFound = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);

  return (
    <div className="container flex min-h-[70dvh] flex-col justify-center py-20">
      <div className="max-w-xl">
        <p className="font-mono text-sm text-primary" dir="ltr">404</p>
        <h1 className="mt-4 font-display text-display-sm font-bold text-foreground md:text-display-md">
          {l('الصفحة غير موجودة', 'Page not found')}
        </h1>
        <p className="measure mt-5 text-base leading-relaxed text-fg-muted">
          {l(
            'الرابط الذي طلبته غير موجود أو تم نقله. يمكنك العودة إلى الرئيسية أو الاطلاع على المدونة.',
            'The link you requested does not exist, or it has moved. You can head back to the homepage, or look through the journal.',
          )}
        </p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to="/">
            <Button variant="accent">
              <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
              {l('العودة للرئيسية', 'Back to home')}
            </Button>
          </Link>
          <Link to="/blog">
            <Button variant="outline">{l('المدونة', 'Journal')}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
