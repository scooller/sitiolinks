<?php

namespace App\GraphQL\Queries;

use App\Models\Cafe;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class CafeDetailQuery extends Query
{
    protected $attributes = [
        'name' => 'cafeDetail',
        'description' => 'Obtiene el detalle de un cafe con sus sucursales, creadores y reseñas',
    ];

    public function type(): Type
    {
        return GraphQL::type('Cafe');
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del cafe',
            ],
        ];
    }

    public function resolve($root, array $args): Cafe
    {
        return Cafe::query()
            ->withCount('branches')
            ->with([
                'branches' => function ($branchQuery): void {
                    $branchQuery
                        ->withCount('reviews')
                        ->withAvg('reviews', 'rating')
                        ->with([
                            'tags',
                            'creators.roles',
                            'reviews' => function ($reviewQuery): void {
                                $reviewQuery
                                    ->with('user.roles')
                                    ->latest();
                            },
                        ])
                        ->orderBy('name');
                },
            ])
            ->findOrFail((int) $args['id']);
    }
}
