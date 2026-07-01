<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TradeJournalEntry;
use Illuminate\Http\Request;

class JournalController extends Controller
{
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
