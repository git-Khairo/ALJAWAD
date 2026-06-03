import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const TASK_TYPES = [
  { key: 'session',  labelAr: 'جلسة',   labelEn: 'Session',   color: 'bg-primary/20 text-primary border-primary/30' },
  { key: 'task',     labelAr: 'مهمة',   labelEn: 'Task',      color: 'bg-violet-500/20 text-violet-400 border-violet-500/30' },
  { key: 'reminder', labelAr: 'تذكير',  labelEn: 'Reminder',  color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { key: 'call',     labelAr: 'مكالمة', labelEn: 'Call',      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  { key: 'meeting',  labelAr: 'اجتماع', labelEn: 'Meeting',   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
];

const TYPE_MAP = Object.fromEntries(TASK_TYPES.map(t => [t.key, t]));

const APT_COLOR = 'bg-cyan-500/20 text-cyan-400';

const EMPTY_FORM = { title_ar: '', title_en: '', date: '', time: '', type: 'task', notes: '' };

const Scheduling = () => {
  const { t, language } = useLanguage();
  const { appointments = [], sessions, addSession } = useAppData();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const today = new Date();
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [modalOpen,    setModalOpen]    = useState(false);
  const [form,         setForm]         = useState(EMPTY_FORM);

  // ── Month helpers ──────────────────────────────────────────────────────────
  const daysInMonth    = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

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

  // ── Events for a day ──────────────────────────────────────────────────────
  const getEventsForDay = (day) => {
    const d = toDateStr(day);
    const apts = (appointments || [])
      .filter(a => a.date === d)
      .map(a => ({
        id: `apt-${a.id}`,
        label: a.client_name || l(a.type_ar, a.type_en) || l('موعد', 'Appointment'),
        color: APT_COLOR,
      }));
    const tasks = (sessions || [])
      .filter(s => s.date === d)
      .map(s => {
        const ty = TYPE_MAP[s.type] ?? TYPE_MAP['task'];
        return {
          id: s.id,
          label: l(s.title_ar, s.title_en) || s.title_ar || s.title_en,
          color: ty.color.split(' border')[0],
        };
      });
    return [...apts, ...tasks];
  };

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (day = null) => {
    setForm({ ...EMPTY_FORM, date: day ? toDateStr(day) : '' });
    setModalOpen(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title_ar.trim() && !form.title_en.trim()) {
      toast.error(l('يرجى إدخال عنوان', 'Please enter a title'));
      return;
    }
    addSession({ ...form });
    toast.success(l('تمت الإضافة', 'Added successfully'));
    setModalOpen(false);
    setForm(EMPTY_FORM);
  };

  // ── Upcoming list ─────────────────────────────────────────────────────────
  const upcomingTasks = [...(sessions || [])]
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''));

  const upcomingApts = [...(appointments || [])]
    .filter(a => a.date >= today.toISOString().split('T')[0])
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.scheduling')}</h1>
        <Button size="sm" onClick={() => openModal()}>
          <Plus className="h-4 w-4 me-1" />{l('إضافة مهمة', 'Add Task')}
        </Button>
      </div>

      {/* ── Calendar ── */}
      <div className="bg-card rounded-xl border overflow-hidden">
        {/* Header row */}
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4 rtl:hidden" />
              <ChevronRight className="h-4 w-4 ltr:hidden" />
            </button>
            <h2 className="font-semibold min-w-[190px] text-center">{monthLabel}</h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-primary/10 transition text-muted-foreground hover:text-foreground"
            >
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
            <div key={d} className="py-2 text-center text-xs font-medium text-muted-foreground bg-muted/40">
              {d}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} className="border-b border-e min-h-[90px] bg-muted/10" />
          ))}

          {days.map(day => {
            const events = getEventsForDay(day);
            const current = isToday(day);
            return (
              <div
                key={day}
                onClick={() => openModal(day)}
                className={`border-b border-e min-h-[90px] p-1.5 cursor-pointer hover:bg-primary/5 transition-colors group ${current ? 'bg-primary/[0.04]' : ''}`}
              >
                <span
                  className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    current
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground/70 group-hover:text-primary'
                  }`}
                >
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
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/40" />
          {l('المواعيد', 'Appointments')}
        </div>
        {TASK_TYPES.map(ty => (
          <div key={ty.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2.5 h-2.5 rounded-sm ${ty.color}`} />
            {l(ty.labelAr, ty.labelEn)}
          </div>
        ))}
      </div>

      {/* ── Upcoming panels ── */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tasks */}
        {upcomingTasks.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-4">{l('المهام', 'Tasks')}</h2>
            <div className="space-y-2">
              {upcomingTasks.map(s => {
                const ty = TYPE_MAP[s.type] ?? TYPE_MAP['task'];
                return (
                  <div key={s.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5 ${ty.color}`}>
                      {l(ty.labelAr, ty.labelEn)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{l(s.title_ar, s.title_en) || s.title_ar || s.title_en}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.date}{s.time ? ` — ${s.time}` : ''}
                      </p>
                      {s.notes && <p className="text-xs text-muted-foreground/70 truncate">{s.notes}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Upcoming appointments */}
        {upcomingApts.length > 0 && (
          <div className="bg-card rounded-xl border p-5">
            <h2 className="font-semibold mb-4">{l('المواعيد القادمة', 'Upcoming Appointments')}</h2>
            <div className="space-y-2">
              {upcomingApts.map(a => (
                <div key={a.id} className="flex items-start gap-3 p-3 bg-background rounded-lg border">
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap mt-0.5 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                    {l('موعد', 'Apt')}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{a.client_name || l(a.type_ar, a.type_en)}</p>
                    <p className="text-xs text-muted-foreground">
                      {a.date}{a.time ? ` — ${a.time}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Add Task Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{l('إضافة مهمة', 'Add Task')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4 mt-1">
            {/* Type chips */}
            <div className="flex flex-wrap gap-2">
              {TASK_TYPES.map(ty => (
                <button
                  key={ty.key}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, type: ty.key }))}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                    form.type === ty.key
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-primary/15 text-muted-foreground hover:bg-primary/8'
                  }`}
                >
                  {l(ty.labelAr, ty.labelEn)}
                </button>
              ))}
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-3">
              <input
                placeholder={l('العنوان (عربي)', 'Title (Arabic)')}
                value={form.title_ar}
                onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))}
                dir="rtl"
                className="px-4 py-2.5 rounded-lg border bg-background text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <input
                placeholder="Title (English)"
                value={form.title_en}
                onChange={e => setForm(p => ({ ...p, title_en: e.target.value }))}
                className="px-4 py-2.5 rounded-lg border bg-background text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Date + Time */}
            <div className="grid grid-cols-2 gap-3">
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                required
              />
              <input
                type="time"
                value={form.time}
                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}
                className="px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Notes */}
            <input
              placeholder={l('ملاحظات (اختياري)', 'Notes (optional)')}
              value={form.notes}
              onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <Button type="submit" className="w-full">{l('إضافة', 'Add')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduling;
