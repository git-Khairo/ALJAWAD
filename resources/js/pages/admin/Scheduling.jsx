import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { calendarApi, coachApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const EVENT_COLORS = {
  appointment: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  task:        'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  content:     'bg-purple-500/20 text-purple-400 border border-purple-500/30',
};

const EMPTY_TASK = { title: '', date: '', time: '09:00', assigned_coach_id: '', priority: 'medium', notes: '' };

const Scheduling = () => {
  const { t, language } = useLanguage();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const l = (ar, en) => language === 'ar' ? ar : en;

  const today = new Date();
  const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [modalOpen,    setModalOpen]    = useState(false);
  const [form,         setForm]         = useState(EMPTY_TASK);

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

  // ── Data ─────────────────────────────────────────────────────────────────
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendarEvents'],
    queryFn: async () => {
      const res = await calendarApi.events();
      return res.data?.data ?? [];
    },
    staleTime: 30_000,
  });

  const { data: coaches = [] } = useQuery({
    queryKey: ['coaches'],
    queryFn: async () => {
      // Minimal {id,name} list — accessible to schedulers without "manage users".
      const res = await coachApi.options();
      return res.data?.data ?? res.data ?? [];
    },
    staleTime: 60_000,
  });

  const createTaskMut = useMutation({
    mutationFn: (data) => calendarApi.createTask(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['calendarEvents'] });
      toast.success(l('تمت إضافة المهمة', 'Task added'));
      setModalOpen(false);
      setForm(EMPTY_TASK);
    },
    onError: () => toast.error(l('فشل الحفظ', 'Failed to save')),
  });

  // ── Events per day ────────────────────────────────────────────────────────
  const getEventsForDay = (day) => {
    const d = toDateStr(day);
    return events
      .filter(e => e.date === d)
      .map(e => ({
        id:    `${e.type}-${e.id}`,
        label: language === 'ar' ? (e.title_ar || e.title) : e.title,
        color: EVENT_COLORS[e.type] ?? EVENT_COLORS.appointment,
        type:  e.type,
        raw:   e,
      }));
  };

  // ── Hover detail popup ──────────────────────────────────────────────────────
  const [hover, setHover] = useState(null); // { ev, x, y }
  const typeLabel = (t) =>
    t === 'appointment' ? l('موعد', 'Appointment')
    : t === 'task' ? l('مهمة', 'Task')
    : l('محتوى', 'Content');
  const showHover = (domEvent, ev) => {
    const r = domEvent.currentTarget.getBoundingClientRect();
    setHover({ ev, x: Math.min(r.left, window.innerWidth - 256), y: r.bottom });
  };
  const hideHover = () => setHover(null);

  // ── Modal ─────────────────────────────────────────────────────────────────
  const openModal = (day = null) => {
    setForm({ ...EMPTY_TASK, date: day ? toDateStr(day) : '' });
    setModalOpen(true);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      toast.error(l('يرجى إدخال عنوان المهمة', 'Please enter a task title'));
      return;
    }
    createTaskMut.mutate({
      title:             form.title,
      date:              form.date,
      time:              form.time,
      assigned_coach_id: form.assigned_coach_id || undefined,
      priority:          form.priority,
      notes:             form.notes || undefined,
    });
  };

  // Upcoming appointments (today onwards, max 5)
  const todayStr = today.toISOString().split('T')[0];
  const upcomingApts = events
    .filter(e => e.type === 'appointment' && e.date >= todayStr)
    .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .slice(0, 5);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.scheduling')}</h1>
        {hasPermission('create scheduling') && (
          <Button size="sm" onClick={() => openModal()}>
            <Plus className="h-4 w-4 me-1" />{l('إضافة مهمة', 'Add Task')}
          </Button>
        )}
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`e-${i}`} className="border-b border-e min-h-[90px] bg-muted/10" />
            ))}

            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const current   = isToday(day);
              return (
                <div key={day} onClick={() => hasPermission('create scheduling') && openModal(day)}
                  className={`border-b border-e min-h-[90px] p-1.5 transition-colors group ${hasPermission('create scheduling') ? 'cursor-pointer hover:bg-primary/5' : 'cursor-default'} ${current ? 'bg-primary/[0.04]' : ''}`}>
                  <span className={`text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
                    current ? 'bg-primary text-primary-foreground' : 'text-foreground/70 group-hover:text-primary'
                  }`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map(ev => (
                      <div key={ev.id}
                        onMouseEnter={(e) => showHover(e, ev)}
                        onMouseLeave={hideHover}
                        onClick={(e) => e.stopPropagation()}
                        className={`px-1.5 py-0.5 rounded text-[10px] truncate leading-tight cursor-default ${ev.color}`}>
                        {ev.label}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[10px] text-muted-foreground/70 px-1">
                        +{dayEvents.length - 3} {l('أكثر', 'more')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Legend ── */}
      <div className="mt-3 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500/30 border border-cyan-500/40" />
          {l('المواعيد', 'Appointments')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500/40" />
          {l('المهام', 'Tasks')}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-500/30 border border-purple-500/40" />
          {l('المحتوى', 'Content')}
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
                  <p className="font-medium text-sm truncate">{language === 'ar' ? (a.title_ar || a.title) : a.title}</p>
                  {a.assigned_coach && (
                    <p className="text-xs text-muted-foreground">{a.assigned_coach.name}</p>
                  )}
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

      {/* ── Add Task Modal ── */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{l('إضافة مهمة جديدة', 'Add New Task')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3 mt-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">{l('عنوان المهمة *', 'Task Title *')}</label>
              <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                required className="w-full px-3 py-2 rounded-lg border bg-background text-sm"
                placeholder={l('أدخل عنوان المهمة', 'Enter task title')} />
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
                <label className="text-xs text-muted-foreground mb-1 block">{l('الأولوية', 'Priority')}</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="low">{l('منخفضة', 'Low')}</option>
                  <option value="medium">{l('متوسطة', 'Medium')}</option>
                  <option value="high">{l('عالية', 'High')}</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{l('المدرب المسؤول', 'Assigned Coach')}</label>
                <select value={form.assigned_coach_id} onChange={e => setForm(p => ({ ...p, assigned_coach_id: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border bg-background text-sm">
                  <option value="">{l('بدون تعيين', 'Unassigned')}</option>
                  {coaches.map(c => (
                    <option key={c.id} value={c.user_id ?? c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
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
              <Button type="submit" className="flex-1" disabled={createTaskMut.isPending}>
                {createTaskMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : l('إضافة', 'Add')}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hover detail popup */}
      {hover && (
        <div
          className="fixed z-50 w-64 rounded-xl border bg-card shadow-xl p-3 text-xs pointer-events-none"
          style={{ left: hover.x, top: hover.y + 6 }}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-2 h-2 rounded-sm ${
              hover.ev.type === 'appointment' ? 'bg-cyan-400' : hover.ev.type === 'task' ? 'bg-amber-400' : 'bg-purple-400'
            }`} />
            <span className="font-semibold text-[11px] uppercase tracking-wide text-muted-foreground">{typeLabel(hover.ev.type)}</span>
          </div>
          <p className="font-medium text-sm mb-1 leading-snug">{hover.ev.label}</p>
          <div className="space-y-0.5 text-muted-foreground">
            <p>📅 {hover.ev.raw.date}{hover.ev.raw.time ? ` · ⏰ ${hover.ev.raw.time}` : ''}</p>
            {hover.ev.raw.status && (
              <p>{l('الحالة', 'Status')}: <span className="text-foreground">{hover.ev.raw.status}</span></p>
            )}
            {hover.ev.raw.assigned_coach?.name && (
              <p>{l('المسؤول', 'Assigned')}: <span className="text-foreground">{hover.ev.raw.assigned_coach.name}</span></p>
            )}
            {hover.ev.raw.notes && (
              <p className="line-clamp-3 whitespace-pre-line">{hover.ev.raw.notes}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scheduling;
