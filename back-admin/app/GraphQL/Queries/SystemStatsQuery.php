<?php

namespace App\GraphQL\Queries;

use App\Models\Gallery;
use App\Models\User;
use GraphQL\Type\Definition\Type;
use Illuminate\Support\Facades\DB;
use Rebing\GraphQL\Support\Facades\GraphQL;
use Rebing\GraphQL\Support\Query;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class SystemStatsQuery extends Query
{
    protected $attributes = [
        'name' => 'systemStats',
        'description' => 'Estadísticas generales del sistema (solo para admins/moderadores)',
    ];

    public function type(): Type
    {
        return GraphQL::type('SystemStats');
    }

    public function authorize($root, array $args, $ctx, $resolveInfo = null, $getSelectFields = null): bool
    {
        $user = auth('sanctum')->user() ?? auth('web')->user();

        if (! $user) {
            return false;
        }

        // Solo admins y moderadores
        return $user->hasAnyRole(['super_admin', 'admin', 'moderator']);
    }

    public function resolve($root, array $args)
    {
        return [
            'total_users' => User::count(),
            'total_creators' => $this->countUsersByRole('creator'),
            'total_vips' => $this->countUsersByRole('vip'),
            'total_galleries' => Gallery::count(),
            'approved_galleries' => Gallery::where('status', 'approved')->count(),
            'pending_galleries' => Gallery::where('status', 'pending')->count(),
            'total_media' => Media::count(),
            'total_storage_mb' => round(Media::sum('size') / 1024 / 1024, 2),
            'total_follows' => DB::table('user_follower')->count(),
            'total_views' => User::sum('views'),
            'total_galleries' => Gallery::count(),
            'new_users_last_7_days' => User::where('created_at', '>=', now()->subDays(7))->count(),
            'new_galleries_last_7_days' => Gallery::where('created_at', '>=', now()->subDays(7))->count(),
        ];
    }

    protected function countUsersByRole(string $role): int
    {
        return DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', $role)
            ->distinct('users.id')
            ->count('users.id');
    }
}
