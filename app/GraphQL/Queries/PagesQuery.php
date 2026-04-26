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

class PagesQuery extends Query
{
    protected $attributes = [
        'name' => 'pages',
        'description' => 'Lista de páginas publicadas',
    ];

    public function type(): Type
    {
        return Type::listOf(GraphQL::type('Page'));
    }

    public function args(): array
    {
        return [
            'status' => [
                'type' => Type::string(),
                'description' => 'Filtrar por estado (draft, published)',
            ],
            'is_system' => [
                'type' => Type::boolean(),
                'description' => 'Filtrar solo páginas del sistema',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $select = $fields->getSelect();

        $query = Page::select($select)->ordered();

        // Por defecto solo páginas publicadas para usuarios públicos
        if (! isset($args['status'])) {
            $query->published();
        } elseif ($args['status']) {
            $query->where('status', $args['status']);
        }

        if (isset($args['is_system'])) {
            $query->where('is_system', $args['is_system']);
        }

        return $query->get();
    }
}
