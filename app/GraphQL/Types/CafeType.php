<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\Cafe;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class CafeType extends GraphQLType
{
    protected $attributes = [
        'name' => 'Cafe',
        'description' => 'Cafe con sus sucursales y reseñas',
        'model' => Cafe::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
            ],
            'slug' => [
                'type' => Type::string(),
            ],
            'description' => [
                'type' => Type::string(),
            ],
            'website' => [
                'type' => Type::string(),
            ],
            'image_url' => [
                'type' => Type::string(),
                'description' => 'URL de la imagen del cafe',
                'selectable' => false,
                'resolve' => function (Cafe $cafe) {
                    $media = $cafe->media()
                        ->where('collection_name', 'cafe_image')
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->first();

                    if ($media) {
                        return rtrim((string) config('app.url'), '/')
                            .route('cafe.media', ['media' => $media->id], false);
                    }

                    return null;
                },
            ],
            'branches_count' => [
                'type' => Type::int(),
                'description' => 'Cantidad de sucursales del cafe',
                'resolve' => function (Cafe $cafe): int {
                    if (isset($cafe->branches_count)) {
                        return (int) $cafe->branches_count;
                    }

                    return $cafe->branches()->count();
                },
            ],
            'reviews_count' => [
                'type' => Type::int(),
                'description' => 'Cantidad total de reseñas del cafe',
                'resolve' => function (Cafe $cafe): int {
                    $branches = $cafe->relationLoaded('branches')
                        ? $cafe->branches
                        : $cafe->branches()->withCount('reviews')->get();

                    return (int) $branches->sum('reviews_count');
                },
            ],
            'average_rating' => [
                'type' => Type::float(),
                'description' => 'Promedio ponderado de calificaciones del cafe',
                'resolve' => function (Cafe $cafe): ?float {
                    $branches = $cafe->relationLoaded('branches')
                        ? $cafe->branches
                        : $cafe->branches()->withCount('reviews')->withAvg('reviews', 'rating')->get();

                    $totalReviews = (int) $branches->sum('reviews_count');
                    if ($totalReviews === 0) {
                        return null;
                    }

                    $weightedSum = (float) $branches->sum(function ($branch) {
                        return ((float) ($branch->reviews_avg_rating ?? 0)) * ((int) ($branch->reviews_count ?? 0));
                    });

                    return round($weightedSum / $totalReviews, 1);
                },
            ],
            'branches' => [
                'type' => Type::listOf(GraphQL::type('CafeBranch')),
                'description' => 'Sucursales del cafe',
            ],
        ];
    }
}
