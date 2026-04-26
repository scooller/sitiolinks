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
            $table->integer('max_galleries_creator')->default(5)->after('grid_users_per_page')
                ->comment('Máximo de galerías que puede crear un usuario con rol creator');
            $table->integer('max_galleries_vip')->nullable()->after('max_galleries_creator')
                ->comment('Máximo de galerías para usuario VIP (null = ilimitado)');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['max_galleries_creator', 'max_galleries_vip']);
        });
    }
};
