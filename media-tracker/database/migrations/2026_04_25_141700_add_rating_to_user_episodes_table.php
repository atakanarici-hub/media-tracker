<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('user_episodes', function (Blueprint $table) {
            $table->integer('rating')->nullable()->after('is_watched');
        });
    }

    public function down(): void
    {
        Schema::table('user_episodes', function (Blueprint $table) {
            $table->dropColumn('rating');
        });
    }
};
