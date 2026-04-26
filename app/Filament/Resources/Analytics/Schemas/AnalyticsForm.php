<?php

namespace App\Filament\Resources\Analytics\Schemas;

use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;

class AnalyticsForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Tabs::make('Analytics')
                    ->tabs([
                        Tab::make('Reportes')
                            ->icon('heroicon-o-document-chart-bar')
                            ->schema([
                                Section::make('Acceso a Reportes')
                                    ->description('Usa el botón "Ver Reportes" en la parte superior para acceder a los reportes detallados de usuarios y galerías')
                                    ->schema([
                                        Placeholder::make('info')
                                            ->content('Los reportes incluyen:

• Estadísticas generales del sistema
• Reporte detallado de usuarios con filtros avanzados
• Análisis de galerías por usuario
• Métricas de vistas y engagement
• Filtros por rol, fechas, verificación, etc.

Haz clic en el botón "Ver Reportes" arriba para acceder a toda esta información.')
                                            ->columnSpanFull(),
                                    ]),
                            ]),

                        Tab::make('Configurar Dashboard')
                            ->icon('heroicon-o-cog-6-tooth')
                            ->schema([
                                Section::make('Widgets del Dashboard')
                                    ->description('Configura qué widgets mostrar en el dashboard y en qué orden')
                                    ->schema([
                                        // StatsOverviewWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.stats_overview.enabled')
                                                    ->label('Resumen General')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.stats_overview.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // EngagementStatsWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.engagement_stats.enabled')
                                                    ->label('Estadísticas de Engagement')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.engagement_stats.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // QuotaUsageWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.quota_usage.enabled')
                                                    ->label('Uso de Cuotas')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.quota_usage.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // GrowthChartWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.growth_chart.enabled')
                                                    ->label('Gráfico de Crecimiento (12 meses)')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.growth_chart.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // OverviewStats
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.overview_stats.enabled')
                                                    ->label('Vista General de Estadísticas')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.overview_stats.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // GalleryStatsWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.gallery_stats.enabled')
                                                    ->label('Estadísticas de Galerías')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.gallery_stats.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // UserActivityWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.user_activity.enabled')
                                                    ->label('Actividad de Usuarios')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.user_activity.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // TicketsOverview
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.tickets_overview.enabled')
                                                    ->label('Resumen de Tickets')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.tickets_overview.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // RecentNotificationsWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.recent_notifications.enabled')
                                                    ->label('Notificaciones Recientes')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.recent_notifications.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        // PopularGalleriesWidget
                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.popular_galleries.enabled')
                                                    ->label('Galerías Populares')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.popular_galleries.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),

                                        Grid::make(['default' => 12])
                                            ->schema([
                                                Toggle::make('dashboard_widgets.top_liked_users.enabled')
                                                    ->label('Usuarios más gustados')
                                                    ->inline(false)
                                                    ->columnSpan(8),

                                                TextInput::make('dashboard_widgets.top_liked_users.order')
                                                    ->label('Orden')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->columnSpan(4),
                                            ]),
                                    ]),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }
}
