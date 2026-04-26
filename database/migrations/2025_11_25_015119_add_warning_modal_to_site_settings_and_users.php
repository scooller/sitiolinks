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
        Schema::table('site_settings', function (Blueprint $table) {
            $table->boolean('warning_modal_enabled')->default(false);
            $table->text('warning_modal_content')->nullable();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->boolean('warning_modal_dismissed')->default(false);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('warning_modal_dismissed');
        });

        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['warning_modal_enabled', 'warning_modal_content']);
        });
    }
};
