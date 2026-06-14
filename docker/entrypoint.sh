#!/bin/sh
set -e

# Register the Laravel scheduler as a cron job that fires every minute.
# Output is forwarded to PID 1's stdout so `docker logs` captures it.
echo "* * * * * root cd /var/www/html && php artisan schedule:run --no-interaction >> /proc/1/fd/1 2>&1" \
    > /etc/cron.d/laravel-scheduler
chmod 0644 /etc/cron.d/laravel-scheduler

# Start the Debian cron daemon in the background
cron

# Hand off to Apache as the main foreground process
exec apache2-foreground
