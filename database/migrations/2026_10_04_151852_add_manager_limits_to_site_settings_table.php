<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->unsignedInteger('max_creators_per_manager')->default(20)->after('grid_users_sort');
            $table->boolean('manager_can_create_tags')->default(false)->after('max_creators_per_manager');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['max_creators_per_manager', 'manager_can_create_tags']);
        });
    }
};
