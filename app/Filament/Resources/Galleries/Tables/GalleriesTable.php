<?php

namespace App\Filament\Resources\Galleries\Tables;

use App\Models\Gallery;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class GalleriesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                TextColumn::make('id')
                    ->label('ID')
                    ->sortable(),

                TextColumn::make('user.name')
                    ->label('Usuario')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('title')
                    ->label('Título')
                    ->searchable()
                    ->sortable()
                    ->limit(50),

                TextColumn::make('visibility')
                    ->label('Visibilidad')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        Gallery::VISIBILITY_PUBLIC => 'success',
                        Gallery::VISIBILITY_PRIVATE => 'danger',
                        Gallery::VISIBILITY_FOLLOWERS => 'warning',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => Gallery::visibilities()[$state] ?? $state),

                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        Gallery::STATUS_PENDING => 'warning',
                        Gallery::STATUS_APPROVED => 'success',
                        Gallery::STATUS_REJECTED => 'danger',
                        default => 'gray',
                    })
                    ->formatStateUsing(fn (string $state): string => Gallery::statuses()[$state] ?? $state)
                    ->sortable(),

                TextColumn::make('media_count')
                    ->label('Imágenes')
                    ->counts('media')
                    ->sortable(),

                TextColumn::make('is_featured')
                    ->label('Destacada')
                    ->badge()
                    ->color(fn (bool $state): string => $state ? 'warning' : 'gray')
                    ->formatStateUsing(fn (bool $state): string => $state ? 'Sí' : 'No')
                    ->sortable(),

                TextColumn::make('order')
                    ->label('Orden')
                    ->sortable(),

                TextColumn::make('created_at')
                    ->label('Creado')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('visibility')
                    ->label('Visibilidad')
                    ->options(Gallery::visibilities()),

                SelectFilter::make('status')
                    ->label('Estado')
                    ->options(Gallery::statuses()),

                SelectFilter::make('is_featured')
                    ->label('Destacada')
                    ->options([
                        '1' => 'Sí',
                        '0' => 'No',
                    ]),

                SelectFilter::make('user_id')
                    ->label('Usuario')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload(),
            ])
            ->recordActions([
                EditAction::make(),

                Action::make('aprobar')
                    ->label('Aprobar')
                    ->color('success')
                    ->icon('heroicon-o-check')
                    ->requiresConfirmation()
                    ->visible(fn (Gallery $record): bool => $record->status !== Gallery::STATUS_APPROVED)
                    ->action(fn (Gallery $record) => $record->update(['status' => Gallery::STATUS_APPROVED]))
                    ->successNotificationTitle('Galería aprobada'),

                Action::make('rechazar')
                    ->label('Rechazar')
                    ->color('danger')
                    ->icon('heroicon-o-x-circle')
                    ->requiresConfirmation()
                    ->visible(fn (Gallery $record): bool => $record->status !== Gallery::STATUS_REJECTED)
                    ->action(fn (Gallery $record) => $record->update(['status' => Gallery::STATUS_REJECTED]))
                    ->successNotificationTitle('Galería rechazada'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),

                    BulkAction::make('aprobar')
                        ->label('Aprobar seleccionadas')
                        ->color('success')
                        ->requiresConfirmation()
                        ->icon('heroicon-o-check')
                        ->action(function (array $records) {
                            foreach ($records as $record) {
                                if ($record->status !== Gallery::STATUS_APPROVED) {
                                    $record->update(['status' => Gallery::STATUS_APPROVED]);
                                }
                            }
                        })
                        ->successNotificationTitle('Galerías aprobadas'),

                    BulkAction::make('rechazar')
                        ->label('Rechazar seleccionadas')
                        ->color('danger')
                        ->requiresConfirmation()
                        ->icon('heroicon-o-x-circle')
                        ->action(function (array $records) {
                            foreach ($records as $record) {
                                if ($record->status !== Gallery::STATUS_REJECTED) {
                                    $record->update(['status' => Gallery::STATUS_REJECTED]);
                                }
                            }
                        })
                        ->successNotificationTitle('Galerías rechazadas'),
                ]),
            ])
            ->defaultSort('order');
    }
}
