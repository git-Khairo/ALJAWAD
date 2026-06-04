import { useLanguage } from '@/contexts/LanguageContext';
import { FileText } from 'lucide-react';

const Applications = () => {
  const { t, language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('app.applications')}</h1>

      <div className="flex flex-col items-center justify-center py-24 text-center text-muted-foreground">
        <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
          <FileText className="h-8 w-8 opacity-30" />
        </div>
        <p className="text-sm font-medium mb-1">
          {l('لا توجد طلبات بعد', 'No applications yet')}
        </p>
        <p className="text-xs opacity-60 max-w-xs">
          {l(
            'سيتم عرض طلبات تسجيلك في الدورات هنا بمجرد تفعيل نظام التسجيل.',
            'Your course enrollment applications will appear here once the registration system is activated.'
          )}
        </p>
      </div>
    </div>
  );
};

export default Applications;
