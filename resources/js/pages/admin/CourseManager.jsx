import { useState, useEffect, useMemo, Fragment } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Check, X, Plus, Edit3, Star, StarOff, DollarSign, Send,
  Loader2, Copy, ExternalLink, Users, RefreshCw, Inbox, Search, Clock,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { courseAccessApi, clientApi } from '@/lib/api';
import { toast } from 'sonner';

const PLAN_COLORS = {
  'plan-1': { border: 'border-blue-500/40',   header: 'from-blue-500/15 to-blue-500/5',   accent: 'text-blue-400',   ring: 'ring-blue-500/30',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'plan-2': { border: 'border-primary/60',     header: 'from-primary/20 to-primary/5',    accent: 'text-primary',    ring: 'ring-primary/40',    badge: 'bg-primary/15 text-primary border-primary/30' },
  'plan-3': { border: 'border-amber-500/40',   header: 'from-amber-500/15 to-amber-500/5', accent: 'text-amber-400',  ring: 'ring-amber-500/30',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

const fallbackColor = { border: 'border-border', header: 'from-muted/30 to-muted/10', accent: 'text-foreground', ring: 'ring-border', badge: 'bg-muted text-muted-foreground border-border' };

const STATUS_COLOR = {
  active:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  expired: 'bg-muted/50 text-muted-foreground border-border',
  revoked: 'bg-red-500/10 text-red-400 border-red-500/20',
};

const REQ_STATUS = {
  pending:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
};

// ── Inline editable text field ─────────────────────────────────────────────────
const InlineEdit = ({ value, onSave, className = '', placeholder = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);

  const commit = () => {
    if (String(draft).trim()) onSave(String(draft).trim());
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className={`bg-background border rounded px-2 py-0.5 outline-none focus:ring-1 focus:ring-primary/50 ${className}`}
        autoFocus
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-text hover:underline decoration-dashed underline-offset-2 ${className} ${!value ? 'text-muted-foreground/40 italic' : ''}`}
      title="Click to edit"
    >
      {value || placeholder}
    </span>
  );
};

// ── Grant access modal (manual grant + "needs telegram" prefill) ────────────────
const AccessManagerModal = ({ open, onClose, plans, language, prefill }) => {
  const l  = (ar, en) => language === 'ar' ? ar : en;
  const qc = useQueryClient();

  const [chatId, setChatId]         = useState('');
  const [planId, setPlanId]         = useState('');
  const [days, setDays]             = useState(30);
  const [userId, setUserId]         = useState(null);
  const [search, setSearch]         = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [lastLinks, setLastLinks]   = useState([]);

  const selectedPlan = plans.find(p => String(p.id) === planId);

  // Apply the prefill (from a "needs telegram" approval) when the modal opens.
  useEffect(() => {
    if (!open) return;
    if (prefill) {
      const pid  = prefill.course_plan_id != null ? String(prefill.course_plan_id) : '';
      const plan = plans.find(p => String(p.id) === pid);
      setPlanId(pid);
      setUserId(prefill.user_id ?? null);
      setDays(plan?.access_days ?? 30);
      setChatId('');
    }
    setLastLinks([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefill]);

  const selectPlan = (pid) => {
    setPlanId(pid);
    const plan = plans.find(p => String(p.id) === pid);
    if (plan?.access_days) setDays(plan.access_days);
  };

  const { data: clientsRes } = useQuery({
    queryKey: ['clientsSearch', search],
    queryFn: async () => (await clientApi.list({ search, per_page: 10 })).data?.data ?? [],
    enabled: showSearch && search.length >= 2,
  });
  const clients = clientsRes ?? [];

  const grantMut = useMutation({
    mutationFn: (data) => courseAccessApi.grant(Number(planId), data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['allGrants'] });
      setLastLinks(res.data?.invite_links ?? []);
      toast.success(l('تم منح الوصول بنجاح', 'Access granted successfully'));
      setChatId(''); setSearch(''); setShowSearch(false); setUserId(null);
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? l('فشل منح الوصول', 'Failed to grant access')),
  });

  const copyLink = (url) => navigator.clipboard.writeText(url).then(() => toast.success(l('تم النسخ', 'Copied')));

  const reset = () => {
    setChatId(''); setPlanId(''); setDays(30); setUserId(null);
    setSearch(''); setShowSearch(false); setLastLinks([]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={reset}>
      <DialogContent className="max-w-xl max-h-[90vh] flex flex-col overflow-hidden p-0">
        <DialogHeader className="px-6 pt-5 pb-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {l('منح وصول تيليجرام', 'Grant Telegram Access')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {prefill?.user_name && (
            <div className="rounded-lg border border-primary/20 bg-primary/[0.05] px-3 py-2 text-xs">
              {l('منح الوصول لـ', 'Granting access for')}{' '}
              <span className="font-semibold text-primary">{prefill.user_name}</span>{' '}
              — {l('أدخل معرّف تيليجرام الرقمي الخاص به', 'enter their numeric Telegram ID')}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 block">{l('معرّف تيليجرام (Chat ID) *', 'Telegram Chat ID *')}</label>
              <input
                value={chatId}
                onChange={e => setChatId(e.target.value)}
                placeholder="123456789"
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm font-mono"
                type="number"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 block">{l('الباقة *', 'Course Plan *')}</label>
              <select
                value={planId}
                onChange={e => selectPlan(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              >
                <option value="">{l('— اختر باقة —', '— Select plan —')}</option>
                {plans.map(p => (
                  <option key={p.id} value={p.id} disabled={!p.bot_plan}>
                    {language === 'ar' ? p.name_ar : p.name_en}
                    {p.bot_plan ? ` (${p.bot_plan})` : l(' — غير مربوط', ' — not linked')}
                  </option>
                ))}
              </select>
              {selectedPlan && !selectedPlan.bot_plan && (
                <p className="text-[10px] text-amber-400 mt-0.5">{l('هذه الباقة غير مربوطة بخطة بوت', 'This plan has no bot plan linked')}</p>
              )}
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-muted-foreground mb-1 block">{l('مدة الوصول (أيام) *', 'Duration (days) *')}</label>
              <input
                type="number" min="1" max="3650"
                value={days} onChange={e => setDays(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
              />
            </div>

            <div className="col-span-2">
              <button
                type="button"
                onClick={() => setShowSearch(v => !v)}
                className="text-xs text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
              >
                <Users className="h-3 w-3" />
                {l('ابحث في العملاء لملء المعرّف تلقائياً', 'Search CRM to auto-fill ID')}
              </button>
              {showSearch && (
                <div className="mt-2">
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder={l('اسم أو بريد إلكتروني...', 'Name or email...')}
                    className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                    autoFocus
                  />
                  {clients.length > 0 && (
                    <div className="mt-1 rounded-lg border bg-background overflow-hidden max-h-32 overflow-y-auto">
                      {clients.map(c => (
                        <button
                          key={c.id}
                          onClick={() => {
                            if (c.telegram_chat_id) {
                              setChatId(String(c.telegram_chat_id));
                              setUserId(c.user_id ?? null);
                              setShowSearch(false); setSearch('');
                            } else {
                              toast.warning(l('هذا العميل ليس لديه معرّف تيليجرام', 'No Telegram ID on file'));
                            }
                          }}
                          className="w-full text-start px-3 py-2 text-sm hover:bg-primary/5 transition-colors border-b last:border-0 flex items-center gap-2"
                        >
                          <span className="font-medium">{c.name}</span>
                          <span className="text-xs text-muted-foreground">{c.email}</span>
                          {c.telegram_chat_id
                            ? <span className="ms-auto text-xs text-emerald-400 font-mono">{c.telegram_chat_id}</span>
                            : <span className="ms-auto text-xs text-amber-400">{l('بدون ID', 'No ID')}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Button
            className="w-full"
            disabled={!chatId || !planId || !days || !selectedPlan?.bot_plan || grantMut.isPending}
            onClick={() => grantMut.mutate({
              telegram_chat_id: Number(chatId),
              access_days: days,
              ...(userId ? { user_id: userId } : {}),
            })}
          >
            {grantMut.isPending ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : <Send className="h-4 w-4 me-2" />}
            {l('منح الوصول', 'Grant Access')}
          </Button>

          {lastLinks.length > 0 && (
            <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
              <p className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Check className="h-3 w-3" /> {l('روابط الدعوة', 'Invite Links')}
              </p>
              {lastLinks.map((lk, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="capitalize text-muted-foreground min-w-[80px]">{lk.channel}</span>
                  <span className="font-mono text-foreground flex-1 truncate text-[10px]">{lk.link}</span>
                  <button onClick={() => copyLink(lk.link)} className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 shrink-0"><Copy className="h-3.5 w-3.5" /></button>
                  <a href={lk.link} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-emerald-500/10 text-emerald-400 shrink-0"><ExternalLink className="h-3.5 w-3.5" /></a>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t shrink-0 flex justify-end">
          <Button variant="outline" onClick={reset}>{l('إغلاق', 'Close')}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ── Single plan card ────────────────────────────────────────────────────────────
const PlanCard = ({ plan, language, l, onUpdate, onToggleFeature, onUpdateFeatureText, onAddFeature, onDeleteFeature }) => {
  const colors = PLAN_COLORS[plan.id] ?? fallbackColor;

  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatAr, setNewFeatAr]         = useState('');
  const [newFeatEn, setNewFeatEn]         = useState('');

  const [editingPrice, setEditingPrice] = useState(false);
  const [draftPrice, setDraftPrice]     = useState(String(plan.price));

  const [editingDays, setEditingDays] = useState(false);
  const [draftDays, setDraftDays]     = useState(String(plan.access_days ?? 30));

  const commitPrice = () => {
    const p = Number(draftPrice);
    if (!isNaN(p) && p >= 0) { onUpdate({ ...plan, price: p }); toast.success(l('تم تحديث السعر', 'Price updated')); }
    else setDraftPrice(String(plan.price));
    setEditingPrice(false);
  };

  const commitDays = () => {
    const n = Number(draftDays);
    if (!isNaN(n) && n >= 1) { onUpdate({ ...plan, access_days: n }); toast.success(l('تم تحديث مدة الوصول', 'Access period updated')); }
    else setDraftDays(String(plan.access_days ?? 30));
    setEditingDays(false);
  };

  const handleAddFeature = () => {
    if (!newFeatAr.trim() && !newFeatEn.trim()) return;
    onAddFeature(plan.id, newFeatAr.trim(), newFeatEn.trim() || newFeatAr.trim());
    setNewFeatAr(''); setNewFeatEn(''); setAddingFeature(false);
    toast.success(l('تمت الإضافة', 'Feature added'));
  };

  const included = plan.features.filter(f => f.included).length;
  const total    = plan.features.length;

  return (
    <div className={`relative rounded-2xl border ${colors.border} ${plan.is_featured ? `ring-2 ${colors.ring}` : ''} bg-card flex flex-col overflow-hidden`}>
      {plan.is_featured && <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />}
      {plan.is_featured && (
        <div className="absolute top-3 end-3 text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">{l('الأشهر', 'Popular')}</div>
      )}

      <div className={`bg-gradient-to-b ${colors.header} px-5 pt-5 pb-4 border-b border-border/50`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 me-8">
            <div className="flex items-center gap-2 mb-1">
              <InlineEdit value={plan.label ?? ''} onSave={(v) => onUpdate({ ...plan, label: v })} className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`} placeholder="L1" />
              <InlineEdit value={language === 'ar' ? plan.name_ar : plan.name_en} onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'name_ar' : 'name_en']: v })} className={`text-lg font-bold ${colors.accent}`} placeholder="Plan name" />
            </div>
            <InlineEdit value={language === 'ar' ? (plan.subtitle_ar ?? '') : (plan.subtitle_en ?? '')} onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'subtitle_ar' : 'subtitle_en']: v })} className="text-xs text-muted-foreground" placeholder={l('العنوان الفرعي...', 'Subtitle...')} />
          </div>
          <div className="flex gap-1 shrink-0 mt-0.5">
            <button
              onClick={() => onUpdate({ ...plan, is_featured: !plan.is_featured })}
              className={`p-1.5 rounded-lg transition-colors ${plan.is_featured ? 'text-amber-400 hover:bg-amber-500/10' : 'text-muted-foreground hover:text-amber-400 hover:bg-amber-500/10'}`}
              title={l('تمييز كالأشهر', 'Mark as popular')}
            >
              {plan.is_featured ? <Star className="h-4 w-4 fill-current" /> : <StarOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-end gap-1">
          {editingPrice ? (
            <div className="flex items-center gap-1">
              <span className={`text-2xl font-bold ${colors.accent}`}>$</span>
              <input
                value={draftPrice}
                onChange={e => setDraftPrice(e.target.value)}
                onBlur={commitPrice}
                onKeyDown={e => { if (e.key === 'Enter') commitPrice(); if (e.key === 'Escape') { setDraftPrice(String(plan.price)); setEditingPrice(false); } }}
                className="text-2xl font-bold bg-background border rounded px-2 py-0.5 w-28 outline-none focus:ring-1 focus:ring-primary/50"
                type="number" min="0" autoFocus
              />
              <span className="text-sm text-muted-foreground mb-0.5">USD</span>
            </div>
          ) : (
            <button onClick={() => { setDraftPrice(String(plan.price)); setEditingPrice(true); }} className="flex items-end gap-1 group" title={l('انقر لتعديل السعر', 'Click to edit price')}>
              <span className={`text-3xl font-bold ${colors.accent}`}>${plan.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">USD <Edit3 className="inline h-3 w-3 ms-1 opacity-0 group-hover:opacity-100 transition-opacity" /></span>
            </button>
          )}
        </div>

        {/* Marketing access copy */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <span>⏱</span>
          <InlineEdit value={language === 'ar' ? (plan.access_ar ?? '') : (plan.access_en ?? '')} onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'access_ar' : 'access_en']: v })} className="text-xs text-muted-foreground" placeholder={l('وصف المدة...', 'Access copy...')} />
        </div>

        {/* Functional access period (days) used when granting */}
        <div className="flex items-center gap-1.5 mt-1.5 text-xs">
          <Clock className="h-3 w-3 text-primary/70" />
          <span className="text-muted-foreground">{l('مدة المنح:', 'Grant period:')}</span>
          {editingDays ? (
            <input
              value={draftDays}
              onChange={e => setDraftDays(e.target.value)}
              onBlur={commitDays}
              onKeyDown={e => { if (e.key === 'Enter') commitDays(); if (e.key === 'Escape') { setDraftDays(String(plan.access_days ?? 30)); setEditingDays(false); } }}
              className="w-16 bg-background border rounded px-1.5 py-0.5 text-xs outline-none focus:ring-1 focus:ring-primary/50"
              type="number" min="1" max="3650" autoFocus
            />
          ) : (
            <button onClick={() => { setDraftDays(String(plan.access_days ?? 30)); setEditingDays(true); }} className="font-semibold text-foreground hover:underline decoration-dashed underline-offset-2" title={l('انقر لتعديل المدة', 'Click to edit')}>
              {plan.access_days ?? 30}
            </button>
          )}
          <span className="text-muted-foreground">{l('يوم', 'days')}</span>
        </div>

        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => { onUpdate({ ...plan, status: plan.status === 'active' ? 'inactive' : 'active' }); toast.success(l('تم التحديث', 'Updated')); }}
            className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${plan.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'}`}
          >
            {plan.status === 'active' ? l('● نشط', '● Active') : l('○ غير نشط', '○ Inactive')}
          </button>
          <span className="text-xs text-muted-foreground">{included}/{total} {l('ميزات مفعّلة', 'features enabled')}</span>
          {plan.bot_plan && <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-primary/5 text-primary/70 border-primary/20 capitalize ms-auto">{plan.bot_plan}</span>}
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 px-4 py-3 space-y-1">
        {plan.features.map(feature => (
          <div key={feature.id} className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30 ${!feature.included ? 'opacity-50' : ''}`}>
            <button
              onClick={() => onToggleFeature(plan.id, feature.id)}
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${feature.included ? `border-current ${colors.accent} bg-current/10` : 'border-muted-foreground/40 text-muted-foreground/40'}`}
            >
              {feature.included && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>
            <span className={`flex-1 text-sm ${!feature.included ? 'line-through text-muted-foreground' : ''}`}>
              <InlineEdit value={language === 'ar' ? feature.text_ar : feature.text_en} onSave={(v) => onUpdateFeatureText(plan.id, feature.id, language === 'ar' ? v : feature.text_ar, language === 'ar' ? feature.text_en : v)} className="text-sm" placeholder="Feature text" />
            </span>
            <button onClick={() => { onDeleteFeature(plan.id, feature.id); toast.success(l('تم الحذف', 'Deleted')); }} className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all shrink-0">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {addingFeature ? (
          <div className="border rounded-xl p-3 mt-2 space-y-2 bg-muted/20">
            <input value={newFeatAr} onChange={e => setNewFeatAr(e.target.value)} placeholder={l('نص الميزة (عربي) *', 'Feature text (Arabic) *')} dir="rtl" className="w-full text-sm px-2.5 py-1.5 rounded-lg border bg-background" autoFocus />
            <input value={newFeatEn} onChange={e => setNewFeatEn(e.target.value)} placeholder="Feature text (English)" className="w-full text-sm px-2.5 py-1.5 rounded-lg border bg-background" onKeyDown={e => { if (e.key === 'Enter') handleAddFeature(); if (e.key === 'Escape') setAddingFeature(false); }} />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddFeature}>{l('إضافة', 'Add')}</Button>
              <button onClick={() => { setAddingFeature(false); setNewFeatAr(''); setNewFeatEn(''); }} className="px-2 text-muted-foreground hover:text-foreground text-xs rounded-lg border hover:bg-muted transition-colors">{l('إلغاء', 'Cancel')}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAddingFeature(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors w-full mt-1">
            <Plus className="h-3.5 w-3.5" />{l('إضافة ميزة', 'Add feature')}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Join requests panel ─────────────────────────────────────────────────────────
const RequestsPanel = ({ requests, onApprove, onDecline, onConnect, busyId, language, l }) => {
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="rounded-2xl border border-primary/15 bg-card p-5">
      <div className="mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <Inbox className="h-4 w-4 text-primary" />
          {l('طلبات الانضمام', 'Join Requests')}
          {pendingCount > 0 && <span className="ms-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 text-[10px] font-bold">{pendingCount} {l('قيد الانتظار', 'pending')}</span>}
        </h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          {l('وافق أو ارفض طلبات العملاء. عند الموافقة يُمنح الوصول تلقائياً إن كان لديهم معرّف تيليجرام.',
             'Approve or decline requests. On approval, access is granted automatically when a Telegram ID is on file.')}
        </p>
      </div>

      {requests.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic text-center py-6">{l('لا توجد طلبات بعد', 'No requests yet')}</p>
      ) : (
        <div className="space-y-2">
          {requests.map(r => {
            const busy = busyId === r.id;
            return (
              <div key={r.id} className="rounded-xl border bg-background/40 p-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{r.user_name}</span>
                    <span className="text-xs text-muted-foreground truncate">{r.user_email}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-muted-foreground">{language === 'ar' ? r.plan_name_ar : r.plan_name_en}</span>
                    {r.has_telegram ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-emerald-500/10 text-emerald-400 border-emerald-500/30 inline-flex items-center gap-1">
                        <Send className="h-2.5 w-2.5" />{l('تيليجرام', 'Telegram')} · {r.telegram_chat_id}
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30 inline-flex items-center gap-1">
                        <Send className="h-2.5 w-2.5" />{l('بدون تيليجرام', 'No Telegram')}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60">{r.created_at ? new Date(r.created_at).toLocaleDateString() : ''}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {r.status === 'pending' ? (
                    <>
                      <Button size="sm" className="h-7 text-xs px-2.5 bg-emerald-600 hover:bg-emerald-600/90 text-white" disabled={busy} onClick={() => onApprove(r)}>
                        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Check className="h-3.5 w-3.5 me-1" />{l('موافقة', 'Approve')}</>}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs px-2.5 text-destructive border-destructive/30 hover:bg-destructive/10" disabled={busy} onClick={() => onDecline(r)}>
                        <X className="h-3.5 w-3.5 me-1" />{l('رفض', 'Decline')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${REQ_STATUS[r.status]}`}>
                        {r.status === 'approved' ? l('مقبول', 'Approved') : l('مرفوض', 'Rejected')}
                      </span>
                      {r.status === 'approved' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs px-2.5" title={l('ربط عبر تيليجرام', 'Connect via Telegram')} onClick={() => onConnect(r)}>
                          <Send className="h-3.5 w-3.5 me-1" />{l('ربط', 'Connect')}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Current access table (page-level, searchable + filterable) ──────────────────
const AccessTable = ({ plans, language, l }) => {
  const qc = useQueryClient();
  const [search, setSearch]             = useState('');
  const [planFilter, setPlanFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [extendingId, setExtendingId]   = useState(null);
  const [addDays, setAddDays]           = useState(30);
  const [linksFor, setLinksFor]         = useState(null);

  const { data: grants = [], isLoading, refetch } = useQuery({
    queryKey: ['allGrants'],
    queryFn: async () => (await courseAccessApi.allGrants()).data?.data ?? [],
  });

  const extendMut = useMutation({
    mutationFn: ({ grant, addDays }) => courseAccessApi.extend(grant.course_plan?.id ?? grant.course_plan_id, grant.id, { add_days: addDays }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['allGrants'] }); toast.success(l('تم تمديد الوصول', 'Access extended')); setExtendingId(null); },
    onError: () => toast.error(l('فشل التمديد', 'Extend failed')),
  });
  const revokeMut = useMutation({
    mutationFn: (grant) => courseAccessApi.revoke(grant.course_plan?.id ?? grant.course_plan_id, grant.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['allGrants'] }); toast.success(l('تم سحب الوصول', 'Access revoked')); },
    onError: () => toast.error(l('فشل السحب', 'Revoke failed')),
  });

  const copyLink = (url) => navigator.clipboard.writeText(url).then(() => toast.success(l('تم النسخ', 'Copied')));

  const filtered = useMemo(() => grants.filter(g => {
    if (planFilter !== 'all' && String(g.course_plan?.id) !== planFilter) return false;
    if (statusFilter !== 'all' && g.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hay = `${g.telegram_chat_id} ${g.user?.name ?? ''} ${g.user?.email ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }), [grants, planFilter, statusFilter, search]);

  return (
    <div className="rounded-2xl border border-primary/15 bg-card p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-semibold flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          {l('الوصول الحالي', 'Current Access')}
          <span className="ms-1 px-1.5 py-0.5 rounded-full bg-muted text-[10px] font-normal">{filtered.length}</span>
        </h2>
        <button onClick={() => refetch()} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><RefreshCw className="h-3.5 w-3.5" /></button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <div className="relative flex-1 min-w-[180px]">
          <Search className={`absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder={l('ابحث بالمعرّف أو الاسم...', 'Search by ID or name...')}
            className={`w-full h-9 rounded-lg border bg-background text-sm ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
          />
        </div>
        <select value={planFilter} onChange={e => setPlanFilter(e.target.value)} className="h-9 rounded-lg border bg-background text-sm px-3">
          <option value="all">{l('كل الباقات', 'All plans')}</option>
          {plans.map(p => <option key={p.id} value={p.id}>{language === 'ar' ? p.name_ar : p.name_en}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-9 rounded-lg border bg-background text-sm px-3">
          <option value="all">{l('كل الحالات', 'All statuses')}</option>
          <option value="active">{l('نشط', 'Active')}</option>
          <option value="expired">{l('منتهٍ', 'Expired')}</option>
          <option value="revoked">{l('مسحوب', 'Revoked')}</option>
        </select>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center"><Loader2 className="h-4 w-4 animate-spin" />{l('جارٍ التحميل...', 'Loading...')}</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground/60 italic text-center py-8">{l('لا يوجد وصول مطابق', 'No matching access')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground border-b">
                <th className="text-start font-medium py-2 px-2">{l('معرّف تيليجرام', 'Telegram ID')}</th>
                <th className="text-start font-medium py-2 px-2">{l('العضو', 'Member')}</th>
                <th className="text-start font-medium py-2 px-2">{l('الباقة', 'Plan')}</th>
                <th className="text-start font-medium py-2 px-2">{l('الحالة', 'Status')}</th>
                <th className="text-start font-medium py-2 px-2">{l('ينتهي', 'Expires')}</th>
                <th className="text-end font-medium py-2 px-2">{l('إجراءات', 'Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <Fragment key={g.id}>
                  <tr className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2.5 px-2 font-mono text-xs">{g.telegram_chat_id}</td>
                    <td className="py-2.5 px-2">
                      <div className="min-w-0">
                        <span className="block truncate">{g.user?.name ?? '—'}</span>
                        {g.user?.email && <span className="block text-[10px] text-muted-foreground truncate">{g.user.email}</span>}
                      </div>
                    </td>
                    <td className="py-2.5 px-2">
                      <span className="text-xs">{language === 'ar' ? g.course_plan?.name_ar : g.course_plan?.name_en}</span>
                      {g.bot_plan && <span className="ms-1.5 text-[10px] px-1.5 py-0.5 rounded-full border bg-primary/5 text-primary/70 border-primary/20 capitalize">{g.bot_plan}</span>}
                    </td>
                    <td className="py-2.5 px-2"><span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${STATUS_COLOR[g.status] ?? ''}`}>{g.status}</span></td>
                    <td className="py-2.5 px-2 text-xs text-muted-foreground">{g.expires_at ? new Date(g.expires_at).toLocaleDateString() : '—'}</td>
                    <td className="py-2.5 px-2">
                      <div className="flex items-center gap-1 justify-end">
                        {g.invite_links?.length > 0 && (
                          <button onClick={() => setLinksFor(g)} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title={l('عرض الروابط', 'View links')}><ExternalLink className="h-3.5 w-3.5" /></button>
                        )}
                        <button onClick={() => { setExtendingId(extendingId === g.id ? null : g.id); setAddDays(30); }} className="p-1 rounded text-muted-foreground hover:text-primary transition-colors" title={l('تمديد', 'Extend')}><RefreshCw className="h-3.5 w-3.5" /></button>
                        {g.status !== 'revoked' && (
                          <button onClick={() => revokeMut.mutate(g)} disabled={revokeMut.isPending} className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors" title={l('سحب', 'Revoke')}><X className="h-3.5 w-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {extendingId === g.id && (
                    <tr className="bg-muted/10">
                      <td colSpan={6} className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{l('إضافة أيام:', 'Add days:')}</span>
                          <input type="number" min="1" max="3650" value={addDays} onChange={e => setAddDays(Number(e.target.value))} className="w-20 px-2 py-1 rounded-lg border bg-background text-sm text-center" autoFocus />
                          <Button size="sm" className="h-7 text-xs px-3" disabled={!addDays || extendMut.isPending} onClick={() => extendMut.mutate({ grant: g, addDays })}>
                            {extendMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : l('تمديد', 'Extend')}
                          </Button>
                          <button onClick={() => setExtendingId(null)} className="text-xs text-muted-foreground hover:text-foreground">{l('إلغاء', 'Cancel')}</button>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite links dialog */}
      <Dialog open={!!linksFor} onOpenChange={() => setLinksFor(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-sm">{l('روابط الدعوة', 'Invite Links')}</DialogTitle></DialogHeader>
          <div className="space-y-2">
            {(linksFor?.invite_links ?? []).map((lk, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <span className="capitalize text-muted-foreground min-w-[80px]">{lk.channel}</span>
                <span className="font-mono flex-1 truncate text-[10px]">{lk.link}</span>
                <button onClick={() => copyLink(lk.link)} className="p-1 rounded hover:bg-primary/10 text-primary shrink-0"><Copy className="h-3.5 w-3.5" /></button>
                <a href={lk.link} target="_blank" rel="noreferrer" className="p-1 rounded hover:bg-primary/10 text-primary shrink-0"><ExternalLink className="h-3.5 w-3.5" /></a>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────────
const CourseManager = () => {
  const { language } = useLanguage();
  const {
    coursePlans,
    updateCoursePlan, toggleFeature, updateFeatureText, addFeatureToPlan, deleteFeature,
    courseRequests, reviewCourseRequest,
  } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [accessOpen, setAccessOpen] = useState(false);
  const [prefill, setPrefill]       = useState(null);
  const [busyId, setBusyId]         = useState(null);

  const openGrant  = (pf = null) => { setPrefill(pf); setAccessOpen(true); };
  const closeGrant = () => { setAccessOpen(false); setPrefill(null); };

  const handleApprove = async (r) => {
    setBusyId(r.id);
    try {
      const res = await reviewCourseRequest(r.id, 'approved');
      if (res?.needs_telegram) {
        toast.info(l('تمت الموافقة — أضِف معرّف تيليجرام لمنح الوصول', 'Approved — add a Telegram ID to grant access'));
        openGrant(res.grant_context);
      } else if (res?.needs_bot_plan) {
        toast.warning(l('تمت الموافقة، لكن الباقة غير مربوطة بخطة بوت', "Approved, but this plan isn't linked to a bot plan"));
      } else if (res?.auto_granted) {
        toast.success(l('تمت الموافقة ومُنح الوصول تلقائياً', 'Approved — access granted automatically'));
      } else {
        toast.success(l('تمت الموافقة', 'Approved'));
      }
    } catch {
      toast.error(l('فشل تنفيذ الإجراء', 'Action failed'));
    } finally {
      setBusyId(null);
    }
  };

  const handleDecline = async (r) => {
    setBusyId(r.id);
    try { await reviewCourseRequest(r.id, 'rejected'); toast.success(l('تم الرفض', 'Declined')); }
    catch { toast.error(l('فشل تنفيذ الإجراء', 'Action failed')); }
    finally { setBusyId(null); }
  };

  const handleConnect = (r) => openGrant({ user_id: r.user_id, user_name: r.user_name, course_plan_id: r.course_plan_id });

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('إدارة باقات الدورة', 'Course Plans Manager')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('عدّل السعر والميزات ومدة المنح لكل باقة — انقر على أي نص لتعديله مباشرة', "Edit price, features and grant period per plan — click any text to edit it directly")}
          </p>
        </div>
        <Button onClick={() => openGrant()} className="shrink-0 flex items-center gap-2">
          <Send className="h-4 w-4" />{l('منح وصول', 'Grant Access')}
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border">
        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" />{l('انقر على الدائرة لتفعيل/إيقاف الميزة', 'Click the circle to toggle a feature')}</span>
        <span className="flex items-center gap-1.5"><Edit3 className="h-3.5 w-3.5 text-primary" />{l('انقر على أي نص لتعديله', 'Click any text to edit it')}</span>
        <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-primary" />{l('مدة المنح تُستخدم عند منح الوصول', 'Grant period is used when granting access')}</span>
        <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />{l('النجمة تضع شارة "الأشهر"', 'Star marks as "Popular"')}</span>
      </div>

      <RequestsPanel
        requests={courseRequests}
        onApprove={handleApprove}
        onDecline={handleDecline}
        onConnect={handleConnect}
        busyId={busyId}
        language={language}
        l={l}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {coursePlans.map(plan => (
          <PlanCard
            key={plan.id}
            plan={plan}
            language={language}
            l={l}
            onUpdate={updateCoursePlan}
            onToggleFeature={toggleFeature}
            onUpdateFeatureText={updateFeatureText}
            onAddFeature={addFeatureToPlan}
            onDeleteFeature={deleteFeature}
          />
        ))}
      </div>

      <AccessTable plans={coursePlans} language={language} l={l} />

      <AccessManagerModal
        open={accessOpen}
        onClose={closeGrant}
        plans={coursePlans}
        language={language}
        prefill={prefill}
      />
    </div>
  );
};

export default CourseManager;
