<?php

namespace App\Filament\Resources\Cafes\RelationManagers;

use App\Filament\Resources\Cafes\Schemas\CafeBranchForm;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\CreateAction;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class BranchesRelationManager extends RelationManager
{
    protected static string $relationship = 'branches';

    protected static ?string $title = 'Sucursales';

    public function form(Schema $schema): Schema
    {
        return CafeBranchForm::configure($schema);
    }

    public function table(Table $table): Table
    {
        return $table
            ->recordTitleAttribute('name')
            ->columns([
                ImageColumn::make('branch_image')
                    ->label('Imagen')
                    ->getStateUsing(function ($record) {
                        $media = $record->media()
                            ->where('collection_name', 'branch_image')
                            ->orderByDesc('created_at')
                            ->orderByDesc('id')
                            ->first();

                        if ($media && $media->hasGeneratedConversion('thumb')) {
                            return $media->getUrl('thumb');
                        }

                        return $media?->getUrl();
                    })
                    ->height(60)
                    ->url(function ($record) {
                        $media = $record->media()
                            ->where('collection_name', 'branch_image')
                            ->orderByDesc('created_at')
                            ->orderByDesc('id')
                            ->first();

                        return $media?->getUrl();
                    }, shouldOpenInNewTab: true),

                TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('address')
                    ->label('Dirección')
                    ->limit(50)
                    ->searchable(),

                TextColumn::make('city')
                    ->label('Ciudad')
                    ->sortable(),

                TextColumn::make('tags.name')
                    ->label('Etiquetas')
                    ->badge()
                    ->separator(', ')
                    ->toggleable(),

                TextColumn::make('phone')
                    ->label('Teléfono')
                    ->copyable(),

                TextColumn::make('entry_price')
                    ->label('Precio')
                    ->money('USD', 2),

                TextColumn::make('reviews_count')
                    ->label('Reseñas')
                    ->counts('reviews')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Creada')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([])
            ->headerActions([
                CreateAction::make(),
            ])
            ->actions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
