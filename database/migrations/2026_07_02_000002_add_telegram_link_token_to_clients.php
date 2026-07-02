<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Stable opaque token used only for the Telegram `?start=link_<token>` deep
     * link, so pressing START in the bot can auto-link the client's chat id.
     */
    public function up(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->string('telegram_link_token')->nullable()->unique()->after('activated_at');
        });
    }

    public function down(): void
    {
        Schema::table('clients', function (Blueprint $table) {
            $table->dropColumn('telegram_link_token');
        });
    }
};
