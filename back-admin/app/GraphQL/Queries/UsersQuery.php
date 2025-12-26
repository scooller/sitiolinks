<?php

namespace App\GraphQL\Queries;

use App\Models\SiteSettings;
use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Rebing\GraphQL\Support\Query;

class UsersQuery extends Query
{
    protected $attributes = [
        'name' => 'users',
        'description' => 'Lista de usuarios',
    ];

    public function type(): Type
    {
        return GraphQL::type('UserPaginator');
    }

    public function args(): array
    {
        return [
            'page' => [
                'type' => Type::int(),
                'description' => 'Número de página (default 1)',
                'defaultValue' => 1,
            ],
            'per_page' => [
                'type' => Type::int(),
                'description' => 'Elementos por página (max 100, default 12)',
                'defaultValue' => 12,
            ],
            'limit' => [
                'type' => Type::int(),
                'description' => 'Límite de resultados (DEPRECATED - usar per_page)',
            ],
            'search' => [
                'type' => Type::string(),
                'description' => 'Buscar por nombre o username',
            ],
            'role' => [
                'type' => Type::string(),
                'description' => 'Filtrar por rol (creator, admin, moderator, etc.)',
            ],
            'gender' => [
                'type' => Type::string(),
                'description' => 'Filtrar por género (hombre, mujer, trans, otro)',
            ],
            'nationality' => [
                'type' => Type::string(),
                'description' => 'Filtrar por código de país',
            ],
            'min_price' => [
                'type' => Type::float(),
                'description' => 'Precio mínimo',
            ],
            'max_price' => [
                'type' => Type::float(),
                'description' => 'Precio máximo',
            ],
            'tagId' => [
                'type' => Type::int(),
                'description' => 'Filtrar por ID de tag',
            ],
            'tag' => [
                'type' => Type::string(),
                'description' => 'Filtrar por nombre exacto de tag',
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $cacheable = ($args['page'] ?? 1) === 1 && empty($args['search']);

        // Eager load relaciones para evitar N+1
        $q = User::query()->with(['tags', 'links', 'roles']);

        $currentUser = auth('web')->user();
        $isAdminOrModerator = $currentUser && $currentUser->hasAnyRole(['admin', 'moderator']);

        $viewerCountryHeader = strtoupper((string) (request()->header('CF-IPCountry') ?? request()->header('X-Country-Code') ?? ''));
        $viewerCountry = $viewerCountryHeader;
        if (! $viewerCountry) {
            $ipHeader = (string) (request()->header('CF-Connecting-IP') ?? request()->header('X-Forwarded-For') ?? '');
            $ip = $ipHeader ? trim(explode(',', $ipHeader)[0]) : request()->ip();
            $validPublicIp = filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) ? $ip : null;
            $ipToCheck = $validPublicIp ?: request()->ip();
            $detected = Cache::remember('ip_country_'.$ipToCheck, now()->addHours(12), function () use ($ipToCheck) {
                try {
                    $res = Http::timeout(3)->get('https://ipapi.co/'.$ipToCheck.'/json/');
                    $code = strtoupper((string) ($res->json('country') ?? ''));
                    return $code ?: null;
                } catch (\Throwable $e) {
                    return null;
                }
            });
            $viewerCountry = $detected ?: '';
        }

        if (! $isAdminOrModerator) {
            // Mostrar solo creadores en todos los listados públicos
            try { $q->role('creator'); } catch (\Spatie\Permission\Exceptions\RoleDoesNotExist $e) {}
            $q->where(function ($w) use ($viewerCountry, $currentUser) {
                $w->where('country_block', false)
                    ->orWhereNull('country_block');
                if ($viewerCountry) {
                    $w->orWhere('country', '!=', $viewerCountry);
                    // No incluir usuarios normales por defecto
                }
            });
        }

        // Búsqueda por texto
        if (! empty($args['search'])) {
            $search = $args['search'];
            $q->where(function ($qq) use ($search) {
                $qq->where('username', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Filtro por rol
        if (! empty($args['role'])) {
            try {
                $q->role($args['role']);
            } catch (\Spatie\Permission\Exceptions\RoleDoesNotExist $e) {
                // Si el rol no existe, devolver paginador vacío
                return [
                    'data' => [],
                    'paginatorInfo' => [
                        'count' => 0,
                        'currentPage' => 1,
                        'firstItem' => null,
                        'lastItem' => null,
                        'lastPage' => 1,
                        'perPage' => $args['per_page'] ?? 12,
                        'total' => 0,
                    ],
                ];
            }
        }

        // Filtro por género
        if (! empty($args['gender'])) {
            $q->where('gender', $args['gender']);
        }

        // Filtro por nacionalidad
        if (! empty($args['nationality'])) {
            $q->where('nationality', $args['nationality']);
        }

        // Filtro por precio
        if (isset($args['min_price'])) {
            $q->where('price_from', '>=', $args['min_price']);
        }
        if (isset($args['max_price'])) {
            $q->where('price_from', '<=', $args['max_price']);
        }

        // Filtro por tag (ID)
        if (! empty($args['tagId'])) {
            $tagId = (int) $args['tagId'];
            $q->whereHas('tags', function ($qq) use ($tagId) {
                $qq->where('tags.id', $tagId);
            });
        }

        // Filtro por tag (nombre)
        if (! empty($args['tag'])) {
            $tagName = trim((string) $args['tag']);
            $tagNameLower = mb_strtolower($tagName);
            $q->whereHas('tags', function ($qq) use ($tagNameLower) {
                $qq->whereRaw('LOWER(tags.name) = ?', [$tagNameLower]);
            });
        }

        // Prioridad VIP en búsquedas/listados si está habilitado en SiteSettings
        $settings = SiteSettings::first();
        if ($settings?->vip_priority_search) {
            $q->orderByRaw(
                "EXISTS (SELECT 1 FROM model_has_roles mhr JOIN roles r ON r.id = mhr.role_id WHERE mhr.model_type = ? AND mhr.model_id = users.id AND r.name = 'vip') DESC",
                [User::class]
            );
        }

        // Orden global de usuarios según configuración del sitio
        $sortMode = $settings?->grid_users_sort ?? 'newest';
        switch ($sortMode) {
            case 'random':
                // Evitar cachear resultados aleatorios
                $cacheable = false;
                $q->orderByRaw('RAND()');
                break;
            case 'oldest':
                $q->orderBy('created_at', 'asc');
                break;
            case 'most_views':
                $q->orderBy('views', 'desc');
                break;
            case 'least_views':
                $q->orderBy('views', 'asc');
                break;
            case 'name':
                $q->orderByRaw("LOWER(name) ASC");
                break;
            case 'username':
                $q->orderByRaw("LOWER(username) ASC");
                break;
            case 'newest':
            default:
                $q->orderBy('created_at', 'desc');
                break;
        }

        // Paginación
        $page = max(1, $args['page'] ?? 1);
        $perPage = min(100, max(1, $args['per_page'] ?? $args['limit'] ?? 12));

        if ($cacheable) {
            return \App\Services\GraphQLCache::remember([
                'query' => 'users',
                'role' => $args['role'] ?? null,
                'gender' => $args['gender'] ?? null,
                'nationality' => $args['nationality'] ?? null,
                'min_price' => $args['min_price'] ?? null,
                'max_price' => $args['max_price'] ?? null,
                'tagId' => $args['tagId'] ?? null,
                'tag' => $args['tag'] ?? null,
                'per_page' => $perPage,
            ], 60, function () use ($q, $perPage, $page) {
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
            });
        }

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
