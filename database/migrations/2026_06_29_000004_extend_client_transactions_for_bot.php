<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Align client_transactions with the bot: add commission + place, and widen
     * the direction/type/currency enums to plain strings so the allowed values
     * are driven by config/transactions.php (direction now also wallet_charge /
     * close_debt; type/method now cash/usdt/sham_cash; currency is USD-only).
     */
    public function up(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->decimal('commission', 15, 2)->nullable()->after('amount');
            $table->string('place')->nullable()->after('commission');
        });

        // sqlite stores enums as TEXT (no constraint), so this only matters on MySQL.
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE client_transactions MODIFY direction VARCHAR(20) NOT NULL DEFAULT 'deposit'");
            DB::statement("ALTER TABLE client_transactions MODIFY type VARCHAR(20) NOT NULL DEFAULT 'cash'");
            DB::statement("ALTER TABLE client_transactions MODIFY currency VARCHAR(10) NOT NULL DEFAULT 'USD'");
        }
    }

    public function down(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->dropColumn(['commission', 'place']);
        });
    }
};
