<!DOCTYPE html>
<html lang="ar" dir="rtl">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ env('APP_NAME') }}</title>
        <meta name="description" content="أكاديمية رائدة في التدريب والاستثمار المالي" />

        {{-- Favicon / tab icon — drop the file at: public/logo.png --}}
        <link rel="icon" type="image/png" href="{{ asset('logo.png') }}" />
        <link rel="apple-touch-icon" href="{{ asset('logo.png') }}" />

        {{-- Social share preview image (WhatsApp/Telegram/Twitter/Facebook) --}}
        {{-- Drop the file at: public/og-image.png (recommended size 1200x630) --}}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="{{ env('APP_NAME') }}" />
        <meta property="og:description" content="أكاديمية رائدة في التدريب والاستثمار المالي" />
        <meta property="og:image" content="{{ asset('og-image.png') }}" />
        <meta property="og:url" content="{{ url()->current() }}" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="{{ env('APP_NAME') }}" />
        <meta name="twitter:description" content="أكاديمية رائدة في التدريب والاستثمار المالي" />
        <meta name="twitter:image" content="{{ asset('og-image.png') }}" />
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    </head>
    <body>
        <div id="app"></div>

        @viteReactRefresh
        @vite(['resources/js/main.jsx', 'resources/css/app.css'])
    </body>
</html>
