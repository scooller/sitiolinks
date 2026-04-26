<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed configuración del sitio y páginas del sistema
        $this->call([
            RolesSeeder::class,
            SiteSettingsSeeder::class,
            PageSeeder::class,
        ]);

        // Crear usuario super administrador sin usar factories (faker no está en producción)
        $superAdmin = User::query()->create([
            'name' => 'Super Admin',
            'email' => 'scoollerx@hotmail.com',
            'username' => 'superadmin',
            'password' => bcrypt('password'),
            'email_verified_at' => now(),
        ]);

        // Asignar rol super_admin si existe (Shield debe estar instalado)
        try {
            $roleModel = Role::where('name', 'super_admin')->first();
            if ($roleModel) {
                // Otorgar todos los permisos disponibles al rol super_admin
                $allPermissions = Permission::all();
                $roleModel->syncPermissions($allPermissions);
                // Asignar rol al usuario
                $superAdmin->assignRole($roleModel);
            }
        } catch (\Exception $e) {
            // Si falla, el rol se asignará manualmente desde el panel
            $this->command->warn('No se pudo asignar el rol super_admin. Asígnalo manualmente desde el panel.');
        }

        // Usuarios de prueba omitidos en producción
    }
}
