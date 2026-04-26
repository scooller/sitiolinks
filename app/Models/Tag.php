<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tag extends Model
{
    protected $fillable = [
        'name',
        'name_en',
        'color',
        'icon',
        'weight',
        'is_fixed',
    ];

    protected $casts = [
        'weight' => 'integer',
        'is_fixed' => 'boolean',
    ];

    /**
     * Usuarios que tienen este tag
     */
    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'user_tag')->withTimestamps();
    }

    /**
     * Sucursales de cafe que tienen este tag.
     */
    public function cafeBranches(): BelongsToMany
    {
        return $this->belongsToMany(CafeBranch::class, 'cafe_branch_tag')->withTimestamps();
    }
}
