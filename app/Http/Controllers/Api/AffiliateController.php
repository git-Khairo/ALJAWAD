<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ActivityLog;
use App\Models\Broker;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Multi-level IB (Introducing Broker) / affiliate management.
 *
 * The company is the head IB. Every IB is a user with an `affiliate_code`, a
 * `broker_id`, and a parent IB (`referred_by_user_id`; null = directly under
 * the company). Each IB operates under exactly one broker, and an IB's parent
 * must sit on that same broker. No money/commissions are tracked here.
 */
class AffiliateController extends Controller
{
    /** Max recursion depth when materializing a downline tree (safety guard). */
    private const MAX_DEPTH = 8;

    // ── Reads ─────────────────────────────────────────────────

    /** Flat list of every IB (for tables / the promote dialog). */
    public function index()
    {
        $ibs = User::whereNotNull('affiliate_code')
            ->with('broker', 'referredBy')
            ->withCount([
                'referrals as clients_count' => fn ($q) => $q->whereNull('affiliate_code'),
                'referrals as sub_ibs_count' => fn ($q) => $q->whereNotNull('affiliate_code'),
            ])
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => $this->formatIb($u));

        return response()->json(['data' => $ibs]);
    }

    /** The full IB hierarchy as a nested tree (company roots → sub-IBs → clients). */
    public function tree()
    {
        $roots = User::whereNotNull('affiliate_code')
            ->whereNull('referred_by_user_id')
            ->with('broker')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => $this->buildNode($u));

        return response()->json(['data' => $roots]);
    }

    /**
     * IB picker for the client form's "which IB is this client under?" select.
     * Prepends a Company (head IB) sentinel — id null means "directly under the
     * company".
     */
    public function options()
    {
        $ibs = User::whereNotNull('affiliate_code')
            ->with('broker')
            ->orderBy('name')
            ->get()
            ->map(fn (User $u) => [
                'id'          => $u->id,
                'name'        => $u->name,
                'broker_id'   => $u->broker_id,
                'broker_name' => $u->broker?->name,
            ])
            ->values()
            ->all();

        array_unshift($ibs, [
            'id'          => null,
            'name'        => 'Company (Head IB)',
            'broker_id'   => null,
            'broker_name' => null,
        ]);

        return response()->json($ibs);
    }

    /** Brokers the company works with (for broker selects). */
    public function brokers()
    {
        return response()->json(
            Broker::where('is_active', true)->orderBy('name')->get(['id', 'name'])
        );
    }

    // ── Writes ────────────────────────────────────────────────

    /** Turn an existing user into an IB (or re-key their broker/parent). */
    public function promote(Request $request)
    {
        $validated = $request->validate([
            'phone'        => 'required|string|max:20',
            'broker_id'    => 'required|integer|exists:brokers,id',
            'parent_ib_id' => 'nullable|integer|exists:users,id',
        ]);

        $normalized = User::normalizePhone($validated['phone']);
        $user = User::where('phone', $normalized)->first();
        if (! $user) {
            throw ValidationException::withMessages(['phone' => ['No user found with this phone number.']]);
        }
        $this->assertValidParent($user, $validated['parent_ib_id'] ?? null, (int) $validated['broker_id']);

        $user->affiliate_code = $user->affiliate_code ?? User::generateAffiliateCode();
        $user->broker_id = $validated['broker_id'];
        $user->referred_by_user_id = $validated['parent_ib_id'] ?? null;
        $user->save();

        ActivityLog::record('affiliates', 'create', $request, target: $user->name, target_type: 'user', meta: ['action' => 'ib_promoted', 'broker_id' => $user->broker_id]);

        return response()->json(['data' => $this->formatIb($user->fresh(['broker', 'referredBy']))]);
    }

    /** Change an IB's parent and/or broker. */
    public function update(Request $request, User $user)
    {
        abort_unless($user->isAffiliate(), 422, 'This user is not an IB.');

        $validated = $request->validate([
            'broker_id'    => 'sometimes|required|integer|exists:brokers,id',
            'parent_ib_id' => 'nullable|integer|exists:users,id',
        ]);

        $newBroker = (int) ($validated['broker_id'] ?? $user->broker_id);

        // Changing the broker of an IB that already has sub-IBs would break the
        // "parent and child share a broker" invariant for its whole subtree.
        if ($newBroker !== (int) $user->broker_id && $user->subIbs()->exists()) {
            throw ValidationException::withMessages([
                'broker_id' => ['Move or demote this IB\'s sub-IBs before changing its broker.'],
            ]);
        }

        $parentId = array_key_exists('parent_ib_id', $validated)
            ? $validated['parent_ib_id']
            : $user->referred_by_user_id;

        $this->assertValidParent($user, $parentId, $newBroker);

        $user->broker_id = $newBroker;
        $user->referred_by_user_id = $parentId;
        $user->save();

        ActivityLog::record('affiliates', 'update', $request, target: $user->name, target_type: 'user', meta: ['action' => 'ib_updated']);

        return response()->json(['data' => $this->formatIb($user->fresh(['broker', 'referredBy']))]);
    }

    /**
     * Demote an IB back to a regular user. Its direct downline (clients and
     * sub-IBs) is reparented to the demoted IB's own parent (the grandparent)
     * so nothing is orphaned — safe because they all shared the same broker.
     */
    public function demote(Request $request, User $user)
    {
        abort_unless($user->isAffiliate(), 422, 'This user is not an IB.');

        DB::transaction(function () use ($user) {
            User::where('referred_by_user_id', $user->id)
                ->update(['referred_by_user_id' => $user->referred_by_user_id]);

            $user->update(['affiliate_code' => null, 'broker_id' => null]);
        });

        ActivityLog::record('affiliates', 'delete', $request, target: $user->name, target_type: 'user', meta: ['action' => 'ib_demoted']);

        return response()->json(['ok' => true]);
    }

    // ── Self-service ──────────────────────────────────────────

    /**
     * GET /api/my/network — the authenticated user's own downline (any user
     * type). Returns their direct clients and their sub-IBs as a nested tree so
     * the client app / coach profile can drill through multiple levels.
     */
    public function network(Request $request)
    {
        $user = $request->user();

        return response()->json([
            'is_affiliate'   => $user->isAffiliate(),
            'affiliate_code' => $user->affiliate_code,
            'broker'         => $user->broker?->name,
            'clients'        => $this->directClients($user),
            'sub_ibs'        => $user->subIbs()->with('broker')->orderBy('name')->get()
                ->map(fn (User $u) => $this->buildNode($u))->values(),
        ]);
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Validate a proposed parent for an IB on a given broker:
     * parent must itself be an IB, on the same broker, and not create a cycle.
     */
    private function assertValidParent(User $user, ?int $parentId, int $brokerId): void
    {
        if ($parentId === null) {
            return; // directly under the company (head IB)
        }

        if ($parentId === $user->id) {
            throw ValidationException::withMessages(['parent_ib_id' => ['An IB cannot be its own parent.']]);
        }

        $parent = User::find($parentId);
        if (! $parent || ! $parent->isAffiliate()) {
            throw ValidationException::withMessages(['parent_ib_id' => ['The parent must be an existing IB.']]);
        }
        if ((int) $parent->broker_id !== $brokerId) {
            throw ValidationException::withMessages(['parent_ib_id' => ['The parent IB must be on the same broker.']]);
        }
        if ($this->createsCycle($user, $parentId)) {
            throw ValidationException::withMessages(['parent_ib_id' => ['That IB is already below this one — this would create a loop.']]);
        }
    }

    /** True if making $parentId the parent of $user would introduce a cycle. */
    private function createsCycle(User $user, int $parentId): bool
    {
        $cursor = $parentId;
        while ($cursor !== null) {
            if ($cursor === $user->id) {
                return true;
            }
            $cursor = User::where('id', $cursor)->value('referred_by_user_id');
        }

        return false;
    }

    /** One IB node with its nested sub-IBs and direct clients. */
    private function buildNode(User $u, int $depth = 0): array
    {
        $node = $this->formatIb($u);

        if ($depth < self::MAX_DEPTH) {
            $children = $u->subIbs()->with('broker')->orderBy('name')->get();
            $clients  = $this->directClients($u);

            $node['sub_ibs'] = $children->map(fn (User $c) => $this->buildNode($c, $depth + 1))->values();
            $node['clients'] = $clients;
            $node['sub_ibs_count'] = $children->count();
            $node['clients_count'] = count($clients);
        }

        return $node;
    }

    /** Direct client referrals (referred, non-affiliate, client-type users). */
    private function directClients(User $u): \Illuminate\Support\Collection
    {
        return $u->referrals()
            ->whereNull('affiliate_code')
            ->where('user_type', 'client')
            ->with('client')
            ->orderBy('name')
            ->get()
            ->map(fn (User $c) => [
                'user_id' => $c->id,
                'client_id' => $c->client?->id,
                'name'    => $c->name,
                'email'   => $c->email,
                'phone'   => $c->phone,
                'stage'   => $c->client?->stage,
            ])
            ->values();
    }

    private function formatIb(User $u): array
    {
        return [
            'id'             => $u->id,
            'name'           => $u->name,
            'affiliate_code' => $u->affiliate_code,
            'user_type'      => $u->user_type,
            'parent_id'      => $u->referred_by_user_id,
            'parent_name'    => $u->referredBy?->name,
            'broker_id'      => $u->broker_id,
            'broker_name'    => $u->broker?->name,
            'clients_count'  => $u->clients_count ?? $u->referrals()->whereNull('affiliate_code')->count(),
            'sub_ibs_count'  => $u->sub_ibs_count ?? $u->referrals()->whereNotNull('affiliate_code')->count(),
        ];
    }
}
