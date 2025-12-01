<?php

namespace App\Filament\Resources\Analytics\Pages;

use App\Filament\Resources\Analytics\AnalyticsResource;
use App\Models\SiteSettings;
use Filament\Resources\Pages\EditRecord;

class ManageAnalytics extends EditRecord
{
    protected static string $resource = AnalyticsResource::class;

    public function mount(int|string|null $record = null): void
    {
        $settings = SiteSettings::firstOrFail();

        // Valores por defecto para todos los widgets
        $defaults = [
            'stats_overview' => ['enabled' => true, 'order' => 1],
            'engagement_stats' => ['enabled' => true, 'order' => 2],
            'quota_usage' => ['enabled' => true, 'order' => 3],
            'growth_chart' => ['enabled' => true, 'order' => 4],
            'overview_stats' => ['enabled' => false, 'order' => 5],
            'gallery_stats' => ['enabled' => false, 'order' => 6],
            'user_activity' => ['enabled' => false, 'order' => 7],
            'tickets_overview' => ['enabled' => false, 'order' => 8],
            'recent_notifications' => ['enabled' => false, 'order' => 9],
            'popular_galleries' => ['enabled' => false, 'order' => 10],
            'top_liked_users' => ['enabled' => false, 'order' => 11],
        ];

        // Mergear con los existentes, dando prioridad a los valores guardados
        $current = is_array($settings->dashboard_widgets) ? $settings->dashboard_widgets : [];

        // Para cada widget, si no tiene orden o enabled, usar el default
        foreach ($defaults as $key => $default) {
            if (! isset($current[$key])) {
                $current[$key] = $default;
            } else {
                // Forzar enabled a booleano
                $current[$key]['enabled'] = isset($current[$key]['enabled'])
                    ? (bool) $current[$key]['enabled']
                    : $default['enabled'];

                if (! isset($current[$key]['order']) || $current[$key]['order'] === null) {
                    $current[$key]['order'] = $default['order'];
                }
            }
        }

        $settings->dashboard_widgets = $current;
        $settings->save();

        parent::mount($settings->id);
    }

    protected function getHeaderActions(): array
    {
        return [
            \Filament\Actions\Action::make('view_reports')
                ->label('Ver Reportes')
                ->icon('heroicon-o-document-chart-bar')
                ->url(route('filament.admin.resources.analytics.reports', SiteSettings::first()->id)),
        ];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        // Asegurarse de que dashboard_widgets se guarde correctamente
        if (isset($data['dashboard_widgets'])) {
            // Forzar que los valores enabled sean booleanos
            foreach ($data['dashboard_widgets'] as $key => $widget) {
                if (isset($widget['enabled'])) {
                    $data['dashboard_widgets'][$key]['enabled'] = (bool) $widget['enabled'];
                }
                if (isset($widget['order'])) {
                    $data['dashboard_widgets'][$key]['order'] = (int) $widget['order'];
                }
            }
        }

        return $data;
    }
}
