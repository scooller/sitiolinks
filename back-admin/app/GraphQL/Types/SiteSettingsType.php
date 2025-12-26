<?php

namespace App\GraphQL\Types;

use App\Models\SiteSettings;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Type as GraphQLType;

class SiteSettingsType extends GraphQLType
{
    protected $attributes = [
        'name' => 'SiteSettings',
        'description' => 'Configuración del sitio',
        'model' => SiteSettings::class,
    ];

    public function fields(): array
    {
        return [
            'site_title' => [
                'type' => Type::string(),
            ],
            'site_description' => [
                'type' => Type::string(),
            ],
            'avatar_width' => [
                'type' => Type::int(),
            ],
            'avatar_height' => [
                'type' => Type::int(),
            ],
            'thumbnail_width' => [
                'type' => Type::int(),
            ],
            'thumbnail_height' => [
                'type' => Type::int(),
            ],
            'grid_cols_desktop' => [
                'type' => Type::int(),
            ],
            'grid_cols_mobile' => [
                'type' => Type::int(),
            ],
            'grid_users_sort' => [
                'type' => Type::string(),
                'description' => 'Orden de usuarios en el grid: newest | random',
            ],
            'grid_roles_order' => [
                'type' => Type::listOf(Type::string()),
                'selectable' => false,
                'resolve' => function (SiteSettings $settings) {
                    $roles = $settings->grid_roles_order ?? [];

                    return collect($roles)->pluck('role')->all();
                },
            ],
            'grid_users_per_page' => [
                'type' => Type::int(),
            ],
            'max_galleries_creator' => [
                'type' => Type::int(),
                'description' => 'Límite de galerías para usuarios creator',
            ],
            'max_galleries_vip' => [
                'type' => Type::int(),
                'description' => 'Límite de galerías para usuarios VIP (null = ilimitado)',
            ],
            'max_media_per_gallery_creator' => [
                'type' => Type::int(),
                'description' => 'Límite de medios por galería para creators',
            ],
            'max_media_per_gallery_vip' => [
                'type' => Type::int(),
                'description' => 'Límite de medios por galería para VIP (null = ilimitado)',
            ],
            'max_upload_size_creator' => [
                'type' => Type::int(),
                'description' => 'Tamaño máximo de archivo en MB para creators',
            ],
            'max_upload_size_vip' => [
                'type' => Type::int(),
                'description' => 'Tamaño máximo de archivo en MB para VIP',
            ],
            // Campos comentados - Funcionalidad futura
            /*
            'require_approval_creator' => [
                'type' => Type::boolean(),
                'description' => 'Galerías de creators requieren aprobación',
            ],
            'require_approval_vip' => [
                'type' => Type::boolean(),
                'description' => 'Galerías de VIP requieren aprobación',
            ],
            'allow_comments_creator' => [
                'type' => Type::boolean(),
                'description' => 'Permitir comentarios en galerías de creators',
            ],
            'allow_comments_vip' => [
                'type' => Type::boolean(),
                'description' => 'Permitir comentarios en galerías de VIP',
            ],
            */
            'vip_featured_profile' => [
                'type' => Type::boolean(),
                'description' => 'Perfiles VIP destacados en home',
            ],
            'vip_priority_search' => [
                'type' => Type::boolean(),
                'description' => 'VIP aparece primero en búsquedas',
            ],
            'vip_home_enabled' => [
                'type' => Type::boolean(),
                'description' => 'Mostrar sección de usuarios VIP en Home',
            ],
            'vip_home_limit' => [
                'type' => Type::int(),
                'description' => 'Cantidad de usuarios VIP a mostrar en Home',
            ],
            'vip_badge_label' => [
                'type' => Type::string(),
                'description' => 'Etiqueta del badge VIP en UI',
            ],
            'vip_badge_icon' => [
                'type' => Type::string(),
                'description' => 'Icono Font Awesome del badge VIP',
            ],
            'featured_galleries_vip' => [
                'type' => Type::int(),
                'description' => 'Número de galerías VIP que pueden destacarse',
            ],
            'default_avatar_url' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (SiteSettings $settings) {
                    return $settings->getFirstMediaUrl('default_avatar');
                },
            ],
            'logo_url' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (SiteSettings $settings) {
                    return $settings->getFirstMediaUrl('logo');
                },
            ],
            'favicon_url' => [
                'type' => Type::string(),
                'selectable' => false,
                'resolve' => function (SiteSettings $settings) {
                    return $settings->getFirstMediaUrl('favicon');
                },
            ],
            'qr_logo_size' => [
                'type' => Type::int(),
                'description' => 'Tamaño (px) del logo superpuesto en el QR del perfil',
            ],
            'transition_type' => [
                'type' => Type::string(),
                'description' => 'Tipo de transición de página: fade, slide, scale',
            ],
            'google_analytics_id' => [
                'type' => Type::string(),
                'description' => 'ID de Google Analytics (formato: G-XXXXXXXXXX o UA-XXXXXXXXX)',
            ],
            'custom_css' => [
                'type' => Type::string(),
            ],
            'primary_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_primary;
                },
            ],
            'secondary_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_secondary;
                },
            ],
            'success_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_success;
                },
            ],
            'danger_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_danger;
                },
            ],
            'warning_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_warning;
                },
            ],
            'info_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_info;
                },
            ],
            'light_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_light;
                },
            ],
            'dark_color' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->color_dark;
                },
            ],
            'heading_font' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->font_heading;
                },
            ],
            'body_font' => [
                'type' => Type::string(),
                'resolve' => function (SiteSettings $settings) {
                    return $settings->font_body;
                },
            ],
            'warning_modal_enabled' => [
                'type' => Type::boolean(),
                'description' => 'Si el modal de advertencia está activado',
            ],
            'warning_modal_content' => [
                'type' => Type::string(),
                'description' => 'Contenido del modal de advertencia',
            ],
            'warning_modal_title' => [
                'type' => Type::string(),
            ],
            'warning_modal_title_icon' => [
                'type' => Type::string(),
            ],
            'warning_modal_btn_text' => [
                'type' => Type::string(),
            ],
            'warning_modal_btn_icon' => [
                'type' => Type::string(),
            ],
            'warning_modal_btn_variant' => [
                'type' => Type::string(),
            ],
            'warning_modal_show_close_icon' => [
                'type' => Type::boolean(),
            ],
            'warning_modal_cancel_btn_enabled' => [
                'type' => Type::boolean(),
            ],
            'warning_modal_cancel_btn_text' => [
                'type' => Type::string(),
            ],
            'warning_modal_cancel_btn_icon' => [
                'type' => Type::string(),
            ],
            'warning_modal_cancel_btn_variant' => [
                'type' => Type::string(),
            ],
            'warning_modal_cancel_btn_url' => [
                'type' => Type::string(),
            ],
        ];
    }
}
