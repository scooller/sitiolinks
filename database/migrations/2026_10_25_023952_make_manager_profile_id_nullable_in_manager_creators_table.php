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
        Schema::table('manager_creators', function (Blueprint $table) {
            $table->foreignId('manager_profile_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('manager_creators', function (Blueprint $table) {
            $table->foreignId('manager_profile_id')->nullable(false)->change();
        });
    }
};
