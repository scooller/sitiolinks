<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('site_settings', 'vip_home_enabled')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('vip_home_enabled')->default(true)->after('vip_priority_search')->comment('Mostrar sección de usuarios VIP en Home');
            });
        }

        if (! Schema::hasColumn('site_settings', 'vip_home_limit')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('vip_home_limit')->default(10)->after('vip_home_enabled')->comment('Cantidad de usuarios VIP a mostrar en Home');
            });
        }

        if (! Schema::hasColumn('site_settings', 'vip_badge_label')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->string('vip_badge_label')->nullable()->after('vip_home_limit')->comment('Etiqueta del badge VIP en UI');
            });
        }

        if (! Schema::hasColumn('site_settings', 'vip_badge_icon')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->string('vip_badge_icon')->nullable()->after('vip_badge_label')->comment('Icono FA del badge VIP (ej: "fas fa-crown")');
            });
        }
    }

    public function down(): void
    {
        foreach (['vip_home_enabled', 'vip_home_limit', 'vip_badge_label', 'vip_badge_icon'] as $column) {
            if (Schema::hasColumn('site_settings', $column)) {
                Schema::table('site_settings', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
