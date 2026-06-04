<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BlogPost;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\Course;
use App\Models\Expense;
use App\Models\SupportTicket;
use App\Models\Webinar;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * GET /api/admin/overview
     * High-level KPI counts for the main dashboard.
     */
    public function overview()
    {
        $totalClients     = Client::clients()->count();
        $totalLeads       = Client::leads()->count();
        $activeClients    = Client::clients()->active()->count();
        $totalCourses     = Course::where('status', 'active')->count();
        $totalRevenue     = ClientTransaction::where('direction', 'deposit')
                             ->where('status', 'completed')
                             ->where('currency', 'USD')
                             ->sum('amount');
        $openTickets      = SupportTicket::whereIn('status', ['open', 'in_progress'])->count();
        $upcomingWebinars = Webinar::where('status', 'upcoming')->count();
        $upcomingAppts    = Appointment::whereIn('status', ['pending', 'confirmed'])
                             ->where('date', '>=', now()->toDateString())
                             ->count();
        $publishedPosts   = BlogPost::where('status', 'published')->count();
        $activeCampaigns  = Campaign::where('status', 'active')->count();

        return response()->json([
            'data' => [
                'total_clients'          => $totalClients,
                'total_leads'            => $totalLeads,
                'active_clients'         => $activeClients,
                'total_courses'          => $totalCourses,
                'total_revenue_usd'      => round((float) $totalRevenue, 2),
                'open_tickets'           => $openTickets,
                'upcoming_webinars'      => $upcomingWebinars,
                'upcoming_appointments'  => $upcomingAppts,
                'published_posts'        => $publishedPosts,
                'active_campaigns'       => $activeCampaigns,
            ],
        ]);
    }

    /**
     * GET /api/admin/analytics
     * Aggregated analytics data for the Analytics page.
     */
    public function analytics()
    {
        // Monthly revenue for the last 6 months (USD deposits, completed)
        $monthlyRevenue = ClientTransaction::where('direction', 'deposit')
            ->where('status', 'completed')
            ->where('currency', 'USD')
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'revenue' => (float) $r->total]);

        // Monthly expenses for the last 6 months
        $monthlyExpenses = Expense::where('date', '>=', now()->subMonths(6)->startOfDay())
            ->selectRaw("DATE_FORMAT(date, '%Y-%m') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'expenses' => (float) $r->total]);

        // New clients per month (last 6 months)
        $monthlyClients = Client::clients()
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'clients' => (int) $r->count]);

        // New leads per month (last 6 months)
        $monthlyLeads = Client::leads()
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->selectRaw("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count")
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->map(fn($r) => ['month' => $r->month, 'leads' => (int) $r->count]);

        // Traffic by source (lead source breakdown)
        $sourceBreakdown = Client::whereNotNull('source')
            ->selectRaw('source, COUNT(*) as count')
            ->groupBy('source')
            ->orderByDesc('count')
            ->limit(6)
            ->get()
            ->map(fn($r) => ['source' => ucfirst($r->source), 'count' => (int) $r->count]);

        // Ticket status distribution
        $ticketBreakdown = SupportTicket::selectRaw('status, COUNT(*) as count')
            ->groupBy('status')
            ->get()
            ->map(fn($r) => ['status' => $r->status, 'count' => (int) $r->count]);

        // Summary KPIs
        $totalRevenue    = ClientTransaction::where('direction', 'deposit')->where('status', 'completed')->where('currency', 'USD')->sum('amount');
        $totalExpenses   = Expense::sum('amount');
        $totalClients    = Client::clients()->count();
        $totalLeads      = Client::leads()->count();
        $conversionRate  = $totalLeads > 0
            ? round(($totalClients / ($totalClients + $totalLeads)) * 100, 1)
            : 0;

        return response()->json([
            'data' => [
                'summary' => [
                    'total_revenue_usd' => round((float) $totalRevenue, 2),
                    'total_expenses'    => round((float) $totalExpenses, 2),
                    'net_profit'        => round((float) $totalRevenue - (float) $totalExpenses, 2),
                    'total_clients'     => (int) $totalClients,
                    'total_leads'       => (int) $totalLeads,
                    'conversion_rate'   => $conversionRate,
                ],
                'monthly_revenue'  => $monthlyRevenue,
                'monthly_expenses' => $monthlyExpenses,
                'monthly_clients'  => $monthlyClients,
                'monthly_leads'    => $monthlyLeads,
                'source_breakdown' => $sourceBreakdown,
                'ticket_breakdown' => $ticketBreakdown,
            ],
        ]);
    }
}
