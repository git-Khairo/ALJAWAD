<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * A ledger of money moved between two company wallets.
 *
 * Before this, a transfer changed two balances and left nothing behind, so a
 * secondary wallet's balance could not be traced back to where it came from
 * or why. Every transfer now leaves one row naming both wallets, the amount,
 * the reason and who made it.
 *
 * Both wallet references are nullable with `nullOnDelete` rather than
 * cascading, the same rule top-ups and expenses follow: deleting a wallet
 * must never silently delete the history of money that passed through it.
 *
 * Transfers made before this table existed were never recorded and cannot be
 * reconstructed.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallet_transfers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('from_wallet_id')->nullable()->constrained('wallets')->nullOnDelete();
            $table->foreignId('to_wallet_id')->nullable()->constrained('wallets')->nullOnDelete();
            $table->string('currency', 10);            // USD | SYP
            $table->decimal('amount', 18, 2);
            $table->string('note');                    // why the money moved
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallet_transfers');
    }
};
