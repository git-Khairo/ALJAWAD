<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('media_library', function (Blueprint $table) {
            $table->id();
            $table->string('category');  // idea | video_draft | reference | image
            $table->string('title');
            $table->text('notes')->nullable();
            $table->enum('status', ['inbox', 'in_progress', 'done'])->default('inbox');
            $table->json('tags')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('media_library');
    }
};
