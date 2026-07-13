<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientNote;
use App\Models\User;
use App\Services\LoginCodeService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class ClientController extends Controller
{
    // ── List ──────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = Client::with(['user', 'notes.author', 'accessGrants']);

        $type = $request->get('type', 'all');
        if ($type === 'client') {
            $query->clients();
        } elseif ($type === 'lead') {
            $query->leads();
        }

        if ($request->filled('stage')) {
            $query->where('stage', $request->stage);
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
        return response()->json(['data' => $this->format($client->load(['user', 'notes.author', 'accessGrants']))]);
    }

    // ── Create ────────────────────────────────────────────────

    public function store(Request $request)
    {
        $isLead = $request->get('stage', 'lead') === 'lead';

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
            'stage'            => 'required|in:lead,client_inactive,client_active',
            'lead_status'      => 'nullable|string',
            'source'           => 'nullable|string',
            'tags'             => 'nullable|array',
        ]);

        // Phone is the login identity — normalize + enforce uniqueness.
        $phone = User::normalizePhone($validated['phone'] ?? null);
        if ($phone && User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages(['phone' => ['A user with this phone number already exists.']]);
        }

        $newClientName = null;
        $response = DB::transaction(function () use ($validated, $isLead, $phone, &$newClientName) {
            $referredBy = null;
            if (! empty($validated['referred_by_code'])) {
                $referredBy = User::where('affiliate_code', $validated['referred_by_code'])->first();
            }

            $user = User::create([
                'name'                => $validated['name'],
                'email'               => $validated['email'] ?? null,
                'phone'               => $phone,
                'telegram_chat_id'    => $validated['telegram_chat_id'] ?? null,
                'affiliate_code'      => $validated['affiliate_code'] ?? null,
                'referred_by_user_id' => $referredBy?->id,
                'password'            => bcrypt(Str::random(16)), // placeholder — client sets via invite
                'user_type'           => 'client',
                'is_active'           => true,
            ]);

            $client = Client::create([
                'user_id'      => $user->id,
                'stage'        => $validated['stage'],
                'lead_status'  => $isLead ? ($validated['lead_status'] ?? 'new') : null,
                'source'       => $validated['source'] ?? null,
                'tags'         => $validated['tags'] ?? [],
                'activated_at' => $validated['stage'] === 'client_active' ? now() : null,
            ]);

            $newClientName = $user->name;

            return response()->json(['data' => $this->format($client->load(['user', 'notes.author', 'accessGrants']))], 201);
        });

        ActivityLog::record('clients', 'create', $request, target: $newClientName, target_type: 'client', meta: ['stage' => $validated['stage']]);

        return $response;
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
            'stage'            => 'sometimes|in:lead,client_inactive,client_active',
            'lead_status'      => 'nullable|string',
            'source'           => 'nullable|string',
            'tags'             => 'nullable|array',
            'last_contact'     => 'nullable|date',
        ]);

        $response = DB::transaction(function () use ($validated, $client) {
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

            // Normalize + enforce phone uniqueness (excluding this user).
            if (array_key_exists('phone', $userFields)) {
                $userFields['phone'] = User::normalizePhone($userFields['phone']);
                if ($userFields['phone'] && User::where('phone', $userFields['phone'])->where('id', '!=', $client->user_id)->exists()) {
                    throw ValidationException::withMessages(['phone' => ['A user with this phone number already exists.']]);
                }
            }

            if (! empty($userFields)) {
                $client->user->update($userFields);
            }

            $crmFields = array_intersect_key($validated, array_flip([
                'stage', 'lead_status', 'source', 'tags', 'last_contact',
            ]));

            // Stamp activation time the first time they move to active (manual override).
            if (($crmFields['stage'] ?? null) === 'client_active' && ! $client->activated_at) {
                $crmFields['activated_at'] = now();
            }

            if (! empty($crmFields)) {
                $client->update($crmFields);
            }

            return response()->json(['data' => $this->format($client->fresh(['user', 'notes.author', 'accessGrants']))]);
        });

        ActivityLog::record('clients', 'update', $request, target: $client->user->name, target_type: 'client');

        return $response;
    }

    // ── Delete ────────────────────────────────────────────────

    public function destroy(Request $request, Client $client)
    {
        $name = $client->user?->name ?? '—';

        DB::transaction(function () use ($client) {
            $user = $client->user;
            $client->delete();
            $user?->delete();
        });

        ActivityLog::record('clients', 'delete', $request, target: $name, target_type: 'client');

        return response()->json(['message' => 'Deleted']);
    }

    // ── Convert lead → client ─────────────────────────────────

    public function convert(Request $request, Client $client)
    {
        abort_if($client->isClient(), 422, 'Already a client.');

        $client->promoteToClient();

        ActivityLog::record('clients', 'convert_lead', $request, target: $client->user->name, target_type: 'client');

        return response()->json(['data' => $this->format($client->fresh(['user', 'notes.author', 'accessGrants']))]);
    }

    // ── Support: issue a one-time login code ──────────────────

    /**
     * POST /api/admin/crm/{client}/access-code
     * Support fallback: generate a login/claim code for this client's user.
     * Returns the plaintext code (admin-only) and also sends it via Telegram
     * when possible. The user enters it on /auth/claim to set their password.
     */
    public function issueAccessCode(Request $request, Client $client, LoginCodeService $codes)
    {
        $user = $client->user;

        if (! $user) {
            return response()->json(['message' => 'This record has no user account.'], 422);
        }
        if (! $user->phone) {
            return response()->json(['message' => 'Add a phone number first so the client can log in.'], 422);
        }

        $result = $codes->issue($user);

        ActivityLog::record('clients', 'update', $request, target: $user->name, target_type: 'client', meta: ['action' => 'access_code_issued', 'sent_via' => $result['sent_via']]);

        return response()->json([
            'code'               => $result['code'],
            'sent_via'           => $result['sent_via'],
            'expires_in_minutes' => 10,
        ]);
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

        ActivityLog::record('clients', 'update', $request, target: $client->user->name, target_type: 'client', meta: ['action' => 'note_added']);

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

        $activeGrants = $client->relationLoaded('accessGrants')
            ? $client->accessGrants->where('status', 'active')->count()
            : $client->accessGrants()->where('status', 'active')->count();

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
            'stage'            => $client->stage,
            'is_student'       => $client->stage === 'client_active' && $activeGrants > 0,
            'lead_status'      => $client->lead_status,
            'source'           => $client->source,
            'tags'             => $client->tags ?? [],
            'last_contact'     => $client->last_contact,
            'courses_count'    => $activeGrants,
            'converted_at'     => $client->converted_at,
            'activated_at'     => $client->activated_at,
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
