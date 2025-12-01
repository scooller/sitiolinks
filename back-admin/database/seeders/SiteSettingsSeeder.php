<?php

namespace Database\Seeders;

use App\Models\SiteSettings;
use Illuminate\Database\Seeder;

class SiteSettingsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        SiteSettings::create([
            'site_title' => 'Link Persons',
            'site_description' => 'Conecta con personas y comparte tus enlaces',
            'avatar_width' => 200,
            'avatar_height' => 200,
            'thumbnail_width' => 368,
            'thumbnail_height' => 232,
            'grid_cols_desktop' => 4,
            'grid_cols_mobile' => 2,
            // Estructura esperada por Repeater: array de objetos con clave 'role'
            'grid_roles_order' => [
                ['role' => 'creator'],
                ['role' => 'moderator'],
                ['role' => 'admin'],
                ['role' => 'user'],
            ],
            'grid_users_per_page' => 12,
            'watermark_enabled' => false,
            'watermark_text' => 'Link Persons',
            'watermark_position' => 'bottom-right',
            'watermark_opacity' => 50,
            'watermark_size' => 20,
        ]);
    }
}
