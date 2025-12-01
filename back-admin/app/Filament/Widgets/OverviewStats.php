<?php

namespace App\Filament\Widgets;

use App\Models\Post;
use App\Models\SiteSettings;
use App\Models\Tag;
use App\Models\User;
use Filament\Widgets\StatsOverviewWidget as BaseWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;
use Illuminate\Support\Carbon;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class OverviewStats extends BaseWidget
{
    public static function canView(): bool
    {
        $settings = SiteSettings::first();
        $config = $settings?->dashboard_widgets['overview_stats'] ?? null;

        return $config && ($config['enabled'] ?? false);
    }

    public static function getSort(): int
    {
        $settings = SiteSettings::first();

        return $settings?->dashboard_widgets['overview_stats']['order'] ?? 5;
    }

    protected function getStats(): array
    {
        $since = Carbon::now()->subDays(7);

        $users = User::query()->count();
        $usersLast7 = User::where('created_at', '>=', $since)->count();

        $posts = class_exists(Post::class) ? Post::query()->count() : 0;
        $postsLast7 = class_exists(Post::class) ? Post::where('created_at', '>=', $since)->count() : 0;

        $media = Media::query()->count();
        $mediaLast7 = Media::where('created_at', '>=', $since)->count();

        $tags = class_exists(Tag::class) ? Tag::query()->count() : 0;
        $tagsLast7 = class_exists(Tag::class) ? Tag::where('created_at', '>=', $since)->count() : 0;

        return [
            Stat::make('Usuarios', number_format($users))
                ->description(($usersLast7 > 0 ? '+' : '').number_format($usersLast7).' últimos 7 días')
                ->descriptionIcon($usersLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($usersLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-users')
                ->color('primary'),

            Stat::make('Posts', number_format($posts))
                ->description(($postsLast7 > 0 ? '+' : '').number_format($postsLast7).' últimos 7 días')
                ->descriptionIcon($postsLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($postsLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-document-text')
                ->color('info'),

            Stat::make('Medios', number_format($media))
                ->description(($mediaLast7 > 0 ? '+' : '').number_format($mediaLast7).' últimos 7 días')
                ->descriptionIcon($mediaLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($mediaLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-photo')
                ->color('warning'),

            Stat::make('Etiquetas', number_format($tags))
                ->description(($tagsLast7 > 0 ? '+' : '').number_format($tagsLast7).' últimos 7 días')
                ->descriptionIcon($tagsLast7 > 0 ? 'heroicon-o-arrow-trending-up' : 'heroicon-o-minus')
                ->descriptionColor($tagsLast7 > 0 ? 'success' : 'gray')
                ->icon('heroicon-o-tag')
                ->color('success'),
        ];
    }
}
