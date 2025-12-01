<?php

namespace App\Filament\Resources\Tags\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class TagsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->weight('bold'),

                BadgeColumn::make('color')
                    ->label('Color')
                    ->colors([
                        'primary' => 'primary',
                        'secondary' => 'secondary',
                        'success' => 'success',
                        'danger' => 'danger',
                        'warning' => 'warning',
                        'info' => 'info',
                        'gray' => 'light',
                        'gray' => 'dark',
                    ]),

                TextColumn::make('icon')
                    ->label('Icono')
                    ->formatStateUsing(fn ($state) => self::renderIcon($state))
                    ->html(),

                TextColumn::make('weight')
                    ->label('Peso')
                    ->numeric()
                    ->sortable()
                    ->suffix(' pts')
                    ->badge()
                    ->color(fn ($state) => match (true) {
                        $state >= 80 => 'danger',
                        $state >= 50 => 'warning',
                        $state >= 20 => 'info',
                        default => 'gray',
                    }),

                IconColumn::make('is_fixed')
                    ->label('Fijo')
                    ->boolean()
                    ->trueIcon('heroicon-o-lock-closed')
                    ->falseIcon('heroicon-o-user')
                    ->trueColor('danger')
                    ->falseColor('success')
                    ->tooltip(fn ($state) => $state ? 'Visible solo para administradores' : 'Seleccionable por usuarios'),

                TextColumn::make('created_at')
                    ->label('Creado')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),

                TextColumn::make('updated_at')
                    ->label('Actualizado')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->defaultSort('weight', 'desc')
            ->filters([
                //
            ])
            ->recordActions([
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    /**
     * Renderiza el icono según el tipo (Font Awesome o Heroicon)
     */
    protected static function renderIcon(?string $icon): string
    {
        if (! $icon) {
            return '<i class="fas fa-tag" style="font-size: 1.2em; color: #6b7280;"></i>';
        }

        // Si es Font Awesome
        if (str_starts_with($icon, 'fas-') || str_starts_with($icon, 'far-') || str_starts_with($icon, 'fab-') || str_starts_with($icon, 'fa-')) {
            $iconClass = str_replace('-', ' fa-', $icon);

            return '<i class="'.$iconClass.'" style="font-size: 1.2em; color: #6b7280;"></i>';
        }

        // Si es Heroicon, renderizar usando SVG de Filament
        return '<x-filament::icon icon="'.$icon.'" class="w-5 h-5 text-gray-500" />';
    }
}
