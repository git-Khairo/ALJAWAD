# ── Stage 1: build frontend assets ───────────────────────────────────────────
FROM node:20-alpine AS node-build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Stage 2: PHP application (Apache + cron scheduler) ───────────────────────
FROM php:8.3-apache AS app

WORKDIR /var/www/html

# System deps (Debian/Apache base)
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    git \
    cron \
    libpng-dev \
    libzip-dev \
    libonig-dev \
    unzip \
    zip \
    && rm -rf /var/lib/apt/lists/*

# PHP extensions
RUN docker-php-ext-install \
    bcmath \
    mbstring \
    pdo_mysql \
    pcntl \
    zip

# Serve Laravel's public/ directory and enable URL rewriting
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf \
    && sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf \
    && a2enmod rewrite

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

# Copy entrypoint (starts cron + apache)
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 80
ENTRYPOINT ["/entrypoint.sh"]
