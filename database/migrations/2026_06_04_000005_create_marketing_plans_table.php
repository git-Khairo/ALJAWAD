<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('marketing_plans', function (Blueprint $table) {
            $table->id();
            $table->string('name_ar');
            $table->string('name_en');
            $table->unsignedTinyInteger('month');
            $table->unsignedSmallInteger('year');
            $table->text('goal_ar')->nullable();
            $table->text('goal_en')->nullable();
            $table->enum('status', ['active', 'draft', 'completed'])->default('draft');
            $table->timestamps();
        });

        Schema::create('marketing_plan_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('marketing_plan_id')->constrained()->onDelete('cascade');
            $table->string('type');      // reel | post | story | live | carousel
            $table->string('platform');  // instagram | tiktok | youtube | google_meet
            $table->string('title_ar')->nullable();
            $table->string('title_en')->nullable();
            $table->text('script_ar')->nullable();
            $table->text('script_en')->nullable();
            $table->date('date')->nullable();
            $table->string('time')->nullable();
            $table->enum('status', ['draft', 'scheduled', 'published'])->default('draft');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('marketing_plan_items');
        Schema::dropIfExists('marketing_plans');
    }
};
