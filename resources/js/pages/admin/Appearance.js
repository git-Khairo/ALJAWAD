import { useLanguage } from '@/contexts/LanguageContext';
import { Palette, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Appearance = () => {
  const { language, toggleTheme, theme } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{l('المظهر', 'Appearance')}</h1>
      <div className="grid gap-4 max-w-2xl">
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-medium mb-4">{l('السمة', 'Theme')}</h3>
          <div className="flex gap-3">
            <button onClick={() => theme !== 'light' && toggleTheme()} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <Sun className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm text-center">{l('فاتح', 'Light')}</p>
            </button>
            <button onClick={() => theme !== 'dark' && toggleTheme()} className={`flex-1 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-border'}`}>
              <Moon className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm text-center">{l('داكن', 'Dark')}</p>
            </button>
          </div>
        </div>
        <div className="bg-card rounded-xl border p-5">
          <h3 className="font-medium mb-3">{l('الألوان الأساسية', 'Primary Colors')}</h3>
          <div className="flex gap-3">
            {['bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500', 'bg-rose-500'].map((c, i) => (
              <button key={i} className={`h-8 w-8 rounded-full ${c} ring-2 ring-offset-2 ring-transparent hover:ring-primary transition-all`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Appearance;
