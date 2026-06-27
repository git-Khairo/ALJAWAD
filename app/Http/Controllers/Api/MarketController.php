<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
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
    public function quotes(Request $request)
    {
        $ttl   = (int) config('services.twelvedata.cache_ttl', 900);
        $debug = $request->boolean('debug');

        $data  = [];
        $diag  = [];

        foreach (self::CATEGORIES as $category) {
            $cacheKey = "market.quotes.$category";
            $cached   = Cache::get($cacheKey);

            // Serve from cache unless we're explicitly debugging (force fresh).
            if ($cached !== null && ! $debug) {
                $data = array_merge($data, $cached);
                continue;
            }

            [$rows, $ok, $info] = $this->fetchCategory($category);

            // Cache real data for the full window; cache failures briefly so a
            // transient error (e.g. a one-off rate limit) self-heals quickly.
            Cache::put($cacheKey, $rows, $ok ? $ttl + self::TTL_OFFSET[$category] : 60);

            $data        = array_merge($data, $rows);
            $diag[$category] = $info;
        }

        if ($debug) {
            $key = (string) config('services.twelvedata.key');
            return response()->json([
                'key_present' => $key !== '',
                'key_length'  => strlen($key),
                'cache_ttl'   => $ttl,
                'upstream'    => $diag,
                'data'        => $data,
            ]);
        }

        return response()->json(['data' => $data]);
    }

    /**
     * Fetch + normalize one category's symbols from Twelve Data.
     *
     * @return array{0: array, 1: bool, 2: array}  [rows, success, diagnostics]
     */
    private function fetchCategory(string $category): array
    {
        $key     = (string) config('services.twelvedata.key');
        $symbols = array_keys(array_filter(self::SYMBOLS, fn ($c) => $c === $category));

        if ($key === '') {
            return [$this->fallback($category), false, ['error' => 'no_api_key']];
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
                return [$this->fallback($category), false, [
                    'http'  => $response->status(),
                    'code'  => $json['code'] ?? null,
                    'error' => $json['message'] ?? 'unknown_error',
                ]];
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

                $rows[] = [
                    'symbol'         => $symbol,
                    'price'          => round((float) $q['close'], 4),
                    'change'         => round((float) ($q['percent_change'] ?? 0), 2),
                    'category'       => $category,
                    'is_market_open' => array_key_exists('is_market_open', $q)
                        ? (bool) $q['is_market_open']
                        : $this->marketOpenHeuristic($category),
                ];
            }

            if (! $rows) {
                return [$this->fallback($category), false, [
                    'http'  => $response->status(),
                    'error' => 'no_usable_rows',
                    'raw'   => $json,
                ]];
            }

            return [$rows, true, ['http' => $response->status(), 'ok' => true, 'count' => count($rows)]];
        } catch (\Throwable $e) {
            Log::error('MarketController::fetchCategory failed', ['category' => $category, 'error' => $e->getMessage()]);
            return [$this->fallback($category), false, ['error' => $e->getMessage()]];
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

        // US stocks: Mon–Fri, ~14:30–21:00 UTC (regular session, DST-agnostic).
        if ($dow === 0 || $dow === 6) return false;
        return $minutes >= 870 && $minutes < 1260;
    }
}
