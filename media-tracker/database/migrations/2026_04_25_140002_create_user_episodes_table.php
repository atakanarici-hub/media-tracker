<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_episodes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('media_id')->constrained('medias')->cascadeOnDelete();
            $table->integer('season_number');
            $table->integer('episode_number');
            $table->boolean('is_watched')->default(true);
            $table->timestamps();

            $table->unique(['user_id', 'media_id', 'season_number', 'episode_number'], 'user_episode_unique');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_episodes');
    }
};
