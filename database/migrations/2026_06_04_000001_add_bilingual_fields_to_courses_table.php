<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->string('title_ar')->nullable()->after('id');
            $table->string('title_en')->nullable()->after('title_ar');
            $table->string('category')->default('forex')->after('title_en');  // forex | crypto | stocks
            $table->text('description_ar')->nullable()->after('category');
            $table->text('description_en')->nullable()->after('description_ar');
            $table->string('level_ar')->default('مبتدئ')->after('description_en');
            $table->string('level_en')->default('Beginner')->after('level_ar');
            $table->string('duration_ar')->nullable()->after('level_en');
            $table->string('duration_en')->nullable()->after('duration_ar');
            $table->unsignedInteger('sessions')->default(0)->after('duration_en');
            $table->unsignedInteger('enrolled')->default(0)->after('sessions');
        });
    }

    public function down(): void
    {
        Schema::table('courses', function (Blueprint $table) {
            $table->dropColumn([
                'title_ar', 'title_en', 'category',
                'description_ar', 'description_en',
                'level_ar', 'level_en',
                'duration_ar', 'duration_en',
                'sessions', 'enrolled',
            ]);
        });
    }
};
