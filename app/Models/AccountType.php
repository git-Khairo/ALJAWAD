<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AccountType extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
    ];

    /**
     * Get the accounts for this account type.
     */
    public function accounts()
    {
        return $this->hasMany(Account::class, 'acc_type_id');
    }
}

