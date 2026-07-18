<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The broker an IB (affiliate) operates under. Null for non-IBs and for the
     * company/head IB (the root of the tree). An IB's parent must sit on the
     * same broker — enforced in the application layer, not the schema.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('broker_id')->nullable()->after('affiliate_balance')
                ->constrained('brokers')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('broker_id');
        });
    }
};
