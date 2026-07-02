import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppDataProvider } from "@/contexts/AppDataContext";

import PublicLayout from "@/layouts/PublicLayout";
import AppLayout from "@/layouts/AppLayout";
import AdminLayout from "@/layouts/AdminLayout";

import Index from "@/pages/Index";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Courses from "@/pages/Courses";
import Contact from "@/pages/Contact";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Rate from "@/pages/Rate";

import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Claim from "@/pages/auth/Claim";
import Forgot from "@/pages/auth/Forgot";
import Reset from "@/pages/auth/Reset";

import AppOverview from "@/pages/app/Overview";
import Profile from "@/pages/app/Profile";
import Applications from "@/pages/app/Applications";
import AppTransactions from "@/pages/app/Transactions";
import Journal from "@/pages/app/Journal";
import Notifications from "@/pages/app/Notifications";
import SettingsPage from "@/pages/app/Settings";

import AdminOverview from "@/pages/admin/Overview";
import CRM from "@/pages/admin/CRM";
import Financing from "@/pages/admin/Financing";
import Marketing from "@/pages/admin/Marketing";
import Scheduling from "@/pages/admin/Scheduling";
import AdminUsers from "@/pages/admin/Users";
import Performance from "@/pages/admin/Performance";
import AdminSettings from "@/pages/admin/AdminSettings";
import Reports from "@/pages/admin/Reports";
import Csat from "@/pages/admin/Csat";
import ActivityLog from "@/pages/admin/ActivityLog";
import Leads from "@/pages/admin/Leads";
import SupportTickets from "@/pages/admin/SupportTickets";
import Invoices from "@/pages/admin/Invoices";
import Transactions from "@/pages/admin/Transactions";
import Revenue from "@/pages/admin/Revenue";
import EmailMarketing from "@/pages/admin/EmailMarketing";
import SocialMedia from "@/pages/admin/SocialMedia";
import Analytics from "@/pages/admin/Analytics";
import BlogManager from "@/pages/admin/BlogManager";
import ContentCreation from "@/pages/admin/ContentCreation";
import CourseManager from "@/pages/admin/CourseManager";
import MediaLibrary from "@/pages/admin/MediaLibrary";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import Messages from "@/pages/admin/Messages";
import Appointments from "@/pages/admin/Appointments";
import Coaches from "@/pages/admin/Coaches";

import SubmitTicket from "@/pages/SubmitTicket";
import NotFound from "@/pages/NotFound";

import { toast } from 'sonner';

const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      onError: (err) => {
        const status = err?.response?.status;
        // 401 is handled by the axios interceptor (redirect to login)
        // 403 = permissions issue — show a clear message
        if (status === 403) {
          toast.error('Access denied — you do not have permission for this action.');
          return;
        }
        // Validation errors (422) — show the first validation message
        if (status === 422) {
          const messages = err?.response?.data?.errors;
          if (messages) {
            const first = Object.values(messages)[0];
            toast.error(Array.isArray(first) ? first[0] : first);
            return;
          }
        }
        // 501 stub (AI generation not yet configured)
        if (status === 501) {
          const msg = err?.response?.data?.message;
          if (msg) { toast.info(msg); return; }
        }
        // Generic fallback
        const msg = err?.response?.data?.message ?? err?.message ?? 'Something went wrong. Please try again.';
        toast.error(msg);
      },
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <AuthProvider>
        <AppDataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<Index />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/courses" element={<Courses />} />
                  <Route path="/contact" element={<Contact />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/blog/:id" element={<BlogPost />} />
                </Route>

                {/* Public ticket submission — shareable link */}
                <Route path="/support" element={<SubmitTicket />} />

                {/* Public CSAT rating — token link (no auth) */}
                <Route path="/r/:token" element={<Rate />} />

                {/* Auth */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/claim" element={<Claim />} />
                <Route path="/auth/forgot" element={<Forgot />} />
                <Route path="/auth/reset" element={<Reset />} />

                {/* User Dashboard */}
                <Route element={<AppLayout />}>
                  <Route path="/app" element={<Navigate to="/app/overview" replace />} />
                  <Route path="/app/overview" element={<AppOverview />} />
                  <Route path="/app/profile" element={<Profile />} />
                  <Route path="/app/applications" element={<Applications />} />
                  <Route path="/app/transactions" element={<AppTransactions />} />
                  <Route path="/app/journal" element={<Journal />} />
                  <Route path="/app/notifications" element={<Notifications />} />
                  <Route path="/app/settings" element={<SettingsPage />} />
                </Route>

                {/* Admin Dashboard */}
                <Route element={<AdminLayout />}>
                  <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />
                  {/* Overview */}
                  <Route path="/admin/overview" element={<AdminOverview />} />
                  <Route path="/admin/performance" element={<Performance />} />
                  <Route path="/admin/reports" element={<Reports />} />
                  <Route path="/admin/csat" element={<Csat />} />
                  <Route path="/admin/activity-log" element={<ActivityLog />} />
                  {/* CRM */}
                  <Route path="/admin/crm" element={<CRM />} />
                  <Route path="/admin/users" element={<AdminUsers />} />
                  <Route path="/admin/leads" element={<Leads />} />
                  <Route path="/admin/support-tickets" element={<SupportTickets />} />
                  {/* Finance */}
                  <Route path="/admin/financing" element={<Financing />} />
                  <Route path="/admin/invoices" element={<Invoices />} />
                  <Route path="/admin/transactions" element={<Transactions />} />
                  <Route path="/admin/revenue" element={<Revenue />} />
                  {/* Marketing */}
                  <Route path="/admin/marketing" element={<Marketing />} />
                  <Route path="/admin/email-marketing" element={<EmailMarketing />} />
                  <Route path="/admin/social-media" element={<SocialMedia />} />
                  <Route path="/admin/analytics" element={<Analytics />} />
                  {/* Content */}
                  <Route path="/admin/blog-manager" element={<BlogManager />} />
                  <Route path="/admin/content-creation" element={<ContentCreation />} />
                  <Route path="/admin/course-manager" element={<CourseManager />} />
                  <Route path="/admin/media-library" element={<MediaLibrary />} />
                  <Route path="/admin/notifications" element={<AdminNotifications />} />
                  <Route path="/admin/messages" element={<Messages />} />
                  {/* Scheduling */}
                  <Route path="/admin/scheduling" element={<Scheduling />} />
                  <Route path="/admin/appointments" element={<Appointments />} />
                  {/* Settings */}
                  <Route path="/admin/settings" element={<AdminSettings />} />
                  <Route path="/admin/coaches" element={<Coaches />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AppDataProvider>
      </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
