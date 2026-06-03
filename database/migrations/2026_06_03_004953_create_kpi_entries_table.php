<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('kpi_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kpi_definition_id')
                ->constrained('kpi_definitions')
                ->cascadeOnDelete();

            // The coach being evaluated
            $table->foreignId('coach_id')
                ->constrained('coaches')
                ->cascadeOnDelete();

            // Evaluation period
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month'); // 1–12

            // The actual recorded value for this KPI this month
            $table->decimal('value', 10, 2);

            // Computed tier: F / A / B / C  (stored for fast querying)
            $table->enum('tier', ['F', 'A', 'B', 'C'])->default('F');

            // Bonus % earned from this KPI this month
            $table->unsignedSmallInteger('bonus_pct')->default(0);

            // Whether this entry triggered a warning
            $table->boolean('has_warning')->default(false);

            // Admin notes
            $table->text('notes')->nullable();

            // Who logged this entry
            $table->foreignId('entered_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();

            // One entry per KPI per coach per month
            $table->unique(['kpi_definition_id', 'coach_id', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('kpi_entries');
    }
};
