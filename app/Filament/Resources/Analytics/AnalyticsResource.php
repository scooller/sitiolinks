<?php

namespace App\Filament\Resources\Analytics;

use App\Filament\Resources\Analytics\Pages\ManageAnalytics;
use App\Filament\Resources\Analytics\Pages\ViewReports;
use App\Filament\Resources\Analytics\Schemas\AnalyticsForm;
use App\Models\SiteSettings;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;

class AnalyticsResource extends Resource
{
    protected static ?string $model = SiteSettings::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-chart-bar';

    protected static string|\UnitEnum|null $navigationGroup = 'Configuración';

    protected static ?string $navigationLabel = 'Analytics y Reportes';

    protected static ?int $navigationSort = 3;

    public static function form(Schema $schema): Schema
    {
        return AnalyticsForm::configure($schema);
    }

    public static function getPages(): array
    {
        return [
            'index' => ManageAnalytics::route('/'),
            'reports' => ViewReports::route('/reportes'),
        ];
    }
}
