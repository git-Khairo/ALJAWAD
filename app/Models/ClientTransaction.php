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
        'type',
        'direction',
        'amount',
        'currency',
        'status',
        'notes',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
    ];
}
