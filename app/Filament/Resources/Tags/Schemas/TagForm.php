<?php

namespace App\Filament\Resources\Tags\Schemas;

use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Schema;

class TagForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Grid::make(2)
                    ->schema([
                        TextInput::make('name')
                            ->label('Nombre')
                            ->required()
                            ->maxLength(255)
                            ->unique(ignoreRecord: true)
                            ->helperText('Nombre único de la etiqueta')
                            ->columnSpan(2),

                        TextInput::make('name_en')
                            ->label('Nombre (EN)')
                            ->maxLength(255)
                            ->helperText('Nombre en inglés para mostrar según idioma')
                            ->columnSpan(2),

                        Select::make('color')
                            ->label('Color Bootstrap')
                            ->required()
                            ->default('primary')
                            ->options([
                                'primary' => 'Primary (Azul)',
                                'secondary' => 'Secondary (Gris)',
                                'success' => 'Success (Verde)',
                                'danger' => 'Danger (Rojo)',
                                'warning' => 'Warning (Amarillo)',
                                'info' => 'Info (Cyan)',
                                'light' => 'Light (Claro)',
                                'dark' => 'Dark (Oscuro)',
                            ])
                            ->helperText('Color del badge en Bootstrap')
                            ->searchable(),

                        Select::make('icon')
                            ->label('Icono')
                            ->required()
                            ->default('fas-tag')
                            ->options(self::getIconOptions())
                            ->helperText('Selecciona un icono de Font Awesome o Heroicon')
                            ->searchable(),

                        TextInput::make('weight')
                            ->label('Peso de Importancia')
                            ->required()
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->maxValue(100)
                            ->suffix('pts')
                            ->helperText('Mayor peso = mayor importancia (0-100)')
                            ->columnSpan(1),

                        Toggle::make('is_fixed')
                            ->label('Fijo (solo admin)')
                            ->helperText('Si está activo, solo administradores verán y asignarán este tag')
                            ->default(false)
                            ->columnSpan(1),
                    ]),
            ]);
    }

    /**
     * Lista de iconos Font Awesome y Heroicons
     */
    protected static function getIconOptions(): array
    {
        return [
            // Font Awesome Solid
            'fas-tag' => '🏷️ Tag',
            'fas-star' => '⭐ Estrella',
            'fas-heart' => '❤️ Corazón',
            'fas-fire' => '🔥 Fuego',
            'fas-bolt' => '⚡ Rayo',
            'fas-crown' => '👑 Corona',
            'fas-gem' => '💎 Gema',
            'fa-sack-dollar' => '💰 Dolar',
            'fa-wifi' => '🌐 Wifi',
            'fa-user-doctor' => '👨‍⚕️ Doctor',
            'fas-trophy' => '🏆 Trofeo',
            'fas-medal' => '🏅 Medalla',
            'fa-ranking-star' => '⭐️ Puntuación',
            'fas-flag' => '🚩 Bandera',
            'fas-bookmark' => '🔖 Marcador',
            'fas-certificate' => '📜 Certificado',
            'fas-award' => '🎖️ Premio',
            'fas-thumbs-up' => '👍 Me gusta',
            'fas-check-circle' => '✅ Check',
            'fas-times-circle' => '❌ Cancelar',
            'fas-exclamation-circle' => '❗ Exclamación',
            'fas-info-circle' => 'ℹ️ Info',
            'fas-question-circle' => '❓ Pregunta',
            'fas-bell' => '🔔 Campana',
            'fas-lightbulb' => '💡 Idea',
            'fas-rocket' => '🚀 Cohete',
            'fas-gift' => '🎁 Regalo',
            'fas-users' => '👥 Usuarios',
            'fas-user-tie' => '👔 Profesional',
            'fas-briefcase' => '💼 Maletín',
            'fas-shield-alt' => '🛡️ Escudo',
            'fas-lock' => '🔒 Candado',
            'fas-key' => '🔑 Llave',

            // Heroicons Outline
            'heroicon-o-tag' => '🏷️ Tag (Outline)',
            'heroicon-o-star' => '⭐ Estrella (Outline)',
            'heroicon-o-heart' => '❤️ Corazón (Outline)',
            'heroicon-o-fire' => '🔥 Fuego (Outline)',
            'heroicon-o-bolt' => '⚡ Rayo (Outline)',
            'heroicon-o-bookmark' => '🔖 Marcador (Outline)',
            'heroicon-o-flag' => '🚩 Bandera (Outline)',
            'heroicon-o-sparkles' => '✨ Brillos (Outline)',
            'heroicon-o-light-bulb' => '💡 Idea (Outline)',
            'heroicon-o-shield-check' => '🛡️ Escudo (Outline)',
        ];
    }
}
