<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class StatsOverviewWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['stats_overview'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['stats_overview']['order'] ?? 1;
    }

    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        // Total de usuarios
        $totalUsers = User::count();
        $newUsersLast7Days = User::where('created_at', '>=', now()->subDays(7))->count();

        // Creadores activos (usuarios con rol creator o vip)
        $activeCreators = DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->whereIn('roles.name', ['creator', 'vip'])
            ->distinct('users.id')
            ->count('users.id');

        // Galerías totales
        $totalGalleries = Gallery::count();
        $approvedGalleries = Gallery::where('status', 'approved')->count();
        $pendingGalleries = Gallery::where('status', 'pending')->count();

        // Medios subidos
        $totalMedia = Media::count();
        $totalMediaSize = Media::sum('size'); // bytes
        $totalMediaSizeMB = round($totalMediaSize / 1024 / 1024, 2);

        // Galerías creadas últimos 7 días
        $newGalleriesLast7Days = Gallery::where('created_at', '>=', now()->subDays(7))->count();

        return [
            Stat::make('Total de Usuarios', $totalUsers)
                ->description("+{$newUsersLast7Days} en los últimos 7 días")
                ->descriptionIcon('heroicon-m-arrow-trending-up')
                ->color($newUsersLast7Days > 0 ? 'success' : 'gray')
                ->chart($this->getUserGrowthChart()),

            Stat::make('Creadores Activos', $activeCreators)
                ->description(round(($activeCreators / max($totalUsers, 1)) * 100, 1).'% del total')
                ->descriptionIcon('heroicon-m-user-group')
                ->color('info'),

            Stat::make('Galerías', $totalGalleries)
                ->description("+{$newGalleriesLast7Days} últimos 7 días | Pendientes: {$pendingGalleries}")
                ->descriptionIcon('heroicon-m-photo')
                ->color($pendingGalleries > 0 ? 'warning' : 'success'),

            Stat::make('Medios Almacenados', number_format($totalMedia))
                ->description("{$totalMediaSizeMB} MB en uso")
                ->descriptionIcon('heroicon-m-cloud-arrow-up')
                ->color('primary'),
        ];
    }

    /**
     * Obtener datos de crecimiento de usuarios para el chart (últimos 7 días)
     */
    protected function getUserGrowthChart(): array
    {
        $data = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->startOfDay();
            $count = User::whereDate('created_at', $date)->count();
            $data[] = $count;
        }

        return $data;
    }
}
