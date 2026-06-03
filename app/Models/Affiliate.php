<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * AFFILIATE PROGRAM — DISABLED
 *
 * The underlying tables (affiliates, affiliate_commissions) and the
 * clients.affiliate_id column remain in the database so data is preserved.
 * This model is intentionally inert. Re-enable by restoring relationships
 * in Client and Registration models and removing this notice.
 */
class Affiliate extends Model
{
    use HasFactory;

    protected $fillable = [];
}
