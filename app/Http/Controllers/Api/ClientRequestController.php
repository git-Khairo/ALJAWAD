<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Client;
use App\Models\ClientRequest;
use App\Models\ClientTradingAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Sub-IB client introductions.
 *
 * An IB submits a proposed client from their own dashboard; nothing is written
 * into the CRM until an admin approves it from the Clients tab. Approval creates
 * the user + client under the *requesting* IB, so the downline stays correct
 * without the IB ever holding write access to the CRM.
 */
class ClientRequestController extends Controller
{
    // ── IB side (/my) ─────────────────────────────────────────

    /** The authenticated IB's own submissions, newest first. */
    public function mine(Request $request)
    {
        $this->assertAffiliate($request->user());

        $rows = ClientRequest::with('broker:id,name')
            ->where('requested_by_user_id', $request->user()->id)
            ->orderByDesc('id')
            ->get()
            ->map(fn (ClientRequest $r) => $this->format($r));

        return response()->json(['data' => $rows]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $this->assertAffiliate($user);

        $validated = $request->validate([
            'name'             => 'required|string|max:255',
            'phone'            => 'required|string|max:20',
            'email'            => 'nullable|email|max:255',
            'telegram_chat_id' => 'nullable|string|max:100',
            'broker_id'        => 'nullable|integer|exists:brokers,id',
            'account_number'   => 'nullable|string|max:100',
            'source'           => 'nullable|string|max:100',
            'note'             => 'nullable|string|max:2000',
        ]);

        $phone = User::normalizePhone($validated['phone']);
        $this->assertPhoneAvailable($phone);
        $this->assertEmailAvailable($validated['email'] ?? null);

        $clientRequest = ClientRequest::create([
            ...$validated,
            'phone'                => $phone,
            'requested_by_user_id' => $user->id,
            'status'               => 'pending',
        ]);

        return response()->json([
            'data' => $this->format($clientRequest->load('broker:id,name')),
        ], 201);
    }

    /** An IB may withdraw their own request while it is still pending. */
    public function destroy(Request $request, ClientRequest $clientRequest)
    {
        $this->assertAffiliate($request->user());

        if ($clientRequest->requested_by_user_id !== $request->user()->id) {
            abort(403, 'This request belongs to another IB.');
        }
        if (! $clientRequest->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['Only a pending request can be withdrawn.'],
            ]);
        }

        $clientRequest->delete();

