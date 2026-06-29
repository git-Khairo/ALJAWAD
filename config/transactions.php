<?php

/*
|--------------------------------------------------------------------------
| Client transaction options (canonical source of truth)
|--------------------------------------------------------------------------
| The fixed option lists for deposits/withdrawals. The frontend
| (resources/js/constants/transactions.js) and the Telegram bot
| (TransactionBot/config.py) mirror these — keep them in sync.
*/

return [
    // Transaction direction (DB column: client_transactions.direction) — the bot's "type".
    'directions' => ['deposit', 'withdrawal', 'wallet_charge', 'close_debt'],

    // Directions that count as an inbound payment → activate an inactive client.
    'inbound' => ['deposit'],

    // Payment method (DB column: client_transactions.type) — the bot's "method".
    'methods' => ['cash', 'usdt', 'sham_cash'],

    // Place of the transaction.
    'places' => ['damascus', 'tartus'],

    // Client transactions are USD only (SYP/USD remains for expenses + wallets).
    'currency' => 'USD',

    // Phone format: starts with 0, exactly 10 digits.
    'phone_regex' => '/^0\d{9}$/',
];
