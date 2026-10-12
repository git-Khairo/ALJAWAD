<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Give every existing top-up and expense an explicit wallet.
 *
 * Until now a null wallet_id was ambiguous. It usually meant "the main
 * wallet": the expense form's default "Main wallet" option saved null, and so
 * did the demo seeders. But since wallets became deletable it can also mean
 * "this wallet was deleted" (the column is nullOnDelete). The server used to
 * treat both as main, so editing or deleting a row from a deleted wallet
 * moved the main wallet's money for something that never touched it.
 *
 * From here on the controller always stores the resolved wallet, and a null
 * wallet_id means only one thing: deleted, so the row is locked. This
 * backfill puts the existing rows on that footing, the same way
 * 2026_08_16_000002 did when the column was introduced.
 *
 * The two cases cannot be told apart after the fact. Treating every existing
 * null as main matches how the server already settled these rows, so no
 * balance moves. The only rows it misattributes are top-ups and expenses
 * from a wallet that was later deleted. Those were rare (the UI could not top
 * up a non-main wallet before this release) and they keep the behaviour they
 * had before this release.
 */
return new class extends Migration
{
    public function up(): void
    {
        $mainId = DB::table('wallets')->where('is_main', true)->value('id')
            ?? DB::table('wallets')->orderBy('id')->value('id');

        if (! $mainId) {
            return;
        }

        foreach (['wallet_topups', 'expenses'] as $table) {
            DB::table($table)->whereNull('wallet_id')->update(['wallet_id' => $mainId]);
        }
    }

    public function down(): void
    {
        // Irreversible by nature: which rows were null is not recorded, and
        // un-attributing them would only bring the ambiguity back.
    }
};
