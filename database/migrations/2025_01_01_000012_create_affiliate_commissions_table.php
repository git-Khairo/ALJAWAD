<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('affiliate_commissions', function (Blueprint $table) {
            $table->id();

            // The user who referred the registrant and earns this commission.
            // Any user can be an affiliate (coaches, clients, leads).
            $table->foreignId('referrer_user_id')->constrained('users')->cascadeOnDelete();

            $table->foreignId('registration_id')->constrained('registrations')->cascadeOnDelete();
            $table->decimal('amount', 10, 2);
            $table->decimal('percentage', 5, 2)->nullable();
            $table->enum('status', ['pending', 'paid', 'cancelled'])->default('pending');
            $table->date('paid_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('affiliate_commissions');
    }
};
