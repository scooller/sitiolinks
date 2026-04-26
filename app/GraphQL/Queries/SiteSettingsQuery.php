<?php

namespace App\GraphQL\Queries;

use App\Models\SiteSettings;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Cache;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class SiteSettingsQuery extends Query
{
    protected $attributes = [
        'name' => 'siteSettings',
        'description' => 'Obtiene la configuración del sitio',
    ];

    public function type(): Type
    {
        return GraphQL::type('SiteSettings');
    }

    public function args(): array
    {
        return [];
    }

    public function resolve($root, array $args)
    {
        // Cache site settings for 1 hour (3600 seconds)
        return Cache::remember('site_settings', 3600, function () {
            return SiteSettings::first();
        });
    }
}
