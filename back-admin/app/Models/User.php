<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Filament\Models\Contracts\FilamentUser;
use Filament\Panel;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Image\Enums\AlignPosition;
use Spatie\Image\Enums\Unit;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable implements FilamentUser, HasMedia, MustVerifyEmail
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, HasRoles, InteractsWithMedia, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'nationality',
        'country',
        'city',
        'description',
        'gender',
        'country_block',
        'birth_date',
        'price_from',
        'card_bg_color',
        'card_bg_opacity',
        'email_notifications',
        'is_verified',
        'verified_at',
        'warning_modal_dismissed',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'country_block' => 'boolean',
            'birth_date' => 'date',
            'price_from' => 'decimal:2',
            'card_bg_color' => 'string',
            'card_bg_opacity' => 'float',
            'email_notifications' => 'boolean',
            'is_verified' => 'boolean',
            'verified_at' => 'datetime',
            'warning_modal_dismissed' => 'boolean',
        ];
    }

    public function canAccessPanel(Panel $panel): bool
    {
        return $this->hasRole(['super_admin', 'admin']);
    }

    

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('avatar')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        // Colección temporal para avatars subidos pero no confirmados
        $this->addMediaCollection('avatar_temp')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('gallery')
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $settings = \App\Models\SiteSettings::first();

        if ($media && $media->collection_name === 'avatar') {
            $width = $settings?->avatar_width ?? 200;
            $height = $settings?->avatar_height ?? 200;

            // Thumbnail - tamaño pequeño
            $this->addMediaConversion('thumb')
                ->width($width)
                ->height($height)
                ->keepOriginalImageFormat()
                ->performOnCollections('avatar')
                ->nonQueued();

            // Thumbnail WebP para navegadores modernos
            $this->addMediaConversion('thumb_webp')
                ->width($width)
                ->height($height)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('avatar')
                ->nonQueued();

            // Avatar pequeño para móviles (120x120 WebP)
            $this->addMediaConversion('avatar_small_webp')
                ->width(120)
                ->height(120)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('avatar')
                ->nonQueued();

            // Avatar mediano para tablets (240x240 WebP)
            $this->addMediaConversion('avatar_medium_webp')
                ->width(240)
                ->height(240)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('avatar')
                ->nonQueued();

            // Avatar completo (500x500) para perfil de usuario
            $this->addMediaConversion('avatar')
                ->width(500)
                ->height(500)
                ->keepOriginalImageFormat()
                ->performOnCollections('avatar')
                ->nonQueued();

            // Avatar completo en WebP
            $this->addMediaConversion('avatar_webp')
                ->width(500)
                ->height(500)
                ->format('webp')
                ->quality(80)
                ->performOnCollections('avatar')
                ->nonQueued();

            return;
        }

        if ($media && $media->collection_name === 'gallery') {
            $tw = $settings?->thumbnail_width ?? 300;
            $th = $settings?->thumbnail_height ?? 300;

            $conv = $this->addMediaConversion('thumb')
                ->width($tw)
                ->height($th)
                ->keepOriginalImageFormat()
                ->performOnCollections('gallery')
                ->nonQueued();

            // Variante WebP optimizada
            $this->addMediaConversion('thumb_webp')
                ->width($tw)
                ->height($th)
                ->format('webp')
                ->quality(75)
                ->performOnCollections('gallery')
                ->nonQueued();

            if ($settings?->watermark_enabled) {
                $wmPath = $this->generateTextWatermark($settings);
                if ($wmPath && file_exists($wmPath)) {
                    $wmSize = (int) ($settings->watermark_size ?? 30); // percentage
                    $position = match ($settings->watermark_position) {
                        'top-left' => AlignPosition::TopLeft,
                        'top' => AlignPosition::Top,
                        'top-right' => AlignPosition::TopRight,
                        'left' => AlignPosition::Left,
                        'center' => AlignPosition::Center,
                        'right' => AlignPosition::Right,
                        'bottom-left' => AlignPosition::BottomLeft,
                        'bottom' => AlignPosition::Bottom,
                        'bottom-right' => AlignPosition::BottomRight,
                        default => AlignPosition::BottomRight,
                    };
                    $opacity = (int) ($settings->watermark_opacity ?? 50);

                    $conv->watermark(
                        $wmPath,
                        $position,
                        width: $wmSize,
                        widthUnit: Unit::Percent,
                        alpha: $opacity,
                        paddingX: 5,
                        paddingY: 5,
                    );
                }
            }

            return;
        }

        // Fallback when $media is null: declare both so medialibrary knows they exist
        $this->addMediaConversion('thumb')
            ->performOnCollections('avatar', 'gallery')
            ->nonQueued();
        $this->addMediaConversion('thumb_webp')
            ->format('webp')
            ->performOnCollections('avatar', 'gallery')
            ->nonQueued();
    }

    private function generateTextWatermark(\App\Models\SiteSettings $settings): ?string
    {
        $text = trim((string) ($settings->watermark_text ?? ''));
        if ($text === '') {
            return null;
        }

        $fontCandidates = [
            $settings->watermark_font ?? '',
            'C:\\Windows\\Fonts\\arial.ttf',
            '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
        ];
        $fontPath = null;
        foreach ($fontCandidates as $cand) {
            if ($cand && file_exists($cand)) {
                $fontPath = $cand;
                break;
            }
        }
        if (! $fontPath) {
            return null; // no truetype font available
        }

        $tmpDir = storage_path('app/site');
        if (! is_dir($tmpDir)) {
            @mkdir($tmpDir, 0775, true);
        }
        $out = $tmpDir.'/watermark_text.png';

        $imgW = 1000; // base canvas width
        $imgH = 300;  // base canvas height
        $im = imagecreatetruecolor($imgW, $imgH);
        imagesavealpha($im, true);
        $trans = imagecolorallocatealpha($im, 0, 0, 0, 127);
        imagefill($im, 0, 0, $trans);

        $opacity = (int) ($settings->watermark_opacity ?? 50); // 0-100
        $alpha = (int) round(127 * (100 - max(0, min(100, $opacity))) / 100); // 0 opaque, 127 transparent
        $color = imagecolorallocatealpha($im, 0, 0, 0, $alpha);

        $fontSize = max(10, (int) ($settings->watermark_size ?? 30)); // as px for base image
        $angle = 0;
        $bbox = imagettfbbox($fontSize, $angle, $fontPath, $text);
        $textW = abs($bbox[2] - $bbox[0]);
        $textH = abs($bbox[7] - $bbox[1]);
        $x = (int) (($imgW - $textW) / 2);
        $y = (int) (($imgH + $textH) / 2);

        imagettftext($im, $fontSize, $angle, $x, $y, $color, $fontPath, $text);
        imagepng($im, $out);
        imagedestroy($im);

        return $out;
    }

    /**
     * Tags asociados al usuario
     */
    public function tags()
    {
        return $this->belongsToMany(Tag::class, 'user_tag')->withTimestamps();
    }

    /**
     * Links del usuario
     */
    public function links()
    {
        return $this->hasMany(Link::class)->orderBy('order');
    }

    /**
     * Usuarios que siguen a este usuario (seguidores)
     */
    public function followers()
    {
        return $this->belongsToMany(User::class, 'user_follower', 'following_id', 'follower_id')
            ->withTimestamps();
    }

    /**
     * Usuarios que este usuario sigue
     */
    public function following()
    {
        return $this->belongsToMany(User::class, 'user_follower', 'follower_id', 'following_id')
            ->withTimestamps();
    }

    /**
     * Verificar si este usuario sigue a otro usuario
     */
    public function isFollowing(User $user): bool
    {
        return $this->following()->where('following_id', $user->id)->exists();
    }

    /**
     * Seguir a un usuario
     */
    public function follow(User $user): void
    {
        if (! $this->isFollowing($user) && $this->id !== $user->id) {
            $this->following()->attach($user->id);
            $user->increment('followers_count');
            $this->increment('following_count');
        }
    }

    /**
     * Dejar de seguir a un usuario
     */
    public function unfollow(User $user): void
    {
        if ($this->isFollowing($user)) {
            $this->following()->detach($user->id);
            $user->decrement('followers_count');
            $this->decrement('following_count');
        }
    }

    /**
     * Tickets creados por este usuario
     */
    public function tickets()
    {
        return $this->hasMany(Ticket::class);
    }

    /**
     * Tickets asignados a este usuario (admin)
     */
    public function assignedTickets()
    {
        return $this->hasMany(Ticket::class, 'assigned_to');
    }

    /**
     * Galerías del usuario
     */
    public function galleries()
    {
        return $this->hasMany(Gallery::class)->orderBy('order');
    }

    /**
     * Notificaciones del usuario
     */
    public function notifications()
    {
        return $this->hasMany(Notification::class)->orderBy('created_at', 'desc');
    }

    /**
     * Likes dados por el usuario
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }
}
