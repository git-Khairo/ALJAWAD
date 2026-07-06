<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('coaches', function (Blueprint $table) {
            // Stores the intended display role even when the Spatie role is removed
            // (e.g. when individual role permissions are revoked for this coach).
            $table->string('role')->nullable()->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('coaches', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};
