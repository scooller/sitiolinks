<?php

namespace App\GraphQL\Queries;

use App\Models\Gallery;
use App\Models\SiteSettings;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class FeaturedGalleriesQuery extends Query
{
    protected $attributes = [
        'name' => 'featuredGalleries',
        'description' => 'Obtener galerías destacadas (públicas y aprobadas)',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Gallery'));
    }

    public function args(): array
    {
        return [
            'limit' => [
                'name' => 'limit',
                'type' => Type::int(),
                'description' => 'Número máximo de galerías a retornar',
                'defaultValue' => 12,
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        // Verificar si la funcionalidad está activada
        $settings = SiteSettings::first();
        if (! $settings || ! $settings->vip_featured_profile) {
            return [];
        }

        $query = Gallery::with(['user.roles', 'media'])
            ->where('is_featured', true)
            ->where('status', Gallery::STATUS_APPROVED)
            ->where('visibility', Gallery::VISIBILITY_PUBLIC)
            ->orderByDesc('featured_at')
            ->limit($args['limit']);

        return $query->get();
    }
}
