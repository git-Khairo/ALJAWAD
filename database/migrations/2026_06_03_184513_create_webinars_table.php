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
        Schema::create('webinars', function (Blueprint $table) {
            $table->id();
            $table->string('title_ar');
            $table->string('title_en');
            $table->string('description_ar')->nullable();
            $table->string('description_en')->nullable();
            $table->date('date');
            $table->time('time');
            $table->unsignedSmallInteger('duration')->default(60); // minutes
            $table->string('platform')->default('zoom'); // zoom | google_meet | youtube
            $table->string('link')->nullable();
            $table->unsignedInteger('registered')->default(0);
            $table->unsignedInteger('capacity')->default(100);
            $table->enum('status', ['draft', 'upcoming', 'live', 'completed', 'cancelled'])->default('upcoming');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('webinars');
    }
};
