<?php

namespace App\Filament\Resources\VipNotifications\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\Filter;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class VipNotificationsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('id')
                    ->label('#')
                    ->sortable(),
                TextColumn::make('user.username')
                    ->label('Destinatario')
                    ->searchable(),
                TextColumn::make('title')
                    ->label('Titulo')
                    ->searchable()
                    ->limit(60),
                TextColumn::make('message')
                    ->label('Mensaje')
                    ->limit(80)
                    ->wrap(),
                TextColumn::make('sender')
                    ->label('Remitente')
                    ->state(fn ($record): string => (string) (data_get($record, 'data.sender_username') ?: 'sistema'))
                    ->formatStateUsing(fn (string $state): string => $state === 'sistema' ? 'Sistema' : '@'.$state),
                IconColumn::make('read_at')
                    ->label('Leida')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-clock')
                    ->trueColor('success')
                    ->falseColor('warning'),
                TextColumn::make('created_at')
                    ->label('Creada')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Filter::make('unread')
                    ->label('No leidas')
                    ->query(fn (Builder $query): Builder => $query->whereNull('read_at')),
                Filter::make('read')
                    ->label('Leidas')
                    ->query(fn (Builder $query): Builder => $query->whereNotNull('read_at')),
                SelectFilter::make('user_id')
                    ->label('Destinatario')
                    ->relationship('user', 'username')
                    ->searchable()
                    ->preload(),
            ])
            ->recordActions([
                Action::make('markAsRead')
                    ->label('Marcar leida')
                    ->icon('heroicon-o-check')
                    ->visible(fn ($record): bool => $record->read_at === null)
                    ->action(function ($record): void {
                        $record->update(['read_at' => now()]);
                    }),
                Action::make('markAsUnread')
                    ->label('Marcar no leida')
                    ->icon('heroicon-o-arrow-path')
                    ->visible(fn ($record): bool => $record->read_at !== null)
                    ->action(function ($record): void {
                        $record->update(['read_at' => null]);
                    }),
                EditAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    BulkAction::make('bulkRead')
                        ->label('Marcar leidas')
                        ->icon('heroicon-o-check')
                        ->action(fn ($records) => $records->each(fn ($record) => $record->update(['read_at' => now()]))),
                    BulkAction::make('bulkUnread')
                        ->label('Marcar no leidas')
                        ->icon('heroicon-o-arrow-path')
                        ->action(fn ($records) => $records->each(fn ($record) => $record->update(['read_at' => null]))),
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
