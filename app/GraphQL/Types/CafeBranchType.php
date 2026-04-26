<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\CafeBranch;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class CafeBranchType extends GraphQLType
{
    protected $attributes = [
        'name' => 'CafeBranch',
        'description' => 'Sucursal de un cafe',
        'model' => CafeBranch::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'cafe_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'name' => [
                'type' => Type::nonNull(Type::string()),
            ],
            'description' => [
                'type' => Type::string(),
            ],
            'address' => [
                'type' => Type::string(),
            ],
            'city' => [
                'type' => Type::string(),
            ],
            'state' => [
                'type' => Type::string(),
            ],
            'postal_code' => [
                'type' => Type::string(),
            ],
            'phone' => [
                'type' => Type::string(),
            ],
            'website' => [
                'type' => Type::string(),
            ],
            'google_maps_url' => [
                'type' => Type::string(),
            ],
            'menu_qr_url' => [
                'type' => Type::string(),
            ],
            'image_url' => [
                'type' => Type::string(),
                'description' => 'URL de la imagen de la sucursal',
                'selectable' => false,
                'resolve' => function (CafeBranch $branch) {
                    $media = $branch->media()
                        ->where('collection_name', 'branch_image')
                        ->orderByDesc('created_at')
                        ->orderByDesc('id')
                        ->first();

                    if ($media) {
                        return rtrim((string) config('app.url'), '/')
                            .route('branch.media', ['media' => $media->id], false);
                    }

                    return null;
                },
            ],
            'entry_price' => [
                'type' => Type::float(),
                'resolve' => function (CafeBranch $branch): ?float {
                    return $branch->entry_price !== null ? (float) $branch->entry_price : null;
                },
            ],
            'reviews_count' => [
                'type' => Type::int(),
                'resolve' => function (CafeBranch $branch): int {
                    if (isset($branch->reviews_count)) {
                        return (int) $branch->reviews_count;
                    }

                    return $branch->reviews()->count();
                },
            ],
            'average_rating' => [
                'type' => Type::float(),
                'resolve' => function (CafeBranch $branch): ?float {
                    if (isset($branch->reviews_avg_rating)) {
                        return $branch->reviews_avg_rating !== null ? round((float) $branch->reviews_avg_rating, 1) : null;
                    }

                    $avg = $branch->reviews()->avg('rating');

                    return $avg !== null ? round((float) $avg, 1) : null;
                },
            ],
            'reviews' => [
                'type' => Type::listOf(GraphQL::type('CafeBranchReview')),
            ],
            'tags' => [
                'type' => Type::listOf(GraphQL::type('Tag')),
            ],
            'creators' => [
                'type' => Type::listOf(GraphQL::type('User')),
            ],
        ];
    }
}
