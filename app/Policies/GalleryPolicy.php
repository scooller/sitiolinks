<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Gallery;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class GalleryPolicy
{
    use HandlesAuthorization;

    public function viewAny(User $authUser): bool
    {
        return $authUser->can('ViewAny:Gallery');
    }

    public function view(User $authUser, Gallery $gallery): bool
    {
        // Admin y super_admin pueden ver todas las galerías
        if ($authUser->hasAnyRole(['admin', 'super_admin'])) {
            return true;
        }

        // Delega a la lógica de visibilidad del modelo
        return $gallery->isVisibleTo($authUser);
    }

    public function create(User $authUser): bool
    {
        return $authUser->can('Create:Gallery');
    }

    public function update(User $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Update:Gallery');
    }

    public function delete(User $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Delete:Gallery');
    }

    public function restore(User $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Restore:Gallery');
    }

    public function forceDelete(User $authUser, Gallery $gallery): bool
    {
        return $authUser->can('ForceDelete:Gallery');
    }

    public function forceDeleteAny(User $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:Gallery');
    }

    public function restoreAny(User $authUser): bool
    {
        return $authUser->can('RestoreAny:Gallery');
    }

    public function replicate(User $authUser, Gallery $gallery): bool
    {
        return $authUser->can('Replicate:Gallery');
    }

    public function reorder(User $authUser): bool
    {
        return $authUser->can('Reorder:Gallery');
    }
}
