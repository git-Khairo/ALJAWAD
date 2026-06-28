<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Link a transaction to a CRM client so a completed deposit can
     * auto-activate them. Nullable: external/unmatched entries keep using
     * the free-text client_name only.
     */
    public function up(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->foreignId('client_id')
                ->nullable()
                ->after('client_name')
                ->constrained('clients')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('client_id');
        });
    }
};
