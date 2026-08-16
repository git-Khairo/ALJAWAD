<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    use HasFactory;

    protected $fillable = [
        'wallet_id',
        'category',
        'description_ar',
        'description_en',
        'amount',
        'currency',
        'date',
        'notes',
    ];

    protected $casts = [
        'amount' => 'float',
        'date'   => 'date',
    ];

    /** Which wallet this expense was paid from. */
    public function wallet(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Wallet::class);
    }
}
