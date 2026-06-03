<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->json('tags')->nullable()->after('notes');
            $table->string('telegram_chat_id')->nullable()->after('tags');
            $table->string('lead_status')->nullable()->after('telegram_chat_id');
            $table->timestamp('last_contact')->nullable()->after('lead_status');
            $table->unsignedInteger('courses_count')->default(0)->after('last_contact');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['tags', 'telegram_chat_id', 'lead_status', 'last_contact', 'courses_count']);
        });
    }
};
