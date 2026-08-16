<?php

namespace App\Filament\Resources\Cafes\Tables;

use App\Models\Cafe;
use App\Models\CafeBranch;
use App\Models\CafeSuggestion;
use Filament\Actions\Action;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class CafeSuggestionsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                TextColumn::make('name')
                    ->label('Café')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('city')
                    ->label('Ciudad')
                    ->searchable(),

                TextColumn::make('address')
                    ->label('Dirección')
                    ->limit(40)
                    ->searchable(),

                TextColumn::make('user.name')
                    ->label('Sugerido por')
                    ->searchable(),

                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn(string $state): string => match ($state) {
                        CafeSuggestion::STATUS_PENDING => 'warning',
                        CafeSuggestion::STATUS_APPROVED => 'success',
                        CafeSuggestion::STATUS_REJECTED => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn(string $state): string => match ($state) {
                        CafeSuggestion::STATUS_PENDING => 'Pendiente',
                        CafeSuggestion::STATUS_APPROVED => 'Aprobada',
                        CafeSuggestion::STATUS_REJECTED => 'Rechazada',
                        default => $state,
                    }),

                TextColumn::make('created_at')
                    ->label('Recibida')
                    ->dateTime()
                    ->sortable(),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        CafeSuggestion::STATUS_PENDING => 'Pendiente',
                        CafeSuggestion::STATUS_APPROVED => 'Aprobada',
                        CafeSuggestion::STATUS_REJECTED => 'Rechazada',
                    ]),
            ])
            ->actions([
                Action::make('approve')
                    ->label('Aprobar')
                    ->icon('heroicon-m-check-circle')
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalDescription('Se creará el café y su sucursal con los datos de la sugerencia. Podrás editarlos después en Cafés.')
                    ->visible(fn(CafeSuggestion $record): bool => $record->status === CafeSuggestion::STATUS_PENDING)
                    ->action(function (CafeSuggestion $record): void {
                        $cafe = Cafe::create([
                            'name' => $record->name,
                            'website' => $record->website,
                        ]);

                        CafeBranch::create([
                            'cafe_id' => $cafe->id,
                            'name' => $record->name,
                            'address' => $record->address ?: 'Sin dirección',
                            'city' => $record->city,
                            'website' => $record->website,
                            'google_maps_url' => $record->google_maps_url,
                        ]);

                        $record->update([
                            'status' => CafeSuggestion::STATUS_APPROVED,
                            'reviewed_by' => auth()->id(),
                            'reviewed_at' => now(),
                        ]);
                    }),

                Action::make('reject')
                    ->label('Rechazar')
                    ->icon('heroicon-m-x-circle')
                    ->color('danger')
                    ->requiresConfirmation()
                    ->visible(fn(CafeSuggestion $record): bool => $record->status === CafeSuggestion::STATUS_PENDING)
                    ->action(function (CafeSuggestion $record): void {
                        $record->update([
                            'status' => CafeSuggestion::STATUS_REJECTED,
                            'reviewed_by' => auth()->id(),
                            'reviewed_at' => now(),
                        ]);
                    }),
            ])
            ->bulkActions([])
            ->defaultSort('created_at', 'desc')
            ->modifyQueryUsing(fn($query) => $query->with('user'));
    }
}
