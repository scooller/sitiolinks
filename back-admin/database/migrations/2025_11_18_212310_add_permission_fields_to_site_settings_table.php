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
            // Límites de medios por galería
            $table->integer('max_media_per_gallery_creator')->default(20)->comment('Máximo de archivos por galería para creadores');
            $table->integer('max_media_per_gallery_vip')->nullable()->comment('Máximo de archivos por galería para VIP (null = ilimitado)');

            // Límites de tamaño de archivo (en MB)
            $table->integer('max_upload_size_creator')->default(5)->comment('Tamaño máximo de archivo en MB para creadores');
            $table->integer('max_upload_size_vip')->default(20)->comment('Tamaño máximo de archivo en MB para VIP');

            // Restricciones de moderación
            $table->boolean('require_approval_creator')->default(false)->comment('Galerías de creadores requieren aprobación');
            $table->boolean('require_approval_vip')->default(false)->comment('Galerías de VIP requieren aprobación');

            // Permisos de comentarios
            $table->boolean('allow_comments_creator')->default(true)->comment('Permitir comentarios en galerías de creadores');
            $table->boolean('allow_comments_vip')->default(true)->comment('Permitir comentarios en galerías de VIP');

            // Características VIP
            $table->boolean('vip_featured_profile')->default(true)->comment('Perfiles VIP destacados en home');
            $table->boolean('vip_priority_search')->default(true)->comment('VIP aparece primero en búsquedas');
            $table->integer('featured_galleries_vip')->default(3)->comment('Cuántas galerías de VIP pueden destacarse');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('site_settings', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};
