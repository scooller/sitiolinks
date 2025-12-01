<?php

namespace App\Filament\Widgets;

use App\Models\SiteSettings;
use App\Models\Ticket;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;

class TicketsOverview extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['tickets_overview'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['tickets_overview']['order'] ?? 8;
    }

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(7);

        $open = Ticket::where('status', Ticket::STATUS_OPEN)->count();
        $openLast7 = Ticket::where('status', Ticket::STATUS_OPEN)
            ->where('created_at', '>=', $since)
            ->count();

        $inProgress = Ticket::where('status', Ticket::STATUS_IN_PROGRESS)->count();

        $resolved = Ticket::where('status', Ticket::STATUS_RESOLVED)->count();
        $resolvedLast7 = Ticket::where('status', Ticket::STATUS_RESOLVED)
            ->where('resolved_at', '>=', $since)
            ->count();

        $urgent = Ticket::where('priority', Ticket::PRIORITY_URGENT)
            ->whereIn('status', [Ticket::STATUS_OPEN, Ticket::STATUS_IN_PROGRESS, Ticket::STATUS_REOPENED])
            ->count();

        return [
            Stat::make('Tickets Abiertos', number_format($open))
                ->description(($openLast7 > 0 ? '+' : '').number_format($openLast7).' últimos 7 días')
                ->descriptionIcon($openLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($open > 0 ? 'danger' : 'success')
                ->icon('heroicon-o-bell')
                ->color('danger')
                ->url(route('filament.admin.resources.tickets.index', ['tableFilters[status][value]' => 'abierto'])),

            Stat::make('En Progreso', number_format($inProgress))
                ->description('Tickets siendo atendidos')
                ->icon('heroicon-o-clock')
                ->color('warning')
                ->url(route('filament.admin.resources.tickets.index', ['tableFilters[status][value]' => 'en_progreso'])),

            Stat::make('Resueltos', number_format($resolved))
                ->description(($resolvedLast7 > 0 ? '+' : '').number_format($resolvedLast7).' últimos 7 días')
                ->descriptionIcon($resolvedLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($resolvedLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-check-circle')
                ->color('success')
                ->url(route('filament.admin.resources.tickets.index', ['tableFilters[status][value]' => 'resuelto'])),

            Stat::make('Urgentes', number_format($urgent))
                ->description('Prioridad urgente sin cerrar')
                ->descriptionColor($urgent > 0 ? 'danger' : 'success')
                ->icon('heroicon-o-exclamation-triangle')
                ->color($urgent > 0 ? 'danger' : 'gray')
                ->url(route('filament.admin.resources.tickets.index', ['tableFilters[priority][value]' => 'urgente'])),
        ];
    }
}
