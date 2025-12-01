<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Command;

class CleanOrphanMedia extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'media:clean-orphans {--dry-run : Solo mostrar sin eliminar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Eliminar medios de la colección gallery que no están asociados a ninguna galería';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $dryRun = $this->option('dry-run');

        $this->info('Buscando medios huérfanos en la colección "gallery"...');

        $orphanMedia = Media::where('collection_name', 'gallery')
            ->whereDoesntHave('galleries')
            ->get();

        if ($orphanMedia->isEmpty()) {
            $this->info('No se encontraron medios huérfanos.');

            return 0;
        }

        $this->warn("Se encontraron {$orphanMedia->count()} medios huérfanos:");

        $this->table(
            ['ID', 'File Name', 'Size (KB)', 'Created At'],
            $orphanMedia->map(function ($media) {
                return [
                    $media->id,
                    $media->file_name,
                    round($media->size / 1024, 2),
                    $media->created_at->format('Y-m-d H:i:s'),
                ];
            })
        );

        if ($dryRun) {
            $this->comment('Modo dry-run: No se eliminó nada. Ejecuta sin --dry-run para eliminar.');

            return 0;
        }

        if (! $this->confirm('¿Deseas eliminar estos medios?', true)) {
            $this->info('Operación cancelada.');

            return 0;
        }

        $deletedCount = 0;
        foreach ($orphanMedia as $media) {
            try {
                $fileName = $media->file_name;
                $media->delete(); // Spatie elimina archivos físicos automáticamente
                $deletedCount++;
                $this->line("✓ Eliminado: {$fileName}");
            } catch (\Exception $e) {
                $this->error("✗ Error al eliminar {$media->file_name}: {$e->getMessage()}");
            }
        }

        $this->info("Se eliminaron {$deletedCount} medios huérfanos correctamente.");

        return 0;
    }
}
