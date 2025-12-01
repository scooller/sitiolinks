<?php

namespace App\GraphQL\Queries;

use App\Models\User;
use GraphQL\Type\Definition\ResolveInfo;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;

class UserQuery extends Query
{
    protected $attributes = [
        'name' => 'user',
        'description' => 'Obtiene un usuario por id o username',
    ];

    public function type(): Type
    {
        return GraphQL::type('User');
    }

    public function args(): array
    {
        return [
            'id' => [
                'type' => Type::id(),
            ],
            'username' => [
                'type' => Type::string(),
            ],
        ];
    }

    public function resolve($root, array $args, $context, ResolveInfo $resolveInfo)
    {
        $q = User::query()->with(['tags', 'links', 'roles']);

        $user = null;
        if (isset($args['id'])) {
            $user = $q->find($args['id']);
        } elseif (isset($args['username'])) {
            $user = $q->where('username', $args['username'])->first();
        }

        if (! $user) {
            return null;
        }

        // Verificar autorización para ver el perfil
        $currentUser = auth('web')->user();

        // Los perfiles solo son públicos para 'admin', 'moderator' y 'creator'
        $allowedRoles = ['admin', 'moderator', 'creator', 'vip', 'super_admin'];
        $targetUserHasPublicRole = $user->hasAnyRole($allowedRoles);

        // Si el perfil objetivo NO tiene rol público, solo puede verlo:
        // 1. El mismo usuario (su propio perfil)
        // 2. Administradores o moderadores
        if (! $targetUserHasPublicRole) {
            $isOwnProfile = $currentUser && $currentUser->id === $user->id;
            $isAdminOrModerator = $currentUser && $currentUser->hasAnyRole(['admin', 'moderator']);

            if (! $isOwnProfile && ! $isAdminOrModerator) {
                // No autorizado para ver este perfil
                return null;
            }
        }

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
        $targetCountry = strtoupper((string) ($user->country ?? ''));
        if ($user->country_block && $viewerCountry && $targetCountry && ($viewerCountry === $targetCountry)) {
            $isOwnProfile = $currentUser && $currentUser->id === $user->id;
            $isAdminOrModerator = $currentUser && $currentUser->hasAnyRole(['admin', 'moderator']);
            if (! $isOwnProfile && ! $isAdminOrModerator) {
                return null;
            }
        }

        // Contar vista solo si no es su propio perfil
        $isOwnProfile = $currentUser && $currentUser->id === $user->id;

        if (! $isOwnProfile) {
            // Generate unique key based on IP + User Agent (since we're not using server sessions)
            $fingerprint = request()->ip().'|'.request()->userAgent();
            $cacheKey = "profile_view_{$user->id}_".md5($fingerprint);

            // Use add() instead of put() - only succeeds if key doesn't exist (atomic operation)
            // This prevents race conditions when multiple requests arrive simultaneously
            if (Cache::add($cacheKey, true, now()->addHours(24))) {
                // Only increments if add() succeeded (key didn't exist)
                User::where('id', $user->id)->increment('views');
            }
        }

        return $user;
    }
}
