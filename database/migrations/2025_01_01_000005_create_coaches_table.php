<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coaches', function (Blueprint $table) {
            $table->id();

            // Every coach profile must be linked to a user account.
            // All identity data (name, email, phone, telegram_chat_id) lives on users.
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            // Optional login-credential overrides.
            // When set, the controller syncs these to the linked users record so that
            // auth still goes through the users table, but the admin's chosen credentials
            // take effect. Stored here for reference and audit.
            $table->string('login_email')->nullable()->unique();
            $table->string('login_password')->nullable();

            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coaches');
    }
};
