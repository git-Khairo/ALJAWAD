<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Collapse the overlapping type / status flags into a single ordered
     * lifecycle stage: lead → client_inactive → client_active.
     * "student" is derived (an active client with an active course grant), not stored.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('stage', ['lead', 'client_inactive', 'client_active'])
                ->default('lead')
                ->after('user_id');
            $table->timestamp('activated_at')->nullable()->after('converted_at');
        });

        // Backfill from the legacy columns (no-op on a fresh database).
        DB::statement("
            UPDATE clients SET stage = CASE
                WHEN type = 'lead'                          THEN 'lead'
                WHEN type = 'client' AND status = 'active'  THEN 'client_active'
                ELSE 'client_inactive'
            END
        ");
        DB::statement("
            UPDATE clients SET activated_at = COALESCE(converted_at, updated_at)
            WHERE stage = 'client_active'
        ");

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['type', 'status', 'courses_count']);
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->enum('type', ['lead', 'client'])->default('lead')->after('user_id');
            $table->enum('status', ['active', 'inactive'])->nullable()->after('type');
            $table->unsignedInteger('courses_count')->default(0);
        });

        DB::statement("
            UPDATE clients SET
                type   = CASE WHEN stage = 'lead' THEN 'lead' ELSE 'client' END,
                status = CASE
                    WHEN stage = 'client_active'   THEN 'active'
                    WHEN stage = 'client_inactive' THEN 'inactive'
                    ELSE NULL
                END
        ");

        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn(['stage', 'activated_at']);
        });
    }
};
