<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Account extends Model
{
    use HasFactory;

    protected $fillable = [
        'account_number',
        'balance',
        'owner_id',
        'acc_type_id',
        'status',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the account type.
     */
    public function accountType()
    {
        return $this->belongsTo(AccountType::class, 'acc_type_id');
    }

    /**
     * Get the owner (Client or Coach) using polymorphic-like relationship.
     */
    public function owner()
    {
        $accountType = $this->accountType;
        
        if ($accountType && $accountType->slug === 'client') {
            return Client::find($this->owner_id);
        } elseif ($accountType && $accountType->slug === 'coach') {
            return Coach::find($this->owner_id);
        }
        
        return null;
    }

    /**
     * Get the transactions for this account.
     */
    public function transactions()
    {
        return $this->hasMany(Transaction::class);
    }

    /**
     * Get the client owner (if account type is Client).
     */
    public function client()
    {
        return $this->belongsTo(Client::class, 'owner_id');
    }

    /**
     * Get the coach owner (if account type is Coach).
     */
    public function coach()
    {
        return $this->belongsTo(Coach::class, 'owner_id');
    }
}

