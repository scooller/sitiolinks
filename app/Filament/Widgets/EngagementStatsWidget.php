<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\Like;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class EngagementStatsWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['engagement_stats'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['engagement_stats']['order'] ?? 2;
    }

    protected static ?int $sort = 2;

    protected function getStats(): array
    {
        // Total de seguidores (follows)
        $totalFollows = DB::table('user_follower')->count();
        $newFollowsLast7Days = DB::table('user_follower')
            ->where('created_at', '>=', now()->subDays(7))
            ->count();

        // Total de likes
        $totalLikes = Like::count();
        $newLikesLast7Days = Like::where('created_at', '>=', now()->subDays(7))->count();

        // Galerías totales activas
        $totalGalleries = Gallery::where('status', 'approved')->count();
        $mostLikedGallery = Gallery::withCount('likes')
            ->orderByDesc('likes_count')
            ->first();

        // Usuarios más activos (con más galerías aprobadas)
        $mostActiveUser = User::withCount(['galleries' => function ($query) {
            $query->where('status', 'approved');
        }])
            ->orderByDesc('galleries_count')
            ->first();

        $mostActiveUserName = $mostActiveUser ? $mostActiveUser->username : 'N/A';
        $mostActiveUserGalleries = $mostActiveUser ? $mostActiveUser->galleries_count : 0;

        return [
            Stat::make('Total de Seguidores', number_format($totalFollows))
                ->description("+{$newFollowsLast7Days} en los últimos 7 días")
                ->descriptionIcon('heroicon-m-users')
                ->color($newFollowsLast7Days > 0 ? 'success' : 'gray')
                ->chart($this->getFollowsChart()),

            Stat::make('Total de Likes', number_format($totalLikes))
                ->description("+{$newLikesLast7Days} últimos 7 días")
                ->descriptionIcon('heroicon-m-heart')
                ->color($newLikesLast7Days > 0 ? 'success' : 'gray'),

            Stat::make('Galería con Más Likes', $mostLikedGallery?->title ?? 'N/A')
                ->description(number_format($mostLikedGallery?->likes_count ?? 0).' likes')
                ->descriptionIcon('heroicon-m-trophy')
                ->color('warning'),

            Stat::make('Usuario Más Activo', "@{$mostActiveUserName}")
                ->description("{$mostActiveUserGalleries} galerías aprobadas")
                ->descriptionIcon('heroicon-m-user-circle')
                ->color('info'),
        ];
    }

    /**
     * Obtener datos de follows para el chart (últimos 7 días)
     */
    protected function getFollowsChart(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $count = DB::table('user_follower')
                ->whereDate('created_at', $date)
                ->count();
            $data[] = $count;
        }

        return $data;
    }
}
