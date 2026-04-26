<?php

namespace App\GraphQL\Queries;

use App\Models\Cafe;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class CafesWithReviewsQuery extends Query
{
    protected $attributes = [
        'name' => 'cafesWithReviews',
        'description' => 'Obtiene cafes con sucursales y reseñas recientes',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Cafe'));
    }

    public function args(): array
    {
        return [
            'limit' => [
                'type' => Type::int(),
                'description' => 'Numero maximo de cafes a retornar',
                'defaultValue' => 6,
            ],
            'branches_per_cafe' => [
                'type' => Type::int(),
                'description' => 'Numero maximo de sucursales por cafe',
                'defaultValue' => 2,
            ],
            'reviews_per_branch' => [
                'type' => Type::int(),
                'description' => 'Numero maximo de reseñas por sucursal',
                'defaultValue' => 3,
            ],
            'city' => [
                'type' => Type::string(),
                'description' => 'Filtra por ciudad de sucursal',
            ],
            'min_rating' => [
                'type' => Type::float(),
                'description' => 'Calificacion minima (1 a 5)',
            ],
            'tag_id' => [
                'type' => Type::int(),
                'description' => 'Filtra por etiqueta de sucursal',
            ],
            'search' => [
                'type' => Type::string(),
                'description' => 'Busqueda por nombre o descripcion del cafe y nombre de sucursal',
            ],
            'order_by' => [
                'type' => Type::string(),
                'description' => 'Orden: name, latest o featured',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $limit = min(20, max(1, (int) ($args['limit'] ?? 6)));
        $branchesPerCafe = min(5, max(1, (int) ($args['branches_per_cafe'] ?? 2)));
        $reviewsPerBranch = min(10, max(1, (int) ($args['reviews_per_branch'] ?? 3)));
        $cityFilter = trim((string) ($args['city'] ?? ''));
        $minRatingArg = $args['min_rating'] ?? null;
        $minRating = is_numeric($minRatingArg)
            ? max(1, min(5, (float) $minRatingArg))
            : null;
        $minRatingInt = $minRating !== null ? (int) ceil($minRating) : null;
        $tagIdArg = $args['tag_id'] ?? null;
        $tagId = is_numeric($tagIdArg)
            ? max(1, (int) $tagIdArg)
            : null;
        $search = trim((string) ($args['search'] ?? ''));
        $orderBy = strtolower(trim((string) ($args['order_by'] ?? 'name')));

        $query = Cafe::query()
            ->whereHas('branches', function ($branchQuery) use ($cityFilter, $minRatingInt, $tagId) {
                $branchQuery->whereHas('reviews');

                if ($cityFilter !== '') {
                    $branchQuery->where('city', 'like', "%{$cityFilter}%");
                }

                if ($minRatingInt !== null) {
                    $branchQuery->whereHas('reviews', function ($reviewQuery) use ($minRatingInt) {
                        $reviewQuery->where('rating', '>=', $minRatingInt);
                    });
                }

                if ($tagId !== null) {
                    $branchQuery->whereHas('tags', function ($tagQuery) use ($tagId) {
                        $tagQuery->where('tags.id', $tagId);
                    });
                }
            })
            ->when($search !== '', function ($cafeQuery) use ($search) {
                $cafeQuery->where(function ($scopedQuery) use ($search) {
                    $scopedQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhereHas('branches', function ($branchQuery) use ($search) {
                            $branchQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('city', 'like', "%{$search}%");
                        });
                });
            })
            ->withCount('branches')
            ->with([
                'branches' => function ($branchQuery) use ($branchesPerCafe, $reviewsPerBranch, $cityFilter, $minRatingInt, $tagId) {
                    $branchQuery
                        ->whereHas('reviews')
                        ->withCount('reviews')
                        ->withAvg('reviews', 'rating')
                        ->orderByRaw('(select count(*) from `cafe_branch_reviews` where `cafe_branch_reviews`.`cafe_branch_id` = `cafe_branches`.`id`) desc')
                        ->limit($branchesPerCafe)
                        ->when($cityFilter !== '', function ($query) use ($cityFilter) {
                            $query->where('city', 'like', "%{$cityFilter}%");
                        })
                        ->when($minRatingInt !== null, function ($query) use ($minRatingInt) {
                            $query->whereHas('reviews', function ($reviewQuery) use ($minRatingInt) {
                                $reviewQuery->where('rating', '>=', $minRatingInt);
                            });
                        })
                        ->when($tagId !== null, function ($query) use ($tagId) {
                            $query->whereHas('tags', function ($tagQuery) use ($tagId) {
                                $tagQuery->where('tags.id', $tagId);
                            });
                        })
                        ->with([
                            'tags',
                            'reviews' => function ($reviewQuery) use ($reviewsPerBranch) {
                                $reviewQuery
                                    ->with('user.roles')
                                    ->latest()
                                    ->limit($reviewsPerBranch);
                            },
                        ]);
                },
            ]);

        if ($orderBy === 'latest') {
            $query->orderByDesc('created_at')->orderByDesc('id');
        } elseif ($orderBy === 'featured') {
            $query->orderByRaw('(select count(*) from `cafe_branch_reviews` inner join `cafe_branches` on `cafe_branches`.`id` = `cafe_branch_reviews`.`cafe_branch_id` where `cafe_branches`.`cafe_id` = `cafes`.`id`) desc')
                ->orderBy('name');
        } else {
            $query->orderBy('name');
        }

        return $query
            ->limit($limit)
            ->get();
    }
}
