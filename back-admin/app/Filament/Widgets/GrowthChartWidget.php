<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Widgets\ChartWidget;

class GrowthChartWidget extends ChartWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['growth_chart'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['growth_chart']['order'] ?? 4;
    }

    protected ?string $heading = 'Crecimiento del Sistema (Últimos 12 Meses)';

    protected static ?int $sort = 4;

    protected ?string $maxHeight = '300px';

    protected function getData(): array
    {
        $months = [];
        $usersData = [];
        $galleriesData = [];

        // Obtener datos de los últimos 12 meses
        for ($i = 11; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $monthLabel = $date->format('M Y');
            $months[] = $monthLabel;

            // Usuarios creados en ese mes
            $usersCount = User::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $usersData[] = $usersCount;

            // Galerías creadas en ese mes
            $galleriesCount = Gallery::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            $galleriesData[] = $galleriesCount;
        }

        return [
            'datasets' => [
                [
                    'label' => 'Nuevos Usuarios',
                    'data' => $usersData,
                    'borderColor' => 'rgb(59, 130, 246)', // blue
                    'backgroundColor' => 'rgba(59, 130, 246, 0.1)',
                    'tension' => 0.3,
                ],
                [
                    'label' => 'Nuevas Galerías',
                    'data' => $galleriesData,
                    'borderColor' => 'rgb(249, 115, 22)', // orange
                    'backgroundColor' => 'rgba(249, 115, 22, 0.1)',
                    'tension' => 0.3,
                ],
            ],
            'labels' => $months,
        ];
    }

    protected function getType(): string
    {
        return 'line';
    }

    protected function getOptions(): array
    {
        return [
            'plugins' => [
                'legend' => [
                    'display' => true,
                    'position' => 'top',
                ],
            ],
            'scales' => [
                'y' => [
                    'beginAtZero' => true,
                    'ticks' => [
                        'precision' => 0,
                    ],
                ],
            ],
        ];
    }
}
