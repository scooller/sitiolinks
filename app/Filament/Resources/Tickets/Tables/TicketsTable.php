<?php

namespace App\Filament\Resources\Tickets\Tables;

use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Support\Enums\FontWeight;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class TicketsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
                TextColumn::make('subject')
                    ->label('Asunto')
                    ->searchable()
                    ->weight(FontWeight::Bold)
                    ->limit(50),
                TextColumn::make('user.name')
                    ->label('Usuario')
                    ->searchable(),
                TextColumn::make('assignedTo.name')
                    ->label('Asignado a')
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'abierto' => 'danger',
                        'en_progreso' => 'warning',
                        'resuelto' => 'success',
                        'cerrado' => 'gray',
                        'reabierto' => 'info',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'abierto' => 'Abierto',
                        'en_progreso' => 'En Progreso',
                        'resuelto' => 'Resuelto',
                        'cerrado' => 'Cerrado',
                        'reabierto' => 'Reabierto',
                        default => $state,
                    }),
                TextColumn::make('priority')
                    ->label('Prioridad')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'baja' => 'gray',
                        'media' => 'info',
                        'alta' => 'warning',
                        'urgente' => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'baja' => 'Baja',
                        'media' => 'Media',
                        'alta' => 'Alta',
                        'urgente' => 'Urgente',
                        default => $state,
                    }),
                TextColumn::make('category')
                    ->label('Categoría')
                    ->badge()
                    ->color('gray')
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'tecnico' => 'Técnico',
                        'facturacion' => 'Facturación',
                        'cuenta' => 'Cuenta',
                        'contenido' => 'Contenido',
                        'otro' => 'Otro',
                        default => $state,
                    }),
                TextColumn::make('resolved_at')
                    ->label('Resuelto')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('closed_at')
                    ->label('Cerrado')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'abierto' => 'Abiertos',
                        'en_progreso' => 'En Progreso',
                        'resuelto' => 'Resueltos',
                        'cerrado' => 'Cerrados',
                        'reabierto' => 'Reabiertos',
                    ]),
                SelectFilter::make('priority')
                    ->label('Prioridad')
                    ->options([
                        'baja' => 'Baja',
                        'media' => 'Media',
                        'alta' => 'Alta',
                        'urgente' => 'Urgente',
                    ]),
                SelectFilter::make('category')
                    ->label('Categoría')
                    ->options([
                        'tecnico' => 'Técnico',
                        'facturacion' => 'Facturación',
                        'cuenta' => 'Cuenta',
                        'contenido' => 'Contenido',
                        'otro' => 'Otro',
                    ]),
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
