<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('course_access_grants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_plan_id')->constrained('course_plans')->cascadeOnDelete();
            // Telegram user ID — the primary key used by the bot
            $table->string('telegram_chat_id');
            // Link back to our users table if the telegram_chat_id matches a known user
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('bot_plan');  // beginner | intermediate | expert
            $table->timestamp('granted_at')->useCurrent();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('revoked_at')->nullable();
            $table->enum('status', ['active', 'expired', 'revoked'])->default('active');
            $table->json('invite_links')->nullable(); // [{channel, link}] returned by bot
            $table->timestamps();
            $table->unique(['course_plan_id', 'telegram_chat_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('course_access_grants');
    }
};
