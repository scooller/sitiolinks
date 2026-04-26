<?php

namespace App\Filament\Widgets;

use App\Models\SiteSettings;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class UserActivityWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['user_activity'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['user_activity']['order'] ?? 7;
    }

    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(7);
        $sinceMonth = Carbon::now()->subDays(30);

        // Nuevos registros
        $totalUsers = User::count();
        $usersLast7 = User::where('created_at', '>=', $since)->count();
        $usersLast30 = User::where('created_at', '>=', $sinceMonth)->count();

        // Usuarios por rol
        $vipUsers = User::role('vip')->count();
        $creatorUsers = User::role('creator')->count();
        $adminUsers = User::role(['admin', 'super_admin'])->count();

        // Usuarios activos (con galerías)
        $usersWithGalleries = User::has('galleries')->count();

        // Usuarios verificados
        $verifiedUsers = User::whereNotNull('email_verified_at')->count();

        return [
            Stat::make('Total Usuarios', number_format($totalUsers))
                ->description('+'.number_format($usersLast7).' últimos 7 días / +'.number_format($usersLast30).' últimos 30 días')
                ->descriptionIcon('heroicon-o-arrow-trending-up')
                ->descriptionColor($usersLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-users')
                ->color('primary'),

            Stat::make('Usuarios VIP', number_format($vipUsers))
                ->description($vipUsers > 0 ? round(($vipUsers / $totalUsers) * 100, 1).'% del total' : 'Sin usuarios VIP')
                ->descriptionIcon('heroicon-o-star')
                ->descriptionColor('warning')
                ->icon('heroicon-o-star')
                ->color('warning'),

            Stat::make('Creadores', number_format($creatorUsers))
                ->description($creatorUsers > 0 ? round(($creatorUsers / $totalUsers) * 100, 1).'% del total' : 'Sin creadores')
                ->descriptionIcon('heroicon-o-camera')
                ->descriptionColor('info')
                ->icon('heroicon-o-camera')
                ->color('info'),

            Stat::make('Administradores', number_format($adminUsers))
                ->description('Admin y Super Admin')
                ->descriptionIcon('heroicon-o-shield-check')
                ->descriptionColor('success')
                ->icon('heroicon-o-shield-check')
                ->color('success'),

            Stat::make('Usuarios Activos', number_format($usersWithGalleries))
                ->description('Con al menos 1 galería')
                ->descriptionIcon('heroicon-o-photo')
                ->descriptionColor('info')
                ->icon('heroicon-o-photo')
                ->color('info'),

            Stat::make('Verificados', number_format($verifiedUsers))
                ->description($verifiedUsers > 0 ? round(($verifiedUsers / $totalUsers) * 100, 1).'% del total' : 'Sin verificar')
                ->descriptionIcon('heroicon-o-check-badge')
                ->descriptionColor('success')
                ->icon('heroicon-o-check-badge')
                ->color('success'),
        ];
    }
}
