<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\MarketingPlan;
use App\Models\MarketingPlanItem;
use App\Models\MediaLibraryItem;
use App\Models\SentNotification;
use Illuminate\Http\Request;

class MarketingController extends Controller
{
    // ── Marketing Plans ───────────────────────────────────────

    public function plans()
    {
        return response()->json([
            'data' => MarketingPlan::with('items')->orderByDesc('id')->get(),
        ]);
    }

    public function storePlan(Request $request)
    {
        $validated = $request->validate([
            'name_ar' => 'required|string',
            'name_en' => 'required|string',
            'month'   => 'required|integer|min:1|max:12',
            'year'    => 'required|integer',
            'goal_ar' => 'nullable|string',
            'goal_en' => 'nullable|string',
            'status'  => 'nullable|in:active,draft,completed',
        ]);

        $plan = MarketingPlan::create($validated);
        return response()->json(['data' => $plan->load('items')], 201);
    }

    public function updatePlan(Request $request, MarketingPlan $plan)
    {
        $validated = $request->validate([
            'name_ar' => 'sometimes|string',
            'name_en' => 'sometimes|string',
            'month'   => 'sometimes|integer',
            'year'    => 'sometimes|integer',
            'goal_ar' => 'nullable|string',
            'goal_en' => 'nullable|string',
            'status'  => 'nullable|in:active,draft,completed',
        ]);

        $plan->update($validated);
        return response()->json(['data' => $plan->load('items')]);
    }

    public function destroyPlan(MarketingPlan $plan)
    {
        $plan->delete();
        return response()->json(['message' => 'Deleted']);
    }

    public function storePlanItem(Request $request, MarketingPlan $plan)
    {
        $validated = $request->validate([
            'type'      => 'required|string',
            'platform'  => 'required|string',
            'title_ar'  => 'nullable|string',
            'title_en'  => 'nullable|string',
            'script_ar' => 'nullable|string',
            'script_en' => 'nullable|string',
            'date'      => 'nullable|date',
            'time'      => 'nullable|string',
            'status'    => 'nullable|in:draft,scheduled,published',
        ]);

        $item = $plan->items()->create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function updatePlanItem(Request $request, MarketingPlan $plan, MarketingPlanItem $item)
    {
        $validated = $request->validate([
            'type'      => 'sometimes|string',
            'platform'  => 'sometimes|string',
            'title_ar'  => 'nullable|string',
            'title_en'  => 'nullable|string',
            'script_ar' => 'nullable|string',
            'script_en' => 'nullable|string',
            'date'      => 'nullable|date',
            'time'      => 'nullable|string',
            'status'    => 'nullable|in:draft,scheduled,published',
        ]);

        $item->update($validated);
        return response()->json(['data' => $item]);
    }

    public function destroyPlanItem(MarketingPlan $plan, MarketingPlanItem $item)
    {
        $item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Media Library ─────────────────────────────────────────

    public function mediaItems(Request $request)
    {
        $query = MediaLibraryItem::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        return response()->json(['data' => $query->orderByDesc('id')->get()]);
    }

    public function storeMediaItem(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string',
            'title'    => 'required|string',
            'notes'    => 'nullable|string',
            'status'   => 'nullable|in:inbox,in_progress,done',
            'tags'     => 'nullable|array',
        ]);

        $item = MediaLibraryItem::create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function updateMediaItem(Request $request, MediaLibraryItem $item)
    {
        $validated = $request->validate([
            'category' => 'sometimes|string',
            'title'    => 'sometimes|string',
            'notes'    => 'nullable|string',
            'status'   => 'nullable|in:inbox,in_progress,done',
            'tags'     => 'nullable|array',
        ]);

        $item->update($validated);
        return response()->json(['data' => $item]);
    }

    public function destroyMediaItem(MediaLibraryItem $item)
    {
        $item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Sent Notifications ────────────────────────────────────

    public function sentNotifications()
    {
        return response()->json([
            'data' => SentNotification::orderByDesc('id')->get(),
        ]);
    }

    public function sendNotification(Request $request)
    {
        $validated = $request->validate([
            'message'    => 'required|string',
            'recipients' => 'required|in:all,clients,leads',
            'count'      => 'nullable|integer',
        ]);

        $notification = SentNotification::create($validated);
        return response()->json(['data' => $notification], 201);
    }
}
