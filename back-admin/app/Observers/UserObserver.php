<?php

namespace App\Observers;

use App\Models\User;
use App\Services\GraphQLCache;

class UserObserver
{
    public function created(User $user): void
    {
        GraphQLCache::flushFor('users');
    }

    public function updated(User $user): void
    {
        if ($user->isDirty(['name', 'username', 'nationality', 'gender', 'price_from'])) {
            GraphQLCache::flushFor('users');
        }
    }

    public function deleted(User $user): void
    {
        GraphQLCache::flushFor('users');
    }
}
