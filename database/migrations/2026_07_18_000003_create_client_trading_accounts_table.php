<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * A client's trading-account number / user ID at a broker. A client may hold
     * at most one account per broker (up to the number of brokers we work with).
     */
    public function up(): void
    {
        Schema::create('client_trading_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('clients')->cascadeOnDelete();
            $table->foreignId('broker_id')->constrained('brokers')->cascadeOnDelete();
            $table->string('account_number');
            $table->timestamps();

            $table->unique(['client_id', 'broker_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_trading_accounts');
    }
};
