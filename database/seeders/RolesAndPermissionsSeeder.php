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
            // ── Overview ─────────────────────────────────────
            'view dashboard',
            'view performance',
            'view reports',
            'view activity log',

            // ── CRM — Clients ─────────────────────────────────
            'view clients',
            'create clients',
            'edit clients',
            'delete clients',
            'generate client code',
            'request csat rating',

            // ── CRM — Leads ───────────────────────────────────
            'view leads',
            'create leads',
            'edit leads',
            'delete leads',
            'convert leads',

            // ── CRM — Support Tickets ─────────────────────────
            'view support tickets',
            'edit support tickets',
            'delete support tickets',

            // ── CRM — CSAT ────────────────────────────────────
            'view csat',
            'delete csat',

            // ── CRM — Messages ────────────────────────────────
            'view messages',
            'create messages',
            'delete messages',

            // ── Finance ───────────────────────────────────────
            'view finance',
            'view expenses',
            'create expenses',
            'delete expenses',
            'view transactions',
            'create transactions',
            'edit transactions',
            'delete transactions',
            'view wallets',
            'edit wallets',

            // ── Marketing — Campaigns ─────────────────────────
            'view campaigns',
            'create campaigns',
            'edit campaigns',
            'delete campaigns',

            // ── Marketing — Content Plans ─────────────────────
            'view content plans',
            'create content plans',
            'edit content plans',
            'delete content plans',

            // ── Marketing — Telegram Notifications ───────────
            'view telegram notifications',
            'create telegram notifications',

            // ── Marketing — Social Media ──────────────────────
            'view social media',
            'create social media',
            'edit social media',
            'delete social media',

            // ── Content — Blog ────────────────────────────────
            'view blog',
            'create blog',
            'edit blog',
            'delete blog',

            // ── Content — Courses ─────────────────────────────
            'view courses',
            'create courses',
            'edit courses',
            'delete courses',
            'approve course requests',

            // ── Content — Content Creation ────────────────────
            'view content',
            'create content',
            'edit content',
            'delete content',

            // ── Content — Media Library ───────────────────────
            'view media library',
            'create media library',
            'edit media library',
            'delete media library',

            // ── Scheduling — Calendar ─────────────────────────
            'view scheduling',
            'create scheduling',
            'edit scheduling',
            'delete scheduling',

            // ── Scheduling — Appointments ─────────────────────
            'view appointments',
            'create appointments',
            'edit appointments',
            'delete appointments',

            // ── Notifications (own bell) ──────────────────────
            'view notifications',

            // ── Settings ──────────────────────────────────────
            'view settings',
            'edit settings',

            // ── Settings — Coaches / Users ────────────────────
            'view users',
            'create users',
            'edit users',
            'delete users',

            // ── Settings — Roles ──────────────────────────────
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // ── Roles ─────────────────────────────────────────────

        /** Admin — full access to everything. */
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $admin->syncPermissions(Permission::all());

        /** Coach — scheduling, own appointments, courses view, own notifications. */
        $coach = Role::firstOrCreate(['name' => 'coach', 'guard_name' => 'web']);
        $coach->syncPermissions([
            'view dashboard',
            'view scheduling', 'create scheduling', 'edit scheduling', 'delete scheduling',
            'view appointments', 'create appointments', 'edit appointments',
            'view courses',
            'view notifications',
        ]);

        /** Account Manager — CRM write, finance write, scheduling, messages, support. */
        $accountManager = Role::firstOrCreate(['name' => 'account_manager', 'guard_name' => 'web']);
        $accountManager->syncPermissions([
            'view dashboard',
            'view clients', 'create clients', 'edit clients',
            'view leads', 'create leads', 'edit leads', 'convert leads',
            'generate client code', 'request csat rating',
            'view finance',
            'view expenses',
            'view transactions', 'create transactions', 'edit transactions',
            'view wallets',
            'view scheduling', 'view appointments', 'create appointments', 'edit appointments',
            'view notifications',
            'view messages', 'create messages',
            'view support tickets', 'edit support tickets',
            'view csat', 'delete csat',
        ]);

        /** Marketer — campaigns, content plans, social media, blog, content, notifications. */
        $marketer = Role::firstOrCreate(['name' => 'marketer', 'guard_name' => 'web']);
        $marketer->syncPermissions([
            'view dashboard',
            'view performance',
            'view leads', 'create leads', 'edit leads',
            'view campaigns', 'create campaigns', 'edit campaigns', 'delete campaigns',
            'view content plans', 'create content plans', 'edit content plans', 'delete content plans',
            'view telegram notifications', 'create telegram notifications',
            'view social media', 'create social media', 'edit social media', 'delete social media',
            'view blog', 'create blog', 'edit blog', 'delete blog',
            'view content', 'create content', 'edit content', 'delete content',
            'view media library', 'create media library', 'edit media library', 'delete media library',
            'view notifications',
        ]);

        /** Customer Support — tickets, messages, client/lead view, CSAT. */
        $support = Role::firstOrCreate(['name' => 'customer_support', 'guard_name' => 'web']);
        $support->syncPermissions([
            'view dashboard',
            'view clients',
            'view leads',
            'view support tickets', 'edit support tickets', 'delete support tickets',
            'view messages', 'create messages', 'delete messages',
            'view notifications',
            'view csat', 'delete csat',
            'generate client code', 'request csat rating',
        ]);

        /** Analyst — read-only: finance, clients, leads, reports, performance, CSAT. */
        $analyst = Role::firstOrCreate(['name' => 'analyst', 'guard_name' => 'web']);
        $analyst->syncPermissions([
            'view dashboard',
            'view performance',
            'view reports',
            'view activity log',
            'view finance',
            'view expenses',
            'view transactions',
            'view wallets',
            'view clients',
            'view leads',
            'view notifications',
            'view csat',
            'view campaigns',
            'view content plans',
            'view blog',
        ]);
    }
}
