<?php

namespace App\Filament\Resources\ContactMessages\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class ContactMessageForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Mensaje del usuario')
                    ->schema([
                        TextInput::make('name')
                            ->label('Nombre')
                            ->disabled(),
                        TextInput::make('email')
                            ->label('Email')
                            ->disabled(),
                        TextInput::make('subject')
                            ->label('Asunto')
                            ->disabled()
                            ->columnSpanFull(),
                        Textarea::make('message')
                            ->label('Mensaje')
                            ->disabled()
                            ->rows(6)
                            ->columnSpanFull(),
                        TextInput::make('created_at')
                            ->label('Recibido')
                            ->disabled(),
                    ]),

                Section::make('Gestión')
                    ->schema([
                        Select::make('status')
                            ->label('Estado')
                            ->options([
                                'new' => 'Nuevo',
                                'read' => 'Leído',
                                'responded' => 'Respondido',
                                'closed' => 'Cerrado',
                            ])
                            ->required()
                            ->default('new'),
                        Textarea::make('admin_response')
                            ->label('Respuesta / Notas')
                            ->rows(4)
                            ->columnSpanFull(),
                    ]),

                Section::make('Metadata')
                    ->schema([
                        TextInput::make('ip_address')
                            ->label('Dirección IP')
                            ->disabled(),
                        TextInput::make('user_id')
                            ->label('Usuario ID (si autenticado)')
                            ->disabled(),
                        TextInput::make('user_agent')
                            ->label('User Agent')
                            ->disabled()
                            ->columnSpanFull(),
                    ])
                    ->collapsible()
                    ->collapsed(),
            ]);
    }
}
