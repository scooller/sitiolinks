<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\SiteSettings;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class GalleryStatsWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['gallery_stats'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['gallery_stats']['order'] ?? 6;
    }

    protected static ?int $sort = 1;

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(7);

        // Total de galerías
        $totalGalleries = Gallery::count();
        $galleriesLast7 = Gallery::where('created_at', '>=', $since)->count();

        // Galerías por estado
        $pending = Gallery::where('status', 'pending')->count();
        $approved = Gallery::where('status', 'approved')->count();
        $rejected = Gallery::where('status', 'rejected')->count();

        // Galerías destacadas
        $featured = Gallery::where('is_featured', true)->count();

        // Galerías por visibilidad
        $publicGalleries = Gallery::where('visibility', 'public')->count();
        $privateGalleries = Gallery::where('visibility', 'private')->count();
        $followersGalleries = Gallery::where('visibility', 'followers')->count();

        return [
            Stat::make('Total Galerías', number_format($totalGalleries))
                ->description(($galleriesLast7 > 0 ? '+' : '').number_format($galleriesLast7).' últimos 7 días')
                ->descriptionIcon($galleriesLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($galleriesLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-photo')
                ->color('primary'),

            Stat::make('En Revisión', number_format($pending))
                ->description('Pendientes de aprobar')
                ->descriptionIcon('heroicon-o-clock')
                ->descriptionColor('warning')
                ->icon('heroicon-o-exclamation-triangle')
                ->color('warning'),

            Stat::make('Aprobadas', number_format($approved))
                ->description('Galerías activas')
                ->descriptionIcon('heroicon-o-check-circle')
                ->descriptionColor('success')
                ->icon('heroicon-o-check-badge')
                ->color('success'),

            Stat::make('Destacadas', number_format($featured))
                ->description('Galerías VIP destacadas')
                ->descriptionIcon('heroicon-o-star')
                ->descriptionColor('warning')
                ->icon('heroicon-o-star')
                ->color('warning'),

            Stat::make('Públicas', number_format($publicGalleries))
                ->description($publicGalleries > 0 ? round(($publicGalleries / $totalGalleries) * 100, 1).'% del total' : 'Sin galerías')
                ->descriptionIcon('heroicon-o-globe-alt')
                ->descriptionColor('info')
                ->icon('heroicon-o-globe-alt')
                ->color('info'),

            Stat::make('Privadas', number_format($privateGalleries))
                ->description($privateGalleries > 0 ? round(($privateGalleries / $totalGalleries) * 100, 1).'% del total' : 'Sin galerías')
                ->descriptionIcon('heroicon-o-lock-closed')
                ->descriptionColor('danger')
                ->icon('heroicon-o-lock-closed')
                ->color('danger'),
        ];
    }
}
