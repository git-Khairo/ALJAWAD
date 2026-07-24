import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import {
  Sparkles, Copy, Save, Film, Image, Layers, Radio, LayoutGrid,
  Trash2, Clock, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { contentApi } from '@/lib/api';

const CONTENT_TYPES = [
  { value: 'reel',     ar: 'ريل',       en: 'Reel',     icon: Film },
  { value: 'post',     ar: 'بوست',      en: 'Post',     icon: Image },
  { value: 'story',    ar: 'ستوري',     en: 'Story',    icon: Layers },
  { value: 'live',     ar: 'بث مباشر',  en: 'Live',     icon: Radio },
  { value: 'carousel', ar: 'كاروسيل',   en: 'Carousel', icon: LayoutGrid },
];

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube',   label: 'YouTube' },
  { value: 'facebook',  label: 'Facebook' },
  { value: 'tiktok',    label: 'TikTok' },
  { value: 'google',    label: 'Google' },
  { value: 'event',     label: 'Event' },
  { value: 'other',     label: 'Others' },
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
  const { hasPermission } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { generatedContent, saveGeneratedContent, deleteGeneratedContent } = useAppData();

  const [form, setForm]             = useState(EMPTY_FORM);
  const [generated, setGenerated]   = useState(null);   // { text_ar, text_en }
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const field = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  const handleGenerate = async () => {
    if (!form.prompt.trim()) {
      toast.error(l('أدخل موضوع المحتوى أولاً', 'Enter a content topic first'));
      return;
    }
    setGenerating(true);
    setGenerated(null);
    try {
      const res = await contentApi.generate({
        type:             form.type,
        platform:         form.platform,
        prompt:           form.prompt,
        tone:             form.tone,
        language:         form.language,
        audience:         form.audience,
        duration_seconds: parseInt(form.duration),
      });
      // If backend returns generated text
      if (res.data?.generated_ar || res.data?.generated_en) {
        setGenerated(res.data);
      } else {
        // Backend is a stub — show info message
        toast.info(l(
          res.data?.message ?? 'لم يتم ربط OpenAI بعد. أضف المفتاح في الإعدادات.',
          res.data?.message ?? 'OpenAI not connected yet. Add your API key in Settings.'
        ));
      }
    } catch (err) {
      const msg = err.response?.data?.message;
      toast.info(l(
        msg ?? 'لم يتم ربط OpenAI بعد.',
        msg ?? 'OpenAI not connected yet. Add your API key in Settings.'
      ));
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generated) return;
    const text = (form.language === 'ar' ? generated.generated_ar : generated.generated_en)
      ?? generated.generated_ar
      ?? generated.generated_en
      ?? '';
    navigator.clipboard.writeText(text);
    toast.success(l('تم النسخ', 'Copied'));
  };

  const handleSave = async () => {
    if (!generated) return;
    setSaving(true);
    try {
      await saveGeneratedContent({
        type:          form.type,
        platform:      form.platform,
        prompt:        form.prompt,
        generated_ar:  generated.generated_ar ?? '',
        generated_en:  generated.generated_en ?? '',
        tone:          form.tone,
        language:      form.language,
        audience:      form.audience,
        duration_seconds: parseInt(form.duration),
      });
      toast.success(l('تم الحفظ', 'Saved to history'));
    } catch {
      toast.error(l('فشل الحفظ', 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const displayText = generated
    ? ((form.language === 'ar' ? generated.generated_ar : generated.generated_en)
        ?? generated.generated_ar
        ?? generated.generated_en)
    : null;

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            {l('إنشاء المحتوى بالذكاء الاصطناعي', 'AI Content Creation')}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('توليد سكريبتات ومحتوى السوشيال ميديا بمساعدة AI', 'Generate social media scripts and content with AI')}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(h => !h)} className="gap-1.5">
          <Clock className="h-4 w-4" />
          {l('السجل', 'History')} {generatedContent.length > 0 && `(${generatedContent.length})`}
        </Button>
      </div>

{/* ── History panel ── */}
      {showHistory && (
        <div className="bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('المحتوى المحفوظ', 'Saved Content')}</h2>
          {generatedContent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              {l('لا يوجد محتوى محفوظ بعد', 'No saved content yet')}
            </p>
          ) : (
            <div className="space-y-3">
              {generatedContent.map(item => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-xl bg-background border hover:border-primary/30 transition">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 capitalize">{item.type}</span>
                      <span className="text-xs text-muted-foreground">{item.platform}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{item.prompt}</p>
                    {item.generated_ar && <p className="text-sm mt-1 line-clamp-2">{item.generated_ar}</p>}
                  </div>
                  {hasPermission('delete content') && (
                    <button onClick={() => deleteGeneratedContent(item.id)}
                      className="p-1.5 rounded-lg border border-red-500/20 hover:bg-red-500/10 text-red-400 transition shrink-0">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* ── Form ── */}
        <div className="bg-card rounded-xl border p-5 space-y-4">
          <h2 className="font-semibold">{l('إعدادات المحتوى', 'Content Settings')}</h2>

          <div>
            <label className="text-xs text-muted-foreground mb-2 block font-medium">{l('نوع المحتوى', 'Content Type')}</label>
            <div className="grid grid-cols-5 gap-2">
              {CONTENT_TYPES.map(({ value, ar, en, icon: Icon }) => (
                <button key={value} type="button" onClick={() => setForm(p => ({ ...p, type: value }))}
                  className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                    form.type === value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted-foreground hover:border-primary/30'
                  }`}>
                  <Icon className="h-4 w-4" />
                  {l(ar, en)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('المنصة', 'Platform')}</label>
            <select value={form.platform} onChange={field('platform')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
              {PLATFORMS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1 block font-medium">
              {l('موضوع / فكرة المحتوى *', 'Content Topic / Idea *')}
            </label>
            <textarea value={form.prompt} onChange={field('prompt')} rows={4}
              placeholder={l('مثال: اشرح كيفية قراءة الشمعة اليابانية للمبتدئين في 3 نقاط...', 'e.g., Explain how to read candlestick charts for beginners in 3 points...')}
              className="w-full px-3 py-2.5 rounded-lg border bg-background text-sm resize-none"
              dir={language === 'ar' ? 'rtl' : 'ltr'} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('نبرة الكتابة', 'Tone')}</label>
              <select value={form.tone} onChange={field('tone')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {TONES.map(t => <option key={t.value} value={t.value}>{l(t.ar, t.en)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block font-medium">{l('الجمهور', 'Audience')}</label>
              <select value={form.audience} onChange={field('audience')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                {AUDIENCES.map(a => <option key={a.value} value={a.value}>{l(a.ar, a.en)}</option>)}
              </select>
            </div>
          </div>

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

          <Button className="w-full gap-2" onClick={handleGenerate} disabled={generating || !form.prompt.trim()}>
            {generating
              ? <><Loader2 className="h-4 w-4 animate-spin" />{l('جاري الإنشاء...', 'Generating...')}</>
              : <><Sparkles className="h-4 w-4" />{l('إنشاء المحتوى', 'Generate Content')}</>
            }
          </Button>
        </div>

        {/* ── Output ── */}
        <div className="bg-card rounded-xl border p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">{l('المحتوى المُنشأ', 'Generated Content')}</h2>
            {displayText && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopy} className="gap-1">
                  <Copy className="h-3.5 w-3.5" />{l('نسخ', 'Copy')}
                </Button>
                {hasPermission('create content') && (
                  <Button size="sm" onClick={handleSave} disabled={saving} className="gap-1">
                    {saving
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <Save className="h-3.5 w-3.5" />}
                    {l('حفظ', 'Save')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {!displayText ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 text-muted-foreground">
              <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 opacity-30" />
              </div>
              <p className="text-sm font-medium mb-1">{l('المحتوى سيظهر هنا', 'Generated content will appear here')}</p>
              <p className="text-xs opacity-60">
                {l('اضبط الإعدادات واضغط "إنشاء المحتوى"', 'Configure settings and click "Generate Content"')}
              </p>
            </div>
          ) : (
            <div className="flex-1 bg-muted/20 rounded-xl p-4 overflow-y-auto">
              <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed">{displayText}</pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentCreation;
