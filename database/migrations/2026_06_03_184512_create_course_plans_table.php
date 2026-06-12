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
        Schema::create('course_plans', function (Blueprint $table) {
            $table->id();
            $table->string('label')->default('L1'); // L1, L2, L3
            $table->string('icon')->default('Zap');
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('subtitle_ar')->nullable();
            $table->string('subtitle_en')->nullable();
            $table->string('access_ar')->nullable();
            $table->string('access_en')->nullable();
            $table->unsignedInteger('price')->default(0);
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_featured')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->unsignedTinyInteger('sort_order')->default(0);
            // Maps to a CourseBot plan: beginner | intermediate | expert
            $table->string('bot_plan')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_plans');
    }
};
