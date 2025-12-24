<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Affiliate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'code',
        'balance',
        'status',
        'parent_affiliate_id',
    ];

    protected $casts = [
        'balance' => 'decimal:2',
    ];

    /**
     * Get the parent affiliate.
     */
    public function parentAffiliate()
    {
        return $this->belongsTo(Affiliate::class, 'parent_affiliate_id');
    }

    /**
     * Get the child affiliates.
     */
    public function childAffiliates()
    {
        return $this->hasMany(Affiliate::class, 'parent_affiliate_id');
    }

    /**
     * Get the clients referred by this affiliate.
     */
    public function clients()
    {
        return $this->hasMany(Client::class);
    }

    /**
     * Get the commissions for this affiliate.
     */
    public function commissions()
    {
        return $this->hasMany(AffiliateCommission::class);
    }
}

