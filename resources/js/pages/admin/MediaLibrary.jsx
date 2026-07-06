import { useState, useMemo, useRef } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, Lightbulb, Video, Image, Link, GripVertical, X } from 'lucide-react';
import { toast } from 'sonner';

const CATEGORIES = {
  idea:        { ar: 'فكرة',        en: 'Idea',        icon: Lightbulb, color: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/25',  dot: 'bg-amber-400' },
  video_draft: { ar: 'مسودة فيديو', en: 'Video Draft', icon: Video,     color: 'text-pink-400',   bg: 'bg-pink-500/10 border-pink-500/25',    dot: 'bg-pink-400' },
  image:       { ar: 'صورة/موود',   en: 'Image/Mood',  icon: Image,     color: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/25',    dot: 'bg-blue-400' },
  reference:   { ar: 'مرجع/مثال',   en: 'Reference',   icon: Link,      color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/25', dot: 'bg-violet-400' },
};

const COLUMNS = [
  { key: 'inbox',       ar: 'الوارد',       en: 'Inbox',       accent: 'border-t-muted-foreground/40',    countBg: 'bg-muted text-muted-foreground' },
  { key: 'in_progress', ar: 'قيد التنفيذ',  en: 'In Progress', accent: 'border-t-amber-500',              countBg: 'bg-amber-500/15 text-amber-400' },
  { key: 'done',        ar: 'منجز',         en: 'Done',        accent: 'border-t-emerald-500',            countBg: 'bg-emerald-500/15 text-emerald-400' },
];

const EMPTY_FORM = { category: 'idea', title: '', notes: '', status: 'inbox', tags: '' };

const MediaLibrary = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const { mediaItems, addMediaItem, updateMediaItem, deleteMediaItem } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem]   = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);

  // Inline quick-add per column
  const [quickAdd, setQuickAdd]   = useState(null); // column key
  const [quickTitle, setQuickTitle] = useState('');
  const quickRef = useRef(null);

  // Drag state
  const [dragId, setDragId]         = useState(null);
  const [dragOver, setDragOver]     = useState(null); // column key

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const openEdit = (item) => {
    setEditItem(item);
    setForm({ ...item, tags: (item.tags ?? []).join(', ') });
    setModalOpen(true);
  };

  const openAdd = (defaultStatus = 'inbox') => {
    setEditItem(null);
    setForm({ ...EMPTY_FORM, status: defaultStatus });
    setModalOpen(true);
  };

  const handleSave = (ev) => {
    ev.preventDefault();
    if (!form.title.trim()) { toast.error(l('أدخل عنواناً', 'Enter a title')); return; }
    const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [];
    const payload = { ...form, tags };
    if (editItem) {
      updateMediaItem({ ...payload, id: editItem.id, created_at: editItem.created_at });
      toast.success(l('تم التحديث', 'Updated'));
    } else {
      addMediaItem(payload);
      toast.success(l('تمت الإضافة', 'Added'));
    }
    setModalOpen(false);
  };

  const handleQuickAdd = (colKey) => {
    if (!quickTitle.trim()) { setQuickAdd(null); return; }
    addMediaItem({ category: 'idea', title: quickTitle.trim(), notes: '', status: colKey, tags: [] });
    setQuickTitle('');
    setQuickAdd(null);
    toast.success(l('تمت الإضافة', 'Added'));
  };

  // ── Drag & Drop ────────────────────────────────────────────────────────────
  const handleDragStart = (e, id) => {
    setDragId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => { setDragId(null); setDragOver(null); };

  const handleDragOver = (e, colKey) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(colKey);
  };

  const handleDrop = (e, colKey) => {
    e.preventDefault();
    if (dragId) {
      const item = mediaItems.find(i => i.id === dragId);
      if (item && item.status !== colKey) {
        updateMediaItem({ ...item, status: colKey });
        toast.success(l('تم النقل', 'Moved'));
      }
    }
    setDragId(null);
    setDragOver(null);
  };

  // Group items by column
  const byCol = useMemo(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.key] = mediaItems.filter(i => i.status === c.key); });
    return map;
  }, [mediaItems]);

  return (
    <div className="space-y-5 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{l('لوحة الأفكار والمسودات', 'Ideas & Drafts Board')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('مساحة كانبان لتنظيم الأفكار والمسودات والمراجع', 'Kanban space for ideas, drafts, and references')}
          </p>
        </div>
        {hasPermission('create media library') && (
          <Button size="sm" onClick={() => openAdd()}>
            <Plus className="h-4 w-4 me-1" />{l('إضافة بطاقة', 'Add Card')}
          </Button>
        )}
      </div>

      {/* Category legend */}
      <div className="flex flex-wrap gap-3">
        {Object.entries(CATEGORIES).map(([k, v]) => {
          const Icon = v.icon;
          const count = mediaItems.filter(i => i.category === k).length;
          return (
            <span key={k} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={`h-2.5 w-2.5 rounded-full ${v.dot}`} />
              <Icon className={`h-3.5 w-3.5 ${v.color}`} />
              {l(v.ar, v.en)} · {count}
            </span>
          );
        })}
      </div>

      {/* Kanban columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map(col => {
          const items = byCol[col.key] ?? [];
          const isOver = dragOver === col.key;
          return (
            <div
              key={col.key}
              onDragOver={(e) => handleDragOver(e, col.key)}
              onDrop={(e) => handleDrop(e, col.key)}
              onDragLeave={() => setDragOver(null)}
              className={`flex flex-col gap-0 rounded-2xl border-t-2 transition-colors ${col.accent} ${isOver ? 'bg-primary/5 ring-1 ring-primary/30' : 'bg-muted/20'}`}
            >
              {/* Column header */}
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{l(col.ar, col.en)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${col.countBg}`}>{items.length}</span>
                </div>
                {hasPermission('create media library') && (
                  <button
                    onClick={() => { setQuickAdd(col.key); setQuickTitle(''); setTimeout(() => quickRef.current?.focus(), 50); }}
                    className="p-1 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 px-2 pb-2 min-h-[120px]">
                {items.map(item => {
                  const cat  = CATEGORIES[item.category] ?? CATEGORIES.idea;
                  const Icon = cat.icon;
                  const isDragging = dragId === item.id;
                  return (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, item.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => !isDragging && openEdit(item)}
                      className={`bg-card rounded-xl border p-3 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all select-none ${isDragging ? 'opacity-40 scale-95' : ''}`}
                    >
                      {/* Card header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          <div className={`h-6 w-6 rounded-lg border flex items-center justify-center shrink-0 ${cat.bg}`}>
                            <Icon className={`h-3 w-3 ${cat.color}`} />
                          </div>
                          <span className="text-xs font-semibold truncate">{item.title}</span>
                        </div>
                        {hasPermission('delete media library') && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMediaItem(item.id); toast.success(l('تم الحذف','Deleted')); }}
                            className="p-0.5 rounded text-muted-foreground/40 hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {/* Notes */}
                      {item.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed ps-5">
                          {item.notes}
                        </p>
                      )}

                      {/* Tags + date */}
                      {(item.tags?.length > 0 || item.created_at) && (
                        <div className="flex items-center justify-between gap-1 ps-5 flex-wrap">
                          <div className="flex flex-wrap gap-1">
                            {(item.tags ?? []).slice(0, 2).map(tag => (
                              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary leading-none">{tag}</span>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground/50">{item.created_at}</span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Drop zone indicator */}
                {isOver && dragId && (
                  <div className="rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 h-12 flex items-center justify-center">
                    <span className="text-xs text-primary">{l('أفلت هنا', 'Drop here')}</span>
                  </div>
                )}

                {/* Inline quick-add */}
                {quickAdd === col.key && hasPermission('create media library') ? (
                  <div className="bg-card rounded-xl border border-primary/40 p-2 mt-1">
                    <input
                      ref={quickRef}
                      value={quickTitle}
                      onChange={e => setQuickTitle(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleQuickAdd(col.key); if (e.key === 'Escape') { setQuickAdd(null); setQuickTitle(''); } }}
                      placeholder={l('عنوان البطاقة...', 'Card title...')}
                      className="w-full text-xs px-2 py-1.5 rounded-lg bg-background border mb-2"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      <Button size="sm" className="flex-1 h-6 text-xs" onClick={() => handleQuickAdd(col.key)}>{l('إضافة','Add')}</Button>
                      <button onClick={() => { setQuickAdd(null); setQuickTitle(''); }} className="px-2 rounded-lg text-muted-foreground hover:bg-muted transition-colors text-xs">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ) : hasPermission('create media library') ? (
                  <button
                    onClick={() => { setQuickAdd(col.key); setTimeout(() => quickRef.current?.focus(), 50); }}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors w-full mt-1"
                  >
                    <Plus className="h-3.5 w-3.5" />{l('إضافة بطاقة', 'Add a card')}
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Add/Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editItem ? l('تعديل البطاقة','Edit Card') : l('إضافة بطاقة جديدة','Add New Card')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('العنوان *','Title *')}</label>
              <input value={form.title} onChange={field('title')} required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('اسم الفكرة أو المسودة...','Idea or draft name...')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الفئة','Category')}</label>
                <select value={form.category} onChange={field('category')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {Object.entries(CATEGORIES).map(([k,v]) => <option key={k} value={k}>{l(v.ar, v.en)}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('العمود','Column')}</label>
                <select value={form.status} onChange={field('status')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  {COLUMNS.map(c => <option key={c.key} value={c.key}>{l(c.ar, c.en)}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('التفاصيل / الملاحظات','Notes / Details')}</label>
              <textarea value={form.notes} onChange={field('notes')} rows={4} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" placeholder={l('روابط، تفاصيل، ملاحظات...','Links, details, notes...')} dir={language === 'ar' ? 'rtl' : 'ltr'} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الوسوم (مفصولة بفاصلة)','Tags (comma-separated)')}</label>
              <input value={form.tags} onChange={field('tags')} className="w-full px-3 py-2 rounded-lg border bg-background text-sm" placeholder={l('تصوير، تصميم...','filming, design...')} />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>{l('إلغاء','Cancel')}</Button>
              <Button type="submit" className="flex-1">{editItem ? l('حفظ','Save') : l('إضافة','Add')}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MediaLibrary;
