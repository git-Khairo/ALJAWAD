<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('client_transactions', function (Blueprint $table) {
            $table->id();
            $table->string('client_name');
            $table->enum('type', ['cash', 'sham_cash', 'crypto', 'bank', 'wise'])->default('cash');
            $table->enum('direction', ['deposit', 'withdrawal'])->default('deposit');
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('USD');
            $table->enum('status', ['completed', 'pending', 'failed'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_transactions');
    }
};
