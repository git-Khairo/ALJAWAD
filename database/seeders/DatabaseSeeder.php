<?php

namespace Database\Seeders;

use App\Models\Coach;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles & permissions (must run first)
        $this->call(RolesAndPermissionsSeeder::class);

        // 2. KPI definitions
        $this->call(KpiDefinitionsSeeder::class);

        // 3. Default admin account
        $adminUser = User::firstOrCreate(
            ['email' => 'admin@aljawad.com'],
            [
                'name'      => 'Super Admin',
                'phone'     => null,
                'password'  => bcrypt('password'),
                'user_type' => 'coach',
                'is_active' => true,
            ]
        );
        $adminUser->assignRole('admin');

        Coach::firstOrCreate(
            ['user_id' => $adminUser->id],
            [
                'name'           => $adminUser->name,
                'email'          => $adminUser->email,
                'specialization' => 'Administration',
                'status'         => 'active',
            ]
        );

        // 4. Coaches
        $this->call(CoachesSeeder::class);

        // 5. Clients & Leads
        $this->call(ClientsAndLeadsSeeder::class);

        // 6. Courses
        $this->call(CoursesSeeder::class);

        // 7. Course Plans & Features
        $this->call(CoursePlansSeeder::class);

        // 8. Blog Posts
        $this->call(BlogPostsSeeder::class);

        // 9. Campaigns
        $this->call(CampaignsSeeder::class);

        // 10. Support Tickets
        $this->call(SupportTicketsSeeder::class);

        // 11. Appointments
        $this->call(AppointmentsSeeder::class);

        // 12. Webinars
        $this->call(WebinarsSeeder::class);

        // 13. Client Financial Transactions
        $this->call(ClientTransactionsSeeder::class);

        // 14. Expenses
        $this->call(ExpensesSeeder::class);

        // 15. Wallet
        $this->call(WalletSeeder::class);

        // 16. Marketing Plans & Media Library
        $this->call(MarketingPlansSeeder::class);
        $this->call(MediaLibrarySeeder::class);

        // 17. Notifications
        $this->call(NotificationsSeeder::class);
    }
}
