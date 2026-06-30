<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('marketing_plans', function (Blueprint $table) {
            // IDs of the campaigns linked to this monthly plan.
            $table->json('campaign_ids')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('marketing_plans', function (Blueprint $table) {
            $table->dropColumn('campaign_ids');
        });
    }
};
