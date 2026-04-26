<?php

namespace App\GraphQL\Queries;

use App\Models\Cafe;
use GraphQL\Type\Definition\Type;
use Illuminate\Validation\ValidationException;
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
                'type' => Type::id(),
                'description' => 'ID del cafe (compatibilidad)',
            ],
            'slug' => [
                'type' => Type::string(),
                'description' => 'Slug del cafe',
            ],
        ];
    }

    public function resolve($root, array $args): Cafe
    {
        if (! isset($args['id']) && ! isset($args['slug'])) {
            throw ValidationException::withMessages([
                'cafe' => 'Debe enviar id o slug.',
            ]);
        }

        $query = Cafe::query()
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
            ]);

        if (isset($args['slug']) && (string) $args['slug'] !== '') {
            return $query->where('slug', (string) $args['slug'])->firstOrFail();
        }

        return $query->whereKey((int) $args['id'])->firstOrFail();
    }
}
