<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Wipe existing entries (none in production yet) and rebuild the table
        Schema::drop('kpi_entries');

        Schema::create('kpi_entries', function (Blueprint $table) {
            $table->id();

            $table->foreignId('kpi_definition_id')
                ->constrained('kpi_definitions')
                ->cascadeOnDelete();

            // Entries are department-level (role), not per individual coach.
            // The role here must match a value in kpi_definitions.role.
            $table->string('role');

            // Evaluation period
            $table->unsignedSmallInteger('year');
            $table->unsignedTinyInteger('month'); // 1–12

            // The recorded value for this KPI for this department this month
            $table->decimal('value', 10, 2);

            // Auto-computed from the definition thresholds
            $table->enum('tier', ['F', 'A', 'B', 'C'])->default('F');
            $table->unsignedSmallInteger('bonus_pct')->default(0);
            $table->boolean('has_warning')->default(false);

            // Admin notes
            $table->text('notes')->nullable();

            // Who logged this entry
            $table->foreignId('entered_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->timestamps();

            // One entry per KPI per department per month
            $table->unique(['kpi_definition_id', 'role', 'year', 'month']);
        });
    }

    public function down(): void
    {
        Schema::drop('kpi_entries');
    }
};
