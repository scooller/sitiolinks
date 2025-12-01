<?php

namespace App\Filament\Widgets;

use App\Models\Gallery;
use App\Models\SiteSettings;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class PopularGalleriesWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['popular_galleries'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['popular_galleries']['order'] ?? 10;
    }

    protected static ?int $sort = 4;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Gallery::query()
                    ->withCount('media')
                    ->with(['user:id,name,username'])
                    ->where('status', 'approved')
                    ->orderBy('media_count', 'desc')
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\ImageColumn::make('media_preview')
                    ->label('Portada')
                    ->getStateUsing(function (Gallery $record) {
                        $firstMedia = $record->media->first();

                        return $firstMedia?->getUrl('thumb') ?? null;
                    })
                    ->circular()
                    ->defaultImageUrl(url('/images/placeholder.png')),

                Tables\Columns\TextColumn::make('title')
                    ->label('Título')
                    ->searchable()
                    ->sortable()
                    ->weight('bold')
                    ->url(fn (Gallery $record) => route('filament.admin.resources.galleries.edit', $record))
                    ->openUrlInNewTab(),

                Tables\Columns\TextColumn::make('user.name')
                    ->label('Creador')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('media_count')
                    ->label('Medios')
                    ->sortable()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('visibility')
                    ->label('Visibilidad')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'public' => 'success',
                        'private' => 'danger',
                        'followers' => 'warning',
                        default => 'gray'
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'public' => 'Pública',
                        'private' => 'Privada',
                        'followers' => 'Seguidores',
                        default => $state
                    }),

                Tables\Columns\IconColumn::make('is_featured')
                    ->label('Destacada')
                    ->boolean()
                    ->trueIcon('heroicon-o-star')
                    ->falseIcon('heroicon-o-minus')
                    ->trueColor('warning')
                    ->falseColor('gray'),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Creada')
                    ->date('d/m/Y')
                    ->sortable(),
            ])
            ->heading('Galerías Más Populares')
            ->description('Top 10 galerías por cantidad de medios')
            ->paginated(false);
    }
}
