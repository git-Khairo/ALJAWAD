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

    /** Display order of the categories. */
    private const CATEGORIES = ['forex', 'crypto', 'stocks'];

    /**
     * Per-category cache offsets (seconds). Spreads refreshes across different
     * minutes so we never request all 9 symbols inside one rolling minute,
     * which would trip Twelve Data's free 8-credits/minute limit.
     */
    private const TTL_OFFSET = ['forex' => 0, 'crypto' => 120, 'stocks' => 240];

    /**
     * Public: live market quotes for the landing page.
     * Each category is fetched + cached independently (3 symbols = 3 credits)
     * to stay within the free per-minute quota. One upstream call per category
     * serves every visitor for the cache window.
     */
    public function quotes()
    {
        $ttl = (int) config('services.twelvedata.cache_ttl', 900);

        $data = [];
        // Twelve Data's free tier allows only 8 API credits/minute. Each
        // category is 3 symbols (3 credits), so we make AT MOST ONE upstream
        // call per request — three categories in one request would be 9 credits
        // and the third would always 429. Stale categories refresh round-robin
        // across successive requests; staggered TTLs keep them apart afterwards.
        $fetched = false;

        foreach (self::CATEGORIES as $category) {
            $cacheKey = "market.quotes.$category";
            $cached   = Cache::get($cacheKey);

            if ($cached !== null) {
                $data = array_merge($data, $cached);
                continue;
            }

            // Cache miss. Only one live fetch per request; defer the rest
            // (they serve fallback now and refresh on the next request).
            if ($fetched) {
                $data = array_merge($data, $this->fallback($category));
                continue;
            }

            [$rows, $ok] = $this->fetchCategory($category);

            // Cache real data for the full (staggered) window; cache failures
            // briefly so a transient error self-heals on the next request.
            Cache::put($cacheKey, $rows, $ok ? $ttl + self::TTL_OFFSET[$category] : 60);

            $data = array_merge($data, $rows);
            $fetched = true;
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Fetch + normalize one category's symbols from Twelve Data.
     *
     * @return array{0: array, 1: bool}  [rows, success]
     */
    private function fetchCategory(string $category): array
    {
        $key     = (string) config('services.twelvedata.key');
        $symbols = array_keys(array_filter(self::SYMBOLS, fn ($c) => $c === $category));

        if ($key === '') {
            return [$this->fallback($category), false];
        }

        try {
            $response = Http::timeout(12)->get('https://api.twelvedata.com/quote', [
                'symbol' => implode(',', $symbols),
                'apikey' => $key,
            ]);

            $json = $response->json();

            // Top-level error (bad key, rate limit, etc.)
            if (! is_array($json) || (isset($json['status']) && $json['status'] === 'error')) {
                Log::warning('Twelve Data quote error', ['category' => $category, 'response' => $json]);
                return [$this->fallback($category), false];
            }

            // Single-symbol responses come back flat; multi-symbol is keyed.
            $bySymbol = isset($json['symbol']) ? [$json['symbol'] => $json] : $json;

            $rows = [];
            foreach ($symbols as $symbol) {
                $q = $bySymbol[$symbol] ?? null;

                // A per-symbol error object can appear inside a batch response.
                if (! is_array($q) || ! isset($q['close']) || ($q['status'] ?? null) === 'error') {
                    continue;
                }

                // Twelve Data's is_market_open is unreliable for forex (it can
                // report "open" on weekends with frozen quotes), so we treat the
                // market as open only when BOTH the API flag and our time-based
                // heuristic agree. This closes forex on weekends while still
                // respecting the API's holiday/DST awareness for stocks.
                $apiOpen = array_key_exists('is_market_open', $q) ? (bool) $q['is_market_open'] : true;

                $rows[] = [
                    'symbol'         => $symbol,
                    'price'          => round((float) $q['close'], 4),
                    'change'         => round((float) ($q['percent_change'] ?? 0), 2),
                    'category'       => $category,
                    'is_market_open' => $apiOpen && $this->marketOpenHeuristic($category),
                ];
            }

            if (! $rows) {
                Log::warning('Twelve Data returned no usable rows', ['category' => $category, 'response' => $json]);
                return [$this->fallback($category), false];
            }

            return [$rows, true];
        } catch (\Throwable $e) {
            Log::error('MarketController::fetchCategory failed', ['category' => $category, 'error' => $e->getMessage()]);
            return [$this->fallback($category), false];
        }
    }

    /**
     * Static seed values for one category, used when no API key is set or the
     * upstream fails. Mirrors the original hardcoded homepage data.
     */
    private function fallback(string $category): array
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
        foreach (self::SYMBOLS as $symbol => $cat) {
            if ($cat !== $category) {
                continue;
            }
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

        // US stocks: Mon–Fri. Window widened to 13:30–21:00 UTC so it covers
        // the regular session under both EST and EDT; the API's is_market_open
        // (AND-ed in the caller) trims the DST/holiday edges precisely.
        if ($dow === 0 || $dow === 6) return false;
        return $minutes >= 810 && $minutes < 1260;
    }
}
