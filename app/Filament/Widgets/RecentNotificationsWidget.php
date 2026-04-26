<?php

namespace App\Filament\Widgets;

use App\Models\Notification;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;

class RecentNotificationsWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['recent_notifications'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['recent_notifications']['order'] ?? 9;
    }

    protected static ?int $sort = 2;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                Notification::query()
                    ->orderBy('created_at', 'desc')
                    ->limit(10)
            )
            ->columns([
                Tables\Columns\TextColumn::make('type')
                    ->label('Tipo')
                    ->formatStateUsing(fn ($state) => class_basename($state))
                    ->badge()
                    ->color(fn ($state) => match (class_basename($state)) {
                        'GalleryApproved' => 'success',
                        'GalleryRejected' => 'danger',
                        'NewFollower' => 'info',
                        'NewComment' => 'warning',
                        default => 'gray'
                    })
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('notifiable_id')
                    ->label('Usuario')
                    ->formatStateUsing(function ($state) {
                        $user = User::find($state);

                        return $user ? $user->name : 'Usuario #'.$state;
                    })
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('data')
                    ->label('Mensaje')
                    ->formatStateUsing(function ($state) {
                        if (is_array($state)) {
                            return $state['message'] ?? 'Sin mensaje';
                        }

                        return 'Sin mensaje';
                    })
                    ->limit(50)
                    ->wrap(),

                Tables\Columns\IconColumn::make('read_at')
                    ->label('Leída')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-circle')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('warning')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->heading('Últimas Notificaciones del Sistema')
            ->description('Las 10 notificaciones más recientes enviadas a usuarios')
            ->paginated(false);
    }
}
