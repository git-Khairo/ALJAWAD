<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Permissions ───────────────────────────────────────

        $permissions = [
            // Dashboard
            'view dashboard',

            // CRM — clients & leads
            'view clients',
            'create clients',
            'edit clients',
            'delete clients',
            'convert leads',
            'view leads',
            'create leads',
            'edit leads',
            'delete leads',

            // Coach / user accounts
            'view users',
            'create users',
            'edit users',
            'delete users',
            'manage users',

            // Support
            'view support tickets',
            'manage support tickets',

            // Finance
            'view finance',
            'manage invoices',
            'manage transactions',
            'view revenue',

            // Marketing
            'view marketing',
            'manage campaigns',
            'manage email marketing',
            'manage social media',

            // Analytics & Reports
            'view analytics',
            'view reports',

            // Content
            'manage blog',
            'manage media',

            // Scheduling
            'view scheduling',
            'manage scheduling',
            'manage appointments',

            // Notifications & Messages
            'view notifications',
            'manage notifications',
            'view messages',
            'manage messages',

            // Self-service profile (all roles) — coach profile, own transactions, journal, notifications
            'view profile',

            // Settings (admin-only)
            'view settings',
            'manage settings',
            'manage security',
            'manage appearance',
            'manage integrations',

            // Roles management (admin-only)
            'manage roles',

            // Courses
            'manage courses',

            // Affiliate program
            'view affiliates',
            'manage affiliates',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Roles (coaches only — clients/leads have no role) ─

        /** Admin — full access. */
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        /** Coach — scheduling, courses, own KPI. */
        $coach = Role::firstOrCreate(['name' => 'coach', 'guard_name' => 'web']);
        $coach->syncPermissions([
            'view dashboard',
            'view profile',
            'view scheduling', 'manage scheduling', 'manage appointments',
            'manage courses',
            'view notifications',
        ]);

        /** Account Manager — CRM, finance, scheduling. */
        $accountManager = Role::firstOrCreate(['name' => 'account_manager', 'guard_name' => 'web']);
        $accountManager->syncPermissions([
            'view dashboard',
            'view profile',
            'view clients', 'create clients', 'edit clients',
            'view leads', 'create leads', 'edit leads', 'convert leads',
            'view finance', 'manage invoices', 'manage transactions',
            'view scheduling', 'manage scheduling', 'manage appointments',
            'view notifications',
            'view messages', 'manage messages',
            'view support tickets', 'manage support tickets',
            'view affiliates',
        ]);

        /** Marketer — campaigns, social, leads intake. */
        $marketer = Role::firstOrCreate(['name' => 'marketer', 'guard_name' => 'web']);
        $marketer->syncPermissions([
            'view dashboard',
            'view profile',
            'view leads', 'create leads', 'edit leads',
            'view marketing', 'manage campaigns', 'manage email marketing', 'manage social media',
            'view analytics',
            'manage blog', 'manage media',
            'view notifications',
        ]);

        /** Customer Support — tickets, messages, client view. */
        $support = Role::firstOrCreate(['name' => 'customer_support', 'guard_name' => 'web']);
        $support->syncPermissions([
            'view dashboard',
            'view profile',
            'view clients',
            'view leads',
            'view support tickets', 'manage support tickets',
            'view messages', 'manage messages',
            'view notifications',
        ]);

        /** Analyst — read-only analytics, reports, finance overview. */
        $analyst = Role::firstOrCreate(['name' => 'analyst', 'guard_name' => 'web']);
        $analyst->syncPermissions([
            'view dashboard',
            'view profile',
            'view analytics',
            'view reports',
            'view finance', 'view revenue',
            'view clients',
            'view leads',
            'view notifications',
            'view affiliates',
        ]);
    }
}
