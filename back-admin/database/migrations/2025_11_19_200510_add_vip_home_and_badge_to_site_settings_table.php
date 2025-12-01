<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->boolean('vip_home_enabled')->default(true)->after('vip_priority_search')->comment('Mostrar sección de usuarios VIP en Home');
            $table->integer('vip_home_limit')->default(10)->after('vip_home_enabled')->comment('Cantidad de usuarios VIP a mostrar en Home');
            $table->string('vip_badge_label')->nullable()->after('vip_home_limit')->comment('Etiqueta del badge VIP en UI');
            $table->string('vip_badge_icon')->nullable()->after('vip_badge_label')->comment('Icono FA del badge VIP (ej: "fas fa-crown")');
        });
    }

    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn(['vip_home_enabled', 'vip_home_limit', 'vip_badge_label', 'vip_badge_icon']);
        });
    }
};
