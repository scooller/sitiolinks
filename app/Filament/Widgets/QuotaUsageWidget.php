<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Facades\DB;

class QuotaUsageWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['quota_usage'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['quota_usage']['order'] ?? 3;
    }

    protected static ?int $sort = 3;

    protected function getStats(): array
    {
        $settings = SiteSettings::first();

        // Límites configurados
        $creatorGalleryLimit = $settings->max_galleries_creator ?? 5;
        $vipGalleryLimit = $settings->max_galleries_vip ?? 999;
        $creatorMediaLimit = $settings->max_media_per_gallery_creator ?? 20;
        $vipMediaLimit = $settings->max_media_per_gallery_vip ?? 999;

        // Uso de cuotas por creators
        $creatorStats = $this->getQuotaStats('creator', $creatorGalleryLimit, $creatorMediaLimit);

        // Uso de cuotas por VIPs
        $vipStats = $this->getQuotaStats('vip', $vipGalleryLimit, $vipMediaLimit);

        // Galerías con cuota al límite
        $galleriesAtLimit = Gallery::whereHas('user', function ($query) {
            $query->whereHas('roles', function ($q) {
                $q->where('name', 'creator');
            });
        })
            ->withCount('media')
            ->get()
            ->filter(function ($gallery) use ($creatorMediaLimit) {
                return $gallery->media_count >= $creatorMediaLimit;
            })
            ->count();

        return [
            Stat::make('Uso de Galerías - Creators', "{$creatorStats['galleries_used']} / {$creatorStats['galleries_total']}")
                ->description("{$creatorStats['usage_percent']}% de cuota utilizada")
                ->descriptionIcon('heroicon-m-photo')
                ->color($this->getColorByPercent($creatorStats['usage_percent']))
                ->chart([
                    $creatorStats['galleries_used'],
                    $creatorStats['galleries_total'] - $creatorStats['galleries_used'],
                ]),

            Stat::make('Uso de Medios - Creators', "{$creatorStats['media_used']} archivos")
                ->description("Promedio: {$creatorStats['media_avg']} por galería")
                ->descriptionIcon('heroicon-m-cloud-arrow-up')
                ->color('info'),

            Stat::make('Uso de Galerías - VIPs', "{$vipStats['galleries_used']} galerías")
                ->description($vipGalleryLimit >= 999 ? 'Ilimitado' : "{$vipStats['usage_percent']}% usado")
                ->descriptionIcon('heroicon-m-star')
                ->color('warning'),

            Stat::make('Galerías al Límite', $galleriesAtLimit)
                ->description('Creators con cuota completa de medios')
                ->descriptionIcon('heroicon-m-exclamation-triangle')
                ->color($galleriesAtLimit > 0 ? 'danger' : 'success'),
        ];
    }

    /**
     * Obtener estadísticas de uso de cuota por rol
     */
    protected function getQuotaStats(string $role, int $galleryLimit, int $mediaLimit): array
    {
        $users = DB::table('users')
            ->join('model_has_roles', function ($join) {
                $join->on('users.id', '=', 'model_has_roles.model_id')
                    ->where('model_has_roles.model_type', '=', User::class);
            })
            ->join('roles', 'model_has_roles.role_id', '=', 'roles.id')
            ->where('roles.name', $role)
            ->select('users.id')
            ->pluck('id');

        $totalUsers = $users->count();

        if ($totalUsers === 0) {
            return [
                'galleries_used' => 0,
                'galleries_total' => 0,
                'usage_percent' => 0,
                'media_used' => 0,
                'media_avg' => 0,
            ];
        }

        $galleriesUsed = Gallery::whereIn('user_id', $users)->count();
        $galleriesTotal = $totalUsers * $galleryLimit;
        $usagePercent = $galleryLimit >= 999 ? 0 : round(($galleriesUsed / max($galleriesTotal, 1)) * 100, 1);

        // Total de medios en galerías de estos usuarios
        $mediaUsed = DB::table('gallery_media')
            ->join('galleries', 'gallery_media.gallery_id', '=', 'galleries.id')
            ->whereIn('galleries.user_id', $users)
            ->count();

        $mediaAvg = $galleriesUsed > 0 ? round($mediaUsed / $galleriesUsed, 1) : 0;

        return [
            'galleries_used' => $galleriesUsed,
            'galleries_total' => $galleriesTotal,
            'usage_percent' => $usagePercent,
            'media_used' => $mediaUsed,
            'media_avg' => $mediaAvg,
        ];
    }

    /**
     * Obtener color según porcentaje de uso
     */
    protected function getColorByPercent(float $percent): string
    {
        if ($percent >= 90) {
            return 'danger';
        } elseif ($percent >= 70) {
            return 'warning';
        } elseif ($percent >= 50) {
            return 'info';
        }

        return 'success';
    }
}
