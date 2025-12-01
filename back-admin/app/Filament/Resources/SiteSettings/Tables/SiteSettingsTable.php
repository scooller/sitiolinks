<?php

namespace App\Filament\Resources\SiteSettings\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class SiteSettingsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('site_title')
                    ->searchable(),
                TextColumn::make('avatar_width')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('avatar_height')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('thumbnail_width')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('thumbnail_height')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('color_primary')
                    ->searchable(),
                TextColumn::make('color_secondary')
                    ->searchable(),
                TextColumn::make('color_success')
                    ->searchable(),
                TextColumn::make('color_danger')
                    ->searchable(),
                TextColumn::make('color_warning')
                    ->searchable(),
                TextColumn::make('color_info')
                    ->searchable(),
                TextColumn::make('color_light')
                    ->searchable(),
                TextColumn::make('color_dark')
                    ->searchable(),
                TextColumn::make('font_heading')
                    ->searchable(),
                TextColumn::make('font_body')
                    ->searchable(),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
