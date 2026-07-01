import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppData } from '@/contexts/AppDataContext';
import { usePagination } from '@/lib/usePagination';
import TablePagination from '@/components/TablePagination';
import { motion, AnimatePresence } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Plus, Edit, Trash2, GraduationCap, Mail, Phone, Search, Check,
  LayoutDashboard, Users, DollarSign, Megaphone, Calendar, BookOpen,
  Bell, Settings, RotateCcw, ChevronDown, ChevronUp, Eye, EyeOff, Shield,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Permission groups matching actual Spatie permission names ─────────────────
const PERM_GROUPS = [
  {
    key: 'overview',
    labelAr: 'نظرة عامة', labelEn: 'Overview',
    icon: LayoutDashboard,
    perms: [
      { name: 'view dashboard', labelAr: 'عرض لوحة التحكم',  labelEn: 'View Dashboard' },
      { name: 'view analytics', labelAr: 'عرض التحليلات',    labelEn: 'View Analytics' },
      { name: 'view reports',   labelAr: 'عرض التقارير',     labelEn: 'View Reports' },
    ],
  },
  {
    key: 'crm',
    labelAr: 'إدارة العملاء', labelEn: 'CRM',
    icon: Users,
    perms: [
      { name: 'view clients',             labelAr: 'عرض العملاء',               labelEn: 'View Clients' },
      { name: 'create clients',           labelAr: 'إضافة عملاء',               labelEn: 'Create Clients' },
      { name: 'edit clients',             labelAr: 'تعديل العملاء',             labelEn: 'Edit Clients' },
      { name: 'delete clients',           labelAr: 'حذف العملاء',               labelEn: 'Delete Clients' },
      { name: 'view leads',               labelAr: 'عرض العملاء المحتملين',     labelEn: 'View Leads' },
      { name: 'create leads',             labelAr: 'إضافة عملاء محتملين',       labelEn: 'Create Leads' },
      { name: 'edit leads',               labelAr: 'تعديل العملاء المحتملين',   labelEn: 'Edit Leads' },
      { name: 'delete leads',             labelAr: 'حذف العملاء المحتملين',     labelEn: 'Delete Leads' },
      { name: 'convert leads',            labelAr: 'تحويل إلى عميل',            labelEn: 'Convert Leads' },
      { name: 'view support tickets',     labelAr: 'عرض تذاكر الدعم',          labelEn: 'View Support Tickets' },
      { name: 'manage support tickets',   labelAr: 'إدارة تذاكر الدعم',        labelEn: 'Manage Support Tickets' },
      { name: 'view messages',            labelAr: 'عرض الرسائل',               labelEn: 'View Messages' },
      { name: 'manage messages',          labelAr: 'إدارة الرسائل',             labelEn: 'Manage Messages' },
    ],
  },
  {
    key: 'finance',
    labelAr: 'المالية', labelEn: 'Finance',
    icon: DollarSign,
    perms: [
      { name: 'view finance',        labelAr: 'عرض المالية',      labelEn: 'View Finance' },
      { name: 'manage invoices',     labelAr: 'إدارة الفواتير',   labelEn: 'Manage Invoices' },
      { name: 'manage transactions', labelAr: 'إدارة المعاملات',  labelEn: 'Manage Transactions' },
      { name: 'view revenue',        labelAr: 'عرض الإيرادات',    labelEn: 'View Revenue' },
    ],
  },
  {
    key: 'marketing',
    labelAr: 'التسويق', labelEn: 'Marketing',
    icon: Megaphone,
    perms: [
      { name: 'view marketing',         labelAr: 'عرض التسويق',              labelEn: 'View Marketing' },
      { name: 'manage campaigns',       labelAr: 'إدارة الحملات',            labelEn: 'Manage Campaigns' },
      { name: 'manage email marketing', labelAr: 'إدارة التسويق البريدي',    labelEn: 'Manage Email Marketing' },
      { name: 'manage social media',    labelAr: 'إدارة التواصل الاجتماعي', labelEn: 'Manage Social Media' },
    ],
  },
  {
    key: 'content',
    labelAr: 'المحتوى', labelEn: 'Content',
    icon: BookOpen,
    perms: [
      { name: 'manage courses', labelAr: 'إدارة الدورات', labelEn: 'Manage Courses' },
      { name: 'manage blog',    labelAr: 'إدارة المدونة', labelEn: 'Manage Blog' },
      { name: 'manage media',   labelAr: 'إدارة الوسائط', labelEn: 'Manage Media' },
    ],
  },
  {
    key: 'scheduling',
    labelAr: 'الجدولة', labelEn: 'Scheduling',
    icon: Calendar,
    perms: [
      { name: 'view scheduling',     labelAr: 'عرض الجدولة',    labelEn: 'View Scheduling' },
      { name: 'manage scheduling',   labelAr: 'إدارة الجدولة',  labelEn: 'Manage Scheduling' },
      { name: 'manage appointments', labelAr: 'إدارة المواعيد', labelEn: 'Manage Appointments' },
    ],
  },
  {
    key: 'notifications',
    labelAr: 'الإشعارات', labelEn: 'Notifications',
    icon: Bell,
    perms: [
      { name: 'view notifications',   labelAr: 'عرض الإشعارات',  labelEn: 'View Notifications' },
      { name: 'manage notifications', labelAr: 'إدارة الإشعارات', labelEn: 'Manage Notifications' },
    ],
  },
  {
    key: 'settings',
    labelAr: 'الإعدادات', labelEn: 'Settings',
    icon: Settings,
    perms: [
      { name: 'view settings',   labelAr: 'عرض الإعدادات',      labelEn: 'View Settings' },
      { name: 'manage settings', labelAr: 'إدارة الإعدادات',    labelEn: 'Manage Settings' },
      { name: 'manage roles',    labelAr: 'إدارة الأدوار',       labelEn: 'Manage Roles' },
      { name: 'manage users',    labelAr: 'إدارة المستخدمين',   labelEn: 'Manage Users' },
      { name: 'view users',      labelAr: 'عرض المستخدمين',     labelEn: 'View Users' },
      { name: 'create users',    labelAr: 'إضافة مستخدمين',     labelEn: 'Create Users' },
      { name: 'edit users',      labelAr: 'تعديل المستخدمين',   labelEn: 'Edit Users' },
      { name: 'delete users',    labelAr: 'حذف المستخدمين',     labelEn: 'Delete Users' },
    ],
  },
];

