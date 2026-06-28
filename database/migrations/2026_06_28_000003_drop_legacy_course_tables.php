<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * The catalog + enrolment model is gone — everything is now driven by
     * course_plans + course_access_grants. Drop the obsolete tables in
     * FK-safe order. (accounts/account_types/transactions are left intact.)
     */
    public function up(): void
    {
        Schema::disableForeignKeyConstraints();

        Schema::dropIfExists('affiliate_commissions'); // FKs registrations
        Schema::dropIfExists('registrations');         // FKs students, courses
        Schema::dropIfExists('students');              // FKs clients
        Schema::dropIfExists('course_coach');          // FKs courses, coaches
        Schema::dropIfExists('schedules');             // FKs courses, coaches
        Schema::dropIfExists('courses');

        Schema::enableForeignKeyConstraints();
    }

    public function down(): void
    {
        // One-way cleanup — these legacy tables are intentionally not recreated.
    }
};
