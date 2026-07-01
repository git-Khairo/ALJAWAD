<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\MarketingPlan;
use App\Models\MarketingPlanItem;
use App\Models\MediaLibraryItem;
use App\Models\SentNotification;
use App\Models\User;
use App\Models\UserNotification;
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
            'campaign_ids'   => 'nullable|array',
            'campaign_ids.*' => 'integer',
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
            'campaign_ids'   => 'nullable|array',
            'campaign_ids.*' => 'integer',
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

    // ── Media Library (Ideas & Drafts) — a personal space per user ─────────

    public function mediaItems(Request $request)
    {
        // Each coach/user only sees their own ideas & drafts.
        $query = MediaLibraryItem::where('user_id', auth()->id());

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

        $validated['user_id'] = auth()->id();
        $item = MediaLibraryItem::create($validated);
        return response()->json(['data' => $item], 201);
    }

    public function updateMediaItem(Request $request, MediaLibraryItem $item)
    {
        abort_unless((int) $item->user_id === (int) auth()->id(), 403);

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
        abort_unless((int) $item->user_id === (int) auth()->id(), 403);

        $item->delete();
        return response()->json(['message' => 'Deleted']);
    }

    // ── Sent Notifications (Telegram broadcast) ───────────────

    public function sentNotifications()
    {
        return response()->json([
            'data' => SentNotification::orderByDesc('id')->get(),
        ]);
    }

    /**
     * Record a broadcast notification and compute the real recipient count
     * from users who have a telegram_chat_id set.
     *
     * recipients:
     *   all     → every user with a telegram_chat_id
     *   clients → users linked to a client record (type = 'client')
     *   leads   → users linked to a client record (type = 'lead')
     *   coaches → users with user_type = 'coach'
     */
    public function sendNotification(Request $request)
    {
        $validated = $request->validate([
            'message'    => 'required|string',
            'recipients' => 'required|in:all,clients,leads,coaches',
        ]);

        $chatIds = $this->buildTelegramQuery($validated['recipients'])
            ->pluck('telegram_chat_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        // Hand the actual delivery off to the NotificationBot (send-only service).
        $sent = 0;
        $botUrl = config('services.notification_bot.url');
        if ($botUrl && $chatIds->isNotEmpty()) {
            try {
                $resp = \Illuminate\Support\Facades\Http::withHeaders([
                    'X-Bot-Secret' => config('services.notification_bot.secret'),
                ])->timeout(60)->post(rtrim($botUrl, '/') . '/broadcast', [
                    'message'  => $validated['message'],
                    'chat_ids' => $chatIds->all(),
                ]);
                if ($resp->successful()) {
                    $sent = (int) ($resp->json('sent') ?? 0);
                }
            } catch (\Throwable $e) {
                \Illuminate\Support\Facades\Log::warning('NotificationBot broadcast failed: ' . $e->getMessage());
            }
        }

        // In-dashboard fallback: write a UserNotification for every matched user
        // in the segment, regardless of whether they have Telegram linked, so
        // clients without a bot connection can still see it under their bell icon.
        $recipientIds = $this->buildRecipientQuery($validated['recipients'])->pluck('id');
        if ($recipientIds->isNotEmpty()) {
            $now = now();
            $rows = $recipientIds->map(fn ($id) => [
                'user_id'    => $id,
                'title_ar'   => 'إشعار جديد من الإدارة',
                'title_en'   => 'New notification from admin',
                'message_ar' => $validated['message'],
                'message_en' => $validated['message'],
                'type'       => 'info',
                'read'       => false,
                'created_at' => $now,
                'updated_at' => $now,
            ])->all();
            UserNotification::insert($rows);
        }

        $validated['count'] = $sent;
        $notification = SentNotification::create($validated);

        return response()->json([
            'data'      => $notification,
            'sent'      => $sent,
            'targeted'  => $chatIds->count(),
            'in_app'    => $recipientIds->count(),
        ], 201);
    }

    /**
     * GET /api/admin/marketing/telegram-recipients
     * Returns the list of users that would receive a broadcast for each segment.
     * Useful for the dashboard preview before sending.
     */
    public function telegramRecipients(Request $request)
    {
        $segment = $request->get('segment', 'all');

        $users = $this->buildTelegramQuery($segment)
            ->get(['id', 'name', 'telegram_chat_id', 'user_type']);

        return response()->json([
            'segment' => $segment,
            'count'   => $users->count(),
            'data'    => $users,
        ]);
    }

    // ── Private ───────────────────────────────────────────────

    private function countTelegramRecipients(string $segment): int
    {
        return $this->buildTelegramQuery($segment)->count();
    }

    private function buildTelegramQuery(string $segment)
    {
        $query = User::whereNotNull('telegram_chat_id');

        match ($segment) {
            'clients' => $query->whereHas('client', fn($q) => $q->whereIn('stage', ['client_active', 'client_inactive'])),
            'leads'   => $query->whereHas('client', fn($q) => $q->where('stage', 'lead')),
            'coaches' => $query->where('user_type', 'coach'),
            default   => null, // 'all' — no extra filter
        };

        return $query;
    }

    /** Same segment logic as buildTelegramQuery(), but not limited to Telegram-linked users — used for the in-dashboard notification fallback. */
    private function buildRecipientQuery(string $segment)
    {
        $query = User::query();

        match ($segment) {
            'clients' => $query->whereHas('client', fn($q) => $q->whereIn('stage', ['client_active', 'client_inactive'])),
            'leads'   => $query->whereHas('client', fn($q) => $q->where('stage', 'lead')),
            'coaches' => $query->where('user_type', 'coach'),
            default   => null, // 'all' — no extra filter
        };

        return $query;
    }
}
