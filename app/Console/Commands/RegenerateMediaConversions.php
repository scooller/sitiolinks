<?php

namespace App\Console\Commands;

use App\Support\WatermarkManipulator;
use Illuminate\Console\Command;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class RegenerateMediaConversions extends Command
{
    protected $signature = 'media:regenerate {--watermark-only : Solo reaplicar watermark sin regenerar conversiones}';

    protected $description = 'Regenera thumbnails y reaplica watermark a todas las imágenes de usuarios (excluye archivos del sistema)';

    public function handle()
    {
        $watermarkOnly = $this->option('watermark-only');

        // Colecciones del sistema a excluir
        $systemCollections = ['logo', 'favicon', 'default_avatar'];

        $this->info('Buscando medios para procesar...');

        $media = Media::query()
            ->whereNotIn('collection_name', $systemCollections)
            ->where('mime_type', 'like', 'image/%')
            ->get();

        if ($media->isEmpty()) {
            $this->warn('No se encontraron imágenes para procesar.');

            return;
        }

        $this->info("Encontradas {$media->count()} imágenes para procesar.");
        $this->newLine();

        $bar = $this->output->createProgressBar($media->count());
        $bar->start();

        $processed = 0;
        $errors = 0;

        foreach ($media as $item) {
            try {
                if (! $watermarkOnly) {
                    // Regenerar todas las conversiones
                    $item->model->registerMediaConversions($item);
                    $item->regenerateConversions();
                }

                // Aplicar watermark al original
                $originalPath = $item->getPath();
                if (file_exists($originalPath)) {
                    WatermarkManipulator::apply($originalPath);
                }

                // Aplicar watermark a cada conversión
                foreach ($item->getGeneratedConversions() as $conversionName => $generated) {
                    if ($generated) {
                        $conversionPath = $item->getPath($conversionName);
                        if (file_exists($conversionPath)) {
                            WatermarkManipulator::apply($conversionPath);
                        }
                    }
                }

                $processed++;
            } catch (\Exception $e) {
                $errors++;
                $this->error("\nError procesando media ID {$item->id}: ".$e->getMessage());
            }

            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);

        $this->info("✓ Procesadas: {$processed}");
        if ($errors > 0) {
            $this->error("✗ Errores: {$errors}");
        }

        $this->newLine();
        $this->info('Proceso completado.');
    }
}
