<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ClientController extends Controller
{
    // ── List ──────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Client::with(['user', 'notes.author']);

        $type = $request->get('type', 'all');
        if ($type === 'client') {
            $query->clients();
        } elseif ($type === 'lead') {
            $query->leads();
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $q = $request->search;
            $query->whereHas('user', function ($u) use ($q) {
                $u->where('name', 'like', "%$q%")
                  ->orWhere('email', 'like', "%$q%")
                  ->orWhere('phone', 'like', "%$q%");
            });
        }

        $clients = $query->orderByDesc('id')->get()->map(fn($c) => $this->format($c));

        return response()->json(['data' => $clients]);
    }

    // ── Single ────────────────────────────────────────────────

    public function show(Client $client)
    {
        return response()->json(['data' => $this->format($client->load(['user', 'notes.author']))]);
    }

    // ── Create ────────────────────────────────────────────────

    public function store(Request $request)
    {
        $isLead = $request->get('type') === 'lead';

        $validated = $request->validate([
            // User fields
            'name'             => 'required|string|max:255',
            'email'            => $isLead
                                    ? 'nullable|email|unique:users,email'
                                    : 'required|email|unique:users,email',
            'phone'            => 'nullable|string|max:20',
            'telegram_chat_id' => 'nullable|string|max:100',
            'affiliate_code'   => 'nullable|string|max:32|unique:users,affiliate_code',
            'referred_by_code' => 'nullable|string|exists:users,affiliate_code',

            // CRM fields
            'type'             => 'required|in:client,lead',
            'status'           => 'nullable|string',
            'lead_status'      => 'nullable|string',
            'source'           => 'nullable|string',
            'tags'             => 'nullable|array',
        ]);

        if ($isLead && isset($validated['status'])) {
            $leadStatuses = ['new', 'contacted', 'interested', 'qualified', 'not_interested', 'converted'];
            if (in_array($validated['status'], $leadStatuses)) {
                $validated['lead_status'] = $validated['lead_status'] ?? $validated['status'];
                $validated['status']      = null;
            }
        }

        if ($isLead && empty($validated['lead_status'])) {
            $validated['lead_status'] = 'new';
        }

        return DB::transaction(function () use ($validated) {
            $referredBy = null;
            if (! empty($validated['referred_by_code'])) {
                $referredBy = User::where('affiliate_code', $validated['referred_by_code'])->first();
            }

            $user = User::create([
                'name'                => $validated['name'],
                'email'               => $validated['email'] ?? null,
                'phone'               => $validated['phone'] ?? null,
                'telegram_chat_id'    => $validated['telegram_chat_id'] ?? null,
                'affiliate_code'      => $validated['affiliate_code'] ?? null,
                'referred_by_user_id' => $referredBy?->id,
                'password'            => bcrypt(Str::random(16)), // placeholder — client sets via invite
                'user_type'           => 'client',
                'is_active'           => true,
            ]);

            $client = Client::create([
                'user_id'      => $user->id,
                'type'         => $validated['type'],
                'status'       => $validated['status'] ?? ($validated['type'] === 'client' ? 'active' : null),
                'lead_status'  => $validated['lead_status'] ?? null,
                'source'       => $validated['source'] ?? null,
                'tags'         => $validated['tags'] ?? [],
            ]);

            return response()->json(['data' => $this->format($client->load(['user', 'notes.author']))], 201);
        });
    }

    // ── Update ────────────────────────────────────────────────

    public function update(Request $request, Client $client)
    {
        $validated = $request->validate([
            // User fields
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|nullable|email|unique:users,email,' . $client->user_id,
            'phone'            => 'nullable|string|max:20',
            'telegram_chat_id' => 'nullable|string|max:100',
            'affiliate_code'   => 'nullable|string|max:32|unique:users,affiliate_code,' . $client->user_id,
            'referred_by_code' => 'nullable|string|exists:users,affiliate_code',
            'is_active'        => 'sometimes|boolean',

            // CRM fields
            'type'             => 'sometimes|in:client,lead',
            'status'           => 'nullable|string',
            'lead_status'      => 'nullable|string',
            'source'           => 'nullable|string',
            'tags'             => 'nullable|array',
            'last_contact'     => 'nullable|date',
            'courses_count'    => 'nullable|integer',
        ]);

        // For leads: map pipeline-style status into lead_status
        if ($client->type === 'lead' && isset($validated['status'])) {
            $leadStatuses = ['new', 'contacted', 'interested', 'qualified', 'not_interested', 'converted'];
            if (in_array($validated['status'], $leadStatuses)) {
                $validated['lead_status'] = $validated['status'];
                unset($validated['status']);
            }
        }

        return DB::transaction(function () use ($validated, $client) {
            $userFields = array_filter(
                array_intersect_key($validated, array_flip([
                    'name', 'email', 'phone', 'telegram_chat_id', 'affiliate_code', 'is_active',
                ])),
                fn($v) => $v !== null
            );

            if (! empty($validated['referred_by_code'])) {
                $referredBy = User::where('affiliate_code', $validated['referred_by_code'])->first();
                $userFields['referred_by_user_id'] = $referredBy?->id;
            }

            if (! empty($userFields)) {
                $client->user->update($userFields);
            }

            $crmFields = array_intersect_key($validated, array_flip([
                'type', 'status', 'lead_status', 'source', 'tags', 'last_contact', 'courses_count',
            ]));

            if (! empty($crmFields)) {
                $client->update($crmFields);
            }

            return response()->json(['data' => $this->format($client->fresh(['user', 'notes.author']))]);
        });
    }

    // ── Delete ────────────────────────────────────────────────

    public function destroy(Client $client)
    {
        DB::transaction(function () use ($client) {
            $user = $client->user;
            $client->delete();
            $user?->delete();
        });

        return response()->json(['message' => 'Deleted']);
    }

    // ── Convert lead → client ─────────────────────────────────

    public function convert(Client $client)
    {
        abort_if($client->type === 'client', 422, 'Already a client.');

        $client->convertToClient();

        return response()->json(['data' => $this->format($client->fresh(['user', 'notes.author']))]);
    }

    // ── Notes ─────────────────────────────────────────────────

    public function storeNote(Request $request, Client $client)
    {
        $validated = $request->validate([
            'body' => 'required|string',
        ]);

        $note = $client->notes()->create([
            'author_id' => $request->user()->id,
            'body'      => $validated['body'],
        ]);

        return response()->json(['data' => $this->formatNote($note->load('author'))], 201);
    }

    public function destroyNote(Client $client, ClientNote $note)
    {
        abort_if($note->client_id !== $client->id, 404);
        $note->delete();
        return response()->json(['message' => 'Note deleted']);
    }

    // ── Format helpers ────────────────────────────────────────

    private function format(Client $client): array
    {
        $user = $client->user;

        return [
            'id'               => $client->id,
            'user_id'          => $client->user_id,
            'name'             => $user->name,
            'email'            => $user->email,
            'phone'            => $user->phone,
            'telegram_chat_id' => $user->telegram_chat_id,
            'is_active'        => $user->is_active,
            'affiliate_code'   => $user->affiliate_code,
            'affiliate_balance'=> $user->affiliate_balance,
            'referred_by'      => $user->referredBy?->name,
            'type'             => $client->type,
            'status'           => $client->status,
            'lead_status'      => $client->lead_status,
            'source'           => $client->source,
            'tags'             => $client->tags ?? [],
            'last_contact'     => $client->last_contact,
            'courses_count'    => $client->courses_count,
            'converted_at'     => $client->converted_at,
            'notes'            => $client->relationLoaded('notes')
                ? $client->notes->map(fn($n) => $this->formatNote($n))->values()
                : [],
            'created_at'       => $client->created_at,
        ];
    }

    private function formatNote(ClientNote $note): array
    {
        return [
            'id'         => $note->id,
            'body'       => $note->body,
            'author_id'  => $note->author_id,
            'author'     => $note->author?->name,
            'created_at' => $note->created_at,
        ];
    }
}
