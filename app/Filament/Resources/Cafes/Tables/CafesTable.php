<?php

namespace App\Filament\Resources\Cafes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class CafesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                ImageColumn::make('cafe_image')
                    ->label('Imagen')
                    ->getStateUsing(function ($record) {
                        $media = $record->media()
                            ->where('collection_name', 'cafe_image')
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
                            ->where('collection_name', 'cafe_image')
                            ->orderByDesc('created_at')
                            ->orderByDesc('id')
                            ->first();

                        return $media?->getUrl();
                    }, shouldOpenInNewTab: true),

                TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('description')
                    ->label('Descripción')
                    ->limit(50)
                    ->searchable(),

                TextColumn::make('website')
                    ->label('Website')
                    ->url(fn ($record) => $record->website)
                    ->openUrlInNewTab(),

                TextColumn::make('branches_count')
                    ->label('Sucursales')
                    ->counts('branches')
                    ->sortable(),

                TextColumn::make('creators_count')
                    ->label('Creadores')
                    ->counts('creators')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Creado')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([])
            ->actions([
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ])
            ->defaultSort('created_at', 'desc');
    }
}
