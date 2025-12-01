<?php

namespace App\Filament\Resources\Galleries\Schemas;

use App\Models\Gallery;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class GalleryForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información de la Galería')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required()
                            ->default(fn () => auth('web')->id()),
                        TextInput::make('title')
                            ->label('Título')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Textarea::make('description')
                            ->label('Descripción')
                            ->rows(3)
                            ->maxLength(1000)
                            ->columnSpanFull(),

                        Select::make('visibility')
                            ->label('Visibilidad')
                            ->options(Gallery::visibilities())
                            ->default(Gallery::VISIBILITY_PUBLIC)
                            ->required()
                            ->helperText('Público: Visible para todos. Privado: Solo tú. Seguidores: Solo tus seguidores.'),

                        Select::make('status')
                            ->label('Estado')
                            ->options(Gallery::statuses())
                            ->default(Gallery::STATUS_APPROVED)
                            ->required()
                            ->helperText('Pendiente: Requiere aprobación. Aprobada: Visible públicamente. Rechazada: No visible.'),

                        TextInput::make('order')
                            ->label('Orden')
                            ->numeric()
                            ->default(0)
                            ->helperText('Orden de visualización (menor número = primero)'),

                        Toggle::make('is_featured')
                            ->label('Destacar galería')
                            ->helperText('Solo galerías aprobadas y públicas de usuarios VIP/admin pueden destacarse.')
                            ->inline(false)
                            ->columnSpanFull(),

                        DateTimePicker::make('featured_at')
                            ->label('Fecha de destacado')
                            ->helperText('Se actualiza automáticamente al destacar/desdestacar.')
                            ->disabled()
                            ->dehydrated(false)
                            ->visible(fn ($get) => $get('is_featured')),
                    ])
                    ->columns(2),
            ]);
    }
}
