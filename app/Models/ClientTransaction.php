<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClientTransaction extends Model
{
    use HasFactory;

    protected $table = 'client_transactions';

    protected $fillable = [
        'client_name',
        'client_id',
        'type',
        'direction',
        'amount',
        'commission',
        'place',
        'currency',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount'     => 'float',
        'commission' => 'float',
    ];

    /** The CRM client this transaction belongs to (nullable for external entries). */
    public function client(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(Client::class);
    }
}
