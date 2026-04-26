<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\SiteSettings;
use Illuminate\Auth\Access\HandlesAuthorization;
use Illuminate\Foundation\Auth\User as AuthUser;

class SiteSettingsPolicy
{
    use HandlesAuthorization;

    public function viewAny(AuthUser $authUser): bool
    {
        return $authUser->can('ViewAny:SiteSettings');
    }

    public function view(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('View:SiteSettings');
    }

    public function create(AuthUser $authUser): bool
    {
        return $authUser->can('Create:SiteSettings');
    }

    public function update(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('Update:SiteSettings');
    }

    public function delete(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('Delete:SiteSettings');
    }

    public function restore(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('Restore:SiteSettings');
    }

    public function forceDelete(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('ForceDelete:SiteSettings');
    }

    public function forceDeleteAny(AuthUser $authUser): bool
    {
        return $authUser->can('ForceDeleteAny:SiteSettings');
    }

    public function restoreAny(AuthUser $authUser): bool
    {
        return $authUser->can('RestoreAny:SiteSettings');
    }

    public function replicate(AuthUser $authUser, SiteSettings $siteSettings): bool
    {
        return $authUser->can('Replicate:SiteSettings');
    }

    public function reorder(AuthUser $authUser): bool
    {
        return $authUser->can('Reorder:SiteSettings');
    }
}
