<?php

namespace App\Console\Commands;

use App\Models\ClientTransaction;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * One-time importer for the historical "ALJAWAD Transactions" Google Sheet
 * (exported to CSV). Reads deposits/withdrawals/wallet moves and loads them
 * into client_transactions.
 *
 *   php artisan transactions:import "storage/app/transactions.csv" --dry-run
 *   php artisan transactions:import "storage/app/transactions.csv"
 *
 * Idempotent: each row is keyed by its sheet ID (source_ref = "sheet:<ID>"),
 * so a re-run updates rather than duplicates.
 */
class ImportClientTransactions extends Command
{
    protected $signature = 'transactions:import
        {path : Path to the exported CSV file}
        {--dry-run : Parse and report only; write nothing}
        {--truncate : Delete previously sheet-imported rows first}';

    protected $description = 'Import historical client transactions from the ALJAWAD Transactions CSV';

    // Sheet label → dashboard value (mirrors config/transactions.php).
    private const DIRECTIONS = [
        'deposit'          => 'deposit',
        'withdraw'         => 'withdrawal',
        'withdrawal'       => 'withdrawal',
        'wallet charge'    => 'wallet_charge',
        'wallet discharge' => 'wallet_discharge',
        'close debt'       => 'close_debt',
    ];
    private const METHODS = [
        'usdt'      => 'usdt',
        'cash'      => 'cash',
        'sham cash' => 'sham_cash',
    ];
    private const PLACES = [
        'tartus'   => 'tartus',
        'damascus' => 'damascus',
    ];

    public function handle(): int
    {
        $path = $this->argument('path');
        if (! is_readable($path)) {
            $this->error("File not readable: {$path}");
            return self::FAILURE;
        }

        $rows = $this->readCsv($path);
        if ($rows === []) {
            $this->error('No rows parsed from the CSV.');
            return self::FAILURE;
        }

        // Locate the header row (first cell === "ID"); data follows it.
        $headerIdx = null;
        foreach ($rows as $i => $r) {
            if (isset($r[0]) && strtolower(trim($r[0])) === 'id') { $headerIdx = $i; break; }
        }
        if ($headerIdx === null) {
            $this->error('Could not find the header row (a row whose first column is "ID").');
            return self::FAILURE;
        }

        $records = [];
        $skipped = [];
        foreach (array_slice($rows, $headerIdx + 1) as $r) {
            $id = isset($r[0]) ? trim($r[0]) : '';
            if ($id === '' || ! ctype_digit($id)) {
                continue; // summary/blank/non-data row
            }

            [$record, $error] = $this->mapRow($r);
            if ($error) {
                $skipped[] = "ID {$id}: {$error}";
                continue;
            }
            $records[$id] = $record; // keyed by sheet ID (last wins on dupes)
        }

        $this->report($records, $skipped);

        if ($this->option('dry-run')) {
            $this->info('Dry run — nothing written.');
            return self::SUCCESS;
        }
        if ($records === []) {
            $this->warn('Nothing to import.');
            return self::SUCCESS;
        }

        DB::transaction(function () use ($records) {
            if ($this->option('truncate')) {
                $deleted = ClientTransaction::where('source_ref', 'like', 'sheet:%')->delete();
                $this->warn("Deleted {$deleted} previously imported row(s).");
            }

            $bar = $this->output->createProgressBar(count($records));
            foreach ($records as $rec) {
                $model = ClientTransaction::updateOrCreate(
                    ['source_ref' => $rec['source_ref']],
                    $rec,
                );

                // `created_at`/`updated_at` are not mass-assignable, so fill()
                // drops them and Eloquent stamps now() instead. Write the sheet's
                // real date explicitly, or every imported row lands on import day.
                $model->forceFill([
                    'created_at' => $rec['created_at'],
                    'updated_at' => $rec['updated_at'],
                ])->saveQuietly();

                $bar->advance();
            }
            $bar->finish();
            $this->newLine();
        });

        $this->info('Imported '.count($records).' transaction(s).');
        return self::SUCCESS;
    }

