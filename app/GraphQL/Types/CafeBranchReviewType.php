<?php

declare(strict_types=1);

namespace App\GraphQL\Types;

use App\Models\CafeBranchReview;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Type as GraphQLType;

class CafeBranchReviewType extends GraphQLType
{
    protected $attributes = [
        'name' => 'CafeBranchReview',
        'description' => 'Reseña de una sucursal de cafe',
        'model' => CafeBranchReview::class,
    ];

    public function fields(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
            ],
            'cafe_branch_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'user_id' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'rating' => [
                'type' => Type::nonNull(Type::int()),
            ],
            'comment' => [
                'type' => Type::string(),
            ],
            'created_at' => [
                'type' => Type::string(),
                'resolve' => function (CafeBranchReview $review): ?string {
                    return $review->created_at?->format('Y-m-d H:i:s');
                },
            ],
            'user' => [
                'type' => GraphQL::type('User'),
                'description' => 'Usuario que escribio la reseña',
            ],
        ];
    }
}
