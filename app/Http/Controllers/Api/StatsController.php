<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\CourseAccessGrant;
use Illuminate\Support\Facades\Cache;

class StatsController extends Controller
{
    /**
     * Public: headline stats for the homepage "trust" cards.
     * Cached briefly so the public landing page never hammers the DB.
     */
    public function index()
    {
        $data = Cache::remember('public.stats', 300, fn () => [
            'active_clients' => Client::clients()->active()->count(),
            'active_members' => CourseAccessGrant::where('status', 'active')->count(),
        ]);

        return response()->json(['data' => $data]);
    }
}
