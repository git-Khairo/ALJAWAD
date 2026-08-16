<?php

use App\Models\Setting;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Turn the single hardcoded 'main' wallet into a set of named wallets, each
 * still holding both currencies, with exactly one flagged as the main one.
 *
 * The exchange rate moves out of the wallets table entirely. It is a
 * company-wide number, and once there is more than one wallet, a per-wallet
 * `rate` column is a drift bug waiting to happen: two wallets disagreeing
 * about what a dollar is worth would silently produce two different USD
 * totals for the same money. It lives in `settings` under `fx_rate`.
 *
 * Existing balances are preserved: the current row is relabelled as the main
 * wallet rather than replaced, so no money moves.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('wallets', function (Blueprint $table) {
            $table->string('name_ar')->nullable()->after('key');
            $table->string('name_en')->nullable()->after('name_ar');
            $table->boolean('is_main')->default(false)->after('name_en');
            // Archived wallets keep their history but cannot receive new money.
            $table->boolean('is_archived')->default(false)->after('is_main');
        });

        // Carry the existing rate into settings before the column goes.
        $existingRate = DB::table('wallets')->value('rate');
        if ($existingRate !== null && Setting::get('fx_rate') === null) {
            Setting::set('fx_rate', (float) $existingRate);
        }

        // Label whatever is already there as the main wallet. If the table is
        // empty (a fresh install), create it.
        $current = DB::table('wallets')->orderBy('id')->first();

        if ($current) {
            DB::table('wallets')->where('id', $current->id)->update([
                'name_ar'    => 'المحفظة الرئيسية',
                'name_en'    => 'Main wallet',
                'is_main'    => true,
                'updated_at' => now(),
            ]);

            // Any other pre-existing rows are demoted, so exactly one is main.
            DB::table('wallets')->where('id', '!=', $current->id)->update(['is_main' => false]);
        } else {
            DB::table('wallets')->insert([
                'key'        => 'main',
                'name_ar'    => 'المحفظة الرئيسية',
                'name_en'    => 'Main wallet',
                'is_main'    => true,
                'is_archived'=> false,
                'syp'        => 0,
                'usd'        => 0,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        if (Schema::hasColumn('wallets', 'rate')) {
            Schema::table('wallets', fn (Blueprint $table) => $table->dropColumn('rate'));
        }
    }

    public function down(): void
    {
        if (! Schema::hasColumn('wallets', 'rate')) {
            Schema::table('wallets', function (Blueprint $table) {
                $table->decimal('rate', 10, 2)->default(14200);
            });

            // Put the rate back on every row so the old code path still works.
            DB::table('wallets')->update(['rate' => (float) (Setting::get('fx_rate') ?? 14200)]);
        }

        Schema::table('wallets', function (Blueprint $table) {
            $table->dropColumn(['name_ar', 'name_en', 'is_main', 'is_archived']);
        });
    }
};
