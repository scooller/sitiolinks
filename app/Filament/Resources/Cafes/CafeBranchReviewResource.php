<?php

namespace App\Filament\Resources\Cafes;

use App\Filament\Resources\Cafes\Pages\CreateCafeBranchReview;
use App\Filament\Resources\Cafes\Pages\EditCafeBranchReview;
use App\Filament\Resources\Cafes\Pages\ListCafeBranchReviews;
use App\Filament\Resources\Cafes\Schemas\CafeBranchReviewForm;
use App\Filament\Resources\Cafes\Tables\CafeBranchReviewsTable;
use App\Models\CafeBranchReview;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;

class CafeBranchReviewResource extends Resource
{
    protected static ?string $model = CafeBranchReview::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedStar;

    protected static ?string $navigationLabel = 'Reseñas de Sucursales';

    protected static ?string $modelLabel = 'Reseña';

    protected static ?string $pluralModelLabel = 'Reseñas';

    protected static string|\UnitEnum|null $navigationGroup = 'Contenido';

    protected static ?int $navigationSort = 5;

    protected static ?string $recordTitleAttribute = 'id';

    public static function form(Schema $schema): Schema
    {
        return CafeBranchReviewForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return CafeBranchReviewsTable::configure($table);
    }

    public static function getRelations(): array
    {
        return [];
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCafeBranchReviews::route('/'),
            'create' => CreateCafeBranchReview::route('/create'),
            'edit' => EditCafeBranchReview::route('/{record}/edit'),
        ];
    }
}
