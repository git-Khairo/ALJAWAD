<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use Illuminate\Http\Request;

class ActivityLogController extends Controller
{
    /**
     * GET /api/admin/activity-logs
     * Returns paginated activity log entries, newest first.
     * Supports optional ?category= and ?search= filters.
     */
    public function index(Request $request)
    {
        $query = ActivityLog::with('user')->orderByDesc('id');

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('actor', 'like', "%{$q}%")
                   ->orWhere('target', 'like', "%{$q}%")
                   ->orWhere('action', 'like', "%{$q}%");
            });
        }

        return response()->json([
            'data' => $query->limit(200)->get(),
        ]);
    }
}
