# ── Stage 1: build frontend assets ───────────────────────────────────────────
FROM node:20-alpine AS node-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: PHP application (PHP-FPM + cron scheduler) ──────────────────────
FROM php:8.3-apache AS app

WORKDIR /var/www/html

# System deps (busybox crond is already part of Alpine)
RUN apk add --no-cache \
    bash \
    curl \
    git \
    libpng-dev \
    libzip-dev \
    oniguruma-dev \
    unzip \
    zip

# PHP extensions
RUN docker-php-ext-install \
    bcmath \
    mbstring \
    pdo_mysql \
    pcntl \
    zip

# Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Install PHP dependencies first (layer-cached until composer files change)
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-interaction --prefer-dist

# Copy application source + compiled frontend assets
COPY . .
COPY --from=node-build /app/public/build ./public/build

# Fix permissions and finalise Composer
RUN chown -R www-data:www-data storage bootstrap/cache \
    && chmod -R 775 storage bootstrap/cache \
    && composer run-script post-autoload-dump

# Copy entrypoint (starts crond + php-fpm)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 9000
ENTRYPOINT ["/entrypoint.sh"]
