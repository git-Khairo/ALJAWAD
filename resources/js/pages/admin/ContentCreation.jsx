import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Sparkles, Copy, Save, Info, Film, Image, Layers, Radio, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

const CONTENT_TYPES = [
  { value: 'reel',     ar: 'ريل',       en: 'Reel',     icon: Film },
  { value: 'post',     ar: 'بوست',      en: 'Post',     icon: Image },
  { value: 'story',    ar: 'ستوري',     en: 'Story',    icon: Layers },
  { value: 'live',     ar: 'بث مباشر',  en: 'Live',     icon: Radio },
  { value: 'carousel', ar: 'كاروسيل',   en: 'Carousel', icon: LayoutGrid },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'x',         label: 'X / Twitter' },
  { value: 'linkedin',  label: 'LinkedIn' },
];

const TONES = [
  { value: 'energetic',    ar: 'نشيط وحماسي',    en: 'Energetic' },
  { value: 'professional', ar: 'احترافي',          en: 'Professional' },
  { value: 'casual',       ar: 'عفوي وودود',       en: 'Casual' },
  { value: 'educational',  ar: 'تعليمي',           en: 'Educational' },
  { value: 'promotional',  ar: 'ترويجي',           en: 'Promotional' },
];

const AUDIENCES = [
  { value: 'beginners',    ar: 'مبتدئون',  en: 'Beginners' },
  { value: 'intermediate', ar: 'متوسط',    en: 'Intermediate' },
  { value: 'advanced',     ar: 'متقدمون',  en: 'Advanced' },
  { value: 'all',          ar: 'الجميع',   en: 'Everyone' },
];

const LANGUAGES = [
  { value: 'ar',   ar: 'عربي',          en: 'Arabic' },
  { value: 'en',   ar: 'إنجليزي',       en: 'English' },
  { value: 'both', ar: 'عربي وإنجليزي', en: 'Both' },
];

const EMPTY_FORM = {
  type: 'reel', platform: 'instagram', prompt: '',
  tone: 'energetic', audience: 'beginners',
  language: 'ar', duration: '60',
};

const ContentCreation = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [form, setForm]             = useState(EMPTY_FORM);
  const [generated, setGenerated]   = useState(null);
  const [generating, setGenerating] = useState(false);

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.prompt.trim()) {
      toast.error(l('أدخل موضوع المحتوى أولاً', 'Enter a content topic first'));
      return;
    }
    setGenerating(true);
    // API not yet connected — placeholder response
    await new Promise(r => setTimeout(r, 800));
    setGenerating(false);
    toast.info(l('لم يتم ربط OpenAI API بعد. سيتم تفعيله قريباً.', 'OpenAI API not connected yet. Will be enabled soon.'));
  };

  const handleCopy = () => {
    if (!generated) return;
    navigator.clipboard.writeText(generated);
    toast.success(l('تم النسخ', 'Copied'));
  };

  return (
    <div className="space-y-5">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {l('إنشاء المحتوى بالذكاء الاصطناعي', 'AI Content Creation')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('توليد سكريبتات ومحتوى السوشيال ميديا بمساعدة ChatGPT', 'Generate social media scripts and content with ChatGPT')}
          </p>
        </div>
      </div>

      {/* ── API notice ───────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5 text-xs">
        <Info className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
        <span className="text-amber-300/80">
          {l(
            'سيتم ربط OpenAI API قريباً. الواجهة والبنية التحتية جاهزة — فقط أضف مفتاح API في الإعدادات لتفعيل الإنشاء.',
            'OpenAI API will be connected soon. The UI and infrastructure are ready — just add your API key in settings to activate generation.'
          )}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Form ────────────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">{l('إعدادات المحتوى', 'Content Settings')}</h2>

          {/* Type selector */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">{l('نوع المحتوى', 'Content Type')}</label>
            <div className="grid grid-cols-5 gap-2">
              {CONTENT_TYPES.map(({ value, ar, en, icon: Icon }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: value }))}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    form.type === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {l(ar, en)}
                </button>
              ))}
            </div>
          </div>

          {/* Platform */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('المنصة', 'Platform')}</label>
            <select value={form.platform} onChange={field('platform')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          {/* Topic / Prompt */}
          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">
              {l('موضوع / فكرة المحتوى *', 'Content Topic / Idea *')}
            </label>
            <textarea
              value={form.prompt}
              onChange={field('prompt')}
              rows={4}
              placeholder={l(
                'مثال: اشرح كيفية قراءة الشمعة اليابانية للمبتدئين في 3 نقاط...',
                'e.g., Explain how to read candlestick charts for beginners in 3 points...'
              )}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
          </div>

          {/* Row: tone + audience */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('نبرة الكتابة', 'Tone')}</label>
              <select value={form.tone} onChange={field('tone')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {TONES.map(t => <option key={t.value} value={t.value}>{l(t.ar, t.en)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الجمهور المستهدف', 'Target Audience')}</label>
              <select value={form.audience} onChange={field('audience')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {AUDIENCES.map(a => <option key={a.value} value={a.value}>{l(a.ar, a.en)}</option>)}
              </select>
            </div>
          </div>

          {/* Row: language + duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('لغة المحتوى', 'Output Language')}</label>
              <select value={form.language} onChange={field('language')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {LANGUAGES.map(lg => <option key={lg.value} value={lg.value}>{l(lg.ar, lg.en)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('المدة (ثواني)', 'Duration (sec)')}</label>
              <select value={form.duration} onChange={field('duration')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="30">30 {l('ثانية','sec')}</option>
                <option value="60">60 {l('ثانية','sec')}</option>
                <option value="90">90 {l('ثانية','sec')}</option>
                <option value="180">3 {l('دقائق','min')}</option>
              </select>
            </div>
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={generating || !form.prompt.trim()}
          >
            <Sparkles className={`h-4 w-4 ${generating ? 'animate-pulse' : ''}`} />
            {generating
              ? l('جاري الإنشاء...', 'Generating...')
              : l('إنشاء المحتوى', 'Generate Content')
            }
          </Button>
        </div>

        {/* ── Output ──────────────────────────────────────────────────────────── */}
        <div className="bg-card rounded-xl border p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{l('المحتوى المُنشأ', 'Generated Content')}</h2>
            {generated && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  <Copy className="h-3.5 w-3.5" />{l('نسخ', 'Copy')}
                </Button>
                <Button size="sm" onClick={() => toast.success(l('تم الحفظ', 'Saved'))} className="gap-1">
                  <Save className="h-3.5 w-3.5" />{l('حفظ', 'Save')}
                </Button>
              </div>
            )}
          </div>

          {/* Empty / placeholder state */}
          {!generated && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium mb-1">{l('المحتوى سيظهر هنا', 'Generated content will appear here')}</p>
              <p className="text-xs opacity-60">
                {l('اضبط الإعدادات واضغط "إنشاء المحتوى"', 'Configure settings and click "Generate Content"')}
              </p>

              {/* Preview of what will be generated */}
              <div className="mt-6 w-full text-start space-y-2">
                {[
                  l('🎬 Hook — جذب الانتباه', '🎬 Hook — Attention grabber'),
                  l('📝 المحتوى الرئيسي — النقاط الأساسية', '📝 Main content — Key points'),
                  l('💬 CTA — دعوة للتفاعل', '💬 CTA — Call to action'),
                  l('🔖 الهاشتاغات المقترحة', '🔖 Suggested hashtags'),
                ].map(s => (
                  <div key={s} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary/40 shrink-0" />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Generated content (when API is connected) */}
          {generated && (
            <div className="flex-1 bg-muted/20 rounded-xl p-4">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{generated}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCreation;
