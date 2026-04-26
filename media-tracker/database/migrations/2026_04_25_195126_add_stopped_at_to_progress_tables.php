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
        Schema::table('user_progress', function (Blueprint $table) {
            $table->integer('stopped_at')->nullable()->after('rating');
        });

        Schema::table('user_episodes', function (Blueprint $table) {
            $table->integer('stopped_at')->nullable()->after('rating');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('progress_tables', function (Blueprint $table) {
            //
        });
    }
};
