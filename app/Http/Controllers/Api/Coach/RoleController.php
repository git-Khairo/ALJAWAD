<?php

namespace App\Http\Controllers\Api\Coach;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * GET /api/admin/roles
     * List all roles with their permissions.
     */
    public function index()
    {
        $roles = Role::with('permissions')->get()->map(fn($r) => [
            'id'          => $r->id,
            'name'        => $r->name,
            'permissions' => $r->permissions->pluck('name'),
        ]);

        return response()->json($roles);
    }

    /**
     * POST /api/admin/roles
     * Create a new role and assign permissions to it.
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:roles,name',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        if (! empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }

        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'permissions' => $role->permissions->pluck('name'),
        ], 201);
    }

    /**
     * PUT /api/admin/roles/{role}
     * Update a role's name and/or permissions.
     */
    public function update(Request $request, Role $role)
    {
        $data = $request->validate([
            'name'          => 'sometimes|string|unique:roles,name,' . $role->id,
            'permissions'   => 'nullable|array',
            'permissions.*' => 'string|exists:permissions,name',
        ]);

        if (isset($data['name'])) {
            $role->update(['name' => $data['name']]);
        }

        if (array_key_exists('permissions', $data)) {
            $role->syncPermissions($data['permissions'] ?? []);
        }

        return response()->json([
            'id'          => $role->id,
            'name'        => $role->name,
            'permissions' => $role->fresh('permissions')->permissions->pluck('name'),
        ]);
    }

    /**
     * DELETE /api/admin/roles/{role}
     * Delete a role (cannot delete 'admin').
     */
    public function destroy(Role $role)
    {
        if ($role->name === 'admin') {
            return response()->json(['message' => 'The admin role cannot be deleted.'], 403);
        }

        $role->delete();
        return response()->json(['message' => 'Role deleted successfully.']);
    }

    /**
     * GET /api/admin/permissions
     * List all available permissions.
     */
    public function permissions()
    {
        return response()->json(Permission::pluck('name'));
    }
}
