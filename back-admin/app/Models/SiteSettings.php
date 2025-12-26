<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class SiteSettings extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'site_title',
        'site_description',
        'avatar_width',
        'avatar_height',
        'thumbnail_width',
        'thumbnail_height',
        'grid_cols_desktop',
        'grid_cols_mobile',
        'grid_users_sort',
        'grid_roles_order',
        'grid_users_per_page',
        'max_galleries_creator',
        'max_galleries_vip',
        'max_media_per_gallery_creator',
        'max_media_per_gallery_vip',
        'max_upload_size_creator',
        'max_upload_size_vip',
        // Campos comentados - Funcionalidad futura
        // 'require_approval_creator',
        // 'require_approval_vip',
        // 'allow_comments_creator',
        // 'allow_comments_vip',
        'vip_featured_profile',
        'vip_priority_search',
        'vip_home_enabled',
        'vip_home_limit',
        'vip_badge_label',
        'vip_badge_icon',
        'featured_galleries_vip',
        'color_primary',
        'color_secondary',
        'color_success',
        'color_danger',
        'color_warning',
        'color_info',
        'color_light',
        'color_dark',
        'custom_css',
        'font_heading',
        'font_body',
        'watermark_enabled',
        'watermark_text',
        'watermark_font',
        'watermark_position',
        'watermark_opacity',
        'watermark_size',
        'qr_logo_size',
        'transition_type',
        'google_analytics_id',
        'warning_modal_enabled',
        'warning_modal_content',
        'warning_modal_title',
        'warning_modal_title_icon',
        'warning_modal_btn_text',
        'warning_modal_btn_icon',
        'warning_modal_btn_variant',
        'warning_modal_show_close_icon',
        'warning_modal_cancel_btn_enabled',
        'warning_modal_cancel_btn_text',
        'warning_modal_cancel_btn_icon',
        'warning_modal_cancel_btn_variant',
        'warning_modal_cancel_btn_url',
        'dashboard_widgets',
    ];

    protected $casts = [
        'avatar_width' => 'integer',
        'avatar_height' => 'integer',
        'thumbnail_width' => 'integer',
        'thumbnail_height' => 'integer',
        'grid_cols_desktop' => 'integer',
        'grid_cols_mobile' => 'integer',
        'grid_roles_order' => 'array',
        'grid_users_per_page' => 'integer',
        'max_galleries_creator' => 'integer',
        'max_galleries_vip' => 'integer',
        'max_media_per_gallery_creator' => 'integer',
        'max_media_per_gallery_vip' => 'integer',
        'max_upload_size_creator' => 'integer',
        'max_upload_size_vip' => 'integer',
        // Campos comentados - Funcionalidad futura
        // 'require_approval_creator' => 'boolean',
        // 'require_approval_vip' => 'boolean',
        // 'allow_comments_creator' => 'boolean',
        // 'allow_comments_vip' => 'boolean',
        'vip_featured_profile' => 'boolean',
        'vip_priority_search' => 'boolean',
        'vip_home_enabled' => 'boolean',
        'vip_home_limit' => 'integer',
        'featured_galleries_vip' => 'integer',
        'watermark_enabled' => 'boolean',
        'watermark_opacity' => 'integer',
        'watermark_size' => 'integer',
        'qr_logo_size' => 'integer',
        'warning_modal_enabled' => 'boolean',
        'warning_modal_show_close_icon' => 'boolean',
        'warning_modal_cancel_btn_enabled' => 'boolean',
        'dashboard_widgets' => 'array',
    ];

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('logo')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp']);

        $this->addMediaCollection('favicon')
            ->singleFile()
            ->acceptsMimeTypes(['image/x-icon', 'image/png']);

        $this->addMediaCollection('default_avatar')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }
}
