import { useState, useMemo } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Plus, ChevronLeft, Trash2, Edit3, Film, Image, Layers,
  Radio, LayoutGrid, Check, Target, CalendarDays, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Shared config ──────────────────────────────────────────────────────────────
const CONTENT_TYPES = {
  reel:     { ar: 'ريل',       en: 'Reel',     icon: Film,       color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/25' },
  post:     { ar: 'بوست',      en: 'Post',     icon: Image,      color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25' },
  story:    { ar: 'ستوري',     en: 'Story',    icon: Layers,     color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25' },
  live:     { ar: 'بث مباشر',  en: 'Live',     icon: Radio,      color: 'text-red-400',    bg: 'bg-red-500/10 border-red-500/25' },
  carousel: { ar: 'كاروسيل',   en: 'Carousel', icon: LayoutGrid, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25' },
};

const PLATFORMS = {
  instagram: { label: 'Instagram', emoji: '📷' },
  tiktok:    { label: 'TikTok',    emoji: '🎵' },
  youtube:   { label: 'YouTube',   emoji: '▶️' },
  x:         { label: 'X',         emoji: '✕' },
  linkedin:  { label: 'LinkedIn',  emoji: '🔗' },
  snapchat:  { label: 'Snapchat',  emoji: '👻' },
};

const STATUS_ADVANCE = { draft: 'scheduled', scheduled: 'published', published: 'published' };

const ITEM_STATUS_STYLES = {
  draft:     'bg-muted text-muted-foreground border-border',
  scheduled: 'bg-amber-500/10 text-amber-400 border-amber-500/25',
  published: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
};

const PLAN_STATUS_STYLES = {
  draft:     'bg-muted text-muted-foreground border-border',
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
};

const CAMPAIGN_STATUS_STYLES = {
  active:    'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
  completed: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
  paused:    'bg-amber-500/10 text-amber-400 border-amber-500/25',
  draft:     'bg-muted text-muted-foreground border-border',
};

const campaignStatusLabel = (status, l) =>
  status === 'active' ? l('نشطة', 'Active')
  : status === 'completed' ? l('منتهية', 'Completed')
  : status === 'paused' ? l('موقوفة', 'Paused')
  : l('مسودة', 'Draft');

const MONTH_AR = ['يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];
const MONTH_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const EMPTY_ITEM = { type: 'reel', platform: 'instagram', title_ar: '', title_en: '', script_ar: '', script_en: '', date: '', time: '12:00', status: 'draft' };
const EMPTY_PLAN = { name_ar: '', name_en: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), goal_ar: '', goal_en: '', status: 'draft', campaign_ids: [] };

// ─── Plans list view ────────────────────────────────────────────────────────────
const PlansList = ({ l, language, plans, campaigns, onOpen, onDelete, onNew, canCreate, canDelete }) => (
  <div className="space-y-5">
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">{l('خطط التسويق الشهرية', 'Monthly Marketing Plans')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l('أنشئ خطة تسويقية متكاملة لكل شهر تضم المحتوى والحملات والأهداف', 'Create a full monthly marketing plan with content, campaigns and goals')}
        </p>
      </div>
      {canCreate && <Button size="sm" onClick={onNew}><Plus className="h-4 w-4 me-1" />{l('خطة جديدة', 'New Plan')}</Button>}
    </div>

    {plans.length === 0 && (
      <div className="bg-card rounded-xl border p-14 text-center text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-3 opacity-25" />
        <p className="mb-3">{l('لا توجد خطط تسويقية بعد', 'No marketing plans yet')}</p>
        {canCreate && <Button variant="outline" size="sm" onClick={onNew}><Plus className="h-4 w-4 me-1" />{l('ابدأ بخطتك الأولى','Start your first plan')}</Button>}
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {plans.map((plan) => {
        const published  = plan.items.filter(i => i.status === 'published').length;
        const scheduled  = plan.items.filter(i => i.status === 'scheduled').length;
        const draft      = plan.items.filter(i => i.status === 'draft').length;
        const linkedCamp = campaigns.filter(c => (plan.campaign_ids ?? []).includes(c.id));
        return (
          <div key={plan.id} className="bg-card rounded-xl border hover:border-primary/40 transition-colors p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-semibold text-primary flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {language === 'ar' ? MONTH_AR[(plan.month - 1)] : MONTH_EN[(plan.month - 1)]} {plan.year}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_STATUS_STYLES[plan.status]}`}>
                  {plan.status === 'active' ? l('نشطة','Active') : plan.status === 'completed' ? l('منتهية','Completed') : l('مسودة','Draft')}
                </span>
              </div>
              {canDelete && (
                <button onClick={() => onDelete(plan.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <h3 className="font-semibold mb-1">{language === 'ar' ? plan.name_ar : plan.name_en}</h3>
            <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
              {language === 'ar' ? plan.goal_ar : plan.goal_en}
            </p>

            {/* Content stats */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-center text-xs">
              <div className="bg-emerald-500/8 rounded-lg p-2">
                <p className="font-bold text-emerald-400">{published}</p>
                <p className="text-muted-foreground">{l('منشور','Published')}</p>
              </div>
              <div className="bg-amber-500/8 rounded-lg p-2">
                <p className="font-bold text-amber-400">{scheduled}</p>
                <p className="text-muted-foreground">{l('مجدول','Scheduled')}</p>
              </div>
              <div className="bg-muted/40 rounded-lg p-2">
                <p className="font-bold text-muted-foreground">{draft}</p>
                <p className="text-muted-foreground">{l('مسودة','Draft')}</p>
              </div>
            </div>

            {/* Linked campaigns */}
            {linkedCamp.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-4">
                {linkedCamp.map(c => (
                  <span key={c.id} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    <Target className="h-2.5 w-2.5" />
                    {language === 'ar' ? c.name_ar : c.name_en}
                  </span>
                ))}
              </div>
            )}

            <Button size="sm" className="w-full" onClick={() => onOpen(plan)}>
              {l('فتح الخطة', 'Open Plan')} →
            </Button>
          </div>
        );
      })}
    </div>
  </div>
);

// ─── Plan detail / editor view ──────────────────────────────────────────────────
const PlanDetail = ({ plan, l, language, campaigns, onBack, onUpdatePlan, onAddItem, onUpdateItem, onDeleteItem, canCreate, canEdit, canDelete }) => {
  const [addOpen, setAddOpen]     = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_ITEM);
  const [filterType, setFT]       = useState('all');
  const [filterStatus, setFS]     = useState('all');
  const [linkOpen, setLinkOpen]   = useState(false);
  const [linkSel, setLinkSel]     = useState([]);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const safeItems = plan?.items ?? [];

  const visibleItems = useMemo(() =>
    [...safeItems]
      .filter(i => filterType   === 'all' || i.type   === filterType)
      .filter(i => filterStatus === 'all' || i.status === filterStatus)
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [safeItems, filterType, filterStatus]
  );

  const stats = {
    published: safeItems.filter(i => i.status === 'published').length,
    scheduled: safeItems.filter(i => i.status === 'scheduled').length,
    draft:     safeItems.filter(i => i.status === 'draft').length,
  };

  const linkedCamp = campaigns.filter(c => (plan.campaign_ids ?? []).includes(c.id));

  const openLink = () => { setLinkSel(plan.campaign_ids ?? []); setLinkOpen(true); };
  const toggleLink = (id) => setLinkSel(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const saveLink = () => {
    onUpdatePlan({ id: plan.id, campaign_ids: linkSel });
    toast.success(l('تم تحديث الحملات المرتبطة', 'Linked campaigns updated'));
    setLinkOpen(false);
  };

  const openAdd = () => {
    setEditItem(null);
    setForm({ ...EMPTY_ITEM, date: `${plan.year}-${String(plan.month).padStart(2,'0')}-01` });
    setAddOpen(true);
  };

  const openEdit = (item) => { setEditItem(item); setForm({ ...item }); setAddOpen(true); };

  const handleSave = (ev) => {
    ev.preventDefault();
    if (!form.title_ar.trim() && !form.title_en.trim()) { toast.error(l('أدخل عنوان','Enter title')); return; }
    if (editItem) { onUpdateItem(plan.id, { ...form, id: editItem.id }); toast.success(l('تم التحديث','Updated')); }
    else { onAddItem(plan.id, form); toast.success(l('تمت الإضافة','Added')); }
    setAddOpen(false);
  };

  const advance = (item) => {
    const next = STATUS_ADVANCE[item.status];
    if (next !== item.status) { onUpdateItem(plan.id, { ...item, status: next }); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button onClick={onBack} className="mt-1 p-2 rounded-lg border hover:bg-muted transition-colors shrink-0">
          <ChevronLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <h1 className="text-2xl font-bold">{language === 'ar' ? plan.name_ar : plan.name_en}</h1>
            <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${PLAN_STATUS_STYLES[plan.status]}`}>
              {plan.status === 'active' ? l('نشطة','Active') : plan.status === 'completed' ? l('منتهية','Completed') : l('مسودة','Draft')}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            <CalendarDays className="inline h-3.5 w-3.5 me-1" />
            {language === 'ar' ? MONTH_AR[(plan.month - 1)] : MONTH_EN[(plan.month - 1)]} {plan.year}
          </p>
        </div>
      </div>

      {/* Goal + linked campaigns */}
      <div className="bg-card rounded-xl border p-5 space-y-3">
        <div>
          <p className="text-xs text-muted-foreground mb-1 font-medium">{l('هدف الخطة', 'Plan Goal')}</p>
          <p className="text-sm">{(language === 'ar' ? plan.goal_ar : plan.goal_en) || <span className="text-muted-foreground italic">{l('لم يحدد هدف','No goal set')}</span>}</p>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground font-medium">{l('الحملات المرتبطة', 'Linked Campaigns')}</p>
            <button onClick={openLink} className="text-xs text-primary hover:underline inline-flex items-center gap-1">
              <Edit3 className="h-3 w-3" />{l('تعديل', 'Edit')}
            </button>
          </div>
          {linkedCamp.length === 0 ? (
            <p className="text-xs text-muted-foreground italic">{l('لا توجد حملات مرتبطة', 'No linked campaigns')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {linkedCamp.map(c => (
                <span key={c.id} className="inline-flex items-center gap-1.5 text-xs ps-3 pe-1.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
                  <Target className="h-3 w-3" />
                  {language === 'ar' ? c.name_ar : c.name_en}
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] border ${CAMPAIGN_STATUS_STYLES[c.status] ?? CAMPAIGN_STATUS_STYLES.draft}`}>
                    {campaignStatusLabel(c.status, l)}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>
        {/* Summary pills */}
        <div className="flex gap-3 pt-1 flex-wrap">
          {[
            { label: l('منشور','Published'), value: stats.published, cls: 'bg-emerald-500/10 text-emerald-400' },
            { label: l('مجدول','Scheduled'), value: stats.scheduled, cls: 'bg-amber-500/10 text-amber-400' },
            { label: l('مسودة','Draft'),     value: stats.draft,     cls: 'bg-muted text-muted-foreground' },
          ].map(s => (
            <span key={s.label} className={`text-xs px-3 py-1 rounded-full font-medium ${s.cls}`}>
              {s.value} {s.label}
            </span>
          ))}
        </div>
      </div>

      {/* Content list header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-semibold">{l('جدول المحتوى', 'Content Schedule')}</h2>
        <div className="flex gap-2 flex-wrap">
          <select value={filterType} onChange={e => setFT(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border bg-background">
            <option value="all">{l('الكل','All')}</option>
            {Object.entries(CONTENT_TYPES).map(([k,v]) => <option key={k} value={k}>{l(v.ar,v.en)}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFS(e.target.value)} className="px-3 py-1.5 text-sm rounded-lg border bg-background">
            <option value="all">{l('الكل','All')}</option>
            <option value="draft">{l('مسودة','Draft')}</option>
            <option value="scheduled">{l('مجدول','Scheduled')}</option>
            <option value="published">{l('منشور','Published')}</option>
          </select>
          {canCreate && <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-1" />{l('إضافة محتوى','Add Content')}</Button>}
        </div>
      </div>

      {/* Content items */}
      <div className="space-y-3">
        {visibleItems.length === 0 && (
          <div className="bg-card rounded-xl border p-10 text-center text-muted-foreground">
            <Film className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="mb-3">{l('لا يوجد محتوى في هذه الخطة بعد','No content in this plan yet')}</p>
            {canCreate && <Button variant="outline" size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-1" />{l('أضف أول محتوى','Add first content')}</Button>}
          </div>
        )}
        {visibleItems.map((item) => {
          const ti  = CONTENT_TYPES[item.type] ?? CONTENT_TYPES.post;
          const pi  = PLATFORMS[item.platform] ?? { label: item.platform, emoji: '📱' };
          const Ico = ti.icon;
          const title  = (language === 'ar' ? item.title_ar : item.title_en) || (language === 'ar' ? item.title_en : item.title_ar) || '—';
          const script = (language === 'ar' ? item.script_ar : item.script_en) || '';
          return (
            <div key={item.id} className="bg-card rounded-xl border p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start gap-4">
                <div className={`h-10 w-10 rounded-xl border flex items-center justify-center shrink-0 ${ti.bg}`}>
                  <Ico className={`h-5 w-5 ${ti.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-medium">{title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${ITEM_STATUS_STYLES[item.status]}`}>
                      {item.status === 'published' ? l('منشور','Published') : item.status === 'scheduled' ? l('مجدول','Scheduled') : l('مسودة','Draft')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2 flex-wrap">
                    <span className={ti.color}>{l(ti.ar,ti.en)}</span>
                    <span>{pi.emoji} {pi.label}</span>
                    <span>📅 {item.date} · ⏰ {item.time}</span>
                  </div>
                  {script && (
                    <p className="text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5 line-clamp-2 whitespace-pre-line">{script}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  {canEdit && item.status !== 'published' && (
                    <button onClick={() => advance(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors" title={l('تقدّم الحالة','Advance status')}>
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => { onDeleteItem(plan.id, item.id); toast.success(l('تم الحذف','Deleted')); }} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit item modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editItem ? l('تعديل المحتوى','Edit Content') : l('إضافة محتوى للخطة','Add Content to Plan')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('النوع','Type')}</label>
                <select value={form.type} onChange={field('type')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(CONTENT_TYPES).map(([k,v]) => <option key={k} value={k}>{l(v.ar,v.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المنصة','Platform')}</label>
                <select value={form.platform} onChange={field('platform')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(PLATFORMS).map(([k,v]) => <option key={k} value={k}>{v.emoji} {v.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('العنوان (عربي)','Title (Arabic)')}</label>
              <input value={form.title_ar} onChange={field('title_ar')} dir="rtl" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('العنوان (إنجليزي)','Title (English)')}</label>
              <input value={form.title_en} onChange={field('title_en')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('السكريبت (عربي)','Script (Arabic)')}</label>
              <textarea value={form.script_ar} onChange={field('script_ar')} dir="rtl" rows={4} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" placeholder={l('Hook:\nمحتوى:\nCTA:','Hook:\nContent:\nCTA:')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('السكريبت (إنجليزي)','Script (English)')}</label>
              <textarea value={form.script_en} onChange={field('script_en')} rows={3} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('التاريخ','Date')}</label>
                <input type="date" value={form.date} onChange={field('date')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الوقت','Time')}</label>
                <input type="time" value={form.time} onChange={field('time')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة','Status')}</label>
              <select value={form.status} onChange={field('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="draft">{l('مسودة','Draft')}</option>
                <option value="scheduled">{l('مجدول','Scheduled')}</option>
                <option value="published">{l('منشور','Published')}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setAddOpen(false)}>{l('إلغاء','Cancel')}</Button>
              <Button type="submit" className="flex-1">{editItem ? l('حفظ','Save') : l('إضافة','Add')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Link campaigns modal */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('ربط الحملات بالخطة', 'Link Campaigns to Plan')}</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-1 max-h-72 overflow-y-auto border rounded-lg p-2 bg-background">
            {campaigns.length === 0 && (
              <p className="text-xs text-muted-foreground p-2">{l('لا توجد حملات متاحة', 'No campaigns available')}</p>
            )}
            {campaigns.map(c => (
              <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1.5">
                <input type="checkbox" checked={linkSel.includes(c.id)} onChange={() => toggleLink(c.id)} className="rounded" />
                <span className="flex-1">{language === 'ar' ? c.name_ar : c.name_en}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] border ${CAMPAIGN_STATUS_STYLES[c.status] ?? CAMPAIGN_STATUS_STYLES.draft}`}>
                  {campaignStatusLabel(c.status, l)}
                </span>
              </label>
            ))}
          </div>
          <div className="flex gap-2 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setLinkOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
            <Button type="button" className="flex-1" onClick={saveLink}>{l('حفظ', 'Save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Root component ─────────────────────────────────────────────────────────────
const MarketingPlans = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const {
    marketingPlans, campaigns,
    addMarketingPlan, updateMarketingPlan, deleteMarketingPlan,
    addItemToPlan, updateItemInPlan, deleteItemFromPlan,
  } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const canCreate = hasPermission('create content plans');
  const canEdit   = hasPermission('edit content plans');
  const canDelete = hasPermission('delete content plans');

  const [activePlan, setActivePlan] = useState(null);
  const [newPlanOpen, setNewPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState(EMPTY_PLAN);

  const pf = (f) => (e) => setPlanForm(p => ({ ...p, [f]: e.target.value }));

  // Keep activePlan in sync with context (after item add/update/delete, re-pull)
  const currentPlan = activePlan ? marketingPlans.find(p => p.id === activePlan.id) ?? activePlan : null;

  const handleNewPlan = (ev) => {
    ev.preventDefault();
    if (!planForm.name_ar.trim() && !planForm.name_en.trim()) { toast.error(l('أدخل اسم الخطة','Enter plan name')); return; }
    addMarketingPlan({ ...planForm, month: Number(planForm.month), year: Number(planForm.year) });
    toast.success(l('تم إنشاء الخطة','Plan created'));
    setNewPlanOpen(false);
    setPlanForm(EMPTY_PLAN);
  };

  const handleDelete = (id) => {
    deleteMarketingPlan(id);
    toast.success(l('تم حذف الخطة','Plan deleted'));
  };

  if (currentPlan) {
    return (
      <PlanDetail
        plan={currentPlan}
        l={l}
        language={language}
        campaigns={campaigns}
        onBack={() => setActivePlan(null)}
        onUpdatePlan={updateMarketingPlan}
        onAddItem={addItemToPlan}
        onUpdateItem={updateItemInPlan}
        onDeleteItem={deleteItemFromPlan}
        canCreate={canCreate}
        canEdit={canEdit}
        canDelete={canDelete}
      />
    );
  }

  return (
    <>
      <PlansList
        l={l}
        language={language}
        plans={marketingPlans}
        campaigns={campaigns}
        onOpen={(plan) => setActivePlan(plan)}
        onDelete={handleDelete}
        onNew={() => setNewPlanOpen(true)}
        canCreate={canCreate}
        canDelete={canDelete}
      />

      {/* New plan modal */}
      <Dialog open={newPlanOpen} onOpenChange={setNewPlanOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إنشاء خطة تسويقية جديدة','Create New Marketing Plan')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleNewPlan} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم الخطة (عربي)','Plan Name (Arabic)')}</label>
              <input value={planForm.name_ar} onChange={pf('name_ar')} dir="rtl" className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('خطة التسويق — يوليو 2026','Marketing Plan — July 2026')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم الخطة (إنجليزي)','Plan Name (English)')}</label>
              <input value={planForm.name_en} onChange={pf('name_en')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder="Marketing Plan — July 2026" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الشهر','Month')}</label>
                <select value={planForm.month} onChange={pf('month')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {MONTH_EN.map((m, i) => <option key={i+1} value={i+1}>{language === 'ar' ? MONTH_AR[i] : m}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('السنة','Year')}</label>
                <input type="number" min="2025" max="2030" value={planForm.year} onChange={pf('year')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الهدف (عربي)','Goal (Arabic)')}</label>
              <textarea value={planForm.goal_ar} onChange={pf('goal_ar')} dir="rtl" rows={2} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" placeholder={l('زيادة المتابعين 20% وتوليد 50 عميل محتمل...','Grow followers 20% and generate 50 leads...')} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الهدف (إنجليزي)','Goal (English)')}</label>
              <textarea value={planForm.goal_en} onChange={pf('goal_en')} rows={2} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ربط الحملات (اختياري)','Link Campaigns (optional)')}</label>
              <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-background">
                {campaigns.map(c => (
                  <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/30 rounded px-2 py-1">
                    <input
                      type="checkbox"
                      checked={(planForm.campaign_ids ?? []).includes(c.id)}
                      onChange={(e) => setPlanForm(p => ({
                        ...p,
                        campaign_ids: e.target.checked
                          ? [...(p.campaign_ids ?? []), c.id]
                          : (p.campaign_ids ?? []).filter(id => id !== c.id),
                      }))}
                      className="rounded"
                    />
                    {language === 'ar' ? c.name_ar : c.name_en}
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة','Status')}</label>
              <select value={planForm.status} onChange={pf('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="draft">{l('مسودة','Draft')}</option>
                <option value="active">{l('نشطة','Active')}</option>
              </select>
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setNewPlanOpen(false)}>{l('إلغاء','Cancel')}</Button>
              <Button type="submit" className="flex-1">{l('إنشاء','Create')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MarketingPlans;
