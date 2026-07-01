<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TradeJournalEntry extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'symbol',
        'direction',
        'entry_price',
        'take_profit',
        'stop_loss',
        'exit_price',
        'size',
        'outcome',
        'entry_reasoning',
        'outcome_notes',
        'tags',
        'opened_at',
        'closed_at',
    ];

    protected $casts = [
        'entry_price' => 'float',
        'take_profit' => 'float',
        'stop_loss'   => 'float',
        'exit_price'  => 'float',
        'size'        => 'float',
        'tags'        => 'array',
        'opened_at'   => 'datetime',
        'closed_at'   => 'datetime',
    ];

    public function user(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
