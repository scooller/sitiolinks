<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Gallery extends Model
{
    const VISIBILITY_PUBLIC = 'public';

    const VISIBILITY_PRIVATE = 'private';

    const VISIBILITY_FOLLOWERS = 'followers';

    // Moderation statuses
    const STATUS_PENDING = 'pending';

    const STATUS_APPROVED = 'approved';

    const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'user_id',
        'title',
        'description',
        'visibility',
        'order',
        'status',
        'is_featured',
        'featured_at',
        'likes_count',
    ];

    protected $casts = [
        'order' => 'integer',
        'is_featured' => 'boolean',
        'featured_at' => 'datetime',
        'likes_count' => 'integer',
    ];

    public static function statuses(): array
    {
        return [
            self::STATUS_PENDING => 'Pendiente',
            self::STATUS_APPROVED => 'Aprobada',
            self::STATUS_REJECTED => 'Rechazada',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function media(): BelongsToMany
    {
        return $this->belongsToMany(
            \Spatie\MediaLibrary\MediaCollections\Models\Media::class,
            'gallery_media',
            'gallery_id',
            'media_id'
        )
            ->withPivot(['order', 'caption'])
            ->withTimestamps()
            ->orderBy('gallery_media.order');
    }

    /**
     * Usuarios explícitamente permitidos para ver una galería privada
     */
    public function allowedUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'gallery_allowed_users', 'gallery_id', 'user_id')
            ->withTimestamps();
    }

    public static function visibilities(): array
    {
        return [
            self::VISIBILITY_PUBLIC => 'Público',
            self::VISIBILITY_PRIVATE => 'Privado',
            self::VISIBILITY_FOLLOWERS => 'Solo Seguidores',
        ];
    }

    public function isVisibleTo(?User $user): bool
    {
        // Admin y super_admin pueden ver TODAS las galerías sin restricciones
        if ($user && $user->hasAnyRole(['admin', 'super_admin'])) {
            return true;
        }

        // Rejected: solo owner y moderators
        if ($this->status === self::STATUS_REJECTED) {
            if (! $user) {
                return false;
            }
            if ($user->id === $this->user_id) {
                return true;
            }

            return $user->hasAnyRole(['moderator']);
        }
        // Pending: solo owner y moderators
        if ($this->status === self::STATUS_PENDING) {
            if (! $user) {
                return false;
            }
            if ($user->id === $this->user_id) {
                return true;
            }

            return $user->hasAnyRole(['moderator']);
        }
        // Public galleries are visible to everyone
        if ($this->visibility === self::VISIBILITY_PUBLIC) {
            return true;
        }

        // Not authenticated user can't see private/followers galleries
        if (! $user) {
            return false;
        }

        // Owner can always see their own galleries
        if ($this->user_id === $user->id) {
            return true;
        }

        // Private galleries visible to owner and explicitly allowed users
        if ($this->visibility === self::VISIBILITY_PRIVATE) {
            return $this->allowedUsers()->where('user_id', $user->id)->exists();
        }

        // Followers-only galleries visible to followers
        if ($this->visibility === self::VISIBILITY_FOLLOWERS) {
            return $this->user->followers()->where('follower_id', $user->id)->exists();
        }

        return false;
    }

    /**
     * Verificar si el usuario puede destacar galerías
     */
    public function canBeFeatured(): bool
    {
        // Solo galerías aprobadas y públicas pueden ser destacadas
        if ($this->status !== self::STATUS_APPROVED || $this->visibility !== self::VISIBILITY_PUBLIC) {
            return false;
        }

        $user = $this->user;
        if (! $user) {
            return false;
        }

        // Solo VIP, admin y super_admin pueden tener galerías destacadas
        return $user->hasAnyRole(['vip', 'admin', 'super_admin']);
    }

    /**
     * Obtener el límite de galerías destacadas para el propietario
     */
    public function getFeaturedLimit(): ?int
    {
        $user = $this->user;
        if (! $user) {
            return 0;
        }

        // Admin/super_admin: ilimitado
        if ($user->hasAnyRole(['admin', 'super_admin'])) {
            return null;
        }

        // VIP: según configuración
        if ($user->hasRole('vip')) {
            $settings = \App\Models\SiteSettings::first();

            return $settings?->featured_galleries_vip ?? 3; // default 3
        }

        return 0; // Otros roles no pueden destacar
    }

    /**
     * Likes recibidos por esta galería
     */
    public function likes()
    {
        return $this->hasMany(Like::class);
    }

    /**
     * Verificar si un usuario específico dio like a esta galería
     */
    public function likedByUser(?User $user): bool
    {
        if (! $user) {
            return false;
        }

        return $this->likes()->where('user_id', $user->id)->exists();
    }
}
