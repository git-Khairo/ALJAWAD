<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('csat_ratings', function (Blueprint $table) {
            $table->id();
            $table->uuid('token')->unique();
            // The CRM client being rated (nullable: brand-new WhatsApp contacts
            // may not have a client record yet — contact_label covers those).
            $table->foreignId('client_id')->nullable()->constrained('clients')->nullOnDelete();
            // The staff member (customer-service agent) who requested the rating.
            $table->foreignId('agent_id')->constrained('users')->cascadeOnDelete();
            $table->string('contact_label')->nullable();
            $table->unsignedTinyInteger('stars')->nullable();
            $table->text('comment')->nullable();
            $table->dateTime('requested_at');
            $table->dateTime('responded_at')->nullable();
            $table->dateTime('expires_at');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('csat_ratings');
    }
};
