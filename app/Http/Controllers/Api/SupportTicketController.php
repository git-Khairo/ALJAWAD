<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $query = SupportTicket::query();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('priority')) {
            $query->where('priority', $request->priority);
        }
        if ($request->filled('search')) {
            $q = $request->search;
            $query->where(function ($q2) use ($q) {
                $q2->where('subject', 'like', "%$q%")
                   ->orWhere('user_name', 'like', "%$q%")
                   ->orWhere('ticket_id', 'like', "%$q%");
            });
        }

        return response()->json(['data' => $query->orderByDesc('opened_at')->get()]);
    }

    public function show(SupportTicket $supportTicket)
    {
        return response()->json(['data' => $supportTicket]);
    }

    /** Public endpoint — anyone can submit a ticket */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'   => 'required|string|max:255',
            'user_name' => 'required|string|max:255',
            'category'  => 'required|string',
            'priority'  => 'nullable|in:low,medium,high,urgent',
            'notes'     => 'nullable|string',
        ]);

        $count = SupportTicket::count();
        $validated['ticket_id']  = 'TK-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT);
        $validated['status']     = 'open';
        $validated['opened_at']  = now();
        $validated['agent']      = 'Unassigned';
        $validated['escalated']  = false;

        $ticket = SupportTicket::create($validated);
        return response()->json(['data' => $ticket], 201);
    }

    public function update(Request $request, SupportTicket $supportTicket)
    {
        $validated = $request->validate([
            'status'           => 'sometimes|in:open,in_progress,resolved,closed,escalated',
            'priority'         => 'sometimes|in:low,medium,high,urgent',
            'agent'            => 'nullable|string',
            'notes'            => 'nullable|string',
            'escalated'        => 'nullable|boolean',
            'csat'             => 'nullable|integer|min:1|max:5',
            'first_response_at'=> 'nullable|date',
            'resolved_at'      => 'nullable|date',
        ]);

        if (isset($validated['status']) && in_array($validated['status'], ['resolved', 'closed']) && !$supportTicket->resolved_at) {
            $validated['resolved_at'] = now();
        }

        $supportTicket->update($validated);
        return response()->json(['data' => $supportTicket]);
    }

    public function destroy(SupportTicket $supportTicket)
    {
        $supportTicket->delete();
        return response()->json(['message' => 'Deleted']);
    }
}
