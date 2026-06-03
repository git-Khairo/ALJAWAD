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
        Schema::create('generated_contents', function (Blueprint $table) {
            $table->id();
            $table->enum('type', ['reel', 'post', 'story', 'live', 'carousel']);
            $table->string('platform');
            $table->text('prompt');
            $table->text('generated_ar')->nullable();
            $table->text('generated_en')->nullable();
            $table->string('tone')->default('energetic');
            $table->string('language')->default('ar');   // ar | en | both
            $table->string('audience')->default('beginners');
            $table->integer('duration_seconds')->nullable();
            $table->enum('status', ['draft', 'saved'])->default('draft');
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('generated_contents');
    }
};
