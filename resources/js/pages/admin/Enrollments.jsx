import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/StatusBadge';
import { Plus, GraduationCap, Edit, Trash2, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS  = ['active', 'completed', 'cancelled'];
const PAYMENT_OPTIONS = ['pending', 'paid', 'partial', 'refunded'];

const EMPTY_FORM = {
  client_id: '', course_id: '',
  status: 'active', payment_status: 'pending',
  amount_paid: '', registration_date: '',
};

const Enrollments = () => {
  const { language } = useLanguage();
  const l = (ar, en) => (language === 'ar' ? ar : en);
  const { registrations, clients, courses, addRegistration, updateRegistration, deleteRegistration } = useAppData();

  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  const courseTitle = (c) => (language === 'ar' ? c.title_ar : c.title_en) || c.title_en || c.title_ar || '—';

  const total     = registrations.length;
  const active    = registrations.filter(r => r.status === 'active').length;
  const completed = registrations.filter(r => r.status === 'completed').length;

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (r) => {
    setEditing(r);
    setForm({
      client_id:         String(r.client_id),
      course_id:         String(r.course_id),
      status:            r.status,
      payment_status:    r.payment_status,
      amount_paid:       r.amount_paid ?? '',
      registration_date: r.registration_date ?? '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!editing && (!form.client_id || !form.course_id)) {
      toast.error(l('يرجى اختيار العميل والدورة', 'Please select a client and a course'));
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        updateRegistration({
          id:                 editing.id,
          status:             form.status,
          payment_status:     form.payment_status,
          amount_paid:        form.amount_paid === '' ? 0 : Number(form.amount_paid),
          registration_date:  form.registration_date || undefined,
        });
        toast.success(l('تم تحديث التسجيل', 'Enrolment updated'));
        setModalOpen(false);
      } else {
        await addRegistration({
          client_id:         Number(form.client_id),
          course_id:         Number(form.course_id),
          status:            form.status,
          payment_status:    form.payment_status,
          amount_paid:       form.amount_paid === '' ? 0 : Number(form.amount_paid),
          registration_date: form.registration_date || undefined,
        });
        setModalOpen(false);
      }
    } catch {
      // error toast handled globally
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteRegistration(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('التسجيلات', 'Enrolments')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('تسجيل العملاء في الدورات وإدارة حالتهم', 'Enrol clients in courses and manage their status')}
          </p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" />{l('تسجيل جديد', 'New Enrolment')}
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { labelAr: 'إجمالي التسجيلات', labelEn: 'Total',     value: total,     color: 'text-primary',     bg: 'bg-primary/8' },
          { labelAr: 'نشط',             labelEn: 'Active',    value: active,    color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
          { labelAr: 'مكتمل',           labelEn: 'Completed', value: completed, color: 'text-blue-400',    bg: 'bg-blue-500/8' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-primary/10 rounded-2xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${k.bg} mb-3`}>
              <GraduationCap className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l(k.labelAr, k.labelEn)}</p>
          </motion.div>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        <AnimatePresence>
          {registrations.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {l('لا توجد تسجيلات بعد', 'No enrolments yet')}
            </motion.div>
          )}
          {registrations.map((r, i) => (
            <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-card border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium truncate">{r.client_name || `#${r.client_id}`}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span className="text-xs text-muted-foreground truncate">
                      {language === 'ar' ? r.course_title_ar : r.course_title_en}
                    </span>
                    {r.registration_date && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">{r.registration_date}</span>
                      </>
                    )}
                    {r.amount_paid > 0 && (
                      <>
                        <span className="text-xs text-muted-foreground">·</span>
                        <span className="text-xs text-muted-foreground">${r.amount_paid}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={r.payment_status} withIcon={false} />
                <StatusBadge status={r.status} />
                <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(r)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add / Edit modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? l('تعديل التسجيل', 'Edit Enrolment') : l('تسجيل جديد', 'New Enrolment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('العميل', 'Client')}</label>
              <select value={form.client_id} onChange={field('client_id')} disabled={!!editing}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60">
                <option value="">{l('— اختر عميلاً —', '— Select a client —')}</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الدورة', 'Course')}</label>
              <select value={form.course_id} onChange={field('course_id')} disabled={!!editing}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-60">
                <option value="">{l('— اختر دورة —', '— Select a course —')}</option>
                {courses.map(c => (
                  <option key={c.id} value={c.id}>{courseTitle(c)}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
                <select value={form.status} onChange={field('status')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('حالة الدفع', 'Payment')}</label>
                <select value={form.payment_status} onChange={field('payment_status')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                  {PAYMENT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('المبلغ المدفوع', 'Amount Paid')}</label>
                <input type="number" min="0" step="0.01" value={form.amount_paid} onChange={field('amount_paid')} placeholder="0.00"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('تاريخ التسجيل', 'Date')}</label>
                <input type="date" value={form.registration_date} onChange={field('registration_date')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button onClick={handleSave} disabled={saving}>{l('حفظ', 'Save')}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{l('حذف التسجيل', 'Remove Enrolment')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('هل أنت متأكد من حذف هذا التسجيل؟', 'Are you sure you want to remove this enrolment?')}
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium mt-1">
              {deleteTarget.client_name} — {language === 'ar' ? deleteTarget.course_title_ar : deleteTarget.course_title_en}
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

export default Enrollments;
