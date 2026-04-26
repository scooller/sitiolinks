<?php

namespace App\Filament\Resources\Cafes\Tables;

use Filament\Tables\Columns\TextColumn;

class CafeBranchesTable
{
    public static function columns(): array
    {
        return [
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
        ];
    }
}
