<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Top-ups are funded by a broker payout. Most come from one of the contracted
     * brokers; anything else is recorded free-text under "Other".
     */
    public function up(): void
    {
        Schema::table('wallet_topups', function (Blueprint $table) {
            $table->foreignId('broker_id')->nullable()->after('amount')->constrained('brokers')->nullOnDelete();
            $table->string('broker_other')->nullable()->after('broker_id');
        });
    }

    public function down(): void
    {
        Schema::table('wallet_topups', function (Blueprint $table) {
            $table->dropConstrainedForeignId('broker_id');
            $table->dropColumn('broker_other');
        });
    }
};
