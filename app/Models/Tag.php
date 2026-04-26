<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_tag')->withTimestamps();
    }
}
