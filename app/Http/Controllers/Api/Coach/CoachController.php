<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

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
     * POST /api/admin/coaches
     *
     * Creates a user account then a linked coach profile.
     * If login_email / login_password are supplied they override the primary
     * email/password on the users record (and are stored on coaches for reference).
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'                => 'required|string|max:255',
            'email'               => 'required|email|unique:users,email',
            'phone'               => 'nullable|string|max:20',
            'telegram_chat_id'    => 'nullable|string|max:100',
            'password'            => 'required|string|min:8',
            'role'                => 'required|string|exists:roles,name',
            'extra_permissions'   => 'nullable|array',
            'extra_permissions.*' => 'string|exists:permissions,name',
            // Optional override credentials stored on the coaches record
            'login_email'         => 'nullable|email|unique:users,email|unique:coaches,login_email',
            'login_password'      => 'nullable|string|min:8',
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

            $user->assignRole($data['role']);

            if (! empty($data['extra_permissions'])) {
                $user->givePermissionTo($data['extra_permissions']);
            }

            $coach = Coach::create([
                'user_id'        => $user->id,
                'login_email'    => $data['login_email'] ?? null,
                'login_password' => isset($data['login_password']) ? Hash::make($data['login_password']) : null,
                'status'         => 'active',
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
            'name'                => 'sometimes|string|max:255',
            'phone'               => 'nullable|string|max:20',
            'telegram_chat_id'    => 'nullable|string|max:100',
            'status'              => 'sometimes|in:active,inactive',
            'is_active'           => 'sometimes|boolean',
            'role'                => 'sometimes|string|exists:roles,name',
            'extra_permissions'   => 'nullable|array',
            'extra_permissions.*' => 'string|exists:permissions,name',
            'login_email'         => 'nullable|email|unique:users,email,' . $coach->user_id . '|unique:coaches,login_email,' . $coach->id,
            'login_password'      => 'nullable|string|min:8',
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

                if (isset($data['role'])) {
                    $coach->user->syncRoles([$data['role']]);
                }

                if (array_key_exists('extra_permissions', $data)) {
                    $coach->user->syncPermissions($data['extra_permissions'] ?? []);
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

    private function format(Coach $coach): array
    {
        $user = $coach->user;

        // Use the already-loaded role relationship rather than the static
        // Role::findByName($name) — the latter resolves the guard from the active
        // (sanctum) request and throws RoleDoesNotExist since roles live on "web".
        $role      = $user?->roles->first();
        $roleName  = $role?->name;
        $rolePerms = $role ? $role->permissions->pluck('name')->values() : collect();

        return [
            'id'               => $coach->id,
            'user_id'          => $coach->user_id,
            'name'             => $user?->name,
            'email'            => $user?->email,
            'phone'            => $user?->phone,
            'telegram_chat_id' => $user?->telegram_chat_id,
            'status'           => $coach->status,
            'has_login_override' => ! is_null($coach->login_email),
            'role'             => $roleName,
            'role_permissions' => $rolePerms,
            'extra_permissions'=> $user?->getDirectPermissions()->pluck('name')->values() ?? collect(),
            'is_active'        => $user?->is_active ?? false,
            'affiliate_code'   => $user?->affiliate_code,
            'affiliate_balance'=> $user?->affiliate_balance,
        ];
    }
}
