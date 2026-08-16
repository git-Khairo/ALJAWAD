<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Wallet;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

/**
 * Invariants for the multi-wallet setup.
 *
 * The important ones are structural rather than cosmetic: exactly one main
 * wallet at all times, one company-wide exchange rate, and both currencies
 * living on every wallet.
 */
class WalletTest extends TestCase
{
    use RefreshDatabase;

    private function make(string $en, string $ar, float $usd = 0, float $syp = 0): Wallet
    {
        return Wallet::create([
            'key'     => Wallet::makeKey($en),
            'name_en' => $en,
            'name_ar' => $ar,
            'usd'     => $usd,
            'syp'     => $syp,
        ]);
    }

    public function test_every_wallet_holds_both_currencies(): void
    {
        $w = $this->make('Damascus desk', 'مكتب دمشق', usd: 1000, syp: 5_000_000);

        $this->assertSame(1000.0, $w->balanceIn('USD'));
        $this->assertSame(5_000_000.0, $w->balanceIn('SYP'));
    }

    /**
     * The migration seeds the main wallet, so a freshly migrated database
     * already has exactly one. main() must return that one rather than
     * creating a second.
     */
    public function test_migration_seeds_exactly_one_main_wallet(): void
    {
        $this->assertSame(1, Wallet::count());
        $this->assertSame(1, Wallet::where('is_main', true)->count());

        $main = Wallet::main();

        $this->assertTrue($main->is_main);
        $this->assertSame(1, Wallet::count(), 'main() must not create a duplicate');
    }

    public function test_main_wallet_is_created_when_the_table_is_empty(): void
    {
        Wallet::query()->delete();
        $this->assertSame(0, Wallet::count());

        $main = Wallet::main();

        $this->assertTrue($main->is_main);
        $this->assertSame(1, Wallet::count());
    }

    public function test_exactly_one_wallet_is_main_after_promotion(): void
    {
        $a = Wallet::main();
        $b = $this->make('Tartus branch', 'فرع طرطوس');

        $b->makeMain();

        $this->assertSame(1, Wallet::where('is_main', true)->count());
        $this->assertSame($b->id, Wallet::main()->id);
    }

    /**
     * Regression: makeMain() used to promote via a model save, which goes
     * through dirty-checking. Promoting back using an instance loaded while
     * that wallet was still main issued no UPDATE, so the demote-everything
     * step landed and the promote step did not, leaving no main wallet at all.
     */
    public function test_promoting_back_using_a_stale_instance_still_leaves_one_main(): void
    {
        $a = Wallet::main();          // loaded while `a` is main
        $b = $this->make('Tartus branch', 'فرع طرطوس');

        $b->makeMain();
        $a->makeMain();               // `a->is_main` is still true in memory

        $this->assertSame(1, Wallet::where('is_main', true)->count());
        $this->assertSame($a->id, Wallet::main()->id);
    }

    public function test_wallet_keys_are_unique_for_duplicate_names(): void
    {
        $first  = $this->make('Tartus branch', 'فرع طرطوس');
        $second = $this->make('Tartus branch', 'فرع طرطوس ٢');

        $this->assertSame('tartus-branch', $first->key);
        $this->assertSame('tartus-branch-2', $second->key);
    }

    public function test_exchange_rate_is_company_wide_not_per_wallet(): void
    {
        $a = Wallet::main();
        $b = $this->make('Tartus branch', 'فرع طرطوس');

        Wallet::setRate(16_000);

        $this->assertFalse(Schema::hasColumn('wallets', 'rate'));
        $this->assertEqualsWithDelta(16_000, $a->fresh()->rate, 0.001);
        $this->assertEqualsWithDelta(16_000, $b->fresh()->rate, 0.001);
        $this->assertEqualsWithDelta(16_000, (float) Setting::get('fx_rate'), 0.001);
    }

    public function test_total_usd_blends_both_currencies_at_the_company_rate(): void
    {
        Wallet::setRate(15_750);
        $w = $this->make('Damascus desk', 'مكتب دمشق', usd: 32_000, syp: 18_500_000);

        $this->assertEqualsWithDelta(32_000 + (18_500_000 / 15_750), $w->totalUsd(), 0.01);
    }

    public function test_changing_the_rate_does_not_move_any_balance(): void
    {
        $w = $this->make('Damascus desk', 'مكتب دمشق', usd: 32_000, syp: 18_500_000);

        Wallet::setRate(20_000);

        $this->assertSame(32_000.0, $w->fresh()->usd);
        $this->assertSame(18_500_000.0, $w->fresh()->syp);
    }
}