    /** Read a CSV that may contain newlines inside quoted fields. */
    private function readCsv(string $path): array
    {
        $rows = [];
        $fh = fopen($path, 'r');
        if ($fh === false) return [];
        while (($r = fgetcsv($fh, 0, ',', '"', '')) !== false) {
            $rows[] = $r;
        }
        fclose($fh);
        return $rows;
    }

    /**
     * @return array{0: array<string,mixed>|null, 1: string|null}  [record, error]
     */
    private function mapRow(array $r): array
    {
        // Columns: ID,Type,Full Name,Method,Amount,Place,Commission,Date,Notes,Telegram ID,telegram name
        $id        = trim($r[0]);
        $direction = self::DIRECTIONS[strtolower(trim($r[1] ?? ''))] ?? null;
        $method    = self::METHODS[strtolower(trim($r[3] ?? ''))] ?? null;
        $place     = self::PLACES[strtolower(trim($r[5] ?? ''))] ?? null;

        if (! $direction) return [null, "unknown type '".trim($r[1] ?? '')."'"];
        if (! $method)    return [null, "unknown method '".trim($r[3] ?? '')."'"];

        $amount = $this->number($r[4] ?? '');
        if ($amount === null) return [null, "invalid amount '".trim($r[4] ?? '')."'"];
        $commission = $this->number($r[6] ?? '') ?? 0.0;

        [$name, $accountRef] = $this->parseName($r[2] ?? '');

        $noteParts = array_filter([
            $accountRef ? "Acct: {$accountRef}" : null,
            trim($r[8] ?? '') ?: null,
        ]);

        $createdAt = $this->parseDate($r[7] ?? '');

        return [[
            'source_ref'  => "sheet:{$id}",
            'client_name' => $name,
            'client_id'   => null,
            'type'        => $method,
            'direction'   => $direction,
            'amount'      => $amount,
            'commission'  => $commission,
            'place'       => $place,
            'currency'    => config('transactions.currency', 'USD'),
            'status'      => 'completed',
            'notes'       => $noteParts ? implode(' | ', $noteParts) : null,
            'created_at'  => $createdAt,
            'updated_at'  => $createdAt,
        ], null];
    }

    /** "1,000.00" → 1000.0 ; blank/non-numeric → null. */
    private function number(string $raw): ?float
    {
        $clean = str_replace([',', ' '], '', trim($raw));
        if ($clean === '' || ! is_numeric($clean)) return null;
        return (float) $clean;
    }

    /**
     * The "Full Name" cell mixes an account ref (SF…USD) and the person's name
     * across lines, in either order. Split them apart.
     *
     * @return array{0: string, 1: string|null}  [name, accountRef]
     */
    private function parseName(string $raw): array
    {
        $lines = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $raw)), fn ($l) => $l !== ''));
        $ref = null; $names = [];
        foreach ($lines as $line) {
            if (preg_match('/^SF.*USD$/i', $line)) { $ref = $ref ?? $line; }
            else { $names[] = $line; }
        }
        $name = trim(implode(' ', $names));
        if ($name === '') $name = $ref ?? 'Unknown';
        return [$name, $ref];
    }

    private function parseDate(string $raw): Carbon
    {
        $raw = trim($raw);
        if ($raw === '') return now();
        try {
            return Carbon::parse($raw);
        } catch (\Throwable) {
            return now();
        }
    }

    private function report(array $records, array $skipped): void
    {
        $byDir = []; $bySum = [];
        foreach ($records as $rec) {
            $d = $rec['direction'];
            $byDir[$d] = ($byDir[$d] ?? 0) + 1;
            $bySum[$d] = ($bySum[$d] ?? 0) + $rec['amount'];
        }
        ksort($byDir);

        $this->newLine();
        $this->info('Parsed '.count($records).' importable row(s):');
        $table = [];
        foreach ($byDir as $d => $count) {
            $table[] = [$d, $count, number_format($bySum[$d], 2)];
        }
        $this->table(['Direction', 'Rows', 'Total (USD)'], $table);

        if ($skipped) {
            $this->warn(count($skipped).' row(s) skipped:');
            foreach (array_slice($skipped, 0, 20) as $s) $this->line("  • {$s}");
            if (count($skipped) > 20) $this->line('  … and '.(count($skipped) - 20).' more');
        }
    }
}
