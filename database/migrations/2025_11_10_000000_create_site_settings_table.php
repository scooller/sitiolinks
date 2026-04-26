<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('site_settings')) {
            Schema::create('site_settings', function (Blueprint $table) {
                $table->id();
                $table->string('site_title')->nullable();
                $table->text('site_description')->nullable();
                $table->integer('avatar_width')->nullable();
                $table->integer('avatar_height')->nullable();
                $table->integer('thumbnail_width')->nullable();
                $table->integer('thumbnail_height')->nullable();
                $table->integer('grid_cols_desktop')->nullable();
                $table->integer('grid_cols_mobile')->nullable();
                $table->json('grid_roles_order')->nullable();
                $table->integer('grid_users_per_page')->nullable();
                $table->integer('max_media_per_gallery_creator')->nullable();
                $table->integer('max_media_per_gallery_vip')->nullable();
                $table->integer('max_upload_size_creator')->nullable();
                $table->integer('max_upload_size_vip')->nullable();
                $table->boolean('vip_featured_profile')->nullable();
                $table->boolean('vip_priority_search')->nullable();
                $table->boolean('vip_home_enabled')->nullable();
                $table->integer('vip_home_limit')->nullable();
                $table->string('vip_badge_label')->nullable();
                $table->string('vip_badge_icon')->nullable();
                $table->integer('featured_galleries_vip')->nullable();
                $table->string('color_primary')->nullable();
                $table->string('color_secondary')->nullable();
                $table->string('color_success')->nullable();
                $table->string('color_danger')->nullable();
                $table->string('color_warning')->nullable();
                $table->string('color_info')->nullable();
                $table->string('color_light')->nullable();
                $table->string('color_dark')->nullable();
                $table->text('custom_css')->nullable();
                $table->string('font_heading')->nullable();
                $table->string('font_body')->nullable();
                $table->boolean('watermark_enabled')->nullable();
                $table->string('watermark_text')->nullable();
                $table->string('watermark_position')->nullable();
                $table->unsignedInteger('watermark_opacity')->nullable();
                $table->integer('watermark_size')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('site_settings');
    }
};
