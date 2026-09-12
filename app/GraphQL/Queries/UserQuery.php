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

        // Verificar bloqueo por país y evasión automática por VPN / Proxy
        if (app(\App\Services\GeoLocationService::class)->shouldBlockUser($user, $currentUser)) {
            return null;
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
