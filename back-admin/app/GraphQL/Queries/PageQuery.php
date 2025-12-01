<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Page;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class PageQuery extends Query
{
    protected $attributes = [
        'name' => 'page',
        'description' => 'Obtener una página por slug',
    ];

    public function type(): Type
    {
        return GraphQL::type('Page');
    }

    public function args(): array
    {
        return [
            'slug' => [
                'type' => Type::nonNull(Type::string()),
                'description' => 'Slug único de la página',
            ],
        ];
    }

    public function resolve($root, array $args)
    {
        $page = Page::where('slug', $args['slug'])
            ->published()
            ->first();

        return $page; // Puede ser null si no existe; GraphQL devolverá data.page = null
    }
}
