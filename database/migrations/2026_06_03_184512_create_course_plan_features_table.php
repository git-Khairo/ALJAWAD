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
        if (Schema::hasTable('course_plan_features')) {
            return;
        }
        Schema::create('course_plan_features', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('course_plan_id');
            $table->string('text_ar');
            $table->string('text_en');
            $table->boolean('included')->default(true);
            $table->unsignedTinyInteger('sort_order')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('course_plan_features');
    }
};
