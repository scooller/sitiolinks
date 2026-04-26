<?php

namespace App\Filament\Widgets;

use App\Models\SiteSettings;
use App\Models\User;
use Filament\Tables;
use Filament\Tables\Table;
use Filament\Widgets\TableWidget as BaseWidget;
use Illuminate\Support\Facades\DB;

class TopLikedUsersWidget extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['top_liked_users'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['top_liked_users']['order'] ?? 5;
    }

    protected static ?int $sort = 5;

    protected int|string|array $columnSpan = 'full';

    public function table(Table $table): Table
    {
        return $table
            ->query(
                User::query()
                    ->select('users.*')
                    ->selectSub(
                        DB::table('user_likes')
                            ->selectRaw('COUNT(*)')
                            ->whereColumn('user_likes.liked_user_id', 'users.id'),
                        'likes_count'
                    )
                    ->orderByDesc('likes_count')
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
                    ->url(fn (User $record) => route('filament.admin.resources.users.edit', $record))
                    ->openUrlInNewTab(),

                Tables\Columns\TextColumn::make('username')
                    ->label('Usuario')
                    ->searchable()
                    ->prefix('@')
                    ->copyable(),

                Tables\Columns\TextColumn::make('likes_count')
                    ->label('Me gusta')
                    ->sortable()
                    ->badge()
                    ->color('danger'),
            ])
            ->heading('Usuarios más gustados')
            ->description('Top 10 perfiles por "me gusta" en el período total')
            ->paginated(false);
    }
}
