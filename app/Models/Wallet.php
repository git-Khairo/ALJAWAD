<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * A named company wallet holding both currencies.
 *
 * Exactly one wallet is the main one. MySQL has no partial unique index, so
 * that invariant is enforced here in makeMain() rather than by the schema:
 * promoting a wallet demotes every other in the same transaction.
 *
 * The USD/SYP exchange rate is deliberately NOT a column on this table. It is
 * a company-wide number kept in settings under `fx_rate`; giving each wallet
 * its own copy would let two wallets disagree about what a dollar is worth
 * and produce two different USD totals for the same money.
 */
class Wallet extends Model
{
    use HasFactory;

    protected $fillable = [
        'key', 'name_ar', 'name_en', 'is_main', 'is_archived', 'syp', 'usd',
    ];

    protected $casts = [
        'syp'         => 'float',
        'usd'         => 'float',
        'is_main'     => 'boolean',
        'is_archived' => 'boolean',
    ];

    /** Balances are per-wallet; the rate is not, so expose it alongside. */
    protected $appends = ['rate'];

    public const DEFAULT_RATE = 14200.0;

    /* ── Relations ─────────────────────────────────────────────────────── */

    public function topups()
    {
        return $this->hasMany(WalletTopup::class);
    }

    public function expenses()
    {
        return $this->hasMany(Expense::class);
    }

    /* ── The main wallet ───────────────────────────────────────────────── */

    /**
     * The wallet that unattributed money defaults to. Falls back to the
     * oldest wallet, then creates one, so this never returns null and a fresh
     * install cannot 500 on the first top-up.
     */
    public static function main(): self
    {
        return static::where('is_main', true)->first()
            ?? static::orderBy('id')->first()
            ?? static::create([
                'key'     => 'main',
                'name_ar' => 'المحفظة الرئيسية',
                'name_en' => 'Main wallet',
                'is_main' => true,
                'syp'     => 0,
                'usd'     => 0,
            ]);
    }

    /**
     * Promote this wallet, demoting whichever one currently holds the flag.
     *
     * Written as two direct queries rather than a model save. A save() goes
     * through Eloquent's dirty-checking, and on an instance loaded while this
     * wallet was still main, `is_main` is already true in memory, so no UPDATE
     * is issued: the demote-everything step lands, the promote step does not,
     * and the system is left with no main wallet at all.
     */
    public function makeMain(): void
    {
        DB::transaction(function () {
            static::query()->update(['is_main' => false]);
            static::whereKey($this->getKey())->update(['is_main' => true, 'is_archived' => false]);
        });

        $this->refresh();
    }

    /* ── Company exchange rate ─────────────────────────────────────────── */

    public static function rate(): float
    {
        return (float) (Setting::get('fx_rate') ?? self::DEFAULT_RATE);
    }

    public static function setRate(float $rate): void
    {
        Setting::set('fx_rate', $rate);
    }

    /** Serialised with every wallet so the client has one rate, not N. */
    public function getRateAttribute(): float
    {
        return static::rate();
    }

    /* ── Helpers ───────────────────────────────────────────────────────── */

    /** Balance column for a currency code. */
    public static function columnFor(string $currency): string
    {
        return $currency === 'SYP' ? 'syp' : 'usd';
    }

    public function balanceIn(string $currency): float
    {
        return (float) $this->{static::columnFor($currency)};
    }

    /** Total value of this wallet expressed in USD at the company rate. */
    public function totalUsd(): float
    {
        $rate = static::rate() ?: self::DEFAULT_RATE;
        return $this->usd + ($this->syp / $rate);
    }

    /** A url-safe unique key derived from the English name. */
    public static function makeKey(string $name): string
    {
        $base = Str::slug($name) ?: 'wallet';
        $key  = $base;
        $n    = 2;
        while (static::where('key', $key)->exists()) {
            $key = "{$base}-{$n}";
            $n++;
        }
        return $key;
    }
}
