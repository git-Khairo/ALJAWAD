import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Video, Users, Edit, Trash2, Link, Clock } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
  { key: 'draft',     labelAr: 'مسودة',    labelEn: 'Draft',     color: 'bg-muted text-muted-foreground border-border' },
  { key: 'upcoming',  labelAr: 'قادمة',    labelEn: 'Upcoming',  color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { key: 'live',      labelAr: 'مباشر',    labelEn: 'Live',      color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 animate-pulse' },
  { key: 'completed', labelAr: 'مكتملة',   labelEn: 'Completed', color: 'bg-muted text-muted-foreground border-border' },
  { key: 'cancelled', labelAr: 'ملغاة',    labelEn: 'Cancelled', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

const PLATFORMS = [
  { key: 'zoom',        labelAr: 'Zoom',         color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { key: 'google_meet', labelAr: 'Google Meet',  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { key: 'youtube',     labelAr: 'YouTube',      color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

const PLATFORM_MAP = Object.fromEntries(PLATFORMS.map(p => [p.key, p]));

const EMPTY_FORM = {
  title_ar: '', title_en: '',
  description_ar: '', description_en: '',
  date: '', time: '',
  duration: 60, capacity: 50,
  platform: 'zoom', meeting_link: '',
  status: 'draft',
};

const Webinars = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { webinars, addWebinar, updateWebinar, deleteWebinar } = useAppData();

  const [filterStatus,   setFilterStatus]   = useState('all');
  const [filterPlatform, setFilterPlatform] = useState('all');
  const [modalOpen,      setModalOpen]      = useState(false);
  const [editing,        setEditing]        = useState(null);
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [form,           setForm]           = useState(EMPTY_FORM);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Summary
  const total    = webinars.length;
  const upcoming = webinars.filter(w => w.status === 'upcoming' || w.status === 'live').length;
  const completed = webinars.filter(w => w.status === 'completed').length;

  const filtered = webinars.filter(w => {
    if (filterStatus   !== 'all' && w.status   !== filterStatus)   return false;
    if (filterPlatform !== 'all' && w.platform !== filterPlatform) return false;
    return true;
  });

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (wb) => {
    setEditing(wb);
    setForm({
      title_ar:       wb.title_ar,
      title_en:       wb.title_en,
      description_ar: wb.description_ar ?? '',
      description_en: wb.description_en ?? '',
      date:           wb.date,
      time:           wb.time,
      duration:       wb.duration,
      capacity:       wb.capacity,
      platform:       wb.platform,
      meeting_link:   wb.meeting_link ?? '',
      status:         wb.status,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.title_ar.trim() && !form.title_en.trim()) {
      toast.error(l('يرجى إدخال عنوان الندوة', 'Please enter a webinar title'));
      return;
    }
    if (editing) {
      updateWebinar({ ...editing, ...form, duration: Number(form.duration), capacity: Number(form.capacity) });
      toast.success(l('تم تحديث الندوة', 'Webinar updated'));
    } else {
      addWebinar({ ...form, duration: Number(form.duration), capacity: Number(form.capacity) });
      toast.success(l('تمت إضافة الندوة', 'Webinar added'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteWebinar(deleteTarget.id);
    toast.success(l('تم حذف الندوة', 'Webinar deleted'));
    setDeleteTarget(null);
  };

  const statusFilterBtns = [{ key: 'all', labelAr: 'الكل', labelEn: 'All' }, ...STATUSES];
  const platformFilterBtns = [{ key: 'all', labelAr: 'كل المنصات', labelEn: 'All Platforms' }, ...PLATFORMS];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('الندوات عبر الإنترنت', 'Webinars')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{l('إدارة الندوات والبث المباشر', 'Manage webinars and live sessions')}</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />{l('ندوة جديدة', 'New Webinar')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { labelAr: 'إجمالي الندوات', labelEn: 'Total',     value: total,     color: 'text-primary',     bg: 'bg-primary/8' },
          { labelAr: 'قادمة',          labelEn: 'Upcoming',  value: upcoming,  color: 'text-amber-400',   bg: 'bg-amber-500/8' },
          { labelAr: 'مكتملة',         labelEn: 'Completed', value: completed, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-primary/10 rounded-2xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${k.bg} mb-3`}>
              <Video className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l(k.labelAr, k.labelEn)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-primary/10 rounded-2xl p-4 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statusFilterBtns.map(b => (
            <button key={b.key} onClick={() => setFilterStatus(b.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                filterStatus === b.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
              }`}>
              {l(b.labelAr, b.labelEn)}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border self-center hidden sm:block" />
        <div className="flex flex-wrap gap-1.5">
          {platformFilterBtns.map(b => (
            <button key={b.key} onClick={() => setFilterPlatform(b.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                filterPlatform === b.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
              }`}>
              {b.labelAr}
            </button>
          ))}
        </div>
      </div>

      {/* Webinar cards */}
      <div className="grid gap-4">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {l('لا توجد ندوات', 'No webinars found')}
            </motion.div>
          )}
          {filtered.map((wb, i) => {
            const sc = STATUS_MAP[wb.status]   ?? STATUSES[0];
            const pc = PLATFORM_MAP[wb.platform] ?? PLATFORMS[0];
            return (
              <motion.div key={wb.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-primary/10 rounded-2xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0 mt-0.5">
                      <Video className="h-4 w-4 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">
                        {l(wb.title_ar, wb.title_en) || (language === 'ar' ? wb.title_en : wb.title_ar) || '—'}
                      </p>
                      {(wb.description_ar || wb.description_en) && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                          {l(wb.description_ar, wb.description_en)}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                          {l(sc.labelAr, sc.labelEn)}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${pc.color}`}>
                          {pc.labelAr}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />{wb.date} {wb.time}
                        </span>
                        <span className="text-xs text-muted-foreground">{wb.duration} {l('دقيقة', 'min')}</span>
                      </div>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>{wb.registered ?? 0} / {wb.capacity} {l('مسجل', 'registered')}</span>
                        {wb.meeting_link && (
                          <a href={wb.meeting_link} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1 ms-3 text-primary hover:underline">
                            <Link className="h-3 w-3" />{l('رابط الاجتماع', 'Meeting link')}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(wb)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(wb)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? l('تعديل الندوة', 'Edit Webinar') : l('ندوة جديدة', 'New Webinar')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('العنوان (عربي)', 'Title (Arabic)')}</label>
                <input value={form.title_ar} onChange={field('title_ar')} dir="rtl"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title (English)</label>
                <input value={form.title_en} onChange={field('title_en')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الوصف (عربي)', 'Description (Arabic)')}</label>
                <textarea value={form.description_ar} onChange={field('description_ar')} rows={3} dir="rtl"
                  placeholder={l('اختياري...', 'Optional...')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description (English)</label>
                <textarea value={form.description_en} onChange={field('description_en')} rows={3}
                  placeholder="Optional..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('التاريخ', 'Date')}</label>
                <input type="date" value={form.date} onChange={field('date')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الوقت', 'Time')}</label>
                <input type="time" value={form.time} onChange={field('time')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('المدة (دقيقة)', 'Duration (min)')}</label>
                <input type="number" min={1} value={form.duration} onChange={field('duration')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('السعة', 'Capacity')}</label>
                <input type="number" min={1} value={form.capacity} onChange={field('capacity')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('المنصة', 'Platform')}</label>
                <select value={form.platform} onChange={field('platform')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {PLATFORMS.map(p => <option key={p.key} value={p.key}>{p.labelAr}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
                <select value={form.status} onChange={field('status')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {STATUSES.map(s => <option key={s.key} value={s.key}>{l(s.labelAr, s.labelEn)}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('رابط الاجتماع', 'Meeting Link')}</label>
              <input value={form.meeting_link} onChange={field('meeting_link')}
                placeholder="https://..."
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button onClick={handleSave}>{l('حفظ', 'Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('حذف الندوة', 'Delete Webinar')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('هل أنت متأكد من حذف هذه الندوة؟ لا يمكن التراجع.', 'Are you sure you want to delete this webinar? This cannot be undone.')}
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium mt-1">
              {l(deleteTarget.title_ar, deleteTarget.title_en) || deleteTarget.title_en || deleteTarget.title_ar}
            </p>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>{l('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{l('حذف', 'Delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Webinars;
