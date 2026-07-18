import { Construction } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export default function AffiliatesPlaceholder({ title }) {
  const { language } = useLanguage();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-500">
      <Construction size={40} className="opacity-40" />
      <p className="text-lg font-medium text-slate-400">{title}</p>
      <p className="text-sm">{language === 'ar' ? 'قريباً' : 'Coming soon'}</p>
    </div>
  );
}
