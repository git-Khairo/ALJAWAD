<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Broker extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────

    /** IB (affiliate) users operating under this broker. */
    public function ibs(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(User::class)->whereNotNull('affiliate_code');
    }

    /** Client trading accounts opened at this broker. */
    public function tradingAccounts(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(ClientTradingAccount::class);
    }
}
