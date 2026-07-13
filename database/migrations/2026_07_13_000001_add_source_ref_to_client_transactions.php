<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * External reference for rows brought in from another system (e.g. the
     * historical Google-Sheet import). Lets the importer run idempotently
     * (updateOrCreate on source_ref) and keeps a trail back to the origin ID.
     */
    public function up(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->string('source_ref')->nullable()->after('notes')->index();
        });
    }

    public function down(): void
    {
        Schema::table('client_transactions', function (Blueprint $table) {
            $table->dropColumn('source_ref');
        });
    }
};
