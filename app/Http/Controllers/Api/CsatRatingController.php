<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\CsatRating;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CsatRatingController extends Controller
{
    /**
     * POST /api/admin/csat/request
     * A customer-service agent generates a single-use, pre-attributed rating
     * link to paste into a WhatsApp/Telegram chat with the client.
     */
    public function request(Request $request)
    {
        $data = $request->validate([
            'client_id'     => 'nullable|exists:clients,id',
            'contact_label' => 'nullable|string|max:120',
        ]);

        $client = isset($data['client_id']) ? Client::find($data['client_id']) : null;
        $label  = $data['contact_label']
            ?? $client?->user?->name
            ?? null;

        $rating = CsatRating::create([
            'token'         => (string) Str::uuid(),
            'client_id'     => $client?->id,
            'agent_id'      => $request->user()->id,
            'contact_label' => $label,
            'requested_at'  => now(),
            'expires_at'    => now()->addDays(14),
        ]);

        $url = rtrim(config('app.url'), '/') . '/r/' . $rating->token;

        ActivityLog::record('clients', 'update', $request, target: $label ?? '—', target_type: 'client', meta: ['action' => 'csat_requested']);

        return response()->json([
            'token'      => $rating->token,
            'url'        => $url,
            'message_ar' => "مرحباً 👋 يهمّنا رأيك! قيّم تجربتك مع خدمة العملاء عبر هذا الرابط (بياخد أقل من دقيقة):\n{$url}",
            'message_en' => "Hi 👋 We'd love your feedback! Rate your customer-service experience here (takes under a minute):\n{$url}",
        ], 201);
    }

    /**
     * GET /api/csat/{token}  (public)
     * Context for the public rating page.
     */
    public function show(string $token)
    {
        $rating = CsatRating::with(['agent', 'client.user'])->where('token', $token)->first();

        if (! $rating) {
            return response()->json(['message' => 'not_found'], 404);
        }

        // Lazily mint the client's Telegram deep-link token so the thank-you
        // page can offer the "connect Telegram" CTA.
        $linkToken = null;
        if ($rating->client && ! $rating->isAnswered() && ! $rating->isExpired()) {
            if (! $rating->client->telegram_link_token) {
                $rating->client->update(['telegram_link_token' => (string) Str::uuid()]);
            }
            $linkToken = $rating->client->telegram_link_token;
        }

        return response()->json([
            'agent_name'          => $rating->agent?->name,
            'contact_name'        => $rating->contact_label,
            'answered'            => $rating->isAnswered(),
            'expired'             => $rating->isExpired(),
            'bot_username'        => config('services.telegram_bot.username'),
            'telegram_link_token' => $linkToken,
        ]);
    }

    /**
     * POST /api/csat/{token}  (public)
     * Submit the rating. Single-use + expiry guarded.
     */
    public function submit(Request $request, string $token)
    {
        $data = $request->validate([
            'stars'   => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $rating = CsatRating::with('client')->where('token', $token)->first();

        if (! $rating) {
            return response()->json(['message' => 'not_found'], 404);
        }
        if ($rating->isAnswered()) {
            return response()->json(['message' => 'already_answered'], 410);
        }
        if ($rating->isExpired()) {
            return response()->json(['message' => 'expired'], 410);
        }

        $rating->update([
            'stars'        => $data['stars'],
            'comment'      => $data['comment'] ?? null,
            'responded_at' => now(),
        ]);

        // Build the Telegram bot-adoption deep link for the thank-you CTA.
        $botDeepLink = null;
        $username    = config('services.telegram_bot.username');
        if ($username && $rating->client?->telegram_link_token) {
            $botDeepLink = 'https://t.me/' . ltrim($username, '@')
                . '?start=link_' . $rating->client->telegram_link_token;
        }

        return response()->json([
            'ok'            => true,
            'bot_deep_link' => $botDeepLink,
        ]);
    }

    /**
     * GET /api/admin/csat
     * Recent answered ratings for the dashboard.
     */
    public function index(Request $request)
    {
        $rows = CsatRating::with(['agent', 'client.user'])
            ->whereNotNull('responded_at')
            ->orderByDesc('responded_at')
            ->limit(200)
            ->get()
            ->map(fn (CsatRating $r) => [
                'id'           => $r->id,
                'stars'        => $r->stars,
                'comment'      => $r->comment,
                'agent_name'   => $r->agent?->name,
                'client_name'  => $r->contact_label ?? $r->client?->user?->name,
                'responded_at' => $r->responded_at,
            ]);

        return response()->json(['data' => $rows]);
    }

    /**
     * GET /api/admin/csat/summary
     * Per-agent CSAT aggregate. CSAT% = share of ratings >= 4.
     */
    public function summary(Request $request)
    {
        $query = CsatRating::query()->whereNotNull('responded_at');

        if ($request->filled('from')) {
            $query->whereDate('responded_at', '>=', $request->get('from'));
        }
        if ($request->filled('to')) {
            $query->whereDate('responded_at', '<=', $request->get('to'));
        }

        $rows = $query->with('agent')->get()
            ->groupBy('agent_id')
            ->map(function ($group) {
                $responses = $group->count();
                $satisfied = $group->where('stars', '>=', 4)->count();

                return [
                    'agent_id'     => $group->first()->agent_id,
                    'agent_name'   => $group->first()->agent?->name,
                    'responses'    => $responses,
                    'avg_stars'    => round($group->avg('stars'), 2),
                    'csat_percent' => $responses > 0 ? round(($satisfied / $responses) * 100, 1) : 0,
                ];
            })
            ->sortByDesc('csat_percent')
            ->values();

        $totalResponses = $rows->sum('responses');
        $overallCsat    = $totalResponses > 0
            ? round($rows->sum(fn ($r) => $r['csat_percent'] * $r['responses']) / $totalResponses, 1)
            : 0;

        return response()->json([
            'data'    => $rows,
            'overall' => [
                'responses'    => $totalResponses,
                'csat_percent' => $overallCsat,
            ],
        ]);
    }
}
