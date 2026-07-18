<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientTradingAccount extends Model
{
    use HasFactory;

    protected $fillable = [
        'client_id',
        'broker_id',
        'account_number',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Client::class);
    }

    public function broker(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Broker::class);
    }
}
