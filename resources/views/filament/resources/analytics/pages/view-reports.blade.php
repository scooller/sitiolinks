<x-filament-panels::page>
    <div class="space-y-6">
        <!-- Estadísticas Rápidas -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); grid-column-gap: 10px; margin-bottom: 20px;">
            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-primary-600">
                        {{ \App\Models\User::count() }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Total Usuarios
                    </div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-success-600">
                        {{ \App\Models\Gallery::where('status', 'approved')->count() }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Galerías Aprobadas
                    </div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-warning-600">
                        {{ \App\Models\Gallery::where('status', 'pending')->count() }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Galerías Pendientes
                    </div>
                </div>
            </x-filament::section>

            <x-filament::section>
                <div class="text-center">
                    <div class="text-3xl font-bold text-info-600">
                        {{ \App\Models\User::where('created_at', '>=', now()->subDays(7))->count() }}
                    </div>
                    <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Nuevos (7 días)
                    </div>
                </div>
            </x-filament::section>
        </div>

        <!-- Tabla de Reportes -->
        <x-filament::section>
            <x-slot name="heading">
                Reporte Detallado de Usuarios
            </x-slot>
            <x-slot name="description">
                Análisis completo de usuarios con galerías, vistas y actividad
            </x-slot>

            {{ $this->table }}
        </x-filament::section>
    </div>
</x-filament-panels::page>
