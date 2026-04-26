<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CafeBranchReview extends Model
{
    protected $table = 'cafe_branch_reviews';

    protected $fillable = [
        'cafe_branch_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'rating' => 'integer',
    ];

    /**
     * Get the branch that this review belongs to.
     */
    public function branch(): BelongsTo
    {
        return $this->belongsTo(CafeBranch::class, 'cafe_branch_id');
    }

    /**
     * Get the user who wrote this review.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
