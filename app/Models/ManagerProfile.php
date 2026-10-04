<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class ManagerProfile extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = ['user_id', 'cafe_id', 'status', 'notes'];

    protected function casts(): array
    {
        return [
            'status' => 'string',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function cafe(): BelongsTo
    {
        return $this->belongsTo(Cafe::class);
    }

    public function creators(): HasMany
    {
        return $this->hasMany(ManagerCreator::class);
    }

    public function activeCreators(): HasMany
    {
        return $this->hasMany(ManagerCreator::class)->where('status', 'approved');
    }

    public function pendingCreators(): HasMany
    {
        return $this->hasMany(ManagerCreator::class)->where('status', 'pending');
    }

    public function isActive(): bool
    {
        return $this->status === 'active';
    }

    public function isCafe(): bool
    {
        return $this->cafe_id !== null;
    }

    /** Número de creadores activos que tiene este manager */
    public function activeCreatorCount(): int
    {
        return $this->activeCreators()->count();
    }

    /**
     * Verifica si puede agregar más creadores según el límite de SiteSettings.
     */
    public function canAddCreator(): bool
    {
        $limit = SiteSettings::first()?->max_creators_per_manager ?? 20;

        return $this->activeCreatorCount() < $limit;
    }
}
