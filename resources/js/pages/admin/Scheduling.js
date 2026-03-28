import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { mockCourses } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

const Scheduling = () => {
  const { t, language } = useLanguage();
  const { sessions, addSession, users } = useAppData();
  const [view, setView] = useState('month');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ courseId: '', title_ar: '', title_en: '', date: '', time: '', duration: '90', instructor_ar: '', instructor_en: '' });

  const l = (key) => language === 'ar' ? key + '_ar' : key + '_en';

  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const weekDays = language === 'ar'
    ? ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const handleCreate = (e) => {
    e.preventDefault();
    addSession({ ...form, duration: Number(form.duration) });
    toast.success(t('common.success'));
    setModalOpen(false);
    setForm({ courseId: '', title_ar: '', title_en: '', date: '', time: '', duration: '90', instructor_ar: '', instructor_en: '' });
  };

  const getSessionsForDay = (day) => {
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sessions.filter((s) => s.date === dateStr);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t('admin.scheduling')}</h1>
        <div className="flex gap-2">
          <div className="flex bg-secondary rounded-lg overflow-hidden">
            <button onClick={() => setView('month')} className={`px-3 py-1.5 text-xs font-medium ${view === 'month' ? 'bg-primary text-primary-foreground' : ''}`}>{t('admin.monthView')}</button>
            <button onClick={() => setView('week')} className={`px-3 py-1.5 text-xs font-medium ${view === 'week' ? 'bg-primary text-primary-foreground' : ''}`}>{t('admin.weekView')}</button>
          </div>
          <Button size="sm" onClick={() => setModalOpen(true)}><Plus className="h-4 w-4 me-1" />{t('admin.createSession')}</Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">{today.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { month: 'long', year: 'numeric' })}</h2>
        </div>
        <div className="grid grid-cols-7">
          {weekDays.map(d => <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground bg-muted/50 border-b">{d}</div>)}
          {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="p-2 border-b border-e min-h-[80px]" />)}
          {days.map(day => {
            const daySessions = getSessionsForDay(day);
            return (
              <div key={day} className={`p-2 border-b border-e min-h-[80px] ${day === today.getDate() ? 'bg-accent/5' : ''}`}>
                <span className={`text-xs font-medium ${day === today.getDate() ? 'bg-accent text-accent-foreground rounded-full w-6 h-6 flex items-center justify-center' : ''}`}>{day}</span>
                {daySessions.map((s) => (
                  <div key={s.id} className="mt-1 px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary truncate">{s[l('title')]}</div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sessions List */}
      <div className="mt-6 bg-card rounded-xl border p-5">
        <h2 className="font-semibold mb-4">{language === 'ar' ? 'الجلسات القادمة' : 'Upcoming Sessions'}</h2>
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
              <div>
                <p className="text-sm font-medium">{s[l('title')]}</p>
                <p className="text-xs text-muted-foreground">{s.date} — {s.time} ({s.duration} {language === 'ar' ? 'دقيقة' : 'min'})</p>
                <p className="text-xs text-muted-foreground">{s[l('instructor')]}</p>
              </div>
              <span className="text-xs text-muted-foreground">{(s.attendees || []).length} {language === 'ar' ? 'حضور' : 'attendees'}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Create Session Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{t('admin.createSession')}</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="space-y-3">
            <select value={form.courseId} onChange={e => setForm(p => ({ ...p, courseId: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required>
              <option value="">{language === 'ar' ? '— اختر دورة —' : '— Select course —'}</option>
              {mockCourses.map(c => <option key={c.id} value={c.id}>{c[l('title')]}</option>)}
            </select>
            <input placeholder={language === 'ar' ? 'عنوان الجلسة (عربي)' : 'Session title (AR)'} value={form.title_ar} onChange={e => setForm(p => ({ ...p, title_ar: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            <input placeholder={language === 'ar' ? 'عنوان الجلسة (إنجليزي)' : 'Session title (EN)'} value={form.title_en} onChange={e => setForm(p => ({ ...p, title_en: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} className="px-4 py-2.5 rounded-lg border bg-background text-sm" required />
              <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="px-4 py-2.5 rounded-lg border bg-background text-sm" required />
            </div>
            <input placeholder={language === 'ar' ? 'المدرب' : 'Instructor'} value={form[l('instructor')]} onChange={e => setForm(p => ({ ...p, [l('instructor')]: e.target.value }))} className="w-full px-4 py-2.5 rounded-lg border bg-background text-sm" />
            <Button type="submit" className="w-full">{t('common.confirm')}</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Scheduling;
