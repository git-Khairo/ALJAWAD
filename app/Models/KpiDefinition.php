<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KpiDefinition extends Model
{
    protected $fillable = [
        'role',
        'slug',
        'name_ar',
        'name_en',
        'description_ar',
        'description_en',
        'unit',
        'direction',
        'max_bonus_pct',
        'tier_a_min',
        'tier_a_bonus',
        'tier_b_min',
        'tier_b_bonus',
        'tier_c_min',
        'tier_c_bonus',
        'sort_order',
        'is_active',
    ];

    protected $casts = [
        'tier_a_min'    => 'decimal:2',
        'tier_b_min'    => 'decimal:2',
        'tier_c_min'    => 'decimal:2',
        'is_active'     => 'boolean',
    ];

    // ── Relationships ─────────────────────────────────────────

    public function entries()
    {
        return $this->hasMany(KpiEntry::class);
    }

    // ── Helpers ───────────────────────────────────────────────

    /**
     * Compute the tier and bonus % for a given raw value.
     * Returns ['tier' => 'B', 'bonus_pct' => 25, 'has_warning' => false]
     */
    public function evaluate(float $value): array
    {
        $better = $this->direction === 'higher_is_better';

        // For higher_is_better: C ≥ tier_c_min, B ≥ tier_b_min, A ≥ tier_a_min, else F
        // For lower_is_better:  C ≤ tier_c_min, B ≤ tier_b_min, A ≤ tier_a_min, else F
        if ($better) {
            if ($value >= $this->tier_c_min) {
                return ['tier' => 'C', 'bonus_pct' => $this->tier_c_bonus, 'has_warning' => false];
            }
            if ($value >= $this->tier_b_min) {
                return ['tier' => 'B', 'bonus_pct' => $this->tier_b_bonus, 'has_warning' => false];
            }
            if ($value >= $this->tier_a_min) {
                return ['tier' => 'A', 'bonus_pct' => $this->tier_a_bonus, 'has_warning' => false];
            }
        } else {
            if ($value <= $this->tier_c_min) {
                return ['tier' => 'C', 'bonus_pct' => $this->tier_c_bonus, 'has_warning' => false];
            }
            if ($value <= $this->tier_b_min) {
                return ['tier' => 'B', 'bonus_pct' => $this->tier_b_bonus, 'has_warning' => false];
            }
            if ($value <= $this->tier_a_min) {
                return ['tier' => 'A', 'bonus_pct' => $this->tier_a_bonus, 'has_warning' => false];
            }
        }

        return ['tier' => 'F', 'bonus_pct' => 0, 'has_warning' => true];
    }
}
