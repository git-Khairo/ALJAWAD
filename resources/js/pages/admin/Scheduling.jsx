import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Appointment color on the calendar
const APT_COLOR = 'bg-cyan-500/20 text-cyan-400';

const EMPTY_FORM = { client_name: '', type_ar: 'موعد', type_en: 'Appointment', date: '', time: '', status: 'pending', notes: '' };

const Scheduling = () => {
  const { t, language } = useLanguage();
  const { appointments = [], addAppointment } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const today = new Date();
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [modalOpen,    setModalOpen]    = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);

  // ── Month helpers ─────────────────────────────────────────────────────────
  const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const days           = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const weekDays = language === 'ar'
    ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthLabel = new Date(currentYear, currentMonth).toLocaleDateString(
    language === 'ar' ? 'ar-SA' : 'en-US',
    { month: 'long', year: 'numeric' }
  );

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const toDateStr = (day) =>
    `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const isToday = (day) =>
    day === today.getDate() &&
    currentMonth === today.getMonth() &&
    currentYear === today.getFullYear();

  // Events for a calendar day — only real appointments from the API
  const getEventsForDay = (day) => {
    const d = toDateStr(day);
    return (appointments || [])
      .filter(a => a.date === d)
      .map(a => ({
        id:    `apt-${a.id}`,
        label: a.client_name || l(a.type_ar, a.type_en) || l('موعد', 'Appointment'),
        color: APT_COLOR,
      }));
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (day = null) => {
    setForm({ ...EMPTY_FORM, date: day ? toDateStr(day) : '' });
    setModalOpen(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) {
      toast.error(l('يرجى إدخال اسم العميل', 'Please enter a client name'));
      return;
    }
    if (!form.date) {
      toast.error(l('يرجى اختيار التاريخ', 'Please select a date'));
      return;
    }
    addAppointment(form);
    toast.success(l('تمت الإضافة', 'Appointment added'));
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  // Upcoming appointments (today onwards, max 5)
  const upcomingApts = [...(appointments || [])]
    .filter(a => a.date >= today.toISOString().split('T')[0])
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.scheduling')}</h1>
        <Button size="sm" onClick={() => openModal()}>
          <Plus className="h-4 w-4 me-1" />{l('إضافة موعد', 'Add Appointment')}
        </Button>
      </div>

      {/* ── Calendar ── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground">
              <ChevronLeft className="h-4 w-4 rtl:hidden" />
              <ChevronRight className="h-4 w-4 ltr:hidden" />
            </button>
            <h2 className="font-semibold min-w-[190px] text-center">{monthLabel}</h2>
            <button onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground">
              <ChevronRight className="h-4 w-4 rtl:hidden" />
              <ChevronLeft className="h-4 w-4 ltr:hidden" />
            </button>
          </div>
          <Button variant="outline" size="sm" onClick={goToday}>
            {l('اليوم', 'Today')}
          </Button>
        </div>

        {/* Day-name headers */}
        <div className="grid grid-cols-7 border-b">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground bg-muted/40">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-e min-h-[90px] bg-muted/10" />
          ))}

          {days.map(day => {
            const events  = getEventsForDay(day);
            const current = isToday(day);
            return (
              <div key={day} onClick={() => openModal(day)}
                className={`border-b border-e min-h-[90px] p-1.5 cursor-pointer hover:bg-primary/5 transition-colors group ${current ? 'bg-primary/[0.04]' : ''}`}>
                <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                  current ? 'bg-primary text-primary-foreground' : 'text-foreground/70 group-hover:text-primary'
                }`}>
                  {day}
                </span>
                <div className="mt-1 space-y-0.5">
                  {events.slice(0, 3).map(ev => (
                    <div key={ev.id} className={`px-1.5 py-0.5 rounded text-[10px] truncate leading-tight ${ev.color}`}>
                      {ev.label}
                    </div>
                  ))}
                  {events.length > 3 && (
                    <div className="text-[10px] text-muted-foreground/70 px-1">
                      +{events.length - 3} {l('أكثر', 'more')}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="mt-3 flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/40" />
          {l('المواعيد', 'Appointments')}
        </div>
      </div>

      {/* ── Upcoming appointments ── */}
      {upcomingApts.length > 0 && (
        <div className="mt-6 bg-card rounded-xl border p-5">
          <h2 className="font-semibold mb-4">{l('المواعيد القادمة', 'Upcoming Appointments')}</h2>
          <div className="space-y-2">
            {upcomingApts.map(a => (
              <div key={a.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border">
                <div className="text-center min-w-[48px]">
                  <p className="text-xs text-muted-foreground">{a.date?.slice(5)}</p>
                  <p className="text-sm font-bold">{a.time}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{a.client_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{l(a.type_ar, a.type_en)}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  a.status === 'confirmed'  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                  a.status === 'completed'  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                  a.status === 'cancelled'  ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                             'bg-amber-500/10 text-amber-400 border-amber-500/20'
                }`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Add Appointment Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إضافة موعد جديد', 'Add New Appointment')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('اسم العميل *', 'Client Name *')}</label>
              <input value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                required className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder={l('أدخل اسم العميل', 'Enter client name')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('التاريخ *', 'Date *')}</label>
                <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                  required className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('الوقت', 'Time')}</label>
                <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('النوع (عربي)', 'Type (Arabic)')}</label>
                <input value={form.type_ar} onChange={e => setForm(p => ({ ...p, type_ar: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" dir="rtl" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('النوع (إنجليزي)', 'Type (English)')}</label>
                <input value={form.type_en} onChange={e => setForm(p => ({ ...p, type_en: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                <option value="pending">{l('معلق', 'Pending')}</option>
                <option value="confirmed">{l('مؤكد', 'Confirmed')}</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('ملاحظات', 'Notes')}</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={2} className="w-full px-3 py-2 rounded-lg border bg-background text-sm resize-none" />
            </div>
            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setModalOpen(false)}>
                {l('إلغاء', 'Cancel')}
              </Button>
              <Button type="submit" className="flex-1">
                {l('إضافة', 'Add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduling;
