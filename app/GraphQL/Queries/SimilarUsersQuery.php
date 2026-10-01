<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\User;
use App\Services\GraphQLCache;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;
use Spatie\Permission\Exceptions\RoleDoesNotExist;

class SimilarUsersQuery extends Query
{
    protected $attributes = [
        'name' => 'similarUsers',
        'description' => 'Obtiene creadores similares ordenando primero perfiles VIP',
    ];

    public function type(): Type
    {
        return GraphQL::type('UserPaginator');
    }

    public function args(): array
    {
        return [
            'username' => [
                'type' => Type::string(),
                'description' => 'Username del perfil base',
            ],
            'user_id' => [
                'type' => Type::int(),
                'description' => 'ID del usuario base',
            ],
            'page' => [
                'type' => Type::int(),
                'description' => 'Número de página (default 1)',
                'defaultValue' => 1,
            ],
            'per_page' => [
                'type' => Type::int(),
                'description' => 'Elementos por página (default 12)',
                'defaultValue' => 12,
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $targetUser = null;

        if (! empty($args['username'])) {
            $targetUser = User::where('username', $args['username'])->with('tags')->first();
        } elseif (! empty($args['user_id'])) {
            $targetUser = User::where('id', $args['user_id'])->with('tags')->first();
        }

        $page = max(1, $args['page'] ?? 1);
        $perPage = min(50, max(1, $args['per_page'] ?? 12));

        if (! $targetUser) {
            return [
                'data' => [],
                'paginatorInfo' => [
                    'count' => 0,
                    'currentPage' => 1,
                    'firstItem' => null,
                    'hasMorePages' => false,
                    'lastItem' => null,
                    'lastPage' => 1,
                    'perPage' => $perPage,
                    'total' => 0,
                ],
            ];
        }

        $tagIds = $targetUser->tags->pluck('id')->filter()->all();
        $targetGender = $targetUser->gender;
        $targetNationality = $targetUser->nationality;

        $q = User::query()->with(['tags', 'links', 'roles'])
            ->where('users.id', '!=', $targetUser->id);

        $currentUser = auth('web')->user();
        $isAdminOrModerator = $currentUser && $currentUser->hasAnyRole(['admin', 'moderator']);

        if (! $isAdminOrModerator) {
            try {
                $q->role('creator');
            } catch (RoleDoesNotExist $e) {
            }

            app(\App\Services\GeoLocationService::class)->applyCountryBlockScope($q, $currentUser);
        }

        // 1. VIPs primero
        $q->orderByRaw(
            "EXISTS (SELECT 1 FROM model_has_roles mhr JOIN roles r ON r.id = mhr.role_id WHERE mhr.model_type = ? AND mhr.model_id = users.id AND r.name = 'vip') DESC",
            [User::class]
        );

        // 2. Coincidencia de tags
        if (! empty($tagIds)) {
            $tagIdsStr = implode(',', array_map('intval', $tagIds));
            $q->orderByRaw(
                "(SELECT COUNT(*) FROM user_tag WHERE user_tag.user_id = users.id AND user_tag.tag_id IN ({$tagIdsStr})) DESC"
            );
        }

        // 3. Coincidencia de género
        if (! empty($targetGender)) {
            $q->orderByRaw(
                '(CASE WHEN users.gender = ? THEN 1 ELSE 0 END) DESC',
                [$targetGender]
            );
        }

        // 4. Coincidencia de nacionalidad
        if (! empty($targetNationality)) {
            $q->orderByRaw(
                '(CASE WHEN users.nationality = ? THEN 1 ELSE 0 END) DESC',
                [$targetNationality]
            );
        }

        // 5. Vistas y fecha
        $q->orderBy('users.views', 'desc')
            ->orderBy('users.created_at', 'desc');

        $paginator = $q->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => $paginator->items(),
            'paginatorInfo' => [
                'count' => $paginator->count(),
                'currentPage' => $paginator->currentPage(),
                'firstItem' => $paginator->firstItem(),
                'hasMorePages' => $paginator->hasMorePages(),
                'lastItem' => $paginator->lastItem(),
                'lastPage' => $paginator->lastPage(),
                'perPage' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ];
    }
}
