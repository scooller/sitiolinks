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
        if (! Schema::hasColumn('site_settings', 'max_media_per_gallery_creator')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('max_media_per_gallery_creator')->default(20)->comment('Máximo de archivos por galería para creadores');
            });
        }

        if (! Schema::hasColumn('site_settings', 'max_media_per_gallery_vip')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('max_media_per_gallery_vip')->nullable()->comment('Máximo de archivos por galería para VIP (null = ilimitado)');
            });
        }

        if (! Schema::hasColumn('site_settings', 'max_upload_size_creator')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('max_upload_size_creator')->default(5)->comment('Tamaño máximo de archivo en MB para creadores');
            });
        }

        if (! Schema::hasColumn('site_settings', 'max_upload_size_vip')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('max_upload_size_vip')->default(20)->comment('Tamaño máximo de archivo en MB para VIP');
            });
        }

        if (! Schema::hasColumn('site_settings', 'require_approval_creator')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('require_approval_creator')->default(false)->comment('Galerías de creadores requieren aprobación');
            });
        }

        if (! Schema::hasColumn('site_settings', 'require_approval_vip')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('require_approval_vip')->default(false)->comment('Galerías de VIP requieren aprobación');
            });
        }

        if (! Schema::hasColumn('site_settings', 'allow_comments_creator')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('allow_comments_creator')->default(true)->comment('Permitir comentarios en galerías de creadores');
            });
        }

        if (! Schema::hasColumn('site_settings', 'allow_comments_vip')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('allow_comments_vip')->default(true)->comment('Permitir comentarios en galerías de VIP');
            });
        }

        if (! Schema::hasColumn('site_settings', 'vip_featured_profile')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('vip_featured_profile')->default(true)->comment('Perfiles VIP destacados en home');
            });
        }

        if (! Schema::hasColumn('site_settings', 'vip_priority_search')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->boolean('vip_priority_search')->default(true)->comment('VIP aparece primero en búsquedas');
            });
        }

        if (! Schema::hasColumn('site_settings', 'featured_galleries_vip')) {
            Schema::table('site_settings', function (Blueprint $table) {
                $table->integer('featured_galleries_vip')->default(3)->comment('Cuántas galerías de VIP pueden destacarse');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $columns = [
            'max_media_per_gallery_creator',
            'max_media_per_gallery_vip',
            'max_upload_size_creator',
            'max_upload_size_vip',
            'require_approval_creator',
            'require_approval_vip',
            'allow_comments_creator',
            'allow_comments_vip',
            'vip_featured_profile',
            'vip_priority_search',
            'featured_galleries_vip',
        ];

        foreach ($columns as $column) {
            if (Schema::hasColumn('site_settings', $column)) {
                Schema::table('site_settings', function (Blueprint $table) use ($column) {
                    $table->dropColumn($column);
                });
            }
        }
    }
};
