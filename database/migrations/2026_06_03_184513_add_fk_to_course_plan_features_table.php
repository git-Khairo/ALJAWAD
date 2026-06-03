<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('course_plan_features', function (Blueprint $table) {
            $table->foreign('course_plan_id')->references('id')->on('course_plans')->cascadeOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('course_plan_features', function (Blueprint $table) {
            $table->dropForeign(['course_plan_id']);
        });
    }
};
