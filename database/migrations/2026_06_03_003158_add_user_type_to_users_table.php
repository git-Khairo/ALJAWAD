<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // 'client' = website user (lead or active/inactive client)
            // 'coach'  = internal staff member with a role
            $table->enum('user_type', ['client', 'coach'])->default('client')->after('email');
            $table->string('phone', 20)->nullable()->after('name');
            $table->boolean('is_active')->default(true)->after('user_type');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['user_type', 'phone', 'is_active']);
        });
    }
};
