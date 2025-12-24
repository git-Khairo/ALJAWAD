<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Client extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email',
        'phone',
        'email_verified_at',
        'affiliate_id',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Get the affiliate that referred this client.
     */
    public function affiliate()
    {
        return $this->belongsTo(Affiliate::class);
    }

    /**
     * Get the student record for this client (if exists).
     */
    public function student()
    {
        return $this->hasOne(Student::class, 'id');
    }

    /**
     * Get the accounts for this client.
     */
    public function accounts()
    {
        $clientAccountType = AccountType::where('slug', 'client')->first();
        if (!$clientAccountType) {
            return $this->hasMany(Account::class, 'owner_id')->whereRaw('1 = 0');
        }
        return $this->hasMany(Account::class, 'owner_id')
            ->where('acc_type_id', $clientAccountType->id);
    }

    /**
     * Check if this client is a student.
     */
    public function isStudent(): bool
    {
        return $this->student !== null;
    }
}

