<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('wallets', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();  // 'main'
            $table->decimal('syp', 18, 2)->default(0);
            $table->decimal('usd', 18, 2)->default(0);
            $table->decimal('rate', 10, 2)->default(14200);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wallets');
    }
};
