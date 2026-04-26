<?php

namespace App\Filament\Resources\VipNotifications\Schemas;

use App\Models\User;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class VipNotificationForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Destino VIP')
                    ->schema([
                        Select::make('recipient_id')
                            ->label('Destinatario VIP')
                            ->options(fn (): array => User::query()
                                ->role('vip')
                                ->orderBy('username')
                                ->get()
                                ->mapWithKeys(fn (User $user): array => [
                                    $user->id => "@{$user->username} ({$user->name})",
                                ])->all())
                            ->searchable()
                            ->required()
                            ->hiddenOn('edit'),
                        Placeholder::make('recipient_username')
                            ->label('Destinatario')
                            ->content(fn ($record): string => $record?->user ? "@{$record->user->username}" : '-')
                            ->hiddenOn('create'),
                    ]),

                Section::make('Contenido')
                    ->schema([
                        TextInput::make('title')
                            ->label('Titulo')
                            ->required()
                            ->maxLength(255),
                        Textarea::make('message')
                            ->label('Mensaje')
                            ->required()
                            ->rows(5)
                            ->maxLength(2000)
                            ->columnSpanFull(),
                        TextInput::make('url')
                            ->label('URL opcional')
                            ->url()
                            ->nullable()
                            ->maxLength(255)
                            ->columnSpanFull(),
                    ]),

                Section::make('Estado')
                    ->schema([
                        DateTimePicker::make('read_at')
                            ->label('Leida en')
                            ->seconds(false)
                            ->nullable()
                            ->hiddenOn('create'),
                        Placeholder::make('sender_username')
                            ->label('Enviada por')
                            ->content(function ($record): string {
                                $sender = data_get($record, 'data.sender_username');

                                return $sender ? "@{$sender}" : 'Sistema';
                            }),
                    ])
                    ->columns(2),
            ]);
    }
}
