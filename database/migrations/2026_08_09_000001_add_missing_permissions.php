<?php

use Illuminate\Database\Migrations\Migration;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

/**
 * Adds permission rows that were introduced in RolesAndPermissionsSeeder after
 * the database was last seeded.
 *
 * This exists because RolesAndPermissionsSeeder must NOT be re-run on a live
 * database: it calls syncPermissions() on every role, which would wipe any
 * role/coach permissions customised through the admin UI. This migration is
 * purely additive — it creates missing permissions and grants them to the admin
 * role, and never revokes anything from anyone.
 */
return new class extends Migration
{
    /** Permissions the app checks for but which may not exist in the DB yet. */
    private const PERMISSIONS = [
        'view client requests',
        'review client requests',
    ];

    public function up(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $name) {
            Permission::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // The admin role is meant to hold every permission. givePermissionTo()
        // only adds, so existing admin permissions are left untouched.
        $admin = Role::where('name', 'admin')->where('guard_name', 'web')->first();
        if ($admin) {
            $admin->givePermissionTo(self::PERMISSIONS);
        }

        app()[PermissionRegistrar::class]->forgetCachedPermissions();
    }

    public function down(): void
    {
        // Intentionally a no-op: dropping these permission rows would cascade
        // and delete grants that may have been assigned to real users.
    }
};
