<?php

namespace App\Filament\Resources\Cafes\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class CafeBranchReviewForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información de la Reseña')
                    ->columnSpanFull()
                    ->schema([
                        Select::make('cafe_branch_id')
                            ->label('Sucursal')
                            ->relationship('branch', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Select::make('user_id')
                            ->label('Usuario')
                            ->relationship('user', 'name')
                            ->searchable()
                            ->preload()
                            ->required(),

                        Select::make('rating')
                            ->label('Calificación')
                            ->options([
                                1 => '1 Estrella',
                                2 => '2 Estrellas',
                                3 => '3 Estrellas',
                                4 => '4 Estrellas',
                                5 => '5 Estrellas',
                            ])
                            ->required(),

                        Textarea::make('comment')
                            ->label('Comentario')
                            ->rows(4)
                            ->maxLength(1000)
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
