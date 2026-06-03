import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff, Check, AlertTriangle, Zap, Bot } from 'lucide-react';
import { toast } from 'sonner';

const IntegrationCard = ({ icon: Icon, iconColor, name, description, keyLabel, placeholder, hint, value, onChange, saved }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="bg-card border border-primary/10 rounded-2xl p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${iconColor}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-base">{name}</h3>
            {saved && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                <Check className="h-3 w-3" /> Connected
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        </div>
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{keyLabel}</label>
        <div className="relative">
          <input
            type={show ? 'text' : 'password'}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            className="w-full px-4 py-2.5 pe-11 rounded-lg border bg-background text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
          />
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>
      </div>
    </div>
  );
};

const Integrations = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [openaiKey,      setOpenaiKey]      = useState(localStorage.getItem('openai_key')      ?? '');
  const [telegramToken,  setTelegramToken]  = useState(localStorage.getItem('telegram_token')  ?? '');

  const handleSave = () => {
    if (openaiKey.trim())     localStorage.setItem('openai_key',      openaiKey.trim());
    else                      localStorage.removeItem('openai_key');
    if (telegramToken.trim()) localStorage.setItem('telegram_token',  telegramToken.trim());
    else                      localStorage.removeItem('telegram_token');
    toast.success(l('تم حفظ إعدادات التكامل', 'Integration settings saved'));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{l('التكاملات', 'Integrations')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('ربط الأدوات الخارجية بلوحة التحكم', 'Connect external tools to the dashboard')}
        </p>
      </div>

      {/* Warning */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-sm text-amber-400">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <span>
          {l(
            'المفاتيح محفوظة محلياً في المتصفح فقط ولا تُرسل إلى الخادم.',
            'Keys are stored locally in the browser only and are not sent to the server.'
          )}
        </span>
      </div>

      {/* Integration cards */}
      <div className="grid gap-5 max-w-2xl">
        <IntegrationCard
          icon={Zap}
          iconColor="bg-emerald-500/10 text-emerald-400"
          name="OpenAI"
          description={l('مطلوب لإنشاء المحتوى بالذكاء الاصطناعي وتوليد النصوص', 'Required for AI content creation and text generation')}
          keyLabel="OpenAI API Key"
          placeholder="sk-..."
          hint={l('احصل على مفتاحك من platform.openai.com', 'Get your key from platform.openai.com')}
          value={openaiKey}
          onChange={e => setOpenaiKey(e.target.value)}
          saved={!!localStorage.getItem('openai_key')}
        />

        <IntegrationCard
          icon={Bot}
          iconColor="bg-blue-500/10 text-blue-400"
          name="Telegram Bot"
          description={l('مطلوب لإرسال إشعارات تليغرام للعملاء والمتابعين', 'Required for sending Telegram notifications to clients and followers')}
          keyLabel={l('رمز البوت', 'Bot Token')}
          placeholder="123456:ABC-DEF..."
          hint={l('احصل على الرمز من @BotFather في تيليغرام', 'Get the token from @BotFather on Telegram')}
          value={telegramToken}
          onChange={e => setTelegramToken(e.target.value)}
          saved={!!localStorage.getItem('telegram_token')}
        />
      </div>

      <div className="max-w-2xl">
        <Button onClick={handleSave} className="w-full sm:w-auto px-8">
          {l('حفظ التكاملات', 'Save Integrations')}
        </Button>
      </div>
    </div>
  );
};

export default Integrations;
