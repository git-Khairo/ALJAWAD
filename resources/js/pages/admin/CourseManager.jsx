import { useState, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Check, X, Plus, Edit3, Star, StarOff, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const PLAN_COLORS = {
  'plan-1': { border: 'border-blue-500/40',   header: 'from-blue-500/15 to-blue-500/5',   accent: 'text-blue-400',   ring: 'ring-blue-500/30',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  'plan-2': { border: 'border-primary/60',     header: 'from-primary/20 to-primary/5',    accent: 'text-primary',    ring: 'ring-primary/40',    badge: 'bg-primary/15 text-primary border-primary/30' },
  'plan-3': { border: 'border-amber-500/40',   header: 'from-amber-500/15 to-amber-500/5', accent: 'text-amber-400',  ring: 'ring-amber-500/30',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
};

const fallbackColor = { border: 'border-border', header: 'from-muted/30 to-muted/10', accent: 'text-foreground', ring: 'ring-border', badge: 'bg-muted text-muted-foreground border-border' };

// ── Inline editable text field ─────────────────────────────────────────────────
const InlineEdit = ({ value, onSave, className = '', placeholder = '' }) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]     = useState(value);
  const inputRef              = useRef(null);

  const commit = () => {
    if (draft.trim()) onSave(draft.trim());
    else setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
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

// ── Single plan card ────────────────────────────────────────────────────────────
const PlanCard = ({ plan, language, l, onUpdate, onToggleFeature, onUpdateFeatureText, onAddFeature, onDeleteFeature }) => {
  const colors = PLAN_COLORS[plan.id] ?? fallbackColor;

  // New feature inline state
  const [addingFeature, setAddingFeature] = useState(false);
  const [newFeatAr, setNewFeatAr]         = useState('');
  const [newFeatEn, setNewFeatEn]         = useState('');

  // Price edit state
  const [editingPrice, setEditingPrice] = useState(false);
  const [draftPrice, setDraftPrice]     = useState(String(plan.price));

  const commitPrice = () => {
    const p = Number(draftPrice);
    if (!isNaN(p) && p >= 0) { onUpdate({ ...plan, price: p }); toast.success(l('تم تحديث السعر', 'Price updated')); }
    else setDraftPrice(String(plan.price));
    setEditingPrice(false);
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
      {/* Featured banner */}
      {plan.is_featured && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
      )}
      {plan.is_featured && (
        <div className="absolute top-3 end-3 text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground font-semibold">
          {l('الأشهر', 'Popular')}
        </div>
      )}

      {/* Header */}
      <div className={`bg-gradient-to-b ${colors.header} px-5 pt-5 pb-4 border-b border-border/50`}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 me-8">
            {/* Label badge + plan name */}
            <div className="flex items-center gap-2 mb-1">
              <InlineEdit
                value={plan.label ?? ''}
                onSave={(v) => onUpdate({ ...plan, label: v })}
                className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}
                placeholder="L1"
              />
              <InlineEdit
                value={language === 'ar' ? plan.name_ar : plan.name_en}
                onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'name_ar' : 'name_en']: v })}
                className={`text-lg font-bold ${colors.accent}`}
                placeholder="Plan name"
              />
            </div>
            {/* Subtitle */}
            <InlineEdit
              value={language === 'ar' ? (plan.subtitle_ar ?? '') : (plan.subtitle_en ?? '')}
              onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'subtitle_ar' : 'subtitle_en']: v })}
              className="text-xs text-muted-foreground"
              placeholder={l('العنوان الفرعي...', 'Subtitle...')}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-1 shrink-0 mt-0.5">
            <button
              onClick={() => { onUpdate({ ...plan, is_featured: !plan.is_featured }); }}
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
                type="number"
                min="0"
                autoFocus
              />
              <span className="text-sm text-muted-foreground mb-0.5">USD</span>
            </div>
          ) : (
            <button
              onClick={() => { setDraftPrice(String(plan.price)); setEditingPrice(true); }}
              className="flex items-end gap-1 group"
              title={l('انقر لتعديل السعر', 'Click to edit price')}
            >
              <span className={`text-3xl font-bold ${colors.accent}`}>${plan.price.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground mb-1 group-hover:text-foreground transition-colors">
                USD <Edit3 className="inline h-3 w-3 ms-1 opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
            </button>
          )}
        </div>

        {/* Access duration */}
        <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
          <span>⏱</span>
          <InlineEdit
            value={language === 'ar' ? (plan.access_ar ?? '') : (plan.access_en ?? '')}
            onSave={(v) => onUpdate({ ...plan, [language === 'ar' ? 'access_ar' : 'access_en']: v })}
            className="text-xs text-muted-foreground"
            placeholder={l('مدة الوصول...', 'Access duration...')}
          />
        </div>

        {/* Status + stats */}
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={() => { onUpdate({ ...plan, status: plan.status === 'active' ? 'inactive' : 'active' }); toast.success(l('تم التحديث', 'Updated')); }}
            className={`text-xs px-2 py-0.5 rounded-full border font-medium transition-colors ${
              plan.status === 'active'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
            }`}
          >
            {plan.status === 'active' ? l('● نشط', '● Active') : l('○ غير نشط', '○ Inactive')}
          </button>
          <span className="text-xs text-muted-foreground">
            {included}/{total} {l('ميزات مفعّلة', 'features enabled')}
          </span>
        </div>
      </div>

      {/* Features list */}
      <div className="flex-1 px-4 py-3 space-y-1">
        {plan.features.map(feature => (
          <div
            key={feature.id}
            className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-muted/30 ${!feature.included ? 'opacity-50' : ''}`}
          >
            {/* Included toggle */}
            <button
              onClick={() => onToggleFeature(plan.id, feature.id)}
              className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                feature.included
                  ? `border-current ${colors.accent} bg-current/10`
                  : 'border-muted-foreground/40 text-muted-foreground/40'
              }`}
            >
              {feature.included && <Check className="h-3 w-3" strokeWidth={3} />}
            </button>

            {/* Feature text */}
            <span className={`flex-1 text-sm ${!feature.included ? 'line-through text-muted-foreground' : ''}`}>
              <InlineEdit
                value={language === 'ar' ? feature.text_ar : feature.text_en}
                onSave={(v) => onUpdateFeatureText(
                  plan.id, feature.id,
                  language === 'ar' ? v : feature.text_ar,
                  language === 'ar' ? feature.text_en : v,
                )}
                className="text-sm"
                placeholder="Feature text"
              />
            </span>

            {/* Delete */}
            <button
              onClick={() => { onDeleteFeature(plan.id, feature.id); toast.success(l('تم الحذف', 'Deleted')); }}
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-muted-foreground hover:text-destructive transition-all shrink-0"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {/* Add new feature */}
        {addingFeature ? (
          <div className="border rounded-xl p-3 mt-2 space-y-2 bg-muted/20">
            <input
              value={newFeatAr}
              onChange={e => setNewFeatAr(e.target.value)}
              placeholder={l('نص الميزة (عربي) *', 'Feature text (Arabic) *')}
              dir="rtl"
              className="w-full text-sm px-2.5 py-1.5 rounded-lg border bg-background"
              autoFocus
            />
            <input
              value={newFeatEn}
              onChange={e => setNewFeatEn(e.target.value)}
              placeholder="Feature text (English)"
              className="w-full text-sm px-2.5 py-1.5 rounded-lg border bg-background"
              onKeyDown={e => { if (e.key === 'Enter') handleAddFeature(); if (e.key === 'Escape') setAddingFeature(false); }}
            />
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 h-7 text-xs" onClick={handleAddFeature}>{l('إضافة', 'Add')}</Button>
              <button onClick={() => { setAddingFeature(false); setNewFeatAr(''); setNewFeatEn(''); }} className="px-2 text-muted-foreground hover:text-foreground text-xs rounded-lg border hover:bg-muted transition-colors">
                {l('إلغاء', 'Cancel')}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingFeature(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors w-full mt-1"
          >
            <Plus className="h-3.5 w-3.5" />{l('إضافة ميزة', 'Add feature')}
          </button>
        )}
      </div>
    </div>
  );
};

// ── Page ────────────────────────────────────────────────────────────────────────
const CourseManager = () => {
  const { language } = useLanguage();
  const {
    coursePlans,
    updateCoursePlan, toggleFeature, updateFeatureText, addFeatureToPlan, deleteFeature,
  } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">{l('إدارة باقات الدورة', 'Course Plans Manager')}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {l(
            'عدّل السعر والميزات وما هو مدرج في كل باقة — انقر على أي نص لتعديله مباشرة',
            'Edit price, features, and what\'s included per plan — click any text to edit it directly'
          )}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground bg-muted/30 rounded-xl px-4 py-3 border">
        <span className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" />{l('انقر على الدائرة لتفعيل/إيقاف الميزة', 'Click the circle to enable/disable a feature')}</span>
        <span className="flex items-center gap-1.5"><Edit3 className="h-3.5 w-3.5 text-primary" />{l('انقر على أي نص لتعديله', 'Click any text to edit it')}</span>
        <span className="flex items-center gap-1.5"><DollarSign className="h-3.5 w-3.5 text-amber-400" />{l('انقر على السعر لتغييره', 'Click the price to change it')}</span>
        <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-amber-400" />{l('النجمة تضع شارة "الأشهر"', 'Star marks as "Popular"')}</span>
      </div>

      {/* Three plan cards */}
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
    </div>
  );
};

export default CourseManager;
