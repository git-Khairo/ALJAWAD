<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Wallet extends Model
{
    use HasFactory;

    protected $fillable = ['key', 'syp', 'usd', 'rate'];

    protected $casts = [
        'syp'  => 'float',
        'usd'  => 'float',
        'rate' => 'float',
    ];

    public static function main(): self
    {
        return self::firstOrCreate(['key' => 'main'], [
            'syp'  => 18500000,
            'usd'  => 32000,
            'rate' => 14200,
        ]);
    }
}
