<?php

namespace App\Filament\Resources\Cafes;

use App\Filament\Resources\Cafes\Pages\CreateCafe;
use App\Filament\Resources\Cafes\Pages\EditCafe;
use App\Filament\Resources\Cafes\Pages\ListCafes;
use App\Filament\Resources\Cafes\RelationManagers\BranchesRelationManager;
use App\Filament\Resources\Cafes\RelationManagers\CafeImageRelationManager;
use App\Filament\Resources\Cafes\Schemas\CafeForm;
use App\Filament\Resources\Cafes\Tables\CafesTable;
use App\Models\Cafe;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CafeResource extends Resource
{
    protected static ?string $model = Cafe::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingStorefront;

    protected static ?string $navigationLabel = 'Cafés';

    protected static ?string $modelLabel = 'Café';

    protected static ?string $pluralModelLabel = 'Cafés';

    protected static string|\UnitEnum|null $navigationGroup = 'Contenido';

    protected static ?int $navigationSort = 4;

    protected static ?string $recordTitleAttribute = 'name';

    public static function form(Schema $schema): Schema
    {
        return CafeForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CafesTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [
            CafeImageRelationManager::class,
            BranchesRelationManager::class,
        ];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCafes::route('/'),
            'create' => CreateCafe::route('/create'),
            'edit' => EditCafe::route('/{record}/edit'),
        ];
    }
}
