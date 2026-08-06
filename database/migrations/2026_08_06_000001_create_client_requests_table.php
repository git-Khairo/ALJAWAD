<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Sub-IBs can introduce clients of their own, but they don't get to write
     * into the CRM directly — each submission lands here as a pending request
     * that an admin approves or rejects from the Clients tab. On approval the
     * row is materialized into a real user + client under the requesting IB.
     */
    public function up(): void
    {
        Schema::create('client_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('requested_by_user_id')->constrained('users')->cascadeOnDelete();

            // Proposed client details (mirrors the CRM add-client form).
            $table->string('name');
            $table->string('phone')->nullable();
            $table->string('email')->nullable();
            $table->string('telegram_chat_id')->nullable();
            $table->foreignId('broker_id')->nullable()->constrained('brokers')->nullOnDelete();
            $table->string('account_number')->nullable();
            $table->string('source')->nullable();
            $table->text('note')->nullable();

            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by_user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();

            // Set once approved, so the request links to what it created.
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();

            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('client_requests');
    }
};
