<?php

namespace App\GraphQL\Queries;

use App\Models\Tag;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Cache;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class TagsQuery extends Query
{
    protected $attributes = [
        'name' => 'tags',
        'description' => 'Lista de tags',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Tag'));
    }

    public function args(): array
    {
        return [
            'onlySelectable' => [
                'type' => Type::boolean(),
                'description' => 'Si es true, solo retorna tags no fijos (is_fixed = false)',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $onlySelectable = $args['onlySelectable'] ?? false;
        $cacheKey = $onlySelectable ? 'tags_selectable' : 'tags_all';

        // Cache tags for 30 minutes (1800 seconds)
        return Cache::remember($cacheKey, 1800, function () use ($onlySelectable) {
            $q = Tag::query();
            if ($onlySelectable) {
                $q->where('is_fixed', false);
            }

            return $q->orderByDesc('weight')->get();
        });
    }
}
