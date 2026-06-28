<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Functional access duration (in days) granted when a plan request is
     * approved / access is granted via the bot. Defaults follow the levels:
     * L1 = 30, L2 = 60, L3 = 90.
     */
    public function up(): void
    {
        Schema::table('course_plans', function (Blueprint $table) {
            $table->unsignedInteger('access_days')->default(30)->after('access_en');
        });

        // Backfill existing rows by sort order (no-op on a fresh database).
        DB::table('course_plans')->where('sort_order', '<=', 1)->update(['access_days' => 30]);
        DB::table('course_plans')->where('sort_order', 2)->update(['access_days' => 60]);
        DB::table('course_plans')->where('sort_order', '>=', 3)->update(['access_days' => 90]);
    }

    public function down(): void
    {
        Schema::table('course_plans', function (Blueprint $table) {
            $table->dropColumn('access_days');
        });
    }
};
