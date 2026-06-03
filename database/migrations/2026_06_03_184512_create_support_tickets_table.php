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
        Schema::create('support_tickets', function (Blueprint $table) {
            $table->id();
            $table->string('ticket_id')->unique(); // TK-001 format
            $table->string('subject');
            $table->string('user_name');
            $table->unsignedBigInteger('user_ref_id')->nullable(); // id in clients/users table
            $table->enum('user_type', ['client', 'lead', 'user'])->default('client');
            $table->string('category');
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium');
            $table->enum('status', ['open', 'in_progress', 'escalated', 'resolved', 'closed'])->default('open');
            $table->timestamp('opened_at')->useCurrent();
            $table->timestamp('first_response_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->tinyInteger('csat')->nullable(); // 1-5
            $table->boolean('escalated')->default(false);
            $table->string('agent')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
