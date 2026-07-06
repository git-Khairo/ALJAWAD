<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use Spatie\Permission\Models\Role;

class CoachController extends Controller
{
    /**
     * GET /api/admin/coaches
     */
    public function index()
    {
        $coaches = Coach::with('user.roles')->get()->map(fn($c) => $this->format($c));
        return response()->json($coaches);
    }

    /**
     * GET /api/admin/coaches-options
     * Minimal id+name list for assignment pickers (e.g. calendar task assignment),
     * so schedulers can assign without needing the full "manage users" permission.
     */
    public function options()
    {
        return response()->json(
            Coach::where('status', 'active')->with('user:id,name')->get()
                ->map(fn($c) => ['id' => $c->user_id, 'name' => $c->user?->name])
                ->filter(fn($o) => $o['name'])
                ->values()
        );
    }

    /**
     * POST /api/admin/coaches
     *
     * Creates a user account then a linked coach profile.
     * If login_email / login_password are supplied they override the primary
     * email/password on the users record (and are stored on coaches for reference).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'            => 'required|string|max:255',
            'email'           => 'required|email|unique:users,email',
            'phone'           => 'nullable|string|max:20',
            'telegram_chat_id'=> 'nullable|string|max:100',
            'password'        => 'required|string|min:8',
            'role'            => 'required|string|exists:roles,name',
            'permissions'     => 'nullable|array',
            'permissions.*'   => 'string|exists:permissions,name',
            'login_email'     => 'nullable|email|unique:users,email|unique:coaches,login_email',
            'login_password'  => 'nullable|string|min:8',
        ]);

        // Phone is a unique login identity — normalize ("" → null) and check.
        $phone = User::normalizePhone($data['phone'] ?? null);
        if ($phone && User::where('phone', $phone)->exists()) {
            throw ValidationException::withMessages(['phone' => ['A user with this phone number already exists.']]);
        }

        return DB::transaction(function () use ($data, $phone) {
            // Effective login credentials (override wins if supplied)
            $authEmail    = $data['login_email']    ?? $data['email'];
            $authPassword = $data['login_password'] ?? $data['password'];

            $user = User::create([
                'name'             => $data['name'],
                'email'            => $authEmail,
                'phone'            => $phone,
                'telegram_chat_id' => $data['telegram_chat_id'] ?? null,
                'password'         => $authPassword,
                'password_set_at'  => now(),
                'user_type'        => 'coach',
                'is_active'        => true,
            ]);

            $this->syncRoleAndPermissions($user, $data['role'], $data['permissions'] ?? null);

            $coach = Coach::create([
                'user_id'        => $user->id,
                'login_email'    => $data['login_email'] ?? null,
                'login_password' => isset($data['login_password']) ? Hash::make($data['login_password']) : null,
                'status'         => 'active',
                'role'           => $data['role'],
            ]);

            return response()->json($this->format($coach->load('user.roles')), 201);
        });
    }

    /**
     * GET /api/admin/coaches/{coach}
     */
    public function show(Coach $coach)
    {
        return response()->json($this->format($coach->load('user.roles')));
    }

    /**
     * PUT /api/admin/coaches/{coach}
     */
    public function update(Request $request, Coach $coach)
    {
        $data = $request->validate([
            'name'            => 'sometimes|string|max:255',
            'phone'           => 'nullable|string|max:20',
            'telegram_chat_id'=> 'nullable|string|max:100',
            'status'          => 'sometimes|in:active,inactive',
            'is_active'       => 'sometimes|boolean',
            'role'            => 'sometimes|string|exists:roles,name',
            'permissions'     => 'nullable|array',
            'permissions.*'   => 'string|exists:permissions,name',
            'login_email'     => 'nullable|email|unique:users,email,' . $coach->user_id . '|unique:coaches,login_email,' . $coach->id,
            'login_password'  => 'nullable|string|min:8',
        ]);

        return DB::transaction(function () use ($data, $coach) {
            // Update coach profile status
            $coachUpdates = array_filter([
                'status'       => $data['status'] ?? null,
                'login_email'  => array_key_exists('login_email', $data) ? $data['login_email'] : null,
                'login_password' => isset($data['login_password']) ? Hash::make($data['login_password']) : null,
            ], fn($v) => $v !== null);

            if (! empty($coachUpdates)) {
                $coach->update($coachUpdates);
            }

            if ($coach->user) {
                $userUpdates = [];

                if (isset($data['name']))             $userUpdates['name']             = $data['name'];
                if (array_key_exists('phone', $data)) {
                    $normalizedPhone = User::normalizePhone($data['phone']);
                    if ($normalizedPhone && User::where('phone', $normalizedPhone)->where('id', '!=', $coach->user_id)->exists()) {
                        throw ValidationException::withMessages(['phone' => ['A user with this phone number already exists.']]);
                    }
                    $userUpdates['phone'] = $normalizedPhone;
                }
                if (isset($data['telegram_chat_id'])) $userUpdates['telegram_chat_id'] = $data['telegram_chat_id'];
                if (isset($data['is_active']))         $userUpdates['is_active']        = $data['is_active'];

                // Override login credentials on the users record if supplied
                if (isset($data['login_email']))    $userUpdates['email']    = $data['login_email'];
                if (isset($data['login_password'])) $userUpdates['password'] = $data['login_password'];

                if (! empty($userUpdates)) {
                    $coach->user->update($userUpdates);
                }

                $newRole = $data['role'] ?? null;
                $desiredPerms = array_key_exists('permissions', $data) ? ($data['permissions'] ?? []) : null;

                if ($newRole || $desiredPerms !== null) {
                    $roleName = $newRole ?? ($coach->role ?? $coach->user->roles->first()?->name);
                    $this->syncRoleAndPermissions($coach->user, $roleName, $desiredPerms);
                    if ($newRole) {
                        $coach->update(['role' => $newRole]);
                    }
                }
            }

            return response()->json($this->format($coach->fresh('user.roles')));
        });
    }

