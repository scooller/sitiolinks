<?php

declare(strict_types=1);

namespace App\GraphQL\Queries;

use App\Models\Gallery;
use App\Models\Like;
use App\Services\GraphQLCache;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class GalleriesQuery extends Query
{
    protected $attributes = [
        'name' => 'galleries',
        'description' => 'Lista de galerías con filtros opcionales',
    ];

    public function type(): Type
    {
        return GraphQL::type('GalleryPaginator');
    }

    public function args(): array
    {
        return [
            'user_id' => [
                'type' => Type::int(),
                'description' => 'Filtrar por ID de usuario',
            ],
            'visibility' => [
                'type' => Type::string(),
                'description' => 'Filtrar por visibilidad: public, private, followers',
            ],
            'page' => [
                'type' => Type::int(),
                'description' => 'Número de página (default: 1)',
                'defaultValue' => 1,
            ],
            'per_page' => [
                'type' => Type::int(),
                'description' => 'Elementos por página (default: 12, max: 50)',
                'defaultValue' => 12,
            ],
            'search' => [
                'type' => Type::string(),
                'description' => 'Buscar por título o descripción',
            ],
            'sort_by' => [
                'type' => Type::string(),
                'description' => 'Ordenar por: "most_liked", "recent_likes", "order" (default)',
            ],
        ];
    }

    public function resolve($root, $args)
    {
        $page = $args['page'] ?? 1;
        $perPage = min($args['per_page'] ?? 12, 50); // Max 50 items per page

        $user = auth('web')->user();
        $roles = $user ? $user->roles->pluck('name')->all() : [];
        $hasAdmin = in_array('admin', $roles, true);
        $hasSuper = in_array('super_admin', $roles, true);
        $hasModerator = in_array('moderator', $roles, true);

        // Caching sólo para primera página sin filtros ni búsqueda
        $cacheable = $page === 1
            && empty($args['search'])
            && empty($args['user_id'])
            && empty($args['visibility']);

        // Relaciones necesarias
        $with = ['user.roles'];
        if ($page === 1) { // media en primera página únicamente para reducir peso
            $with[] = 'media';
        }
        $query = Gallery::with($with)->withCount('likes')->orderBy('order');

        if (isset($args['user_id'])) {
            $query->where('user_id', $args['user_id']);
        }

        // VISIBILIDAD & PERMISOS con SQL para paginar directamente
        if (isset($args['visibility'])) {
            $query->where('visibility', $args['visibility']);
        } else {
            if (! $user) {
                $query->where('visibility', Gallery::VISIBILITY_PUBLIC)
                    ->where('status', Gallery::STATUS_APPROVED);
            } elseif (! ($hasAdmin || $hasSuper)) {
                $query->where(function ($outer) use ($user, $hasModerator) {
                    $outer->where('user_id', $user->id) // propias siempre
                        ->orWhere(function ($q) use ($hasModerator) { // públicas aprobadas (si moderator también pendientes/rechazadas)
                            $q->where('visibility', Gallery::VISIBILITY_PUBLIC)
                                ->where(function ($s) use ($hasModerator) {
                                    if ($hasModerator) {
                                        $s->whereIn('status', [Gallery::STATUS_APPROVED, Gallery::STATUS_PENDING, Gallery::STATUS_REJECTED]);
                                    } else {
                                        $s->where('status', Gallery::STATUS_APPROVED);
                                    }
                                });
                        })
                        ->orWhere(function ($q) use ($user) { // privadas permitidas
                            $q->where('visibility', Gallery::VISIBILITY_PRIVATE)
                                ->where(function ($inner) use ($user) {
                                    $inner->where('user_id', $user->id)
                                        ->orWhereExists(function ($sub) use ($user) {
                                            $sub->selectRaw('1')
                                                ->from('gallery_allowed_users as gau')
                                                ->whereColumn('gau.gallery_id', 'galleries.id')
                                                ->where('gau.user_id', $user->id);
                                        });
                                });
                        })
                        ->orWhere(function ($q) use ($user) { // seguidores
                            $q->where('visibility', Gallery::VISIBILITY_FOLLOWERS)
                                ->where(function ($inner) use ($user) {
                                    $inner->where('user_id', $user->id)
                                        ->orWhereExists(function ($sub) use ($user) {
                                            $sub->selectRaw('1')
                                                ->from('user_follower as uf')
                                                ->whereColumn('uf.following_id', 'galleries.user_id')
                                                ->where('uf.follower_id', $user->id);
                                        });
                                });
                        });
                });
            }
            // admin/super: sin restricciones
        }

        // Búsqueda por título o descripción
        if (isset($args['search']) && ! empty($args['search'])) {
            $search = $args['search'];
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Ordenamiento
        if (isset($args['sort_by'])) {
            switch ($args['sort_by']) {
                case 'most_liked':
                    $query->orderByDesc('likes_count');
                    break;
                case 'recent_likes':
                    // Ordenar por el like más reciente. Requiere una subconsulta.
                    $query->orderByDesc(
                        Like::select('created_at')
                            ->whereColumn('gallery_id', 'galleries.id')
                            ->latest()
                            ->take(1)
                    );
                    break;
                default:
                    $query->orderBy('order');
                    break;
            }
        } else {
            $query->orderBy('order');
        }

        // Paginación directa SQL
        $paginator = $query->paginate($perPage, ['*'], 'page', max(1, $page));
        $items = collect($paginator->items());
        $total = $paginator->total();
        $currentPage = $paginator->currentPage();
        $lastPage = $paginator->lastPage();
        $offset = $paginator->firstItem() ? ($paginator->firstItem() - 1) : 0;

        if ($cacheable) {
            return GraphQLCache::remember([
                'query' => 'galleries',
                'per_page' => $perPage,
                'page' => 1,
                'auth' => $user ? 'yes' : 'no',
            ], 60, function () use ($items, $currentPage, $total, $offset, $lastPage, $perPage) {
                return [
                    'data' => $items,
                    'paginatorInfo' => [
                        'count' => $items->count(),
                        'currentPage' => $currentPage,
                        'firstItem' => $total > 0 ? $offset + 1 : null,
                        'hasMorePages' => $currentPage < $lastPage,
                        'lastItem' => $total > 0 ? min($offset + $perPage, $total) : null,
                        'lastPage' => $lastPage,
                        'perPage' => $perPage,
                        'total' => $total,
                    ],
                ];
            });
        }

        return [
            'data' => $items,
            'paginatorInfo' => [
                'count' => $items->count(),
                'currentPage' => $currentPage,
                'firstItem' => $total > 0 ? $offset + 1 : null,
                'hasMorePages' => $currentPage < $lastPage,
                'lastItem' => $total > 0 ? min($offset + $perPage, $total) : null,
                'lastPage' => $lastPage,
                'perPage' => $perPage,
                'total' => $total,
            ],
        ];
    }
}
