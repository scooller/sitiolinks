<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Link extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'url',
        'icon',
        'is_adult',
        'order',
    ];

    protected $casts = [
        'is_adult' => 'boolean',
        'order' => 'integer',
    ];

    /**
     * Usuario propietario del link
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
