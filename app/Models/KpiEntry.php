<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiEntry extends Model
{
    protected $fillable = [
        'kpi_definition_id',
        'role',
        'year',
        'month',
        'value',
        'tier',
        'bonus_pct',
        'has_warning',
        'notes',
        'entered_by',
    ];

    protected $casts = [
        'value'       => 'decimal:2',
        'has_warning' => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function definition()
    {
        return $this->belongsTo(KpiDefinition::class, 'kpi_definition_id');
    }

    public function enteredBy()
    {
        return $this->belongsTo(User::class, 'entered_by');
    }

    // ── Scopes ────────────────────────────────────────────────

    public function scopeForMonth($query, int $year, int $month)
    {
        return $query->where('year', $year)->where('month', $month);
    }

    public function scopeForRole($query, string $role)
    {
        return $query->where('role', $role);
    }
}
