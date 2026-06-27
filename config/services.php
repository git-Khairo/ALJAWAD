<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'telegram_bot' => [
        'url'    => env('TELEGRAM_BOT_URL', ''),
        'secret' => env('TELEGRAM_BOT_SECRET', ''),
        'token'  => env('TELEGRAM_BOT_TOKEN', ''),
    ],

    // Twelve Data — live market quotes (forex, crypto, stocks) for the homepage.
    // Free key: https://twelvedata.com/pricing  (Basic plan: 800 req/day, 8/min)
    'twelvedata' => [
        'key' => env('TWELVEDATA_API_KEY', ''),
        // Seconds to cache quotes server-side. The free plan allows ~800
        // requests/day; with 9 symbols (=9 credits/call) keep this high so a
        // single upstream call serves all visitors. 900s ≈ stays under the cap.
        'cache_ttl' => (int) env('MARKET_CACHE_TTL', 900),
    ],

];
