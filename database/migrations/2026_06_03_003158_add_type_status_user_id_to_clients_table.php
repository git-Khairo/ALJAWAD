<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            // lead   = prospect, not yet a paying client
            // client = has registered / paid for at least one course
            $table->enum('type', ['lead', 'client'])->default('lead')->after('id');

            // active / inactive applies once they become a client
            $table->enum('status', ['active', 'inactive'])->default('active')->after('type');

            // Optional link to users table for login access
            // Leads usually have no login; set when converting lead → client
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete()->after('status');

            // Source of the lead (manual, website form, referral, social, etc.)
            $table->string('source')->nullable()->after('user_id');

            // Notes / remarks for CRM
            $table->text('notes')->nullable()->after('source');

            // When they became a client (converted from lead)
            $table->timestamp('converted_at')->nullable()->after('notes');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn(['type', 'status', 'user_id', 'source', 'notes', 'converted_at']);
        });
    }
};
