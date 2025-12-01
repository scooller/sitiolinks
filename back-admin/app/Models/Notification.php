<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    // Tipos de notificaciones
    public const TYPE_FOLLOW = 'follow';

    public const TYPE_GALLERY_FEATURED = 'gallery_featured';

    public const TYPE_GALLERY_APPROVED = 'gallery_approved';

    public const TYPE_GALLERY_REJECTED = 'gallery_rejected';

    public const TYPE_SYSTEM = 'system';

    protected $fillable = [
        'user_id',
        'type',
        'title',
        'message',
        'data',
        'url',
        'read_at',
    ];

    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Scopes
    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    public function scopeRead($query)
    {
        return $query->whereNotNull('read_at');
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Helpers
    public function markAsRead(): void
    {
        if (! $this->read_at) {
            $this->update(['read_at' => now()]);
        }
    }

    public function isUnread(): bool
    {
        return is_null($this->read_at);
    }
}
