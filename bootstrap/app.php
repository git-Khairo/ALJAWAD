<?php

// Suppress PDO::MYSQL_ATTR_SSL_CA deprecation from Laravel framework vendor file (PHP 8.5).
// Remove once Laravel ships a fix upstream.
error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Behind nginx/Apache reverse proxy: trust forwarded headers so Laravel
        // detects the original HTTPS scheme and generates https:// asset URLs.
        $middleware->trustProxies(at: '*');

        // Register route-level middleware aliases
        $middleware->alias([
            'coach'      => \App\Http\Middleware\EnsureUserIsCoach::class,
            'bot.secret' => \App\Http\Middleware\EnsureBotSecret::class,
            'role'       => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
