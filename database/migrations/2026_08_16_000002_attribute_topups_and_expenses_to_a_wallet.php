<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Once money can sit in more than one wallet, every movement has to say which
 * wallet it moved. Without this, deleting or editing a top-up cannot know
 * which balance to rewind.
 *
 * Existing rows are backfilled to the main wallet, which is where that money
 * actually was, so no history is orphaned and the balances stay reconcilable.
 *
 * The column is nullable with `nullOnDelete` rather than cascading: deleting a
 * wallet must never silently delete its financial history.
 */
return new class extends Migration
{
    public function up(): void
    {
        $mainId = DB::table('wallets')->where('is_main', true)->value('id')
            ?? DB::table('wallets')->orderBy('id')->value('id');

        foreach (['wallet_topups', 'expenses'] as $table) {
            if (Schema::hasColumn($table, 'wallet_id')) {
                continue;
            }

            Schema::table($table, function (Blueprint $t) {
                $t->foreignId('wallet_id')->nullable()->after('id')
                    ->constrained('wallets')->nullOnDelete();
            });

            if ($mainId) {
                DB::table($table)->whereNull('wallet_id')->update(['wallet_id' => $mainId]);
            }
        }
    }

    public function down(): void
    {
        foreach (['wallet_topups', 'expenses'] as $table) {
            if (! Schema::hasColumn($table, 'wallet_id')) {
                continue;
            }
            Schema::table($table, function (Blueprint $t) {
                $t->dropConstrainedForeignId('wallet_id');
            });
        }
    }
};
