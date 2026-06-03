<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Appointment;
use App\Models\BlogPost;
use App\Models\Campaign;
use App\Models\Client;
use App\Models\ClientTransaction;
use App\Models\Course;
use App\Models\SupportTicket;
use App\Models\Webinar;

class DashboardController extends Controller
{
    public function overview()
    {
        $totalClients    = Client::clients()->count();
        $totalLeads      = Client::leads()->count();
        $activeClients   = Client::clients()->active()->count();
        $totalCourses    = Course::where('status', 'active')->count();
        $totalRevenue    = ClientTransaction::where('direction', 'deposit')
                            ->where('status', 'completed')
                            ->where('currency', 'USD')
                            ->sum('amount');
        $openTickets     = SupportTicket::whereIn('status', ['open', 'in_progress'])->count();
        $upcomingWebinars = Webinar::where('status', 'upcoming')->count();
        $upcomingAppts   = Appointment::whereIn('status', ['pending', 'confirmed'])
                            ->where('date', '>=', now()->toDateString())
                            ->count();
        $publishedPosts  = BlogPost::where('status', 'published')->count();
        $activeCampaigns = Campaign::where('status', 'active')->count();

        return response()->json([
            'data' => [
                'total_clients'      => $totalClients,
                'total_leads'        => $totalLeads,
                'active_clients'     => $activeClients,
                'total_courses'      => $totalCourses,
                'total_revenue_usd'  => round((float)$totalRevenue, 2),
                'open_tickets'       => $openTickets,
                'upcoming_webinars'  => $upcomingWebinars,
                'upcoming_appointments' => $upcomingAppts,
                'published_posts'    => $publishedPosts,
                'active_campaigns'   => $activeCampaigns,
            ],
        ]);
    }
}