// Role display names (DB names → readable labels)
const ROLE_LABELS = {
  admin:            { ar: 'مدير النظام',     en: 'Admin' },
  coach:            { ar: 'مدرب',            en: 'Coach' },
  account_manager:  { ar: 'مدير الحساب',    en: 'Account Manager' },
  marketer:         { ar: 'مسوّق',           en: 'Marketer' },
  customer_support: { ar: 'دعم العملاء',    en: 'Customer Support' },
  analyst:          { ar: 'محلل',            en: 'Analyst' },
};

const ROLE_COLORS = {
  admin:            'text-primary    bg-primary/10    border-primary/25',
  coach:            'text-blue-400   bg-blue-500/10   border-blue-500/25',
  account_manager:  'text-emerald-400 bg-emerald-500/10 border-emerald-500/25',
  marketer:         'text-violet-400 bg-violet-500/10 border-violet-500/25',
  customer_support: 'text-amber-400  bg-amber-500/10  border-amber-500/25',
  analyst:          'text-cyan-400   bg-cyan-500/10   border-cyan-500/25',
};

const roleLabel = (name, lang) => {
  const map = ROLE_LABELS[name];
  if (map) return lang === 'ar' ? map.ar : map.en;
  return name?.replace(/_/g, ' ');
};

const roleColor = (name) => ROLE_COLORS[name] ?? 'text-muted-foreground bg-muted border-border';

