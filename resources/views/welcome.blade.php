<!DOCTYPE html>
<html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>{{ env('APP_NAME') }}</title>
    </head>
    <body>
        <div id="app"></div>

        @viteReactRefresh
        @vite(['resources/js/App.jsx', 'resources/css/app.css'])
    </body>
</html>
