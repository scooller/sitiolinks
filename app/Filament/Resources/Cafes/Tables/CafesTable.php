<?php

namespace App\Filament\Resources\Cafes\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\DB;

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
                    ->getStateUsing(fn ($record) => DB::table('cafe_branch_creator')
                        ->join('cafe_branches', 'cafe_branches.id', '=', 'cafe_branch_creator.cafe_branch_id')
                        ->where('cafe_branches.cafe_id', $record->id)
                        ->distinct('cafe_branch_creator.user_id')
                        ->count('cafe_branch_creator.user_id')),

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
