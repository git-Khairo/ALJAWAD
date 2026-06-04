<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('activity_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('set null');
            $table->string('actor')->default('system');        // display name
            $table->string('actor_role')->nullable();
            $table->string('category');                        // auth, clients, finance, etc.
            $table->string('action');                          // login, create, update, delete …
            $table->string('target')->nullable();              // name of the affected record
            $table->string('target_type')->nullable();         // client, coach, ticket …
            $table->string('status')->default('success');      // success | failed
            $table->json('meta')->nullable();                  // arbitrary extra context
            $table->string('ip', 45)->nullable();
            $table->string('device')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activity_logs');
    }
};
