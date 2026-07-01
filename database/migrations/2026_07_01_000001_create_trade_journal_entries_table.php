<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trade_journal_entries', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('symbol');
            $table->enum('direction', ['buy', 'sell']);
            $table->decimal('entry_price', 15, 5);
            $table->decimal('take_profit', 15, 5)->nullable();
            $table->decimal('stop_loss', 15, 5)->nullable();
            $table->decimal('exit_price', 15, 5)->nullable();
            $table->decimal('size', 15, 4)->nullable();
            $table->enum('outcome', ['open', 'hit_tp', 'hit_sl', 'manual_close'])->default('open');
            $table->text('entry_reasoning')->nullable();
            $table->text('outcome_notes')->nullable();
            $table->json('tags')->nullable();
            $table->dateTime('opened_at')->nullable();
            $table->dateTime('closed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trade_journal_entries');
    }
};
