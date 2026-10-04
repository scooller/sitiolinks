<?php

namespace App\Filament\Manager\Resources\Cafes;

use App\Filament\Manager\Resources\Cafes\Pages\EditMyCafe;
use App\Filament\Manager\Resources\Cafes\Pages\ListMyCafes;
use App\Models\Cafe;
use BackedEnum;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class MyCafeResource extends Resource
{
    protected static ?string $model = Cafe::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBuildingStorefront;

    protected static ?string $modelLabel = 'Mi Café';

    protected static ?string $pluralModelLabel = 'Mi Café';

    protected static ?string $navigationLabel = 'Mi Café';

    protected static ?int $navigationSort = 2;

    public static function canViewAny(): bool
    {
        return (bool) auth()->user()?->managerProfile?->isCafe();
    }

    public static function getEloquentQuery(): Builder
    {
        $cafeId = auth()->user()?->managerProfile?->cafe_id ?? 0;

        return parent::getEloquentQuery()->where('id', $cafeId);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Información del Café')
                ->schema([
                    TextInput::make('name')
                        ->label('Nombre del Café')
                        ->required()
                        ->maxLength(255),

                    TextInput::make('website')
                        ->label('Sitio Web')
                        ->url()
                        ->nullable()
                        ->maxLength(500),

                    Textarea::make('description')
                        ->label('Descripción')
                        ->rows(4)
                        ->nullable()
                        ->columnSpanFull(),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable(),
                Tables\Columns\TextColumn::make('website')
                    ->label('Sitio Web')
                    ->placeholder('-'),
                Tables\Columns\TextColumn::make('branches_count')
                    ->counts('branches')
                    ->label('Sucursales'),
            ])
            ->actions([
                EditAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListMyCafes::route('/'),
            'edit' => EditMyCafe::route('/{record}/edit'),
        ];
    }
}
