<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\SupportTicket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

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

    /** Public endpoint — anyone can submit a ticket. */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'subject'     => 'required|string|max:255',
            'name'        => 'required|string|max:255',
            'phone'       => 'nullable|string|max:20',
            'email'       => 'nullable|email',
            'category'    => 'required|string',
            'description' => 'nullable|string',
            'priority'    => 'nullable|in:low,medium,high,urgent',
        ]);

        // Public visitors can't reach the admin CRM, so resolve (or create) the
        // contact here on the server — matched by phone, created as a lead if new.
        [$userRefId, $userType] = $this->resolveContact($validated);

        $count  = SupportTicket::count();
        $ticket = SupportTicket::create([
            'subject'     => $validated['subject'],
            'user_name'   => $validated['name'],
            'user_ref_id' => $userRefId,
            'user_type'   => $userType,
            'category'    => $validated['category'],
            'priority'    => $validated['priority'] ?? 'medium',
            'notes'       => $validated['description'] ?? null,
            'ticket_id'   => 'TK-' . str_pad($count + 1, 3, '0', STR_PAD_LEFT),
            'status'      => 'open',
            'opened_at'   => now(),
            'agent'       => 'Unassigned',
            'escalated'   => false,
        ]);

        return response()->json(['data' => $ticket], 201);
    }

    /**
     * Match the submitter to a CRM record by phone, creating a lead if new.
     * @return array{0:int|null,1:string}  [user_ref_id, user_type]
     */
    private function resolveContact(array $data): array
    {
        $phone = User::normalizePhone($data['phone'] ?? null);

        if ($phone) {
            $user = User::where('phone', $phone)->first();
            if ($user) {
                $client = $user->client;
                if ($client) {
                    return [$client->id, $client->isLead() ? 'lead' : 'client'];
                }
                return [$user->id, 'user'];
            }
        }

        // New contact → create a lead. Only keep the email if it isn't taken.
        $email = $data['email'] ?? null;
        if ($email && User::where('email', $email)->exists()) {
            $email = null;
        }

        return DB::transaction(function () use ($data, $phone, $email) {
            $user = User::create([
                'name'      => $data['name'],
                'email'     => $email,
                'phone'     => $phone,
                'password'  => bcrypt(Str::random(16)),
                'user_type' => 'client',
                'is_active' => true,
            ]);

            $client = Client::create([
                'user_id'     => $user->id,
                'stage'       => 'lead',
                'lead_status' => 'new',
                'source'      => 'Support',
            ]);

            return [$client->id, 'lead'];
        });
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
