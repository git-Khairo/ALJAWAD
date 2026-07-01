<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TradeJournalEntry;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

class JournalController extends Controller
{
    /** Closed trades needed before AI insights are worth generating. */
    private const MIN_CLOSED_FOR_INSIGHTS = 3;

    /** How many recent closed trades to feed into the analysis (keeps the prompt small). */
    private const INSIGHTS_TRADE_LIMIT = 30;
    /**
     * GET /api/my/journal
     * The authenticated user's trade journal entries + summary stats.
     */
    public function index(Request $request)
    {
        $entries = TradeJournalEntry::where('user_id', $request->user()->id)
            ->orderByDesc('opened_at')
            ->orderByDesc('id')
            ->get();

        $closed  = $entries->whereIn('outcome', ['hit_tp', 'hit_sl', 'manual_close']);
        $wins    = $entries->where('outcome', 'hit_tp')->count();
        $losses  = $entries->where('outcome', 'hit_sl')->count();
        $decided = $wins + $losses;

        return response()->json([
            'data'  => $entries,
            'stats' => [
                'total'    => $entries->count(),
                'open'     => $entries->where('outcome', 'open')->count(),
                'closed'   => $closed->count(),
                'wins'     => $wins,
                'losses'   => $losses,
                'win_rate' => $decided > 0 ? round(($wins / $decided) * 100, 1) : null,
            ],
        ]);
    }

    /**
     * GET /api/my/journal/insights
     * AI-generated behavioral insights from the user's own closed trades
     * (patterns in tags/reasoning vs outcome). Results are cached indefinitely
     * per user — pass ?refresh=1 to force a new OpenAI call.
     */
    public function insights(Request $request)
    {
        $userId = $request->user()->id;

        $entries = TradeJournalEntry::where('user_id', $userId)
            ->whereIn('outcome', ['hit_tp', 'hit_sl', 'manual_close'])
            ->orderByDesc('closed_at')
            ->orderByDesc('id')
            ->limit(self::INSIGHTS_TRADE_LIMIT)
            ->get();

        if ($entries->count() < self::MIN_CLOSED_FOR_INSIGHTS) {
            return response()->json([
                'insights_ar' => null,
                'insights_en' => null,
                'message'     => 'not_enough_data',
                'needed'      => self::MIN_CLOSED_FOR_INSIGHTS,
                'have'        => $entries->count(),
            ]);
        }

        $cacheKey = "journal_insights_user_{$userId}";

        if (! $request->boolean('refresh')) {
            $cached = Cache::get($cacheKey);
            if ($cached) {
                return response()->json($cached);
            }
        }

        $apiKey = config('services.openai.key');
        if (empty($apiKey)) {
            return response()->json([
                'message' => 'OpenAI API key is not configured. Add OPENAI_API_KEY to your .env file.',
            ], 501);
        }

        $lines = $entries->map(function (TradeJournalEntry $e) {
            $tags      = $e->tags ? implode(', ', $e->tags) : 'none';
            $reasoning = $e->entry_reasoning ? mb_substr($e->entry_reasoning, 0, 200) : '—';
            $notes     = $e->outcome_notes   ? mb_substr($e->outcome_notes, 0, 200)   : '—';

            return "- {$e->symbol} {$e->direction}, outcome: {$e->outcome}, tags: [{$tags}], entry reasoning: \"{$reasoning}\", outcome notes: \"{$notes}\"";
        })->implode("\n");

        $system = <<<SYSTEM
You are a trading psychology and discipline coach reviewing a trader's personal journal for AlJawad Trading. Your job is to spot behavioral patterns in how they trade — never give market/financial advice on what to buy or sell next. Be specific and reference their own tags and notes. Be honest but encouraging. Give 2-4 short, actionable insights.
SYSTEM;

        $user = <<<USER
Here are the trader's last {$entries->count()} closed trades (most recent first):

{$lines}

Respond with ONLY valid JSON (no markdown, no code fences) in exactly this shape:
{"ar":"<insights in Arabic>","en":"<insights in English>"}
Each language value should be 2-4 short bullet-style sentences separated by newlines, each starting with "- ".
USER;

        try {
            $client   = \OpenAI::client($apiKey);
            $response = $client->chat()->create([
                'model'       => config('services.openai.model', 'gpt-4o-mini'),
                'messages'    => [
                    ['role' => 'system', 'content' => $system],
                    ['role' => 'user',   'content' => $user],
                ],
                'temperature' => 0.6,
                'max_tokens'  => 500,
            ]);

            $text   = trim($response->choices[0]->message->content ?? '');
            $parsed = json_decode($text, true);

            $result = [
                'insights_ar'  => $parsed['ar'] ?? null,
                'insights_en'  => $parsed['en'] ?? null,
                'generated_at' => now()->toIso8601String(),
                'based_on'     => $entries->count(),
            ];

            Cache::forever($cacheKey, $result);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'OpenAI request failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * POST /api/my/journal
     */
    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $validated['user_id'] = $request->user()->id;

        $entry = TradeJournalEntry::create($validated);

        return response()->json(['data' => $entry], 201);
    }

    /**
     * PUT /api/my/journal/{journal}
     */
    public function update(Request $request, TradeJournalEntry $journal)
    {
        abort_if($journal->user_id !== $request->user()->id, 403);

        $journal->update($this->validated($request, true));

        return response()->json(['data' => $journal]);
    }

    /**
     * DELETE /api/my/journal/{journal}
     */
    public function destroy(Request $request, TradeJournalEntry $journal)
    {
        abort_if($journal->user_id !== $request->user()->id, 403);

        $journal->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function validated(Request $request, bool $partial = false): array
    {
        $prefix = $partial ? 'sometimes|' : 'required|';

        return $request->validate([
            'symbol'          => $prefix . 'string|max:20',
            'direction'       => $prefix . 'in:buy,sell',
            'entry_price'     => $prefix . 'numeric',
            'take_profit'     => 'nullable|numeric',
            'stop_loss'       => 'nullable|numeric',
            'exit_price'      => 'nullable|numeric',
            'size'            => 'nullable|numeric',
            'outcome'         => 'sometimes|in:open,hit_tp,hit_sl,manual_close',
            'entry_reasoning' => 'nullable|string',
            'outcome_notes'   => 'nullable|string',
            'tags'            => 'nullable|array',
            'tags.*'          => 'string',
            'opened_at'       => 'nullable|date',
            'closed_at'       => 'nullable|date',
        ]);
    }
}
