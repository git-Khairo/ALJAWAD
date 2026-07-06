import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Plus, Clock, Edit, Trash2, CalendarCheck } from 'lucide-react';
import { toast } from 'sonner';

const STATUSES = [
  { key: 'pending',    labelAr: 'معلق',    labelEn: 'Pending',    color: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  { key: 'confirmed',  labelAr: 'مؤكد',    labelEn: 'Confirmed',  color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  { key: 'completed',  labelAr: 'مكتمل',   labelEn: 'Completed',  color: 'bg-blue-500/15 text-blue-400 border-blue-500/30' },
  { key: 'cancelled',  labelAr: 'ملغى',    labelEn: 'Cancelled',  color: 'bg-red-500/15 text-red-400 border-red-500/30' },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

const EMPTY_FORM = {
  client_id: '', client_name: '', type_ar: '', type_en: '',
  date: '', time: '', status: 'pending', notes: '',
};

const Appointments = () => {
  const { language } = useLanguage();
  const { hasPermission } = useAuth();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { appointments, clients, addAppointment, updateAppointment, deleteAppointment } = useAppData();

  const [filterStatus, setFilterStatus] = useState('all');
  const [modalOpen,    setModalOpen]    = useState(false);
  const [editing,      setEditing]      = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form,         setForm]         = useState(EMPTY_FORM);

  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // Summary counts
  const allCount  = appointments.length;
  const confirmed = appointments.filter(a => a.status === 'confirmed').length;
  const pending   = appointments.filter(a => a.status === 'pending').length;

  const filtered = filterStatus === 'all'
    ? appointments
    : appointments.filter(a => a.status === filterStatus);
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 12, filterStatus);

  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (apt) => {
    setEditing(apt);
    setForm({
      client_id:   apt.client_id ? String(apt.client_id) : '',
      client_name: apt.client_name,
      type_ar:     apt.type_ar,
      type_en:     apt.type_en,
      date:        apt.date,
      time:        apt.time,
      status:      apt.status,
      notes:       apt.notes ?? '',
    });
    setModalOpen(true);
  };

  // Selecting a client links the appointment (client_id) and fills the display name.
  const selectClient = (e) => {
    const id = e.target.value;
    const client = clients.find(c => String(c.id) === id);
    setForm(p => ({ ...p, client_id: id, client_name: client?.name ?? p.client_name }));
  };

  const handleSave = () => {
    if (!form.client_id && !form.client_name.trim()) {
      toast.error(l('يرجى اختيار العميل', 'Please select a client'));
      return;
    }
    if (!form.date || !form.time) {
      toast.error(l('يرجى تحديد التاريخ والوقت', 'Please select date and time'));
      return;
    }
    const payload = { ...form, client_id: form.client_id || null };
    if (editing) {
      updateAppointment({ ...editing, ...payload });
      toast.success(l('تم تحديث الموعد', 'Appointment updated'));
    } else {
      addAppointment(payload);
      toast.success(l('تم إضافة الموعد', 'Appointment added'));
    }
    setModalOpen(false);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteAppointment(deleteTarget.id);
    toast.success(l('تم حذف الموعد', 'Appointment deleted'));
    setDeleteTarget(null);
  };

  const filterBtns = [
    { key: 'all',       labelAr: 'الكل',   labelEn: 'All' },
    ...STATUSES.map(s => ({ key: s.key, labelAr: s.labelAr, labelEn: s.labelEn })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('المواعيد', 'Appointments')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{l('جدولة المواعيد وإدارتها', 'Schedule and manage appointments')}</p>
        </div>
        {hasPermission('create appointments') && (
          <Button onClick={openAdd} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" />{l('موعد جديد', 'New Appointment')}
          </Button>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { labelAr: 'إجمالي المواعيد', labelEn: 'Total',     value: allCount,  color: 'text-primary',     bg: 'bg-primary/8' },
          { labelAr: 'مؤكدة',           labelEn: 'Confirmed', value: confirmed, color: 'text-emerald-400', bg: 'bg-emerald-500/8' },
          { labelAr: 'معلقة',           labelEn: 'Pending',   value: pending,   color: 'text-amber-400',   bg: 'bg-amber-500/8' },
        ].map((k, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-primary/10 rounded-2xl p-4">
            <div className={`inline-flex p-2 rounded-lg ${k.bg} mb-3`}>
              <CalendarCheck className={`h-4 w-4 ${k.color}`} />
            </div>
            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{l(k.labelAr, k.labelEn)}</p>
          </motion.div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-1.5">
        {filterBtns.map(b => (
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

      {/* Appointments list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {l('لا توجد مواعيد', 'No appointments found')}
            </motion.div>
          )}
          {paginated.map((apt, i) => {
            const sc = STATUS_MAP[apt.status] ?? STATUSES[0];
            return (
              <motion.div key={apt.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-primary/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-primary/8 flex items-center justify-center shrink-0">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{apt.client_name}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        {l(apt.type_ar, apt.type_en) || apt.type_en || apt.type_ar}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{apt.date}</span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs text-muted-foreground">{apt.time}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${sc.color}`}>
                        {l(sc.labelAr, sc.labelEn)}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-muted-foreground/70 mt-1 truncate">{apt.notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {hasPermission('edit appointments') && (
                    <Button variant="ghost" size="sm" onClick={() => openEdit(apt)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  {hasPermission('delete appointments') && (
                    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => setDeleteTarget(apt)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length > 0 && (
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="موعد" labelEn="appointment" language={language} />
        )}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? l('تعديل الموعد', 'Edit Appointment') : l('موعد جديد', 'New Appointment')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('العميل', 'Client')}</label>
              <select value={form.client_id} onChange={selectClient}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">
                  {form.client_name && !form.client_id
                    ? `${form.client_name} ${l('(غير مرتبط)', '(unlinked)')}`
                    : l('— اختر عميلاً —', '— Select a client —')}
                </option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}</option>
                ))}
              </select>
              <p className="text-[0.7rem] text-muted-foreground mt-1">
                {l('ربط العميل يجعل الموعد يظهر في لوحته.', 'Linking a client makes this appear on their dashboard.')}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('النوع (عربي)', 'Type (Arabic)')}</label>
                <input value={form.type_ar} onChange={field('type_ar')} dir="rtl"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Type (English)</label>
                <input value={form.type_en} onChange={field('type_en')}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
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

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
              <select value={form.status} onChange={field('status')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20">
                {STATUSES.map(s => (
                  <option key={s.key} value={s.key}>{l(s.labelAr, s.labelEn)}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <textarea value={form.notes} onChange={field('notes')} rows={3}
                placeholder={l('ملاحظات اختيارية...', 'Optional notes...')}
                className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none" />
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
            <DialogTitle>{l('حذف الموعد', 'Delete Appointment')}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('هل أنت متأكد من حذف هذا الموعد؟', 'Are you sure you want to delete this appointment?')}
          </p>
          {deleteTarget && (
            <p className="text-sm font-medium mt-1">{deleteTarget.client_name} — {deleteTarget.date} {deleteTarget.time}</p>
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

export default Appointments;
