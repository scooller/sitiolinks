<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions for posts
        $permissions = [
            'view_any_post',
            'view_post',
            'create_post',
            'update_post',
            'delete_post',
            'delete_any_post',
            'approve_post',
            'moderate_content',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles

        // Usuario normal - Solo puede ver sus propios posts
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $userRole->givePermissionTo([
            'view_post',
            'create_post',
        ]);

        // Creador - Puede crear y gestionar sus posts
        $creatorRole = Role::firstOrCreate(['name' => 'creator']);
        $creatorRole->givePermissionTo([
            'view_any_post',
            'view_post',
            'create_post',
            'update_post',
            'delete_post',
        ]);

        // Moderador - Puede aprobar y moderar contenido
        $moderatorRole = Role::firstOrCreate(['name' => 'moderator']);
        $moderatorRole->givePermissionTo([
            'view_any_post',
            'view_post',
            'create_post',
            'update_post',
            'approve_post',
            'moderate_content',
            'delete_any_post',
        ]);

        // Admin - Ya tiene super_admin, pero por si acaso
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $adminRole->givePermissionTo(Permission::all());

        $this->command->info('Roles and permissions created successfully!');
        $this->command->info('Roles: user, creator, moderator, admin, super_admin');
    }
}
