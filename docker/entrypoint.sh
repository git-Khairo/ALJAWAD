#!/bin/sh
set -e

# Register the Laravel scheduler as a cron job that fires every minute.
# Output is forwarded to PID 1's stdout so `docker logs` captures it.
echo "* * * * * root cd /var/www/html && php artisan schedule:run --no-interaction >> /proc/1/fd/1 2>&1" \
    > /etc/crontabs/root

# Start busybox crond in background (-b = background, -l 2 = log level warn)
crond -b -l 2

# Hand off to php-fpm as the main foreground process
exec php-fpm
