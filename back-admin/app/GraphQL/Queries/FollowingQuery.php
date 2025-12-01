<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\User;
use Closure;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;
use Rebing\GraphQL\Support\SelectFields;

class FollowingQuery extends Query
{
    protected $attributes = [
        'name' => 'following',
        'description' => 'Obtiene los usuarios que sigue un usuario con paginación y búsqueda',
    ];

    public function type(): Type
    {
        return GraphQL::type('UserPaginator');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'type' => Type::nonNull(Type::id()),
                'description' => 'ID del usuario',
            ],
            'page' => [
                'type' => Type::int(),
                'description' => 'Número de página',
                'defaultValue' => 1,
            ],
            'per_page' => [
                'type' => Type::int(),
                'description' => 'Resultados por página (máximo 50)',
                'defaultValue' => 20,
            ],
            'search' => [
                'type' => Type::string(),
                'description' => 'Buscar por username o descripción',
            ],
            'tag' => [
                'type' => Type::string(),
                'description' => 'Filtrar por nombre de tag',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo, Closure $getSelectFields)
    {
        /** @var SelectFields $fields */
        $fields = $getSelectFields();
        $with = $fields->getRelations();

        $user = User::findOrFail($args['user_id']);
        $perPage = min($args['per_page'] ?? 20, 50);
        $page = $args['page'] ?? 1;

        $query = $user->following();

        // Aplicar búsqueda si existe
        if (! empty($args['search'])) {
            $search = '%'.$args['search'].'%';
            $query->where(function ($q) use ($search) {
                $q->where('users.username', 'like', $search)
                    ->orWhere('users.description', 'like', $search);
            });
        }

        // Filtrar por tag si existe
        if (! empty($args['tag'])) {
            $tagName = $args['tag'];
            $query->whereHas('tags', function ($q) use ($tagName) {
                $q->where('tags.name', $tagName);
            });
        }

        $paginator = $query->with($with)->paginate($perPage, ['users.*'], 'page', $page);

        return [
            'data' => $paginator->items(),
            'paginatorInfo' => [
                'count' => $paginator->count(),
                'currentPage' => $paginator->currentPage(),
                'firstItem' => $paginator->firstItem(),
                'lastItem' => $paginator->lastItem(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
                'hasMorePages' => $paginator->hasMorePages(),
            ],
        ];
    }
}
