<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('expenses', function (Blueprint $table) {
            $table->id();
            $table->string('category');  // salary | rent | marketing | software | utilities | equipment | travel
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency', 10)->default('SYP');
            $table->date('date');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('expenses');
    }
};
