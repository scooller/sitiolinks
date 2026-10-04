<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class CreatorDocument extends Model implements HasMedia
{
    use InteractsWithMedia;

    protected $fillable = [
        'creator_user_id',
        'manager_profile_id',
        'type',
        'verified',
        'verified_at',
        'verified_by',
        'notes',
        'viewed_by',
    ];

    protected function casts(): array
    {
        return [
            'verified' => 'boolean',
            'verified_at' => 'datetime',
            'viewed_by' => 'array',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'creator_user_id');
    }

    public function manager(): BelongsTo
    {
        return $this->belongsTo(ManagerProfile::class, 'manager_profile_id');
    }

    public function verifier(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    public function registerMediaCollections(): void
    {
        // Documentos en disk local (privado, no accesible públicamente)
        $this->addMediaCollection('id_front')
            ->useDisk('local')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('id_back')
            ->useDisk('local')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);

        $this->addMediaCollection('selfie_with_id')
            ->useDisk('local')
            ->singleFile()
            ->acceptsMimeTypes(['image/jpeg', 'image/png', 'image/webp']);
    }

    /**
     * Registra que un usuario vio este documento (GDPR audit).
     */
    public function recordView(int $userId): void
    {
        $views = $this->viewed_by ?? [];
        $views[] = ['user_id' => $userId, 'at' => now()->toIso8601String()];
        $this->update(['viewed_by' => $views]);
    }

    /**
     * Verifica si las 3 fotos requeridas están subidas.
     */
    public function isComplete(): bool
    {
        return $this->hasMedia('id_front')
            && $this->hasMedia('id_back')
            && $this->hasMedia('selfie_with_id');
    }
}
