import { createContext, useContext, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  coursePlanApi, clientApi, blogApi, campaignApi,
  ticketApi, appointmentApi, financeApi,
  marketingApi, notificationApi, coachApi, roleApi,
  kpiApi, contentApi, settingsApi, activityLogApi, dashboardApi, analyticsApi,
  myApi, courseRequestApi, journalApi,
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
        return res.data?.data ?? res.data ?? [];
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
  const { isAuthenticated, hasPermission } = useAuth();

  // Finance is gated by the seeded permissions.
  const canViewFinance    = hasPermission('view finance');
  const canManageFinance  =
    hasPermission('create transactions') || hasPermission('edit transactions') || hasPermission('delete transactions') ||
    hasPermission('create expenses')     || hasPermission('delete expenses') ||
    hasPermission('edit wallets');

  // ── Dashboard overview ────────────────────────────────────────────────────
  const { data: overviewData = null } = useQuery({
    queryKey: ['overview'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await dashboardApi.overview();
        return res.data?.data ?? null;
      } catch { return null; }
    },
    staleTime: 60_000,
  });

  // ── Analytics ─────────────────────────────────────────────────────────────
  const { data: analyticsData = null } = useQuery({
    queryKey: ['analytics'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await analyticsApi.get();
        return res.data?.data ?? null;
      } catch { return null; }
    },
    staleTime: 60_000,
  });

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
    const plan    = coursePlans.find(p => p.id == planId);
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
        return (res.data?.data ?? []).map(p => {
          const isLead   = p.stage === 'lead';
          const isClient = p.stage === 'client_inactive' || p.stage === 'client_active';
          return {
            ...p,
            // Derived convenience flags off the single lifecycle stage.
            isLead,
            isClient,
            isStudent: !!p.is_student,
            // Back-compat `status`: clients → active/inactive, leads → pipeline.
            status: isLead
              ? (p.lead_status ?? 'new')
              : (p.stage === 'client_active' ? 'active' : 'inactive'),
            added:  p.added ?? (p.created_at ? p.created_at.split('T')[0] : ''),
            joined: p.joined ?? (p.created_at ? p.created_at.split('T')[0] : ''),
            tags:   Array.isArray(p.tags) ? p.tags : [],
            courses: p.courses ?? p.courses_count ?? 0,
            referred_by_user_id: p.referred_by_user_id ?? null,
            referred_by:         p.referred_by ?? null,
            trading_accounts:    Array.isArray(p.trading_accounts) ? p.trading_accounts : [],
          };
        });
      } catch { return []; }
    },
    staleTime: 30_000,
  });
  const clients = allCrmPeople.filter(p => p.isClient);
  const leads   = allCrmPeople.filter(p => p.isLead);

  const addClientMut = useMutation({
    mutationFn: ({ status, ...data }) => clientApi.create({
      ...data,
      stage: data.stage ?? 'client_inactive',
      email: data.email || null,
      id:    undefined,
      added: undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });

  const updateClientMut = useMutation({
    mutationFn: ({ id, status, stage, ...d }) => clientApi.update(id, {
      ...d,
      // `stage` may be passed directly (manual override); otherwise map the
      // legacy active/inactive alias onto the lifecycle stage.
      ...(stage ? { stage } : (status ? { stage: status === 'active' ? 'client_active' : 'client_inactive' } : {})),
      email: d.email || undefined,
      // Strip frontend-only computed keys
      added:      undefined,
      joined:     undefined,
      db_id:      undefined,
      record_type: undefined,
      is_student: undefined,
      isLead:     undefined,
      isClient:   undefined,
      isStudent:  undefined,
      notes:      undefined, // notes are a thread managed via their own endpoints
      // referred_by and trading_accounts (readonly derived) are NOT stripped —
      // they're accepted by the backend and passed through when editing.
      referred_by: undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const updateLeadMut = useMutation({
    mutationFn: ({ id, status, stage, ...d }) => clientApi.update(id, {
      ...d,
      // A lead's "status" is its pipeline → lead_status. `stage` (if present)
      // is a direct lifecycle move (e.g. lead → client).
      ...(stage ? { stage } : {}),
      ...(status ? { lead_status: status } : {}),
      // Don't send empty string — backend `sometimes|email` would reject it
      email: d.email || undefined,
      // Strip frontend-only keys that aren't in the DB
      added:     undefined,
      joined:    undefined,
      db_id:     undefined,
      record_type: undefined,
      is_student: undefined,
      isLead:     undefined,
      isClient:   undefined,
      isStudent:  undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const addLeadMut = useMutation({
    mutationFn: ({ status, ...data }) => clientApi.create({
      ...data,
      stage: 'lead',
      // The lead form's "status" is the pipeline stage.
      lead_status: status ?? 'new',
      // Normalize: empty email → null so `nullable|email` passes on the backend
      email: data.email || null,
      // Strip client-generated keys that the backend doesn't accept
      id:    undefined,
      added: undefined,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const deleteClientMut = useMutation({
    mutationFn: (id) => clientApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const deleteLeadMut = useMutation({
    mutationFn: (id) => clientApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['crm'] }),
  });
  const convertLeadMut = useMutation({
    mutationFn: (id) => clientApi.convert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['crm'] });
      toast.success('Lead converted to client');
    },
  });

  const addClient    = (c)  => addClientMut.mutateAsync(c);
  const updateClient = (u)  => updateClientMut.mutate(u);
  const updateLead   = (u)  => updateLeadMut.mutate(u);
  const addLead      = (l)  => addLeadMut.mutate(l);
  const deleteClient = (id) => deleteClientMut.mutate(id);
  const deleteLead   = (id) => deleteLeadMut.mutate(id);
  const convertLead  = (id) => convertLeadMut.mutate(id);

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
        return (res.data?.data ?? []).map(t => ({
          ...t,
          db_id:          t.id,
          id:             t.ticket_id ?? t.id,
          user:           t.user_name ?? t.user,
          opened:         t.opened_at ?? t.opened,
          first_response: t.first_response_at ?? t.first_response,
          resolved:       t.resolved_at ?? t.resolved,
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
  const deleteTicketMut = useMutation({
    mutationFn: (id) => ticketApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tickets'] });
      toast.success('Ticket deleted');
    },
  });

  const updateTicket = (u) => updateTicketMut.mutate({ ...u, id: u.db_id ?? u.id });
  // Returns the created ticket (normalized) so the public form can show its number.
  const addTicket    = (t) =>
    addTicketMut.mutateAsync(t).then(res => {
      const d = res.data?.data ?? res.data ?? {};
      return { ...d, db_id: d.id, id: d.ticket_id ?? d.id, opened: d.opened_at ?? d.opened };
    });
  const deleteTicket = (id) => deleteTicketMut.mutate(id);

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
            ? (typeof post.published_at === 'string'
                ? post.published_at.split('T')[0]
                : new Date(post.published_at).toISOString().split('T')[0])
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

  const addBlogPost    = (p)  => addBlogMut.mutate(p);
  const updateBlogPost = (u)  => updateBlogMut.mutate(u);
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
  const deleteCampaignMut = useMutation({
    mutationFn: (id) => campaignApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign deleted');
    },
  });

  const addCampaign          = (c)          => addCampaignMut.mutate(c);
  const updateCampaignStatus = (id, status) => updateCampaignMut.mutate({ id, status });
  const deleteCampaign       = (id)         => deleteCampaignMut.mutate(id);

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

  // ── Finance (gated by the 'view finance' permission) ──────────────────────
  const { data: clientTransactions = [] } = useQuery({
    queryKey: ['clientTransactions'],
    enabled: isAuthenticated && canViewFinance,
    queryFn: async () => {
      try {
        const res = await financeApi.transactions();
        return (res.data?.data ?? []).map(tx => ({
          ...tx,
          client: tx.client_name ?? tx.client,
          date:   tx.date ?? tx.created_at ?? '',
        }));
      } catch { return []; }
    },
    staleTime: 30_000,
  });
  const { data: expenses = [] } = useList(['expenses'], () => financeApi.expenses(), { enabled: isAuthenticated && canViewFinance });
  const { data: wallets = { syp: 0, usd: 0, rate: 14200 } } = useQuery({
    queryKey: ['wallet'],
    enabled: isAuthenticated && canViewFinance,
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
  const { data: walletTopups = [] } = useList(['walletTopups'], () => financeApi.topups(), { enabled: isAuthenticated && canViewFinance });

  const addClientTxMut = useMutation({
    mutationFn: (data) => financeApi.addTransaction(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientTransactions'] });
      qc.invalidateQueries({ queryKey: ['crm'] }); // a completed deposit may activate the client
    },
  });
  const updateClientTxMut = useMutation({
    mutationFn: ({ id, ...d }) => financeApi.updateTransaction(id, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientTransactions'] });
      qc.invalidateQueries({ queryKey: ['crm'] });
    },
  });
  const deleteClientTxMut = useMutation({
    mutationFn: (id) => financeApi.removeTransaction(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['clientTransactions'] });
      toast.success('Transaction deleted');
    },
  });
  const addExpenseMut = useMutation({
    mutationFn: (data) => financeApi.addExpense(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
  const deleteExpenseMut = useMutation({
    mutationFn: (id) => financeApi.removeExpense(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['expenses'] });
      qc.invalidateQueries({ queryKey: ['wallet'] });
    },
  });
  const topUpMut = useMutation({
    mutationFn: (data) => financeApi.topUp(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['wallet'] });
      qc.invalidateQueries({ queryKey: ['walletTopups'] });
    },
  });
  const convertMut = useMutation({
    mutationFn: (data) => financeApi.convert(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });
  const updateRateMut = useMutation({
    mutationFn: (rate) => financeApi.updateRate(rate),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }),
  });

  const addClientTransaction    = (tx) => addClientTxMut.mutateAsync(tx);
  const updateClientTransaction = (tx) => updateClientTxMut.mutate(tx);
  const deleteClientTransaction = (id) => deleteClientTxMut.mutate(id);
  const addExpense               = (e)  => addExpenseMut.mutateAsync(e);
  const deleteExpense            = (id) => deleteExpenseMut.mutate(id);
  const topUpWallet              = (d)  => topUpMut.mutate(d);
  const convertCurrency          = (d)  => convertMut.mutate(d);
  const updateConversionRate     = (r)  => updateRateMut.mutate(r);

  // ── Marketing Plans ───────────────────────────────────────────────────────
  const { data: marketingPlans = [] } = useList(['marketingPlans'], () => marketingApi.plans(), { enabled: isAuthenticated });

  const addMarketingPlanMut    = useMutation({ mutationFn: (data) => marketingApi.createPlan(data),       onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });
  const updateMarketingPlanMut = useMutation({ mutationFn: ({ id, ...d }) => marketingApi.updatePlan(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });
  const deleteMarketingPlanMut = useMutation({ mutationFn: (id) => marketingApi.removePlan(id),           onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });
  const addItemMut             = useMutation({ mutationFn: ({ planId, ...d }) => marketingApi.addItem(planId, d),            onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });
  const updateItemMut          = useMutation({ mutationFn: ({ planId, id, ...d }) => marketingApi.updateItem(planId, id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });
  const deleteItemMut          = useMutation({ mutationFn: ({ planId, itemId }) => marketingApi.removeItem(planId, itemId),  onSuccess: () => qc.invalidateQueries({ queryKey: ['marketingPlans'] }) });

  const addMarketingPlan    = (p)           => addMarketingPlanMut.mutate(p);
  const updateMarketingPlan = (u)           => updateMarketingPlanMut.mutate(u);
  const deleteMarketingPlan = (id)          => deleteMarketingPlanMut.mutate(id);
  const addItemToPlan       = (planId, item)      => addItemMut.mutate({ planId, ...item });
  const updateItemInPlan    = (planId, updated)   => updateItemMut.mutate({ planId, ...updated });
  const deleteItemFromPlan  = (planId, itemId)    => deleteItemMut.mutate({ planId, itemId });

  // ── Media Library ─────────────────────────────────────────────────────────
  const { data: mediaItems = [] } = useList(['mediaItems'], () => marketingApi.mediaItems(), { enabled: isAuthenticated });

  const addMediaMut    = useMutation({ mutationFn: (d)            => marketingApi.addMedia(d),           onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });
  const updateMediaMut = useMutation({ mutationFn: ({ id, ...d }) => marketingApi.updateMedia(id, d),   onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });
  const deleteMediaMut = useMutation({ mutationFn: (id)           => marketingApi.removeMedia(id),       onSuccess: () => qc.invalidateQueries({ queryKey: ['mediaItems'] }) });

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
  const { data: coaches      = [] } = useList(['coaches'],      () => coachApi.list(),       { enabled: isAuthenticated });
  const { data: dbRoles      = [] } = useList(['dbRoles'],      () => roleApi.list(),        { enabled: isAuthenticated });
  const { data: dbPermissions = [] } = useList(['dbPermissions'], () => roleApi.permissions(), { enabled: isAuthenticated });

  const addCoachMut    = useMutation({ mutationFn: (data)           => coachApi.create(data),   onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }) });
  const updateCoachMut = useMutation({ mutationFn: ({ id, ...d })   => coachApi.update(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }) });
  const deleteCoachMut = useMutation({ mutationFn: (id)             => coachApi.remove(id),     onSuccess: () => qc.invalidateQueries({ queryKey: ['coaches'] }) });

  const addCoach    = (d)  => addCoachMut.mutateAsync(d);
  const updateCoach = (u)  => updateCoachMut.mutateAsync(u);
  const deleteCoach = (id) => deleteCoachMut.mutate(id);

  const addRoleMut    = useMutation({ mutationFn: (data)         => roleApi.create(data),   onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }) });
  const updateRoleMut = useMutation({ mutationFn: ({ id, ...d }) => roleApi.update(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }) });
  const deleteRoleMut = useMutation({ mutationFn: (id)           => roleApi.remove(id),     onSuccess: () => qc.invalidateQueries({ queryKey: ['dbRoles'] }) });

  const addRole    = (d)  => addRoleMut.mutateAsync(d);
  const updateRole = (u)  => updateRoleMut.mutateAsync(u);
  const deleteRole = (id) => deleteRoleMut.mutateAsync(id);

  // ── KPI ───────────────────────────────────────────────────────────────────
  const { data: kpiDefinitions = {} } = useQuery({
    queryKey: ['kpiDefinitions'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await kpiApi.definitions();
        return res.data ?? {};
      } catch { return {}; }
    },
    staleTime: 60_000,
  });

  const addKpiEntryMut = useMutation({
    mutationFn: (data) => kpiApi.addEntry(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['kpiEntries'] });
      qc.invalidateQueries({ queryKey: ['kpiSummary'] });
    },
  });
  const updateKpiEntryMut = useMutation({
    mutationFn: ({ id, ...d }) => kpiApi.updateEntry(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpiEntries'] }),
  });
  const deleteKpiEntryMut = useMutation({
    mutationFn: (id) => kpiApi.deleteEntry(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpiEntries'] }),
  });
  const updateKpiDefinitionMut = useMutation({
    mutationFn: ({ id, ...d }) => kpiApi.updateDefinition(id, d),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['kpiDefinitions'] }),
  });

  const addKpiEntry          = (data) => addKpiEntryMut.mutate(data);
  const updateKpiEntry       = (data) => updateKpiEntryMut.mutate(data);
  const deleteKpiEntry       = (id)   => deleteKpiEntryMut.mutate(id);
  const updateKpiDefinition  = (data) => updateKpiDefinitionMut.mutate(data);

  // ── Generated Content ─────────────────────────────────────────────────────
  const { data: generatedContent = [] } = useQuery({
    queryKey: ['generatedContent'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await contentApi.list();
        return res.data ?? [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const saveContentMut = useMutation({
    mutationFn: (data) => contentApi.save(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generatedContent'] }),
  });
  const deleteContentMut = useMutation({
    mutationFn: (id) => contentApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['generatedContent'] }),
  });

  const saveGeneratedContent   = (data) => saveContentMut.mutateAsync(data);
  const deleteGeneratedContent = (id)   => deleteContentMut.mutate(id);

  // ── Settings ──────────────────────────────────────────────────────────────
  const { data: settings = {} } = useQuery({
    queryKey: ['settings'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await settingsApi.get();
        return res.data?.data ?? {};
      } catch { return {}; }
    },
    staleTime: 60_000,
  });

  const saveSettingsMut = useMutation({
    mutationFn: (data) => settingsApi.update(data),
    onSuccess: (res) => {
      qc.setQueryData(['settings'], res.data?.data ?? {});
      toast.success('Settings saved');
    },
  });
  const saveSettings = (data) => saveSettingsMut.mutateAsync(data);

  // ── My dashboard (self-service: appointments + transactions) ──────────────
  const { data: myAppointments  = [] } = useList(['myAppointments'],  () => myApi.appointments(),  { enabled: isAuthenticated });
  const { data: myTransactions  = [] } = useList(['myTransactions'],  () => myApi.transactions(),  { enabled: isAuthenticated });

  // ── My trade journal ────────────────────────────────────────────────────
  const { data: journalData = { data: [], stats: {} } } = useQuery({
    queryKey: ['journalEntries'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await journalApi.list();
        return { data: res.data?.data ?? [], stats: res.data?.stats ?? {} };
      } catch { return { data: [], stats: {} }; }
    },
    staleTime: 30_000,
  });
  const journalEntries = journalData.data;
  const journalStats   = journalData.stats;

  const addJournalMut    = useMutation({ mutationFn: (d)          => journalApi.create(d),   onSuccess: () => qc.invalidateQueries({ queryKey: ['journalEntries'] }) });
  const updateJournalMut = useMutation({ mutationFn: ({ id, ...d }) => journalApi.update(id, d), onSuccess: () => qc.invalidateQueries({ queryKey: ['journalEntries'] }) });
  const deleteJournalMut = useMutation({ mutationFn: (id)          => journalApi.remove(id),  onSuccess: () => qc.invalidateQueries({ queryKey: ['journalEntries'] }) });

  const addJournalEntry    = (data) => addJournalMut.mutateAsync(data);
  const updateJournalEntry = (data) => updateJournalMut.mutateAsync(data);
  const deleteJournalEntry = (id)   => deleteJournalMut.mutate(id);

  // ── Course requests (user applications → admin approve/decline) ───────────
  const { data: myCourseRequests = [] } = useList(['myCourseRequests'], () => courseRequestApi.mine(), { enabled: isAuthenticated });
  const { data: courseRequests = [] }   = useList(['courseRequests'],   () => courseRequestApi.list(), { enabled: isAuthenticated });

  const requestCourseMut = useMutation({
    mutationFn: (coursePlanId) => courseRequestApi.create({ course_plan_id: coursePlanId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['myCourseRequests'] });
      qc.invalidateQueries({ queryKey: ['courseRequests'] });
    },
  });
  const reviewCourseRequestMut = useMutation({
    mutationFn: ({ id, status }) => courseRequestApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['courseRequests'] });
      qc.invalidateQueries({ queryKey: ['myCourseRequests'] });
      qc.invalidateQueries({ queryKey: ['crm'] });        // approval may activate the client
      qc.invalidateQueries({ queryKey: ['allGrants'] });  // auto-grant adds an access row
    },
  });

  const requestCourse       = (planId)      => requestCourseMut.mutateAsync(planId);
  // Returns the API response body so the caller can branch on
  // auto_granted / needs_telegram / needs_bot_plan.
  const reviewCourseRequest = (id, status)  =>
    reviewCourseRequestMut.mutateAsync({ id, status }).then(r => r.data);

  // ── Activity Log ──────────────────────────────────────────────────────────
  const { data: activityLogs = [] } = useQuery({
    queryKey: ['activityLogs'],
    enabled: isAuthenticated,
    queryFn: async () => {
      try {
        const res = await activityLogApi.list();
        return res.data?.data ?? [];
      } catch { return []; }
    },
    staleTime: 30_000,
  });

  const refreshActivityLogs = () => qc.invalidateQueries({ queryKey: ['activityLogs'] });

  return (
    <AppDataContext.Provider value={{
      // Dashboard
      overviewData,
      // Analytics
      analyticsData,
      // Course Plans
      coursePlans, updateCoursePlan, toggleFeature, updateFeatureText,
      addFeatureToPlan, deleteFeature,
      // CRM
      clients, leads, addClient, updateClient, updateLead, addLead,
      deleteClient, deleteLead, convertLead, lookupByPhone,
      // Tickets
      tickets, updateTicket, addTicket, deleteTicket,
      // Blog
      blogPosts, addBlogPost, updateBlogPost, deleteBlogPost,
      // Campaigns
      campaigns, addCampaign, updateCampaignStatus, deleteCampaign,
      // Appointments
      appointments, addAppointment, updateAppointment, deleteAppointment,
      // Finance
      clientTransactions, expenses, wallets, walletTopups, canManageFinance,
      addClientTransaction, updateClientTransaction, deleteClientTransaction,
      addExpense, deleteExpense,
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
      // My dashboard (self-service)
      myAppointments, myTransactions,
      // My trade journal
      journalEntries, journalStats, addJournalEntry, updateJournalEntry, deleteJournalEntry,
      // Course requests
      myCourseRequests, courseRequests, requestCourse, reviewCourseRequest,
      // Coaches & Roles
      coaches, dbRoles, dbPermissions, addCoach, updateCoach, deleteCoach,
      addRole, updateRole, deleteRole,
      // KPI
      kpiDefinitions, addKpiEntry, updateKpiEntry, deleteKpiEntry, updateKpiDefinition,
      // Generated Content
      generatedContent, saveGeneratedContent, deleteGeneratedContent,
      // Settings
      settings, saveSettings,
      // Activity Log
      activityLogs, refreshActivityLogs,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};
