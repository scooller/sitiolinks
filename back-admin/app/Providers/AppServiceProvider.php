<?php

namespace App\Providers;

use App\Events\NotificationCreated;
use App\Listeners\SendNotificationEmail;
use App\Models\Gallery;
use App\Models\SiteSettings;
use App\Models\Tag;
use App\Models\Ticket;
use App\Models\User;
use App\Observers\GalleryObserver;
use App\Observers\MediaObserver;
use App\Observers\SiteSettingsObserver;
use App\Observers\TagObserver;
use App\Observers\TicketObserver;
use App\Observers\UserObserver;
use App\Support\WatermarkManipulator;
use Illuminate\Support\ServiceProvider;
use Spatie\MediaLibrary\Conversions\Events\ConversionHasBeenCompletedEvent;
use Spatie\MediaLibrary\MediaCollections\Events\MediaHasBeenAddedEvent;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Media::observe(MediaObserver::class);
        Ticket::observe(TicketObserver::class);
        Gallery::observe(GalleryObserver::class);
        User::observe(UserObserver::class);
        SiteSettings::observe(SiteSettingsObserver::class);
        Tag::observe(TagObserver::class);

        // Registrar listener para envío de emails de notificaciones
        \Illuminate\Support\Facades\Event::listen(
            NotificationCreated::class,
            SendNotificationEmail::class
        );

        // Aplicar watermark al archivo original cuando se agrega
        \Illuminate\Support\Facades\Event::listen(
            MediaHasBeenAddedEvent::class,
            function (MediaHasBeenAddedEvent $event) {
                $originalPath = $event->media->getPath();
                if (file_exists($originalPath) && str_starts_with($event->media->mime_type, 'image/')) {
                    WatermarkManipulator::apply($originalPath);
                }
            }
        );

        // Aplicar watermark después de que se complete cada conversión
        \Illuminate\Support\Facades\Event::listen(
            ConversionHasBeenCompletedEvent::class,
            function (ConversionHasBeenCompletedEvent $event) {
                $conversionPath = $event->media->getPath($event->conversion->getName());
                if (file_exists($conversionPath)) {
                    WatermarkManipulator::apply($conversionPath);
                }
            }
        );
    }
}
