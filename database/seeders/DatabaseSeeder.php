<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Throwable;

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

        $superAdminEmail = (string) config('app.super_admin_email', 'scoollerx@hotmail.com');

        // Crear o actualizar super admin para permitir ejecutar seeders varias veces sin duplicar usuarios
        $superAdmin = User::query()->firstOrCreate(
            ['username' => 'superadmin'],
            [
                'name' => 'Super Admin',
                'email' => $superAdminEmail,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
            ]
        );

        if (! $superAdmin->wasRecentlyCreated) {
            $superAdmin->forceFill([
                'name' => 'Super Admin',
                'email' => $superAdminEmail,
                'email_verified_at' => $superAdmin->email_verified_at ?? now(),
            ])->save();
        }

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
        } catch (Throwable $e) {
            // Si falla, el rol se asignará manualmente desde el panel
            $this->command->warn('No se pudo asignar el rol super_admin. Asígnalo manualmente desde el panel.');
        }

        // Usuarios de prueba omitidos en producción
    }
}
