<?php

namespace App\Filament\Resources\Cafes\Schemas;

use Filament\Facades\Filament;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;

class CafeBranchForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información de la Sucursal')
                    ->columnSpanFull()
                    ->schema([
                        TextInput::make('name')
                            ->label('Nombre')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Textarea::make('description')
                            ->label('Descripción')
                            ->rows(3)
                            ->maxLength(1000)
                            ->columnSpanFull(),

                        TextInput::make('address')
                            ->label('Dirección')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull(),

                        Grid::make(3)
                            ->columnSpanFull()
                            ->schema([
                                TextInput::make('city')
                                    ->label('Ciudad'),

                                TextInput::make('state')
                                    ->label('Comuna'),

                                TextInput::make('postal_code')
                                    ->label('Código Postal'),
                            ]),

                        TextInput::make('phone')
                            ->label('Teléfono')
                            ->nullable()
                            ->columnSpanFull(),

                        TextInput::make('website')
                            ->label('Website')
                            ->url()
                            ->nullable()
                            ->columnSpanFull(),

                        Textarea::make('google_maps_url')
                            ->label('Mapa (Google Maps)')
                            ->rows(3)
                            ->nullable()
                            ->columnSpanFull()
                            ->helperText('Pega el código iframe de "Insertar mapa" de Google Maps o una URL directa de Google Maps')
                            ->dehydrateStateUsing(function (?string $state): ?string {
                                if (blank($state)) {
                                    return null;
                                }

                                // If it's a full <iframe> tag, extract the src attribute
                                if (str_contains($state, '<iframe')) {
                                    if (preg_match('/src=["\']([^"\']+)["\']/', $state, $matches)) {
                                        return $matches[1];
                                    }
                                }

                                return $state;
                            }),

                        TextInput::make('menu_qr_url')
                            ->label('URL del QR del Menú')
                            ->url()
                            ->nullable()
                            ->columnSpanFull(),

                        TextInput::make('entry_price')
                            ->label('Precio de Entrada')
                            ->numeric()
                            ->nullable()
                            ->step(0.01)
                            ->columnSpan(1),

                        TextInput::make('consumo_individual')
                            ->label('Consumo individual')
                            ->numeric()
                            ->nullable()
                            ->step(0.01)
                            ->columnSpan(1),

                        TextInput::make('consumo_chica')
                            ->label('Consumo chica')
                            ->numeric()
                            ->nullable()
                            ->step(0.01)
                            ->columnSpan(1),

                        Select::make('tags')
                            ->label('Etiquetas')
                            ->relationship('tags', 'name', modifyQueryUsing: function (Builder $query) {
                                $user = Filament::auth()->user();
                                $roleNames = $user?->roles?->pluck('name')->all() ?? [];
                                $isAdmin = in_array('admin', $roleNames, true) || in_array('super_admin', $roleNames, true);

                                if (! $isAdmin) {
                                    $query->where('is_fixed', false);
                                }
                            })
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->helperText('Selecciona una o más etiquetas para esta sucursal')
                            ->columnSpanFull(),

                        CheckboxList::make('creators')
                            ->label('Creadores')
                            ->relationship('creators', 'name', modifyQueryUsing: function (Builder $query): void {
                                $query->whereHas('roles', function (Builder $roleQuery): void {
                                    $roleQuery->whereIn('name', ['creator', 'vip', 'admin', 'super_admin']);
                                });
                            })
                            ->searchable()
                            ->helperText('Asocia uno o más creadores a esta sucursal')
                            ->columnSpanFull(),
                    ]),
            ]);
    }
}
