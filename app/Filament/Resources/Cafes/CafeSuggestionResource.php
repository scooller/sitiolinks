<?php

namespace App\Filament\Resources\Cafes;

use App\Filament\Resources\Cafes\Pages\ListCafeSuggestions;
use App\Filament\Resources\Cafes\Tables\CafeSuggestionsTable;
use App\Models\CafeSuggestion;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CafeSuggestionResource extends Resource
{
    protected static ?string $model = CafeSuggestion::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedInboxArrowDown;

    protected static ?string $navigationLabel = 'Sugerencias de Cafés';

    protected static ?string $modelLabel = 'Sugerencia';

    protected static ?string $pluralModelLabel = 'Sugerencias de Cafés';

    protected static string|\UnitEnum|null $navigationGroup = 'Contenido';

    protected static ?int $navigationSort = 6;

    public static function table(Table $table): Table
    {
        return CafeSuggestionsTable::configure($table);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCafeSuggestions::route('/'),
        ];
    }
}
