<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class MarketController extends Controller
{
    /**
     * Symbols shown on the homepage ticker + Financial Markets section,
     * grouped by the category the frontend uses for its tabs.
     * Keys are Twelve Data symbols.
     */
    private const SYMBOLS = [
        'EUR/USD' => 'forex',
        'GBP/USD' => 'forex',
        'USD/JPY' => 'forex',
        'BTC/USD' => 'crypto',
        'ETH/USD' => 'crypto',
        'SOL/USD' => 'crypto',
        'AAPL'    => 'stocks',
        'TSLA'    => 'stocks',
        'NVDA'    => 'stocks',
    ];

    /**
     * Public: live market quotes for the landing page.
     * Cached server-side so a single upstream call serves every visitor and
     * keeps usage within the free Twelve Data quota.
     */
    public function quotes()
    {
        $ttl = (int) config('services.twelvedata.cache_ttl', 900);

        $data = Cache::remember('market.quotes', $ttl, fn () => $this->fetchQuotes());

        return response()->json(['data' => $data]);
    }

    /**
     * Fetch + normalize quotes from Twelve Data. Returns an array of
     * { symbol, price, change, category }. On any failure returns the
     * static fallback so the homepage never renders empty.
     */
    private function fetchQuotes(): array
    {
        $key = config('services.twelvedata.key');

        if (! $key) {
            return $this->fallback();
        }

        try {
            $response = Http::timeout(12)->get('https://api.twelvedata.com/quote', [
                'symbol' => implode(',', array_keys(self::SYMBOLS)),
                'apikey' => $key,
            ]);

            $json = $response->json();

            // Top-level error (bad key, rate limit, etc.)
            if (! is_array($json) || (isset($json['status']) && $json['status'] === 'error')) {
                Log::warning('Twelve Data quote error', ['response' => $json]);
                return $this->fallback();
            }

            // A single-symbol response comes back flat; multi-symbol is keyed
            // by symbol. Normalize both into a symbol => payload map.
            $bySymbol = isset($json['symbol']) ? [$json['symbol'] => $json] : $json;

            $out = [];
            foreach (self::SYMBOLS as $symbol => $category) {
                $q = $bySymbol[$symbol] ?? null;
                if (! is_array($q) || ! isset($q['close'])) {
                    continue;
                }
                $out[] = [
                    'symbol'         => $symbol,
                    'price'          => round((float) $q['close'], 4),
                    'change'         => round((float) ($q['percent_change'] ?? 0), 2),
                    'category'       => $category,
                    // Twelve Data reports this per symbol (handles holidays/DST).
                    'is_market_open' => array_key_exists('is_market_open', $q)
                        ? (bool) $q['is_market_open']
                        : $this->marketOpenHeuristic($category),
                ];
            }

            return $out ?: $this->fallback();
        } catch (\Throwable $e) {
            Log::error('MarketController::fetchQuotes failed', ['error' => $e->getMessage()]);
            return $this->fallback();
        }
    }

    /**
     * Static seed values used when no API key is set or the upstream fails.
     * Mirrors the original hardcoded homepage data.
     */
    private function fallback(): array
    {
        $seed = [
            'EUR/USD' => [1.0856, 0.32],
            'GBP/USD' => [1.2734, -0.15],
            'USD/JPY' => [149.82, 0.45],
            'BTC/USD' => [104523, 2.14],
            'ETH/USD' => [3856, 1.87],
            'SOL/USD' => [187.45, -3.21],
            'AAPL'    => [198.45, 0.82],
            'TSLA'    => [256.78, -1.24],
            'NVDA'    => [875.32, 3.45],
        ];

        $out = [];
        foreach (self::SYMBOLS as $symbol => $category) {
            $out[] = [
                'symbol'         => $symbol,
                'price'          => $seed[$symbol][0],
                'change'         => $seed[$symbol][1],
                'category'       => $category,
                'is_market_open' => $this->marketOpenHeuristic($category),
            ];
        }

        return $out;
    }

    /**
     * Approximate whether a market is open (used only when Twelve Data doesn't
     * supply is_market_open, e.g. the static fallback). Times are in UTC and
     * ignore market holidays — the real path uses the API's accurate flag.
     */
    private function marketOpenHeuristic(string $category): bool
    {
        if ($category === 'crypto') {
            return true; // crypto trades 24/7
        }

        $now = now('UTC');
        $dow = (int) $now->dayOfWeek;          // 0 = Sun … 6 = Sat
        $minutes = $now->hour * 60 + $now->minute;

        if ($category === 'forex') {
            // FX runs ~Sun 22:00 UTC → Fri 22:00 UTC.
            if ($dow === 6) return false;                       // Saturday
            if ($dow === 0 && $now->hour < 22) return false;    // Sun before open
            if ($dow === 5 && $now->hour >= 22) return false;   // Fri after close
            return true;
        }

        // US stocks: Mon–Fri, ~14:30–21:00 UTC (regular session, DST-agnostic).
        if ($dow === 0 || $dow === 6) return false;
        return $minutes >= 870 && $minutes < 1260;
    }
}
