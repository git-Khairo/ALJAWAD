<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Leads are non-account contacts, usually captured with just a name and a
     * phone number, so email has to be optional. Phone remains the login identity.
     *
     * The unique index is kept — MySQL allows any number of NULLs in a unique
     * index, so email stays unique among the users that actually have one.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });
    }

    public function down(): void
    {
        // Fails if any user has a null email — clear those rows before rolling back.
        Schema::table('users', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
        });
    }
};
