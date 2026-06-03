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
        Schema::create('campaigns', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->enum('status', ['draft', 'active', 'paused', 'completed'])->default('draft');
            $table->string('platform')->default('instagram');
            $table->unsignedInteger('budget')->default(0);
            $table->unsignedInteger('spent')->default(0);
            $table->unsignedInteger('leads')->default(0);
            $table->unsignedInteger('conversions')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('campaigns');
    }
};
