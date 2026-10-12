<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\FinanceController;
use App\Models\Expense;
use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletTopup;
use App\Models\WalletTransfer;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The transfer ledger and multi-wallet top-ups, through the HTTP API.
 *
 * The invariant every test leans on: a balance only ever changes alongside a
 * ledger row that explains it, and undoing or editing that row re-settles the
 * balances it touched, or refuses if that would overdraw a wallet.
 */
class WalletTransferTest extends TestCase
{
    use RefreshDatabase;

    private Wallet $main;
    private Wallet $branch;
    private User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);

        $this->admin = User::factory()->create(['user_type' => 'coach', 'is_active' => true]);
        $this->admin->assignRole('admin');
        Sanctum::actingAs($this->admin);

        $this->main = Wallet::main();
        $this->main->update(['usd' => 1000, 'syp' => 5_000_000]);
        $this->branch = $this->wallet('Tartus branch', 'فرع طرطوس');
    }

    private function wallet(string $en, string $ar, array $attrs = []): Wallet
    {
        return Wallet::create(['key' => Wallet::makeKey($en), 'name_en' => $en, 'name_ar' => $ar] + $attrs);
    }

    private function transfer(array $overrides = [])
    {
        return $this->postJson('/api/admin/finance/wallets/transfer', $overrides + [
            'from_wallet_id' => $this->main->id,
            'to_wallet_id'   => $this->branch->id,
            'currency'       => 'USD',
            'amount'         => 300,
            'note'           => 'Float for the branch',
        ]);
    }

    /* ── Recording ────────────────────────────────────────────────────── */

    public function test_a_transfer_moves_the_money_and_records_why_and_who(): void
    {
        $this->transfer()->assertCreated()
            ->assertJsonPath('transfer.note', 'Float for the branch')
            ->assertJsonPath('transfer.from_wallet.name_en', 'Main wallet')
            ->assertJsonPath('transfer.to_wallet.name_en', 'Tartus branch')
            ->assertJsonPath('transfer.creator.id', $this->admin->id);

        $this->assertSame(700.0, $this->main->fresh()->usd);
        $this->assertSame(300.0, $this->branch->fresh()->usd);

        $row = WalletTransfer::sole();
        $this->assertSame($this->main->id, $row->from_wallet_id);
        $this->assertSame($this->branch->id, $row->to_wallet_id);
        $this->assertSame('USD', $row->currency);
        $this->assertSame(300.0, $row->amount);
        $this->assertSame($this->admin->id, $row->created_by);
    }

    public function test_a_transfer_requires_a_reason(): void
    {
        $this->transfer(['note' => ''])->assertUnprocessable()->assertJsonValidationErrors('note');
        $this->transfer(['note' => null])->assertUnprocessable()->assertJsonValidationErrors('note');

        $this->assertSame(0, WalletTransfer::count());
        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_an_overdrawing_transfer_is_refused_and_leaves_no_row(): void
    {
        $this->transfer(['amount' => 1000.01])->assertUnprocessable()->assertJsonValidationErrors('amount');

        $this->assertSame(0, WalletTransfer::count());
        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertSame(0.0, $this->branch->fresh()->usd);
    }

    public function test_a_transfer_into_an_archived_wallet_is_refused(): void
    {
        $this->branch->update(['is_archived' => true]);

        $this->transfer()->assertUnprocessable();

        $this->assertSame(0, WalletTransfer::count());
        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_a_wallet_cannot_transfer_to_itself(): void
    {
        $this->transfer(['to_wallet_id' => $this->main->id])
            ->assertUnprocessable()->assertJsonValidationErrors('to_wallet_id');
    }

    public function test_currencies_move_independently(): void
    {
        $this->transfer(['currency' => 'SYP', 'amount' => 2_000_000])->assertCreated();

        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertSame(3_000_000.0, $this->main->fresh()->syp);
        $this->assertSame(2_000_000.0, $this->branch->fresh()->syp);
        $this->assertSame(0.0, $this->branch->fresh()->usd);
    }

    /* ── The ledger ───────────────────────────────────────────────────── */

    public function test_filtering_by_wallet_matches_either_side(): void
    {
        $third = $this->wallet('Aleppo desk', 'مكتب حلب');

        $this->transfer(['note' => 'main to branch'])->assertCreated();
        $this->transfer(['to_wallet_id' => $third->id, 'note' => 'main to aleppo'])->assertCreated();
        $this->transfer([
            'from_wallet_id' => $this->branch->id, 'to_wallet_id' => $third->id,
            'amount' => 100, 'note' => 'branch to aleppo',
        ])->assertCreated();

        $notesFor = fn (Wallet $w) => collect(
            $this->getJson('/api/admin/finance/transfers?wallet_id=' . $w->id)->assertOk()->json('data')
        )->pluck('note')->sort()->values()->all();

        $this->assertSame(['branch to aleppo', 'main to branch'], $notesFor($this->branch));
        $this->assertSame(['branch to aleppo', 'main to aleppo'], $notesFor($third));
        $this->assertCount(3, $this->getJson('/api/admin/finance/transfers')->json('data'));
    }

    public function test_the_ledger_lists_newest_first(): void
    {
        $this->transfer(['note' => 'first'])->assertCreated();
        $this->transfer(['note' => 'second'])->assertCreated();

        $this->assertSame(
            ['second', 'first'],
            collect($this->getJson('/api/admin/finance/transfers')->json('data'))->pluck('note')->all(),
        );
    }

    /* ── Undo ─────────────────────────────────────────────────────────── */

    public function test_deleting_a_transfer_puts_the_money_back(): void
    {
        $id = $this->transfer()->json('transfer.id');

        $this->deleteJson("/api/admin/finance/transfers/{$id}")->assertOk();

        $this->assertSame(0, WalletTransfer::count());
        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertSame(0.0, $this->branch->fresh()->usd);
    }

    public function test_a_transfer_cannot_be_undone_once_the_receiver_spent_it(): void
    {
        $id = $this->transfer()->json('transfer.id');
        $this->branch->decrement('usd', 250);   // the branch spent most of it

        $this->deleteJson("/api/admin/finance/transfers/{$id}")->assertUnprocessable();

        $this->assertSame(1, WalletTransfer::count());
        $this->assertSame(700.0, $this->main->fresh()->usd);
        $this->assertSame(50.0, $this->branch->fresh()->usd);
    }

    public function test_a_transfer_whose_wallet_was_deleted_is_locked(): void
    {
        $id = $this->transfer()->json('transfer.id');
        $this->branch->update(['usd' => 0]);
        $this->branch->delete();

        $row = WalletTransfer::find($id);
        $this->assertNull($row->to_wallet_id, 'deleting a wallet keeps its transfer history');

        $this->deleteJson("/api/admin/finance/transfers/{$id}")->assertUnprocessable();
        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->wallet('New', 'جديد')->id,
            'currency' => 'USD', 'amount' => 300, 'note' => 'x',
        ])->assertUnprocessable();

        $this->assertSame(700.0, $this->main->fresh()->usd);
    }

    /* ── Edit ─────────────────────────────────────────────────────────── */

    public function test_editing_the_amount_re_settles_both_wallets(): void
    {
        $id = $this->transfer()->json('transfer.id');

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'USD', 'amount' => 450, 'note' => 'Bigger float',
        ])->assertOk()->assertJsonPath('data.note', 'Bigger float');

        $this->assertSame(550.0, $this->main->fresh()->usd);
        $this->assertSame(450.0, $this->branch->fresh()->usd);
    }

    public function test_editing_the_receiver_moves_the_money_between_receivers(): void
    {
        $third = $this->wallet('Aleppo desk', 'مكتب حلب');
        $id = $this->transfer()->json('transfer.id');

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $third->id,
            'currency' => 'USD', 'amount' => 300, 'note' => 'Wrong branch, fixed',
        ])->assertOk();

        $this->assertSame(700.0, $this->main->fresh()->usd);
        $this->assertSame(0.0, $this->branch->fresh()->usd);
        $this->assertSame(300.0, $third->fresh()->usd);
    }

    public function test_editing_the_currency_rewinds_one_and_applies_the_other(): void
    {
        $id = $this->transfer()->json('transfer.id');

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'SYP', 'amount' => 1_000_000, 'note' => 'Was meant to be SYP',
        ])->assertOk();

        $main = $this->main->fresh();
        $branch = $this->branch->fresh();
        $this->assertSame(1000.0, $main->usd);
        $this->assertSame(4_000_000.0, $main->syp);
        $this->assertSame(0.0, $branch->usd);
        $this->assertSame(1_000_000.0, $branch->syp);
    }

    public function test_an_edit_that_would_overdraw_is_refused_and_changes_nothing(): void
    {
        $id = $this->transfer()->json('transfer.id');
        $this->branch->decrement('usd', 250);

        // Moving the receiving side elsewhere would take back money the branch
        // has already spent.
        $third = $this->wallet('Aleppo desk', 'مكتب حلب');
        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $third->id,
            'currency' => 'USD', 'amount' => 300, 'note' => 'x',
        ])->assertUnprocessable();

        $this->assertSame(700.0, $this->main->fresh()->usd);
        $this->assertSame(50.0, $this->branch->fresh()->usd);
        $this->assertSame(0.0, $third->fresh()->usd);
        $this->assertSame($this->branch->id, WalletTransfer::find($id)->to_wallet_id);
    }

    public function test_a_note_only_edit_is_allowed_when_the_receiver_is_archived(): void
    {
        $id = $this->transfer()->json('transfer.id');
        $this->branch->update(['is_archived' => true]);

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'USD', 'amount' => 300, 'note' => 'Clarified reason',
        ])->assertOk();

        $this->assertSame('Clarified reason', WalletTransfer::find($id)->note);
        $this->assertSame(300.0, $this->branch->fresh()->usd);
    }

    public function test_an_archived_receiver_cannot_be_sent_more_through_an_edit(): void
    {
        $id = $this->transfer()->json('transfer.id');
        $this->branch->update(['is_archived' => true]);

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'USD', 'amount' => 500, 'note' => 'More for the branch',
        ])->assertUnprocessable();

        $this->assertSame(300.0, $this->branch->fresh()->usd);
        $this->assertSame(700.0, $this->main->fresh()->usd);
    }

    /* ── Guards found in review ───────────────────────────────────────── */

    public function test_amounts_finer_than_a_cent_are_refused(): void
    {
        $this->transfer(['amount' => 10.555])->assertUnprocessable()->assertJsonValidationErrors('amount');
        $this->transfer(['amount' => 10.55])->assertCreated();
    }

    public function test_a_self_transfer_is_refused_even_when_one_id_is_a_string(): void
    {
        $this->transfer(['to_wallet_id' => (string) $this->main->id])
            ->assertUnprocessable()->assertJsonValidationErrors('to_wallet_id');

        $this->assertSame(0, WalletTransfer::count());
    }

    /**
     * Two undos of the same transfer racing: both load the row before either
     * commits. The second must find it gone rather than move the money again.
     */
    public function test_undoing_the_same_transfer_twice_moves_the_money_once(): void
    {
        $this->postJson('/api/admin/finance/wallet/topup', [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 500,
        ])->assertOk();
        $id = $this->transfer()->json('transfer.id');      // main 700, branch 800

        $first  = WalletTransfer::find($id);
        $second = WalletTransfer::find($id);               // stale by the time it runs
        $controller = app(FinanceController::class);

        $controller->destroyTransfer($first);
        try {
            $controller->destroyTransfer($second);
            $this->fail('A second undo of the same transfer must be refused.');
        } catch (ValidationException) {
            // expected
        }

        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertSame(500.0, $this->branch->fresh()->usd);
    }

    public function test_an_edit_racing_an_earlier_edit_rewinds_what_that_edit_wrote(): void
    {
        $id = $this->transfer(['amount' => 100])->json('transfer.id');   // main 900, branch 100
        $stale = WalletTransfer::find($id);

        $this->putJson("/api/admin/finance/transfers/{$id}", [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'USD', 'amount' => 150, 'note' => 'first edit',
        ])->assertOk();                                                   // main 850, branch 150

        // A second edit built from the row as it was before the first edit.
        $request = \Illuminate\Http\Request::create('/', 'PUT', [
            'from_wallet_id' => $this->main->id, 'to_wallet_id' => $this->branch->id,
            'currency' => 'USD', 'amount' => 120, 'note' => 'second edit',
        ]);
        app(FinanceController::class)->updateTransfer($request, $stale);

        $this->assertSame(880.0, $this->main->fresh()->usd);
        $this->assertSame(120.0, $this->branch->fresh()->usd);
        $this->assertSame(120.0, WalletTransfer::find($id)->amount);
    }

    public function test_a_top_up_whose_wallet_was_deleted_never_touches_the_main_wallet(): void
    {
        $topupId = $this->postJson('/api/admin/finance/wallet/topup', [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 125,
        ])->json('topup.id');
        $this->branch->update(['usd' => 0]);           // spent
        $this->branch->delete();
        $this->assertNull(WalletTopup::find($topupId)->wallet_id);

        $this->deleteJson("/api/admin/finance/topups/{$topupId}")->assertUnprocessable();
        $this->putJson("/api/admin/finance/topups/{$topupId}", [
            'wallet_id' => $this->main->id, 'currency' => 'USD', 'amount' => 25,
        ])->assertUnprocessable();

        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertNotNull(WalletTopup::find($topupId));
    }

    public function test_an_expense_whose_wallet_was_deleted_never_touches_the_main_wallet(): void
    {
        $this->branch->update(['usd' => 50]);
        $expenseId = $this->postJson('/api/admin/finance/expenses', [
            'wallet_id' => $this->branch->id, 'category' => 'other', 'amount' => 50,
            'currency' => 'USD', 'date' => '2026-10-12',
        ])->assertCreated()->json('data.id');
        $this->branch->delete();

        $this->deleteJson("/api/admin/finance/expenses/{$expenseId}")->assertUnprocessable();

        $this->assertSame(1000.0, $this->main->fresh()->usd);
        $this->assertNotNull(Expense::find($expenseId));
    }

    public function test_deleting_a_top_up_twice_takes_the_money_out_once(): void
    {
        $topupId = $this->postJson('/api/admin/finance/wallet/topup', [
            'wallet_id' => $this->main->id, 'currency' => 'USD', 'amount' => 200,
        ])->json('topup.id');                         // main 1200

        $first  = WalletTopup::find($topupId);
        $second = WalletTopup::find($topupId);
        $controller = app(FinanceController::class);

        $controller->destroyTopup($first);
        try {
            $controller->destroyTopup($second);
            $this->fail('A second delete of the same top-up must be refused.');
        } catch (ValidationException) {
            // expected
        }

        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_the_memoised_rate_follows_a_change_in_the_same_request(): void
    {
        $this->assertEqualsWithDelta(Wallet::DEFAULT_RATE, Wallet::rate(), 0.001);

        Wallet::setRate(16_500);

        $this->assertEqualsWithDelta(16_500, Wallet::rate(), 0.001);
        $this->assertEqualsWithDelta(16_500, $this->main->fresh()->rate, 0.001);
    }

    /* ── Expenses, conversion and archived top-ups (second review) ────── */

    /** The expense form's default "Main wallet" option posts an empty id. */
    public function test_an_expense_on_the_default_main_option_is_attributed_and_stays_editable(): void
    {
        $id = $this->postJson('/api/admin/finance/expenses', [
            'wallet_id' => '', 'category' => 'rent', 'amount' => 100, 'currency' => 'USD', 'date' => '2026-10-12',
        ])->assertCreated()->assertJsonPath('data.wallet_id', $this->main->id)->json('data.id');

        $this->assertSame(900.0, $this->main->fresh()->usd);

        $this->putJson("/api/admin/finance/expenses/{$id}", ['wallet_id' => '', 'amount' => 150])
            ->assertOk()->assertJsonPath('data.wallet_id', $this->main->id);
        $this->assertSame(850.0, $this->main->fresh()->usd);

        $this->deleteJson("/api/admin/finance/expenses/{$id}")->assertOk();
        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_deleting_an_expense_twice_refunds_once(): void
    {
        $id = $this->postJson('/api/admin/finance/expenses', [
            'category' => 'rent', 'amount' => 100, 'currency' => 'USD', 'date' => '2026-10-12',
        ])->assertCreated()->json('data.id');

        $first  = Expense::find($id);
        $second = Expense::find($id);
        $controller = app(FinanceController::class);

        $controller->destroyExpense($first);
        try {
            $controller->destroyExpense($second);
            $this->fail('A second delete of the same expense must be refused.');
        } catch (ValidationException) {
            // expected
        }

        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_an_overdrawing_expense_is_refused_and_leaves_no_row(): void
    {
        $this->postJson('/api/admin/finance/expenses', [
            'wallet_id' => $this->main->id, 'category' => 'rent', 'amount' => 1000.01, 'currency' => 'USD', 'date' => '2026-10-12',
        ])->assertUnprocessable();

        $this->assertSame(0, Expense::count());
        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_conversion_moves_both_legs_and_refuses_an_overdraw(): void
    {
        $this->postJson('/api/admin/finance/wallet/convert', [
            'wallet_id' => $this->main->id, 'from' => 'SYP', 'amount' => 1_420_000, 'rate' => 14_200,
        ])->assertOk();

        $main = $this->main->fresh();
        $this->assertEqualsWithDelta(1100.0, $main->usd, 0.001);
        $this->assertEqualsWithDelta(3_580_000.0, $main->syp, 0.001);
        $this->assertEqualsWithDelta(14_200, Wallet::rate(), 0.001);

        $this->postJson('/api/admin/finance/wallet/convert', [
            'wallet_id' => $this->main->id, 'from' => 'USD', 'amount' => 5000, 'rate' => 15_000,
        ])->assertUnprocessable();

        $this->assertEqualsWithDelta(1100.0, $this->main->fresh()->usd, 0.001);
        $this->assertEqualsWithDelta(14_200, Wallet::rate(), 0.001, 'a refused conversion must not move the rate');
    }

    public function test_an_archived_wallet_cannot_gain_money_through_a_top_up_edit(): void
    {
        $topupId = $this->postJson('/api/admin/finance/wallet/topup', [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 100,
        ])->json('topup.id');
        $this->branch->update(['is_archived' => true]);

        $this->putJson("/api/admin/finance/topups/{$topupId}", [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 10_000,
        ])->assertUnprocessable();
        $this->assertSame(100.0, $this->branch->fresh()->usd);

        $this->putJson("/api/admin/finance/topups/{$topupId}", [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 100, 'note' => 'Clarified source',
        ])->assertOk();
        $this->assertSame('Clarified source', WalletTopup::find($topupId)->note);
    }

    public function test_the_backfill_attributes_unattributed_rows_to_the_main_wallet(): void
    {
        $topup   = WalletTopup::create(['currency' => 'USD', 'amount' => 5]);
        $expense = Expense::create(['category' => 'rent', 'amount' => 5, 'currency' => 'USD', 'date' => '2026-10-12']);
        $this->assertNull($topup->wallet_id);

        (require database_path('migrations/2026_10_12_000002_backfill_main_wallet_on_topups_and_expenses.php'))->up();

        $this->assertSame($this->main->id, $topup->fresh()->wallet_id);
        $this->assertSame($this->main->id, $expense->fresh()->wallet_id);
    }

    /* ── Top-ups into any wallet, and the uncapped list ───────────────── */

    public function test_a_top_up_can_fund_a_non_main_wallet_directly(): void
    {
        $this->postJson('/api/admin/finance/wallet/topup', [
            'wallet_id' => $this->branch->id, 'currency' => 'USD', 'amount' => 125, 'note' => 'Direct',
        ])->assertOk()->assertJsonPath('topup.wallet.name_en', 'Tartus branch');

        $this->assertSame(125.0, $this->branch->fresh()->usd);
        $this->assertSame(1000.0, $this->main->fresh()->usd);
    }

    public function test_the_top_up_list_is_not_capped(): void
    {
        foreach (range(1, 60) as $i) {
            WalletTopup::create(['wallet_id' => $this->main->id, 'currency' => 'USD', 'amount' => $i]);
        }

        $rows = $this->getJson('/api/admin/finance/topups')->assertOk()->json('data');

        $this->assertCount(60, $rows);
        $this->assertSame(1830.0, (float) collect($rows)->sum('amount'));
    }

    /* ── Permissions ──────────────────────────────────────────────────── */

    public function test_a_read_only_analyst_can_see_the_ledger_but_not_move_money(): void
    {
        $id = $this->transfer()->json('transfer.id');

        $analyst = User::factory()->create(['user_type' => 'coach', 'is_active' => true]);
        $analyst->assignRole('analyst');
        Sanctum::actingAs($analyst);

        $this->getJson('/api/admin/finance/transfers')->assertOk();
        $this->transfer()->assertForbidden();
        $this->deleteJson("/api/admin/finance/transfers/{$id}")->assertForbidden();

        $this->assertSame(1, WalletTransfer::count());
    }
}
