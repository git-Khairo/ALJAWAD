<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    /**
     * Get a single setting value by key.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();
        if (!$setting) return $default;
        $decoded = json_decode($setting->value, true);
        return json_last_error() === JSON_ERROR_NONE ? $decoded : $setting->value;
    }

    /**
     * Set a setting value by key (upsert).
     */
    public static function set(string $key, mixed $value): void
    {
        static::updateOrCreate(
            ['key' => $key],
            ['value' => is_string($value) ? $value : json_encode($value)]
        );
    }

    /**
     * Return all settings as a flat key => value map.
     */
    public static function allAsMap(): array
    {
        return static::all()->mapWithKeys(function ($row) {
            $decoded = json_decode($row->value, true);
            return [$row->key => json_last_error() === JSON_ERROR_NONE ? $decoded : $row->value];
        })->toArray();
    }
}
