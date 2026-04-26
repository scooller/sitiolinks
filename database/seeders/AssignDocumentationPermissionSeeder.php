<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class AssignDocumentationPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $guard = 'web';
        $permissionNames = [
            'View:Documentation', // Filament Shield page permission
        ];

        foreach ($permissionNames as $name) {
            $permission = Permission::firstOrCreate([
                'name' => $name,
                'guard_name' => $guard,
            ]);

            $roles = Role::whereIn('name', ['admin', 'super_admin'])->get();
            foreach ($roles as $role) {
                if (! $role->hasPermissionTo($permission)) {
                    $role->givePermissionTo($permission);
                }
            }
        }
    }
}