// ── PermCheckbox ──────────────────────────────────────────────────────────────
const PermCheckbox = ({ checked, onChange, fromRole, isExtra }) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative h-5 w-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${
      checked
        ? fromRole
          ? 'bg-blue-500 border-blue-500'
          : 'bg-primary border-primary'
        : 'border-border bg-background hover:border-primary/40'
    }`}
  >
    {checked && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
    {isExtra && (
      <span className="absolute -top-1 -end-1 w-2 h-2 rounded-full bg-amber-400 border border-background" />
    )}
  </button>
);

// ── Collapsible permission group ──────────────────────────────────────────────
const PermGroup = ({ group, checkedSet, rolePermSet, onToggle, language }) => {
  const [open, setOpen] = useState(true);
  const l = (ar, en) => language === 'ar' ? ar : en;
  const Icon = group.icon;

  const groupChecked   = group.perms.filter(p => checkedSet.has(p.name)).length;
  const groupTotal     = group.perms.length;

  return (
    <div className="rounded-xl border border-primary/10 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{l(group.labelAr, group.labelEn)}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
            groupChecked > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
          }`}>
            {groupChecked}/{groupTotal}
          </span>
        </div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="divide-y divide-border/40">
          {group.perms.map(perm => {
            const checked   = checkedSet.has(perm.name);
            const fromRole  = rolePermSet.has(perm.name);
            const isExtra   = checked && !fromRole;
            return (
              <div key={perm.name} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <PermCheckbox
                    checked={checked}
                    onChange={(v) => onToggle(perm.name, v)}
                    fromRole={fromRole}
                    isExtra={isExtra}
                  />
                  <span className="text-sm truncate">{l(perm.labelAr, perm.labelEn)}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ms-3">
                  {fromRole && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {l('من الدور', 'Role')}
                    </span>
                  )}
                  {isExtra && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {l('مخصص', 'Custom')}
                    </span>
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

// ── Main component ────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  name: '', email: '', phone: '', specialization: '',
  password: '', role: '', status: 'active',
  checkedPerms: new Set(),
};

const Coaches = () => {
  const { language } = useLanguage();
  const l = (ar, en) => language === 'ar' ? ar : en;
  const { coaches, dbRoles, addCoach, updateCoach, deleteCoach, addRole, updateRole, deleteRole } = useAppData();

  const [pageTab,      setPageTab]     = useState('coaches');
  const [search,       setSearch]      = useState('');

  // Coach modal
  const [modalOpen,    setModalOpen]   = useState(false);
  const [editingCoach, setEditingCoach]= useState(null);
  const [form,         setForm]        = useState(EMPTY_FORM);
  const [modalTab,     setModalTab]    = useState('info');
  const [showPass,     setShowPass]    = useState(false);
  const [delTarget,    setDelTarget]   = useState(null);
  const [saving,       setSaving]      = useState(false);

  // Role modal
  const [roleModalOpen,    setRoleModalOpen]   = useState(false);
  const [editingRole,      setEditingRole]     = useState(null);
  const [roleForm,         setRoleForm]        = useState({ name: '', checkedPerms: new Set() });
  const [roleSaving,       setRoleSaving]      = useState(false);
  const [delRoleTarget,    setDelRoleTarget]   = useState(null);

  // Derive role permissions set from dbRoles
  const getRolePermSet = (roleName) => {
    const role = dbRoles.find(r => r.name === roleName);
    return new Set(role?.permissions ?? []);
  };

  // Current role's permission set in the form
  const currentRolePermSet = getRolePermSet(form.role);

  // Extra permissions = checked but NOT from the role
  const extraPerms = [...form.checkedPerms].filter(p => !currentRolePermSet.has(p));

  // ── Open modals ────────────────────────────────────────────────────────────
  const openAdd = () => {
    const defaultRole = dbRoles[0]?.name ?? '';
    const rolePerms   = getRolePermSet(defaultRole);
    setEditingCoach(null);
    setForm({ ...EMPTY_FORM, role: defaultRole, checkedPerms: new Set(rolePerms) });
    setModalTab('info');
    setShowPass(false);
    setModalOpen(true);
  };

  const openEdit = (coach) => {
    const rolePerms  = getRolePermSet(coach.role);
    const allChecked = new Set([
      ...(coach.role_permissions ?? []),
      ...(coach.extra_permissions ?? []),
    ]);
    setEditingCoach(coach);
    setForm({
      name:         coach.name,
      email:        coach.email,
      phone:        coach.phone ?? '',
      specialization: coach.specialization ?? '',
      password:     '',
      role:         coach.role ?? '',
      status:       coach.status ?? 'active',
      checkedPerms: allChecked,
    });
    setModalTab('info');
    setShowPass(false);
    setModalOpen(true);
  };

  // ── Role change resets permissions to the new role's defaults ──────────────
  const handleRoleChange = (newRole) => {
    const newRolePerms = getRolePermSet(newRole);
    setForm(p => ({
      ...p,
      role: newRole,
      // Keep any extras the user manually added, drop old role perms, add new role perms
      checkedPerms: new Set([...newRolePerms, ...[...p.checkedPerms].filter(pm => !currentRolePermSet.has(pm))]),
    }));
  };

  const togglePerm = (permName, val) => {
    setForm(p => {
      const next = new Set(p.checkedPerms);
      val ? next.add(permName) : next.delete(permName);
      return { ...p, checkedPerms: next };
    });
  };

  const resetToRole = () => {
    setForm(p => ({ ...p, checkedPerms: new Set(getRolePermSet(p.role)) }));
    toast.info(l('تم إعادة الضبط لصلاحيات الدور', 'Reset to role defaults'));
  };

  // ── Save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error(l('يرجى إدخال الاسم', 'Please enter a name'));
      return;
    }
    if (!form.role) {
      toast.error(l('يرجى اختيار دور', 'Please select a role'));
      return;
    }
    if (!editingCoach && !form.password.trim()) {
      toast.error(l('يرجى إدخال كلمة المرور', 'Please enter a password'));
      return;
    }

    setSaving(true);
    try {
      if (editingCoach) {
        await updateCoach({
          id:              editingCoach.id,
          name:            form.name,
          phone:           form.phone,
          specialization:  form.specialization,
          status:          form.status,
          role:            form.role,
          extra_permissions: extraPerms,
        });
        toast.success(l('تم تحديث بيانات المدرب', 'Coach updated'));
      } else {
        await addCoach({
          name:            form.name,
          email:           form.email,
          phone:           form.phone,
          password:        form.password,
          specialization:  form.specialization,
          role:            form.role,
          extra_permissions: extraPerms,
        });
        toast.success(l('تمت إضافة المدرب', 'Coach added'));
      }
      setModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message ?? l('حدث خطأ', 'Something went wrong');
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!delTarget) return;
    deleteCoach(delTarget.id);
    toast.success(l('تم حذف المدرب', 'Coach deleted'));
    setDelTarget(null);
  };

  // ── Role handlers ──────────────────────────────────────────────────────────
  const openAddRole = () => {
    setEditingRole(null);
    setRoleForm({ name: '', checkedPerms: new Set() });
    setRoleModalOpen(true);
  };

  const openEditRole = (role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, checkedPerms: new Set(role.permissions ?? []) });
    setRoleModalOpen(true);
  };

  const toggleRolePerm = (permName, val) => {
    setRoleForm(p => {
      const next = new Set(p.checkedPerms);
      val ? next.add(permName) : next.delete(permName);
      return { ...p, checkedPerms: next };
    });
  };

  const handleSaveRole = async () => {
    const name = roleForm.name.trim().toLowerCase().replace(/\s+/g, '_');
    if (!name) {
      toast.error(l('يرجى إدخال اسم الدور', 'Please enter a role name'));
      return;
    }
    setRoleSaving(true);
    try {
      if (editingRole) {
        await updateRole({ id: editingRole.id, permissions: [...roleForm.checkedPerms] });
        toast.success(l('تم تحديث الدور', 'Role updated'));
      } else {
        await addRole({ name, permissions: [...roleForm.checkedPerms] });
        toast.success(l('تمت إضافة الدور', 'Role added'));
      }
      setRoleModalOpen(false);
    } catch (err) {
      const msg = err?.response?.data?.message ?? l('حدث خطأ', 'Something went wrong');
      toast.error(msg);
    } finally {
      setRoleSaving(false);
    }
  };

  const handleDeleteRole = async () => {
    if (!delRoleTarget) return;
    try {
      await deleteRole(delRoleTarget.id);
      toast.success(l('تم حذف الدور', 'Role deleted'));
    } catch (err) {
      const msg = err?.response?.data?.message ?? l('لا يمكن حذف هذا الدور', 'Cannot delete this role');
      toast.error(msg);
    }
    setDelRoleTarget(null);
  };

  const coachesWithRole = (roleName) => coaches.filter(c => c.role === roleName).length;

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = coaches.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.name ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.specialization ?? '').toLowerCase().includes(q) ||
      (c.role ?? '').toLowerCase().includes(q)
    );
  });
  const { page, setPage, paginated, totalPages, from, to, total } = usePagination(filtered, 12, search);

  const activeCount = coaches.filter(c => c.status === 'active').length;
  const field = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{l('المدربون والأدوار', 'Coaches & Roles')}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {l('إدارة المدربين وصلاحياتهم وفق أدوار النظام', 'Manage coaches and their permissions based on system roles')}
          </p>
        </div>
        {pageTab === 'coaches'
          ? <Button onClick={openAdd} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{l('إضافة مدرب', 'Add Coach')}</Button>
          : <Button onClick={openAddRole} size="sm" className="gap-1.5"><Plus className="h-4 w-4" />{l('إضافة دور', 'Add Role')}</Button>
        }
      </div>

      {/* Page tabs */}
      <div className="flex gap-1 bg-muted/50 rounded-xl p-1 w-fit">
        {[
          { key: 'coaches', labelAr: 'المدربون', labelEn: 'Coaches' },
          { key: 'roles',   labelAr: 'الأدوار',  labelEn: 'Roles' },
        ].map(tab => (
          <button key={tab.key} type="button" onClick={() => setPageTab(tab.key)}
            className={`px-5 py-1.5 rounded-lg text-sm font-medium transition-all ${
              pageTab === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {l(tab.labelAr, tab.labelEn)}
          </button>
        ))}
      </div>

      {pageTab === 'coaches' && (<>
      {/* Stats */}
      <div className="flex flex-wrap gap-3">
        {[
          { labelAr: 'إجمالي المدربين', labelEn: 'Total',    value: coaches.length,   color: 'text-primary',      bg: 'bg-primary/8' },
          { labelAr: 'نشطون',           labelEn: 'Active',   value: activeCount,       color: 'text-emerald-400',  bg: 'bg-emerald-500/8' },
          { labelAr: 'غير نشطين',       labelEn: 'Inactive', value: coaches.length - activeCount, color: 'text-muted-foreground', bg: 'bg-muted/40' },
        ].map((s, i) => (
          <div key={i} className="bg-card border border-primary/10 rounded-2xl px-5 py-3 flex items-center gap-3">
            <div className={`p-2 rounded-lg ${s.bg}`}>
              <GraduationCap className={`h-4 w-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground">{l(s.labelAr, s.labelEn)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${language === 'ar' ? 'right-3' : 'left-3'}`} />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder={l('بحث بالاسم أو الدور...', 'Search by name or role...')}
          className={`w-full h-9 rounded-xl bg-card border border-primary/15 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition ${language === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'}`}
        />
      </div>

      {/* Coach cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <AnimatePresence>
          {coaches.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="col-span-full bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
              {l('لا يوجد مدربون بعد', 'No coaches yet')}
            </motion.div>
          )}
          {paginated.map((coach, i) => {
            const extraCount = (coach.extra_permissions ?? []).length;
            const totalPerms = (coach.role_permissions ?? []).length + extraCount;
            return (
              <motion.div key={coach.id}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="bg-card border border-primary/10 rounded-2xl p-5 flex flex-col gap-4"
              >
                {/* Top */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl gradient-gold flex items-center justify-center text-primary-foreground font-bold text-sm shadow-neon shrink-0">
                      {(coach.name ?? '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{coach.name}</p>
                      {coach.specialization && (
                        <p className="text-xs text-muted-foreground truncate">{coach.specialization}</p>
                      )}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${
                    coach.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                      : 'bg-muted text-muted-foreground border-border'
                  }`}>
                    {coach.status === 'active' ? l('نشط', 'Active') : l('غير نشط', 'Inactive')}
                  </span>
                </div>

                {/* Contact */}
                <div className="space-y-1">
                  {coach.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{coach.email}</span>
                    </div>
                  )}
                  {coach.phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{coach.phone}</span>
                    </div>
                  )}
                </div>

                {/* Role + permissions summary */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {coach.role && (
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${roleColor(coach.role)}`}>
                        {roleLabel(coach.role, language)}
                      </span>
                    )}
                    {extraCount > 0 && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25 font-medium">
                        +{extraCount} {l('مخصص', 'custom')}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground ms-auto">
                      {totalPerms} {l('صلاحية', 'permissions')}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1 border-t border-primary/8 mt-auto">
                  <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs" onClick={() => openEdit(coach)}>
                    <Edit className="h-3.5 w-3.5" />{l('تعديل', 'Edit')}
                  </Button>
                  <Button variant="ghost" size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setDelTarget(coach)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        {filtered.length > 0 && (
          <TablePagination page={page} totalPages={totalPages} from={from} to={to} total={total} onPage={setPage} labelAr="مدرب" labelEn="coach" language={language} />
        )}
      </div>
      </>)}

      {/* ══ ROLES TAB ══ */}
      {pageTab === 'roles' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence>
            {dbRoles.length === 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="col-span-full bg-card border rounded-2xl p-12 text-center text-muted-foreground text-sm">
                {l('لا توجد أدوار', 'No roles found')}
              </motion.div>
            )}
            {dbRoles.map((role, i) => {
              const count    = coachesWithRole(role.name);
              const perms    = role.permissions ?? [];
              const isSystem = role.name === 'admin' || role.name === 'client';
              return (
                <motion.div key={role.id}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="bg-card border border-primary/10 rounded-2xl p-5 space-y-4"
                >
                  {/* Role header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center border ${roleColor(role.name)}`}>
                        <Shield className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold">{roleLabel(role.name, language)}</p>
                        <p className="text-xs text-muted-foreground font-mono opacity-60">{role.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {count} {l('مدرب', count === 1 ? 'coach' : 'coaches')} · {perms.length} {l('صلاحية', 'permissions')}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => openEditRole(role)} title={l('تعديل', 'Edit')}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      {!isSystem && (
                        <Button variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => setDelRoleTarget(role)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Permission chips grouped */}
                  <div className="space-y-2">
                    {PERM_GROUPS.filter(g => g.perms.some(p => perms.includes(p.name))).map(g => {
                      const active = g.perms.filter(p => perms.includes(p.name));
                      if (!active.length) return null;
                      const Icon = g.icon;
                      return (
                        <div key={g.key}>
                          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground/70 mb-1">
                            <Icon className="h-3 w-3" />
                            {l(g.labelAr, g.labelEn)}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {active.map(p => (
                              <span key={p.name} className="text-[10px] px-2 py-0.5 rounded-full bg-primary/8 text-primary border border-primary/15 font-medium">
                                {l(p.labelAr, p.labelEn)}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    {perms.length === 0 && (
                      <p className="text-xs text-muted-foreground/50">{l('لا توجد صلاحيات', 'No permissions')}</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* ══ ADD / EDIT MODAL ══ */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCoach ? l('تعديل المدرب', 'Edit Coach') : l('إضافة مدرب جديد', 'Add New Coach')}
            </DialogTitle>
          </DialogHeader>

          {/* Tab switcher */}
          <div className="flex gap-1 bg-muted/50 rounded-xl p-1 mt-2">
            {[
              { key: 'info',  labelAr: 'البيانات',  labelEn: 'Info' },
              { key: 'perms', labelAr: 'الصلاحيات', labelEn: 'Permissions' },
            ].map(tab => (
              <button key={tab.key} type="button" onClick={() => setModalTab(tab.key)}
                className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  modalTab === tab.key ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {l(tab.labelAr, tab.labelEn)}
                {tab.key === 'perms' && extraPerms.length > 0 && (
                  <span className="ms-1.5 text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                    +{extraPerms.length}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="space-y-4 mt-2">

            {/* ── Info tab ── */}
            {modalTab === 'info' && (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الاسم الكامل', 'Full Name')}</label>
                  <input value={form.name} onChange={field('name')}
                    placeholder={l('أحمد خالد', 'Ahmad Khalid')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>

                {!editingCoach && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('البريد الإلكتروني', 'Email')}</label>
                    <input type="email" value={form.email} onChange={field('email')}
                      placeholder="coach@aljawad.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('رقم الهاتف', 'Phone')}</label>
                    <input type="tel" value={form.phone} onChange={field('phone')}
                      placeholder="+963 9XX XXX XXX"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('التخصص', 'Specialization')}</label>
                    <input value={form.specialization} onChange={field('specialization')}
                      placeholder={l('الفوركس والأسهم', 'Forex & Stocks')}
                      className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Role */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الدور', 'Role')}</label>
                    <div className="relative">
                      <select value={form.role} onChange={e => handleRoleChange(e.target.value)}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                        <option value="">{l('— اختر دوراً —', '— Select role —')}</option>
                        {dbRoles.map(r => (
                          <option key={r.id} value={r.name}>{roleLabel(r.name, language)}</option>
                        ))}
                      </select>
                      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${language === 'ar' ? 'left-3' : 'right-3'}`} />
                    </div>
                    {form.role && (
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {currentRolePermSet.size} {l('صلاحية من الدور', 'permissions from role')}
                      </p>
                    )}
                  </div>

                  {/* Status */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('الحالة', 'Status')}</label>
                    <div className="relative">
                      <select value={form.status} onChange={field('status')}
                        className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                        <option value="active">{l('نشط', 'Active')}</option>
                        <option value="inactive">{l('غير نشط', 'Inactive')}</option>
                      </select>
                      <ChevronDown className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none ${language === 'ar' ? 'left-3' : 'right-3'}`} />
                    </div>
                  </div>
                </div>

                {/* Password (new coach only) */}
                {!editingCoach && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('كلمة المرور', 'Password')}</label>
                    <div className="relative">
                      <input
                        type={showPass ? 'text' : 'password'}
                        value={form.password} onChange={field('password')}
                        placeholder="••••••••"
                        className="w-full px-3 py-2 pe-10 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                      />
                      <button type="button" onClick={() => setShowPass(s => !s)}
                        className={`absolute top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors ${language === 'ar' ? 'left-3' : 'right-3'}`}>
                        {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── Permissions tab ── */}
            {modalTab === 'perms' && (
              <div className="space-y-3">
                {/* Legend + reset */}
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-blue-500 inline-block" />
                      <span className="text-muted-foreground">{l('صلاحية من الدور', 'From role')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-3.5 h-3.5 rounded bg-primary inline-block" />
                      <span className="text-muted-foreground">{l('إضافية مخصصة', 'Custom extra')}</span>
                    </div>
                  </div>
                  {extraPerms.length > 0 && (
                    <Button variant="outline" size="sm" onClick={resetToRole} className="gap-1.5 text-xs h-7">
                      <RotateCcw className="h-3 w-3" />{l('إعادة ضبط', 'Reset to role')}
                    </Button>
                  )}
                </div>

                {/* Groups */}
                <div className="space-y-2">
                  {PERM_GROUPS.map(group => (
                    <PermGroup
                      key={group.key}
                      group={group}
                      checkedSet={form.checkedPerms}
                      rolePermSet={currentRolePermSet}
                      onToggle={togglePerm}
                      language={language}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? l('جاري الحفظ...', 'Saving...') : editingCoach ? l('حفظ', 'Save') : l('إضافة', 'Add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ DELETE COACH CONFIRMATION ══ */}
      <Dialog open={!!delTarget} onOpenChange={() => setDelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{l('تعطيل المدرب', 'Deactivate Coach')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('سيتم تعطيل حساب المدرب. هل أنت متأكد؟', 'The coach account will be deactivated. Are you sure?')}
          </p>
          {delTarget && <p className="text-sm font-semibold mt-1">{delTarget.name}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDelTarget(null)}>{l('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" onClick={handleDelete}>{l('تعطيل', 'Deactivate')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ ROLE ADD / EDIT MODAL ══ */}
      <Dialog open={roleModalOpen} onOpenChange={setRoleModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRole ? l('تعديل صلاحيات الدور', 'Edit Role Permissions') : l('إضافة دور جديد', 'Add New Role')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Role name — only editable on create */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">{l('اسم الدور', 'Role Name')}</label>
              {editingRole ? (
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl border border-primary/15 bg-muted/30">
                  <Shield className={`h-4 w-4 ${roleColor(editingRole.name).split(' ')[0]}`} />
                  <div>
                    <p className="text-sm font-medium">{roleLabel(editingRole.name, language)}</p>
                    <p className="text-[10px] font-mono text-muted-foreground">{editingRole.name}</p>
                  </div>
                </div>
              ) : (
                <>
                  <input
                    value={roleForm.name}
                    onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))}
                    placeholder={l('مثال: content_creator', 'e.g. content_creator')}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-primary/15 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {l('سيتم حفظه بأحرف صغيرة مع شرطات سفلية', 'Saved as lowercase with underscores')}
                  </p>
                </>
              )}
            </div>

            {/* Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-muted-foreground">{l('الصلاحيات', 'Permissions')}</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setRoleForm(p => ({ ...p, checkedPerms: new Set(PERM_GROUPS.flatMap(g => g.perms.map(pp => pp.name))) }))}
                    className="text-[10px] text-primary hover:underline">{l('تحديد الكل', 'Select all')}</button>
                  <span className="text-muted-foreground/40">·</span>
                  <button type="button" onClick={() => setRoleForm(p => ({ ...p, checkedPerms: new Set() }))}
                    className="text-[10px] text-muted-foreground hover:underline">{l('مسح الكل', 'Clear all')}</button>
                </div>
              </div>
              <div className="space-y-2">
                {PERM_GROUPS.map(group => {
                  const Icon = group.icon;
                  const groupChecked = group.perms.filter(p => roleForm.checkedPerms.has(p.name)).length;
                  return (
                    <div key={group.key} className="rounded-xl border border-primary/10 overflow-hidden">
                      {/* Group header with select-all toggle */}
                      <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{l(group.labelAr, group.labelEn)}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${groupChecked > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
                            {groupChecked}/{group.perms.length}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const allIn = group.perms.every(p => roleForm.checkedPerms.has(p.name));
                            setRoleForm(prev => {
                              const next = new Set(prev.checkedPerms);
                              group.perms.forEach(p => allIn ? next.delete(p.name) : next.add(p.name));
                              return { ...prev, checkedPerms: next };
                            });
                          }}
                          className="text-[10px] text-primary hover:underline"
                        >
                          {group.perms.every(p => roleForm.checkedPerms.has(p.name)) ? l('إلغاء الكل', 'Remove all') : l('تحديد الكل', 'Select all')}
                        </button>
                      </div>
                      {/* Permissions list */}
                      <div className="divide-y divide-border/40">
                        {group.perms.map(perm => {
                          const checked = roleForm.checkedPerms.has(perm.name);
                          return (
                            <label key={perm.name} className="flex items-center gap-3 px-4 py-2 hover:bg-muted/20 transition-colors cursor-pointer">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={e => toggleRolePerm(perm.name, e.target.checked)}
                                className="h-4 w-4 rounded border-border accent-primary cursor-pointer"
                              />
                              <span className="text-sm">{l(perm.labelAr, perm.labelEn)}</span>
                              <span className="text-[10px] font-mono text-muted-foreground/50 ms-auto">{perm.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setRoleModalOpen(false)}>{l('إلغاء', 'Cancel')}</Button>
              <Button onClick={handleSaveRole} disabled={roleSaving}>
                {roleSaving ? l('جاري الحفظ...', 'Saving...') : editingRole ? l('حفظ', 'Save') : l('إضافة', 'Add')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══ DELETE ROLE CONFIRMATION ══ */}
      <Dialog open={!!delRoleTarget} onOpenChange={() => setDelRoleTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{l('حذف الدور', 'Delete Role')}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mt-2">
            {l('هل أنت متأكد من حذف هذا الدور؟', 'Are you sure you want to delete this role?')}
          </p>
          {delRoleTarget && (
            <>
              <p className="text-sm font-semibold mt-1">{roleLabel(delRoleTarget.name, language)}</p>
              {coachesWithRole(delRoleTarget.name) > 0 && (
                <p className="text-xs text-destructive mt-2">
                  {l(
                    `${coachesWithRole(delRoleTarget.name)} مدرب مرتبط بهذا الدور. يجب تغيير أدوارهم أولاً.`,
                    `${coachesWithRole(delRoleTarget.name)} coach(es) use this role. Reassign them first.`
                  )}
                </p>
              )}
            </>
          )}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDelRoleTarget(null)}>{l('إلغاء', 'Cancel')}</Button>
            <Button variant="destructive" onClick={handleDeleteRole}>{l('حذف', 'Delete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Coaches;
