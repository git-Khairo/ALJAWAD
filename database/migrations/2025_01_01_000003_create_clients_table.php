<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('clients', function (Blueprint $table) {
            $table->id();

            // Every client/lead must have a user record — the user row holds
            // all identity data (name, email, phone, telegram_chat_id).
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // CRM classification
            // lead   = prospect, not yet a paying client
            // client = has registered / paid for at least one course
            $table->enum('type', ['lead', 'client'])->default('lead');

            // active / inactive applies once they become a client
            $table->enum('status', ['active', 'inactive'])->nullable();

            // Lead pipeline stage (new → contacted → interested → qualified → converted)
            $table->string('lead_status')->nullable();

            // How they found us
            $table->string('source')->nullable();

            // Taxonomy tags (VIP, Forex, Crypto, …)
            $table->json('tags')->nullable();

            $table->timestamp('last_contact')->nullable();
            $table->unsignedInteger('courses_count')->default(0);

            // Stamped when lead is converted to a paying client
            $table->timestamp('converted_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('clients');
    }
};
