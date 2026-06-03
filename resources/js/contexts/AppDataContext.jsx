import { createContext, useContext, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  courseApi, coursePlanApi, clientApi, blogApi, campaignApi,
  ticketApi, appointmentApi, webinarApi, financeApi,
  marketingApi, notificationApi, coachApi, roleApi,
} from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const normalizePhone = (raw = '') => raw.replace(/[\s\-().]/g, '');

const AppDataContext = createContext(null);
export const useAppData = () => useContext(AppDataContext);

// ── Generic hook factory ────────────────────────────────────────────────────
function useList(queryKey, fetcher, options = {}) {
  return useQuery({
    queryKey,
    queryFn: async () => {
      try {
        const res = await fetcher();
        return res.data?.data ?? [];
      } catch {
        return [];
      }
    },
    staleTime: 30_000,
    ...options,
  });
}

export const AppDataProvider = ({ children }) => {
  const qc = useQueryClient();
  const { isAuthenticated } = useAuth();

  // ── Courses (public endpoint — always fetch) ──────────────────────────────
  const { data: courses = [] } = useList(['courses'], () => courseApi.list());

  const addCourseMut = useMutation({
    mutationFn: (data) => courseApi.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['courses'] }); toast.success('Course added'); },
  });
  const updateCourseMut = useMutation({
    mutationFn: ({ id, ...d }) => courseApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });
  const deleteCourseMut = useMutation({
    mutationFn: (id) => courseApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['courses'] }),
  });

  const addCourse    = (c)  => addCourseMut.mutate(c);
  const updateCourse = (u)  => updateCourseMut.mutate(u);
  const deleteCourse = (id) => deleteCourseMut.mutate(id);

  // ── Course Plans ──────────────────────────────────────────────────────────
  const { data: coursePlans = [] } = useList(['coursePlans'], () => coursePlanApi.list());

  const updateCoursePlanMut = useMutation({
    mutationFn: ({ id, ...d }) => coursePlanApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coursePlans'] }),
  });
  const updateCoursePlan = (u) => updateCoursePlanMut.mutate(u);

  const toggleFeatureMut = useMutation({
    mutationFn: ({ planId, featureId, included }) =>
      coursePlanApi.updateFeature(planId, featureId, { included }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coursePlans'] }),
  });
  const toggleFeature = (planId, featureId) => {
    const plan = coursePlans.find(p => p.id == planId);
    const feature = plan?.features?.find(f => f.id == featureId);
    if (feature) toggleFeatureMut.mutate({ planId, featureId, included: !feature.included });
  };

  const updateFeatureTextMut = useMutation({
    mutationFn: ({ planId, featureId, text_ar, text_en }) =>
      coursePlanApi.updateFeature(planId, featureId, { text_ar, text_en }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coursePlans'] }),
  });
  const updateFeatureText = (planId, featureId, text_ar, text_en) =>
    updateFeatureTextMut.mutate({ planId, featureId, text_ar, text_en });

  const addFeatureMut = useMutation({
    mutationFn: ({ planId, text_ar, text_en }) =>
      coursePlanApi.addFeature(planId, { text_ar, text_en, included: true }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coursePlans'] }),
  });
  const addFeatureToPlan = (planId, text_ar, text_en) =>
    addFeatureMut.mutate({ planId, text_ar, text_en });

  const deleteFeatureMut = useMutation({
    mutationFn: ({ planId, featureId }) => coursePlanApi.removeFeature(planId, featureId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coursePlans'] }),
  });
  const deleteFeature = (planId, featureId) =>
    deleteFeatureMut.mutate({ planId, featureId });

  // ── CRM: Clients & Leads ──────────────────────────────────────────────────
  const { data: allCrmPeople = [] } = useQuery({
    queryKey: ['crm'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await clientApi.list();
        return (res.data?.data ?? []).map(p => ({
          ...p,
          // Leads: map lead_status -> status, created_at -> added
          status: p.type === 'lead' ? (p.lead_status ?? p.status ?? 'new') : p.status,
          added:  p.added ?? (p.created_at ? p.created_at.split('T')[0] : ''),
          joined: p.joined ?? (p.created_at ? p.created_at.split('T')[0] : ''),
          tags:   Array.isArray(p.tags) ? p.tags : [],
          courses: p.courses ?? p.courses_count ?? 0,
        }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });
  const clients = allCrmPeople.filter(p => p.type === 'client');
  const leads   = allCrmPeople.filter(p => p.type === 'lead');

  const updateClientMut = useMutation({
    mutationFn: ({ id, ...d }) => clientApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const updateLeadMut = useMutation({
    mutationFn: ({ id, ...d }) => clientApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const addLeadMut = useMutation({
    mutationFn: (data) => clientApi.create({ ...data, type: 'lead' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });

  const updateClient = (u)  => updateClientMut.mutate(u);
  const updateLead   = (u)  => updateLeadMut.mutate(u);
  const addLead      = (l)  => { addLeadMut.mutate(l); return l; };

  const lookupByPhone = useCallback((rawPhone) => {
    const q = normalizePhone(rawPhone);
    const client = clients.find(c => normalizePhone(c.phone ?? '') === q);
    if (client) return { record: client, type: 'client' };
    const lead = leads.find(l => normalizePhone(l.phone ?? '') === q);
    if (lead) return { record: lead, type: 'lead' };
    return null;
  }, [clients, leads]);

  // ── Support Tickets ───────────────────────────────────────────────────────
  const { data: tickets = [] } = useQuery({
    queryKey: ['tickets'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await ticketApi.list();
        // Normalize field names: API uses snake_case, pages use camelCase/short forms
        return (res.data?.data ?? []).map(t => ({
          ...t,
          db_id:          t.id,            // keep real database ID for API calls
          id:             t.ticket_id ?? t.id,
          user:           t.user_name ?? t.user,
          opened:         t.opened_at ?? t.opened,
          first_response: t.first_response_at ?? t.first_response,
        }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const updateTicketMut = useMutation({
    mutationFn: ({ id, ...d }) => ticketApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });
  const addTicketMut = useMutation({
    mutationFn: (data) => ticketApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const updateTicket = (u) => updateTicketMut.mutate({ ...u, id: u.db_id ?? u.id });
  const addTicket    = (t) => { addTicketMut.mutate(t); return t; };

  // ── Blog Posts ────────────────────────────────────────────────────────────
  const { data: blogPosts = [] } = useQuery({
    queryKey: ['blogPosts'],
    queryFn: async () => {
      try {
        const res = await blogApi.list();
        return (res.data?.data ?? []).map(post => ({
          ...post,
          readTime: post.read_time ?? post.readTime ?? 5,
          date: post.published_at
            ? (typeof post.published_at === 'string' ? post.published_at.split('T')[0] : new Date(post.published_at).toISOString().split('T')[0])
            : post.date ?? '',
        }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const addBlogMut = useMutation({
    mutationFn: (data) => blogApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blogPosts'] }),
  });
  const updateBlogMut = useMutation({
    mutationFn: ({ id, ...d }) => blogApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blogPosts'] }),
  });
  const deleteBlogMut = useMutation({
    mutationFn: (id) => blogApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['blogPosts'] }),
  });

  const addBlogPost    = (p) => addBlogMut.mutate(p);
  const updateBlogPost = (u) => updateBlogMut.mutate(u);
  const deleteBlogPost = (id) => deleteBlogMut.mutate(id);

  // ── Campaigns ─────────────────────────────────────────────────────────────
  const { data: campaigns = [] } = useList(['campaigns'], () => campaignApi.list(), { enabled: isAuthenticated });

  const addCampaignMut = useMutation({
    mutationFn: (data) => campaignApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });
  const updateCampaignMut = useMutation({
    mutationFn: ({ id, ...d }) => campaignApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  const addCampaign           = (c) => addCampaignMut.mutate(c);
  const updateCampaignStatus  = (id, status) => updateCampaignMut.mutate({ id, status });

  // ── Appointments ──────────────────────────────────────────────────────────
  const { data: appointments = [] } = useList(['appointments'], () => appointmentApi.list(), { enabled: isAuthenticated });

  const addAppointmentMut = useMutation({
    mutationFn: (data) => appointmentApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
  const updateAppointmentMut = useMutation({
    mutationFn: ({ id, ...d }) => appointmentApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });
  const deleteAppointmentMut = useMutation({
    mutationFn: (id) => appointmentApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  });

  const addAppointment    = (a) => addAppointmentMut.mutate(a);
  const updateAppointment = (u) => updateAppointmentMut.mutate(u);
  const deleteAppointment = (id) => deleteAppointmentMut.mutate(id);

  // ── Webinars ──────────────────────────────────────────────────────────────
  const { data: webinars = [] } = useQuery({
    queryKey: ['webinars'],
    queryFn: async () => {
      try {
        const res = await webinarApi.list();
        // Normalize: API uses 'link', frontend pages use 'meeting_link'
        return (res.data?.data ?? []).map(w => ({
          ...w,
          meeting_link: w.meeting_link ?? w.link ?? '',
        }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const addWebinarMut = useMutation({
    mutationFn: (data) => webinarApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars'] }),
  });
  const updateWebinarMut = useMutation({
    mutationFn: ({ id, ...d }) => webinarApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars'] }),
  });
  const deleteWebinarMut = useMutation({
    mutationFn: (id) => webinarApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webinars'] }),
  });

  const addWebinar    = (w) => addWebinarMut.mutate(w);
  const updateWebinar = (u) => updateWebinarMut.mutate(u);
  const deleteWebinar = (id) => deleteWebinarMut.mutate(id);

  // ── Finance ───────────────────────────────────────────────────────────────
  const { data: clientTransactions = [] } = useQuery({
    queryKey: ['clientTransactions'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await financeApi.transactions();
        // Normalize: API returns client_name but pages use tx.client
        return (res.data?.data ?? []).map(tx => ({ ...tx, client: tx.client_name ?? tx.client }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });
  const { data: expenses = [] }           = useList(['expenses'], () => financeApi.expenses(), { enabled: isAuthenticated });
  const { data: wallets = { syp: 0, usd: 0, rate: 14200 } } = useQuery({
    queryKey: ['wallet'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await financeApi.wallet();
        return res.data?.data ?? { syp: 0, usd: 0, rate: 14200 };
      } catch {
        return { syp: 0, usd: 0, rate: 14200 };
      }
    },
    staleTime: 30_000,
  });

  const addClientTxMut = useMutation({
    mutationFn: (data) => financeApi.addTransaction(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clientTransactions'] }); qc.invalidateQueries({ queryKey: ['wallet'] }); },
  });
  const addExpenseMut = useMutation({
    mutationFn: (data) => financeApi.addExpense(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['wallet'] }); },
  });
  const deleteExpenseMut = useMutation({
    mutationFn: (id) => financeApi.removeExpense(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['expenses'] }); qc.invalidateQueries({ queryKey: ['wallet'] }); },
  });
  const topUpMut = useMutation({
    mutationFn: (data) => financeApi.topUp(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
  const convertMut = useMutation({
    mutationFn: (data) => financeApi.convert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
  const updateRateMut = useMutation({
    mutationFn: (rate) => financeApi.updateRate(rate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });

  const addClientTransaction  = (tx) => addClientTxMut.mutate({ ...tx, client_name: tx.client_name ?? tx.client });
  const addExpense             = (e)  => addExpenseMut.mutate(e);
  const deleteExpense          = (id) => deleteExpenseMut.mutate(id);
  const topUpWallet            = (d)  => topUpMut.mutate(d);
  const convertCurrency        = (d)  => convertMut.mutate(d);
  const updateConversionRate   = (r)  => updateRateMut.mutate(r);

  // ── Marketing Plans ───────────────────────────────────────────────────────
  const { data: marketingPlans = [] } = useList(['marketingPlans'], () => marketingApi.plans(), { enabled: isAuthenticated });

  const addMarketingPlanMut = useMutation({
    mutationFn: (data) => marketingApi.createPlan(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
  const updateMarketingPlanMut = useMutation({
    mutationFn: ({ id, ...d }) => marketingApi.updatePlan(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
  const deleteMarketingPlanMut = useMutation({
    mutationFn: (id) => marketingApi.removePlan(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
  const addItemMut = useMutation({
    mutationFn: ({ planId, ...d }) => marketingApi.addItem(planId, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
  const updateItemMut = useMutation({
    mutationFn: ({ planId, id, ...d }) => marketingApi.updateItem(planId, id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });
  const deleteItemMut = useMutation({
    mutationFn: ({ planId, itemId }) => marketingApi.removeItem(planId, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }),
  });

  const addMarketingPlan    = (p)  => addMarketingPlanMut.mutate(p);
  const updateMarketingPlan = (u)  => updateMarketingPlanMut.mutate(u);
  const deleteMarketingPlan = (id) => deleteMarketingPlanMut.mutate(id);
  const addItemToPlan       = (planId, item) => addItemMut.mutate({ planId, ...item });
  const updateItemInPlan    = (planId, updated) => updateItemMut.mutate({ planId, ...updated });
  const deleteItemFromPlan  = (planId, itemId)  => deleteItemMut.mutate({ planId, itemId });

  // ── Media Library ─────────────────────────────────────────────────────────
  const { data: mediaItems = [] } = useList(['mediaItems'], () => marketingApi.mediaItems(), { enabled: isAuthenticated });

  const addMediaMut    = useMutation({ mutationFn: (d)  => marketingApi.addMedia(d),     onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });
  const updateMediaMut = useMutation({ mutationFn: ({ id, ...d }) => marketingApi.updateMedia(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });
  const deleteMediaMut = useMutation({ mutationFn: (id) => marketingApi.removeMedia(id), onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });

  const addMediaItem    = (i)  => addMediaMut.mutate(i);
  const updateMediaItem = (u)  => updateMediaMut.mutate(u);
  const deleteMediaItem = (id) => deleteMediaMut.mutate(id);

  // ── Sent Notifications ────────────────────────────────────────────────────
  const { data: sentNotifications = [] } = useList(['sentNotifications'], () => marketingApi.sentNotifications(), { enabled: isAuthenticated });

  const sendNotifMut = useMutation({
    mutationFn: (data) => marketingApi.sendNotification(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['sentNotifications'] }),
  });
  const sendTelegramNotification = (d) => sendNotifMut.mutate(d);

  // ── User Notifications ────────────────────────────────────────────────────
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await notificationApi.list();
        // Normalize: API returns created_at but pages use n.date
        return (res.data?.data ?? []).map(n => ({ ...n, date: n.date ?? n.created_at ?? '' }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const markReadMut = useMutation({
    mutationFn: (id) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllReadMut = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markNotificationRead     = (id) => markReadMut.mutate(id);
  const markAllNotificationsRead = ()   => markAllReadMut.mutate();

  // ── Coaches & Roles ───────────────────────────────────────────────────────
  const { data: coaches = [] } = useList(['coaches'], () => coachApi.list(), { enabled: isAuthenticated });
  const { data: dbRoles = [] } = useList(['dbRoles'], () => roleApi.list(), { enabled: isAuthenticated });
  const { data: dbPermissions = [] } = useList(['dbPermissions'], () => roleApi.permissions(), { enabled: isAuthenticated });

  const addCoachMut = useMutation({
    mutationFn: (data) => coachApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }),
  });
  const updateCoachMut = useMutation({
    mutationFn: ({ id, ...d }) => coachApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }),
  });
  const deleteCoachMut = useMutation({
    mutationFn: (id) => coachApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }),
  });

  const addCoach    = (d)  => addCoachMut.mutateAsync(d);
  const updateCoach = (u)  => updateCoachMut.mutateAsync(u);
  const deleteCoach = (id) => deleteCoachMut.mutate(id);

  const addRoleMut = useMutation({
    mutationFn: (data) => roleApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }),
  });
  const updateRoleMut = useMutation({
    mutationFn: ({ id, ...d }) => roleApi.update(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }),
  });
  const deleteRoleMut = useMutation({
    mutationFn: (id) => roleApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }),
  });

  const addRole    = (d)  => addRoleMut.mutateAsync(d);
  const updateRole = (u)  => updateRoleMut.mutateAsync(u);
  const deleteRole = (id) => deleteRoleMut.mutateAsync(id);

  // ── Legacy compatibility shims (some pages still use these) ──────────────
  const [applications, setApplications] = useState([]);
  const [users, setUsers]               = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [sessions, setSessions]         = useState([]);

  const updateApplicationStatus = (id, status) =>
    setApplications(p => p.map(a => a.id === id ? { ...a, status } : a));
  const addNote      = (appId, note) =>
    setApplications(p => p.map(a => a.id === appId ? { ...a, notes: note } : a));
  const addSession   = (session) =>
    setSessions(p => [...p, { ...session, id: String(Date.now()), attendees: [] }]);
  const addTransaction = (txn) =>
    setTransactions(p => [...p, { ...txn, id: String(Date.now()), date: new Date().toISOString() }]);
  const updateUserTags  = () => {};
  const updateUserNotes = () => {};
  const updateUserRole  = () => {};

  return (
    <AppDataContext.Provider value={{
      // Courses
      courses, addCourse, updateCourse, deleteCourse,
      // Course Plans
      coursePlans, updateCoursePlan, toggleFeature, updateFeatureText,
      addFeatureToPlan, deleteFeature,
      // CRM
      clients, leads, updateClient, updateLead, addLead, lookupByPhone,
      // Tickets
      tickets, updateTicket, addTicket,
      // Blog
      blogPosts, addBlogPost, updateBlogPost, deleteBlogPost,
      // Campaigns
      campaigns, addCampaign, updateCampaignStatus,
      // Appointments
      appointments, addAppointment, updateAppointment, deleteAppointment,
      // Webinars
      webinars, addWebinar, updateWebinar, deleteWebinar,
      // Finance
      clientTransactions, expenses, wallets,
      addClientTransaction, addExpense, deleteExpense,
      topUpWallet, convertCurrency, updateConversionRate,
      // Marketing
      marketingPlans, addMarketingPlan, updateMarketingPlan, deleteMarketingPlan,
      addItemToPlan, updateItemInPlan, deleteItemFromPlan,
      // Media
      mediaItems, addMediaItem, updateMediaItem, deleteMediaItem,
      // Sent notifications
      sentNotifications, sendTelegramNotification,
      // User notifications
      notifications, markNotificationRead, markAllNotificationsRead,
      // Coaches & Roles
      coaches, dbRoles, dbPermissions, addCoach, updateCoach, deleteCoach,
      addRole, updateRole, deleteRole,
      // Legacy shims
      applications, users, transactions, sessions,
      updateApplicationStatus, addNote, addSession, addTransaction,
      updateUserTags, updateUserNotes, updateUserRole,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
