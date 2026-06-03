<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use App\Models\Coach;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Role;

class CoachController extends Controller
{
    /**
     * GET /api/admin/coaches
     * List all coaches with their roles.
     */
    public function index()
    {
        $coaches = Coach::with('user.roles')->get()->map(fn($c) => $this->format($c));
        return response()->json($coaches);
    }

    /**
     * POST /api/admin/coaches
     * Create a new coach and their user account.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'             => 'required|string|max:255',
            'email'            => 'required|email|unique:users,email',
            'phone'            => 'nullable|string|max:20',
            'password'         => 'required|string|min:8',
            'specialization'   => 'nullable|string|max:255',
            'role'             => 'required|string|exists:roles,name',
            'extra_permissions'=> 'nullable|array',
            'extra_permissions.*' => 'string|exists:permissions,name',
        ]);

        return DB::transaction(function () use ($data) {
            $user = User::create([
                'name'      => $data['name'],
                'email'     => $data['email'],
                'phone'     => $data['phone'] ?? null,
                'password'  => $data['password'],
                'user_type' => 'coach',
                'is_active' => true,
            ]);
            $user->assignRole($data['role']);

            if (! empty($data['extra_permissions'])) {
                $user->givePermissionTo($data['extra_permissions']);
            }

            $coach = Coach::create([
                'user_id'        => $user->id,
                'name'           => $data['name'],
                'email'          => $data['email'],
                'phone'          => $data['phone'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'status'         => 'active',
            ]);

            return response()->json($this->format($coach->load('user.roles')), 201);
        });
    }

    /**
     * GET /api/admin/coaches/{id}
     */
    public function show(Coach $coach)
    {
        return response()->json($this->format($coach->load('user.roles')));
    }

    /**
     * PUT /api/admin/coaches/{id}
     * Update coach details and/or their role.
     */
    public function update(Request $request, Coach $coach)
    {
        $data = $request->validate([
            'name'             => 'sometimes|string|max:255',
            'phone'            => 'nullable|string|max:20',
            'specialization'   => 'nullable|string|max:255',
            'status'           => 'sometimes|in:active,inactive',
            'role'             => 'sometimes|string|exists:roles,name',
            'is_active'        => 'sometimes|boolean',
            'extra_permissions'=> 'nullable|array',
            'extra_permissions.*' => 'string|exists:permissions,name',
        ]);

        return DB::transaction(function () use ($data, $coach) {
            $coach->update(array_filter([
                'name'           => $data['name'] ?? null,
                'phone'          => $data['phone'] ?? null,
                'specialization' => $data['specialization'] ?? null,
                'status'         => $data['status'] ?? null,
            ]));

            if ($coach->user) {
                $userUpdates = array_filter([
                    'name'      => $data['name'] ?? null,
                    'phone'     => $data['phone'] ?? null,
                    'is_active' => isset($data['is_active']) ? $data['is_active'] : null,
                ], fn($v) => $v !== null);
                $coach->user->update($userUpdates);

                if (isset($data['role'])) {
                    $coach->user->syncRoles([$data['role']]);
                }

                // Sync direct (extra) permissions independently of the role.
                // array_key_exists distinguishes "not sent" from "sent as empty".
                if (array_key_exists('extra_permissions', $data)) {
                    $coach->user->syncPermissions($data['extra_permissions'] ?? []);
                }
            }

            return response()->json($this->format($coach->fresh('user.roles')));
        });
    }

    /**
     * DELETE /api/admin/coaches/{id}
     * Deactivate a coach (soft-disable their user account).
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
        $roleName   = $user?->getRoleNames()->first();
        $rolePerms  = $roleName
            ? \Spatie\Permission\Models\Role::findByName($roleName)->permissions->pluck('name')->values()
            : collect();

        return [
            'id'               => $coach->id,
            'name'             => $coach->name,
            'email'            => $coach->email,
            'phone'            => $coach->phone,
            'specialization'   => $coach->specialization,
            'status'           => $coach->status,
            'role'             => $roleName,
            'role_permissions' => $rolePerms,
            'extra_permissions'=> $user?->getDirectPermissions()->pluck('name')->values() ?? collect(),
            'is_active'        => $user?->is_active ?? false,
        ];
    }
}
