<?php

namespace App\Filament\Resources\Tickets\Schemas;

use App\Models\Ticket;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class TicketForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Ticket')
                    ->schema([
                        TextInput::make('subject')
                            ->label('Asunto')
                            ->required()
                            ->columnSpanFull(),
                        Textarea::make('description')
                            ->label('Descripción')
                            ->rows(6)
                            ->columnSpanFull(),
                        Select::make('category')
                            ->label('Categoría')
                            ->options(Ticket::categories())
                            ->required(),
                        Select::make('priority')
                            ->label('Prioridad')
                            ->options(Ticket::priorities())
                            ->required(),
                        Select::make('status')
                            ->label('Estado')
                            ->options(Ticket::statuses())
                            ->required(),
                        Select::make('assigned_to')
                            ->label('Asignado a')
                            ->relationship(
                                name: 'assignedTo',
                                titleAttribute: 'name',
                                modifyQueryUsing: fn ($query) => $query->whereHas('roles', fn ($q) => $q->whereIn('name', ['super_admin', 'admin', 'moderator']))
                            )
                            ->searchable()
                            ->preload()
                            ->nullable(),
                        Textarea::make('resolution')
                            ->label('Resolución / Notas finales')
                            ->rows(4)
                            ->columnSpanFull(),
                    ]),

                Section::make('Metadata')
                    ->schema([
                        TextInput::make('user_id')
                            ->label('Usuario ID')
                            ->disabled(),
                        DateTimePicker::make('created_at')
                            ->label('Creado')
                            ->disabled(),
                        DateTimePicker::make('first_response_at')
                            ->label('Primera respuesta'),
                        DateTimePicker::make('resolved_at')
                            ->label('Resuelto'),
                        DateTimePicker::make('closed_at')
                            ->label('Cerrado'),
                    ])
                    ->collapsible()
                    ->collapsed(),
            ]);
    }
}
