<?php

namespace App\Filament\Manager\Resources\Tags;

use App\Filament\Manager\Resources\Tags\Pages\CreateTag;
use App\Filament\Manager\Resources\Tags\Pages\ListTags;
use App\Models\SiteSettings;
use App\Models\Tag;
use BackedEnum;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables;
use Filament\Tables\Table;

class ManagerTagResource extends Resource
{
    protected static ?string $model = Tag::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedTag;

    protected static ?string $modelLabel = 'Etiqueta';

    protected static ?string $pluralModelLabel = 'Etiquetas';

    protected static ?string $navigationLabel = 'Etiquetas';

    protected static ?int $navigationSort = 3;

    public static function canCreate(): bool
    {
        return (bool) (SiteSettings::first()?->manager_can_create_tags ?? false);
    }

    public static function canEdit($record): bool
    {
        return false;
    }

    public static function canDelete($record): bool
    {
        return false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Nueva Etiqueta')
                ->schema([
                    TextInput::make('name')
                        ->label('Nombre (Español)')
                        ->required()
                        ->unique('tags', 'name')
                        ->maxLength(100),

                    TextInput::make('name_en')
                        ->label('Nombre (Inglés)')
                        ->nullable()
                        ->maxLength(100),

                    ColorPicker::make('color')
                        ->label('Color de la etiqueta')
                        ->nullable(),

                    TextInput::make('icon')
                        ->label('Icono FontAwesome (ej: fas-star)')
                        ->nullable()
                        ->maxLength(50),
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
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('name_en')
                    ->label('Inglés')
                    ->placeholder('-'),

                Tables\Columns\ColorColumn::make('color')
                    ->label('Color'),

                Tables\Columns\TextColumn::make('users_count')
                    ->counts('users')
                    ->label('Creadores con este tag'),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListTags::route('/'),
            'create' => CreateTag::route('/create'),
        ];
    }
}