        return response()->json(['message' => 'Withdrawn']);
    }

    // ── Admin side (/admin/crm) ───────────────────────────────

    /** Review queue. Defaults to pending only; `?status=all` shows history. */
    public function index(Request $request)
    {
        $query = ClientRequest::with(['broker:id,name', 'requestedBy:id,name,affiliate_code', 'reviewedBy:id,name']);

        $status = $request->get('status', 'pending');
        if ($status !== 'all') {
            $query->where('status', $status);
        }

        return response()->json([
            'data' => $query->orderByDesc('id')->get()->map(fn (ClientRequest $r) => $this->format($r)),
        ]);
    }

    /**
     * Approve or reject. Approving provisions the user + client under the
     * requesting IB; rejecting just records the decision and an optional reason.
     */
    public function update(Request $request, ClientRequest $clientRequest)
    {
        $validated = $request->validate([
            'status'      => 'required|in:approved,rejected',
            'stage'       => 'nullable|in:lead,client_inactive,client_active',
            'review_note' => 'nullable|string|max:2000',
        ]);

        if (! $clientRequest->isPending()) {
            throw ValidationException::withMessages([
                'status' => ['This request has already been reviewed.'],
            ]);
        }

        if ($validated['status'] === 'rejected') {
            $clientRequest->update([
                'status'              => 'rejected',
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at'         => now(),
                'review_note'         => $validated['review_note'] ?? null,
            ]);

            ActivityLog::record('clients', 'update', $request, target: $clientRequest->name, target_type: 'client_request', meta: ['action' => 'request_rejected']);

            return response()->json(['data' => $this->format($clientRequest->fresh(['broker', 'requestedBy', 'reviewedBy']))]);
        }

        // Re-check availability at approval time: the phone or email may have
        // been taken between submission and review.
        $this->assertPhoneAvailable($clientRequest->phone, $clientRequest->id);
        $this->assertEmailAvailable($clientRequest->email);

        $stage = $validated['stage'] ?? 'client_inactive';

        DB::transaction(function () use ($clientRequest, $request, $stage, $validated) {
            $user = User::create([
                'name'                => $clientRequest->name,
                'email'               => $clientRequest->email,
                'phone'               => $clientRequest->phone,
                'telegram_chat_id'    => $clientRequest->telegram_chat_id,
                // The client lands under the IB that introduced them.
                'referred_by_user_id' => $clientRequest->requested_by_user_id,
                'password'            => bcrypt(Str::random(16)), // placeholder — the client claims via code
                'user_type'           => 'client',
                'is_active'           => true,
            ]);

            $client = Client::create([
                'user_id'      => $user->id,
                'stage'        => $stage,
                'lead_status'  => $stage === 'lead' ? 'new' : null,
                'source'       => $clientRequest->source ?? 'ib_referral',
                'tags'         => [],
                'activated_at' => $stage === 'client_active' ? now() : null,
            ]);

            if ($clientRequest->broker_id && $clientRequest->account_number) {
                ClientTradingAccount::create([
                    'client_id'      => $client->id,
                    'broker_id'      => $clientRequest->broker_id,
                    'account_number' => $clientRequest->account_number,
                ]);
            }

            $clientRequest->update([
                'status'              => 'approved',
                'reviewed_by_user_id' => $request->user()->id,
                'reviewed_at'         => now(),
                'review_note'         => $validated['review_note'] ?? null,
                'client_id'           => $client->id,
            ]);
        });

        ActivityLog::record('clients', 'create', $request, target: $clientRequest->name, target_type: 'client', meta: ['action' => 'request_approved', 'stage' => $stage]);

        return response()->json([
            'data' => $this->format($clientRequest->fresh(['broker', 'requestedBy', 'reviewedBy'])),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────

    /** Only registered IBs may introduce clients. */
    private function assertAffiliate(?User $user): void
    {
        if (! $user || ! $user->isAffiliate()) {
            abort(403, 'Only registered IBs can submit client requests.');
        }
    }

    /**
     * The phone is the login identity, so it must be free both at submission
     * and again at approval. `$ignoreRequestId` skips the row being approved —
     * otherwise a request would collide with itself.
     */
    private function assertPhoneAvailable(?string $phone, ?int $ignoreRequestId = null): void
    {
        if (! $phone) {
            return;
        }
        if (User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => ['A user with this phone number already exists.'],
            ]);
        }
        $duplicate = ClientRequest::pending()
            ->where('phone', $phone)
            ->when($ignoreRequestId, fn ($q) => $q->whereKeyNot($ignoreRequestId))
            ->exists();

        if ($duplicate) {
            throw ValidationException::withMessages([
                'phone' => ['There is already a pending request for this phone number.'],
            ]);
        }
    }

    private function assertEmailAvailable(?string $email): void
    {
        if ($email && User::where('email', $email)->exists()) {
            throw ValidationException::withMessages([
                'email' => ['A user with this email already exists.'],
            ]);
        }
    }

    private function format(ClientRequest $r): array
    {
        return [
            'id'               => $r->id,
            'name'             => $r->name,
            'phone'            => $r->phone,
            'email'            => $r->email,
            'telegram_chat_id' => $r->telegram_chat_id,
            'broker_id'        => $r->broker_id,
            'broker_name'      => $r->broker?->name,
            'account_number'   => $r->account_number,
            'source'           => $r->source,
            'note'             => $r->note,
            'status'           => $r->status,
            'requested_by'     => $r->requestedBy?->name,
            'requested_by_id'  => $r->requested_by_user_id,
            'reviewed_by'      => $r->reviewedBy?->name,
            'reviewed_at'      => $r->reviewed_at?->toIso8601String(),
            'review_note'      => $r->review_note,
            'client_id'        => $r->client_id,
            'created_at'       => $r->created_at?->toIso8601String(),
        ];
    }
}
