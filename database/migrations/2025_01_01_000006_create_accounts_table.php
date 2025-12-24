<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('accounts', function (Blueprint $table) {
            $table->id();
            $table->string('account_number')->unique();
            $table->decimal('balance', 15, 2)->default(0);
            $table->foreignId('owner_id');
            $table->foreignId('acc_type_id')->constrained('account_types')->onDelete('cascade');
            $table->enum('status', ['active', 'frozen', 'closed'])->default('active');
            $table->timestamps();

            // Unique constraint: one account per owner per account type
            $table->unique(['owner_id', 'acc_type_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('accounts');
    }
};

