<?php

namespace App\Support;

use App\Models\SiteSettings;
use Spatie\Image\Enums\AlignPosition;
use Spatie\Image\Image;

class WatermarkManipulator
{
    public static function apply(string $imagePath): void
    {
        $settings = SiteSettings::first();

        if (! $settings || ! $settings->watermark_enabled || ! $settings->watermark_text) {
            return;
        }

        $watermarkPath = self::createTextWatermark(
            $settings->watermark_text,
            $settings->watermark_size ?? 14,
            $settings->watermark_opacity ?? 50
        );

        if (! $watermarkPath) {
            return;
        }

        try {
            Image::load($imagePath)
                ->watermark(
                    $watermarkPath,
                    self::getPosition($settings->watermark_position ?? 'bottom-right'),
                    paddingX: 10,
                    paddingY: 10
                )
                ->save();
        } finally {
            @unlink($watermarkPath);
        }
    }

    private static function createTextWatermark(string $text, int $fontSize, int $opacity): ?string
    {
        $tempDir = storage_path('app/temp');
        if (! is_dir($tempDir)) {
            mkdir($tempDir, 0755, true);
        }

        $tempFile = tempnam($tempDir, 'watermark_').'.png';

        // Obtener fuente configurada
        $settings = SiteSettings::first();
        $fontName = $settings?->watermark_font ?? 'system';
        $fontPath = $fontName !== 'system' ? storage_path('app/fonts/'.$fontName.'.ttf') : null;
        $useCustomFont = $fontPath && file_exists($fontPath);

        // Calcular dimensiones del texto
        if ($useCustomFont) {
            // Usar imagettfbbox para calcular dimensiones con fuente TTF
            $bbox = imagettfbbox($fontSize, 0, $fontPath, $text);
            $width = abs($bbox[4] - $bbox[0]) + 20;
            $height = abs($bbox[5] - $bbox[1]) + 20;
        } else {
            // Dimensiones aproximadas para fuente del sistema
            $width = strlen($text) * $fontSize;
            $height = $fontSize * 2;
        }

        $image = imagecreatetruecolor($width, $height);

        // Hacer el fondo transparente
        imagealphablending($image, false);
        $transparent = imagecolorallocatealpha($image, 0, 0, 0, 127);
        imagefill($image, 0, 0, $transparent);
        imagesavealpha($image, true);
        imagealphablending($image, true);

        // Color del texto blanco con opacidad
        $alpha = (int) ((100 - $opacity) * 1.27);
        $textColor = imagecolorallocatealpha($image, 255, 255, 255, $alpha);

        // Escribir el texto
        if ($useCustomFont) {
            imagettftext($image, $fontSize, 0, 10, $height - 10, $textColor, $fontPath, $text);
        } else {
            imagestring($image, 5, 10, $height / 2 - 10, $text, $textColor);
        }

        imagepng($image, $tempFile);
        imagedestroy($image);

        return $tempFile;
    }

    private static function getPosition(string $position): AlignPosition
    {
        return match ($position) {
            'top-left' => AlignPosition::TopLeft,
            'top-center' => AlignPosition::Top,
            'top-right' => AlignPosition::TopRight,
            'center-left' => AlignPosition::Left,
            'center' => AlignPosition::Center,
            'center-right' => AlignPosition::Right,
            'bottom-left' => AlignPosition::BottomLeft,
            'bottom-center' => AlignPosition::Bottom,
            'bottom-right' => AlignPosition::BottomRight,
            default => AlignPosition::BottomRight,
        };
    }
}
