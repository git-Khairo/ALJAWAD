<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class ActivityLog extends Model
{
    protected $fillable = [
        'user_id', 'actor', 'actor_role',
        'category', 'action',
        'target', 'target_type',
        'status', 'meta',
        'ip', 'device',
    ];

    protected $casts = [
        'meta' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Convenience helper — call from any controller to record an action.
     *
     * Usage:
     *   ActivityLog::record('clients', 'create', $request, target: $client->name, target_type: 'client');
     */
    public static function record(
        string  $category,
        string  $action,
        ?\Illuminate\Http\Request $request = null,
        string  $target      = null,
        string  $target_type = null,
        string  $status      = 'success',
        array   $meta        = [],
    ): void {
        try {
            $user      = $request?->user();
            $actorName = $user?->name_en ?? $user?->name ?? 'System';
            $actorRole = $user?->getRoleNames()->first() ?? null;

            static::create([
                'user_id'     => $user?->id,
                'actor'       => $actorName,
                'actor_role'  => $actorRole,
                'category'    => $category,
                'action'      => $action,
                'target'      => $target,
                'target_type' => $target_type,
                'status'      => $status,
                'meta'        => $meta ?: null,
                'ip'          => $request?->ip(),
                'device'      => $request ? static::parseDevice($request->userAgent() ?? '') : null,
            ]);
        } catch (\Throwable) {
            // Never let logging failures crash the app
        }
    }

    private static function parseDevice(string $ua): string
    {
        $browser = 'Unknown';
        $os      = 'Unknown';

        if (str_contains($ua, 'Firefox'))       $browser = 'Firefox';
        elseif (str_contains($ua, 'Chrome'))    $browser = 'Chrome';
        elseif (str_contains($ua, 'Safari'))    $browser = 'Safari';
        elseif (str_contains($ua, 'Edge'))      $browser = 'Edge';

        if (str_contains($ua, 'Windows'))       $os = 'Windows';
        elseif (str_contains($ua, 'Macintosh')) $os = 'macOS';
        elseif (str_contains($ua, 'Linux'))     $os = 'Linux';
        elseif (str_contains($ua, 'iPhone'))    $os = 'iPhone';
        elseif (str_contains($ua, 'Android'))   $os = 'Android';

        return "{$browser} / {$os}";
    }
}
