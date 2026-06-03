<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_definitions', function (Blueprint $table) {
            $table->id();

            // Which role this KPI belongs to (matches Spatie role name)
            $table->string('role');

            // Slug used in code, e.g. "activity_rate"
            $table->string('slug');

            // Display name (Arabic + English)
            $table->string('name_ar');
            $table->string('name_en');

            // Short description shown on the scorecard
            $table->text('description_ar')->nullable();
            $table->text('description_en')->nullable();

            // Unit label for the value, e.g. "%", "messages", "broadcasts"
            $table->string('unit')->default('%');

            // Whether higher or lower values are better (for display arrows)
            $table->enum('direction', ['higher_is_better', 'lower_is_better'])->default('higher_is_better');

            // Maximum possible bonus percentage this KPI can contribute
            $table->unsignedSmallInteger('max_bonus_pct')->default(0);

            /*
            |  Tier thresholds — admin-editable.
            |  Each tier stores the minimum value required to achieve it
            |  and the bonus % awarded.
            |
            |  Tier F = below tier_a_min → 0% bonus + warning flag
            |  Tier A = tier_a_min  → tier_a_bonus %
            |  Tier B = tier_b_min  → tier_b_bonus %
            |  Tier C = tier_c_min  → tier_c_bonus % (max)
            */
            $table->decimal('tier_a_min', 8, 2)->default(0);
            $table->unsignedSmallInteger('tier_a_bonus')->default(0);

            $table->decimal('tier_b_min', 8, 2)->default(0);
            $table->unsignedSmallInteger('tier_b_bonus')->default(0);

            $table->decimal('tier_c_min', 8, 2)->default(0);
            $table->unsignedSmallInteger('tier_c_bonus')->default(0);

            // Display order within the role group
            $table->unsignedTinyInteger('sort_order')->default(0);

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['role', 'slug']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_definitions');
    }
};
