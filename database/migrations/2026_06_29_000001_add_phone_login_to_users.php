<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Phone is the unique login identity for clients. `password_set_at` marks
     * whether the account has a real (claimed) password — admin-created accounts
     * start null (placeholder password) and must be claimed via a one-time code.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('password_set_at')->nullable()->after('password');
            // Nullable unique: MySQL permits multiple NULLs, so leads without a
            // phone are fine; any stored phone must be unique (normalized).
            $table->unique('phone');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique(['phone']);
            $table->dropColumn('password_set_at');
        });
    }
};
