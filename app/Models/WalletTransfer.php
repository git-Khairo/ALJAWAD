<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Money moved from one company wallet to another, in one currency.
 *
 * A null wallet reference means that wallet has since been deleted; the row is
 * kept so the history of the other side still explains its balance.
 */
class WalletTransfer extends Model
{
    protected $fillable = [
        'from_wallet_id',
        'to_wallet_id',
        'currency',
        'amount',
        'note',
        'created_by',
    ];

    protected $casts = [
        'amount' => 'float',
    ];

    public function fromWallet(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'from_wallet_id');
    }

    public function toWallet(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Wallet::class, 'to_wallet_id');
    }

    public function creator(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
