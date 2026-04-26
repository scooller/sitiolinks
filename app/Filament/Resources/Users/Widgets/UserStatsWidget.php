<?php

namespace App\Filament\Resources\Users\Widgets;

use App\Models\SiteSettings;
use App\Models\User;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class UserStatsWidget extends BaseWidget
{
    protected int|string|array $columnSpan = 'full';

    protected static ?int $sort = 2;

    public function table(Table $table): Table
    {
        return $table
            ->heading('Estadísticas de Usuarios - Top 10')
            ->description('Usuarios más seguidos y más visitados')
            ->query(
                User::query()
                    ->orderByDesc('followers_count')
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\SpatieMediaLibraryImageColumn::make('avatar')
                    ->label('Avatar')
                    ->collection('avatar')
                    ->conversion('thumb')
                    ->circular()
                    ->defaultImageUrl(function () {
                        $settings = SiteSettings::first();

                        return $settings?->getFirstMediaUrl('default_avatar') ?: asset('images/default-avatar.png');
                    }),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->url(fn (User $record) => route('filament.admin.resources.users.edit', $record)),

                Tables\Columns\TextColumn::make('username')
                    ->label('Usuario')
                    ->searchable()
                    ->prefix('@')
                    ->copyable(),

                Tables\Columns\TextColumn::make('followers_count')
                    ->label('Seguidores')
                    ->sortable()
                    ->badge()
                    ->color('success')
                    ->icon('heroicon-o-users'),

                Tables\Columns\TextColumn::make('following_count')
                    ->label('Siguiendo')
                    ->sortable()
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('views')
                    ->label('Visitas')
                    ->sortable()
                    ->badge()
                    ->color('warning')
                    ->icon('heroicon-o-eye'),
            ])
            ->defaultSort('followers_count', 'desc')
            ->filters([
                Tables\Filters\SelectFilter::make('sort_by')
                    ->label('Ordenar por')
                    ->options([
                        'followers' => 'Más Seguidos',
                        'views' => 'Más Visitados',
                    ])
                    ->default('followers')
                    ->query(function ($query, $state) {
                        if ($state['value'] === 'views') {
                            return $query->orderByDesc('views');
                        }

                        return $query->orderByDesc('followers_count');
                    }),
            ]);
    }
}
