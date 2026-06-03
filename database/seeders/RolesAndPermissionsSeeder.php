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
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Define all permissions ────────────────────────────────────────
        $permissions = [
            // Dashboard / Overview
            'view dashboard',

            // Clients & Leads (CRM)
            'view clients',
            'create clients',
            'edit clients',
            'delete clients',
            'convert leads',
            'view leads',
            'create leads',
            'edit leads',
            'delete leads',

            // Users (coach accounts)
            'view users',
            'create users',
            'edit users',
            'delete users',

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
            'manage webinars',

            // Notifications & Messages
            'view notifications',
            'manage notifications',
            'view messages',
            'manage messages',

            // Settings (admin-only)
            'view settings',
            'manage settings',
            'manage security',
            'manage appearance',
            'manage integrations',

            // Roles management (admin-only)
            'manage roles',

            // Users management (admin-only)
            'manage users',

            // Courses management
            'manage courses',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Define roles and assign permissions ───────────────────────────

        /**
         * Admin — full access to everything.
         */
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        /**
         * Coach — access to scheduling, courses, and personal KPI.
         */
        $coach = Role::firstOrCreate(['name' => 'coach', 'guard_name' => 'web']);
        $coach->syncPermissions([
            'view dashboard',
            'view scheduling', 'manage scheduling', 'manage appointments',
            'manage courses',
            'view notifications',
        ]);

        /**
         * Client — basic portal access.
         */
        $client = Role::firstOrCreate(['name' => 'client', 'guard_name' => 'web']);
        $client->syncPermissions([
            'view notifications',
        ]);

        /**
         * Account Manager — focuses on clients, leads, finance, and scheduling.
         */
        $accountManager = Role::firstOrCreate(['name' => 'account_manager', 'guard_name' => 'web']);
        $accountManager->syncPermissions([
            'view dashboard',
            'view clients', 'create clients', 'edit clients',
            'view leads', 'create leads', 'edit leads', 'convert leads',
            'view finance', 'manage invoices', 'manage transactions',
            'view scheduling', 'manage scheduling', 'manage appointments',
            'view notifications',
            'view messages', 'manage messages',
            'view support tickets', 'manage support tickets',
        ]);

        /**
         * Marketer — campaigns, email, social media, leads intake.
         */
        $marketer = Role::firstOrCreate(['name' => 'marketer', 'guard_name' => 'web']);
        $marketer->syncPermissions([
            'view dashboard',
            'view leads', 'create leads', 'edit leads',
            'view marketing', 'manage campaigns', 'manage email marketing', 'manage social media',
            'view analytics',
            'manage blog', 'manage media',
            'view notifications',
        ]);

        /**
         * Customer Support — tickets, messages, client view.
         */
        $support = Role::firstOrCreate(['name' => 'customer_support', 'guard_name' => 'web']);
        $support->syncPermissions([
            'view dashboard',
            'view clients',
            'view leads',
            'view support tickets', 'manage support tickets',
            'view messages', 'manage messages',
            'view notifications',
        ]);

        /**
         * Analyst — read-only access to analytics, reports, finance overview.
         */
        $analyst = Role::firstOrCreate(['name' => 'analyst', 'guard_name' => 'web']);
        $analyst->syncPermissions([
            'view dashboard',
            'view analytics',
            'view reports',
            'view finance', 'view revenue',
            'view clients',
            'view leads',
            'view notifications',
        ]);
    }
}