    /**
     * DELETE /api/admin/coaches/{coach}
     * Deactivates the coach and their user account (soft-disable, not hard-delete).
     */
    public function destroy(Coach $coach)
    {
        $coach->update(['status' => 'inactive']);
        $coach->user?->update(['is_active' => false]);

        return response()->json(['message' => 'Coach deactivated successfully.']);
    }

    // ── Private ───────────────────────────────────────────────

    /**
     * Sync a user's role and direct permissions, correctly handling revocations.
     *
     * In Spatie, role permissions cannot be revoked per-user — the only way to deny
     * a role permission for a specific user is to remove the role and grant all desired
     * permissions directly. This method handles that transparently:
     *   - No revocations → keep role, sync only the extra direct permissions.
     *   - Revocations present → remove role, grant the full desired set directly.
     *     The role name is still stored in coaches.role for display purposes.
     */
    private function syncRoleAndPermissions(User $user, ?string $roleName, ?array $desiredPerms): void
    {
        if ($roleName) {
            $role     = Role::where('name', $roleName)->with('permissions')->first();
            $rolePerms = $role ? $role->permissions->pluck('name') : collect();
        } else {
            $rolePerms = collect();
        }

        if ($desiredPerms === null) {
            // No permission change requested — just sync the role.
            if ($roleName) $user->syncRoles([$roleName]);
            return;
        }

        $desired = collect($desiredPerms);
        $revoked = $roleName ? $rolePerms->diff($desired) : collect();

        if ($revoked->isNotEmpty()) {
            // Some role permissions were intentionally unchecked.
            // Remove the Spatie role so those permissions no longer apply,
            // then grant the full desired set as direct permissions.
            $user->syncRoles([]);
            $user->syncPermissions($desired->toArray());
        } else {
            // No revocations — assign role normally and only add extras directly.
            if ($roleName) $user->syncRoles([$roleName]);
            $extras = $desired->diff($rolePerms);
            $user->syncPermissions($extras->toArray());
        }
    }

    private function format(Coach $coach): array
    {
        $user = $coach->user;

        $spatieRole      = $user?->roles->first();
        // Prefer the Spatie-assigned role; fall back to the stored display role
        // (used when role was removed to allow per-user permission revocations).
        $displayRoleName = $spatieRole?->name ?? $coach->role;

        // Load the role's full permission set from the DB for display purposes.
        $roleForDisplay = $displayRoleName
            ? Role::where('name', $displayRoleName)->with('permissions')->first()
            : null;
        $allRolePerms = $roleForDisplay ? $roleForDisplay->permissions->pluck('name') : collect();

        $directPerms = $user?->getDirectPermissions()->pluck('name') ?? collect();

        // "role_permissions" = what the user effectively has from the role.
        // When the Spatie role is assigned: all role perms apply.
        // When the role was removed (revocation mode): only the ones still in direct perms.
        $effectiveRolePerms = $spatieRole
            ? $allRolePerms
            : $allRolePerms->intersect($directPerms);

        // "extra_permissions" = direct perms beyond what the role grants.
        $extraPerms = $directPerms->diff($allRolePerms);

        return [
            'id'                 => $coach->id,
            'user_id'            => $coach->user_id,
            'name'               => $user?->name,
            'email'              => $user?->email,
            'phone'              => $user?->phone,
            'telegram_chat_id'   => $user?->telegram_chat_id,
            'status'             => $coach->status,
            'has_login_override' => ! is_null($coach->login_email),
            'role'               => $displayRoleName,
            'role_permissions'   => $effectiveRolePerms->values(),
            'extra_permissions'  => $extraPerms->values(),
            'is_active'          => $user?->is_active ?? false,
            'affiliate_code'     => $user?->affiliate_code,
            'affiliate_balance'  => $user?->affiliate_balance,
        ];
    }
}
