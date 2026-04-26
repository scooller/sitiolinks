<?php

namespace App\Filament\Resources\Media\Tables;

use App\Models\Post;
use App\Models\User;
use App\Support\WatermarkManipulator;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Notifications\Notification;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

class MediaTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                ImageColumn::make('id')
                    ->label('Preview')
                    ->disk('public')
                    ->state(function ($record) {
                        // Obtener la ruta relativa al disco público
                        $path = $record->getPathRelativeToRoot();

                        // Si tiene conversión thumb, usarla
                        if ($record->hasGeneratedConversion('thumb')) {
                            return str_replace($record->file_name, 'conversions/'.pathinfo($record->file_name, PATHINFO_FILENAME).'-thumb.'.pathinfo($record->file_name, PATHINFO_EXTENSION), $path);
                        }

                        return $path;
                    })
                    ->url(fn ($record) => $record->getUrl())
                    ->openUrlInNewTab()
                    ->circular(),
                TextColumn::make('file_name')->searchable()->label('Archivo'),
                TextColumn::make('collection_name')->label('Colección')->badge(),
                TextColumn::make('owner')
                    ->label('Usuario')
                    ->getStateUsing(function ($record) {
                        if ($record->model_type === User::class) {
                            return $record->model?->name ?? 'N/A';
                        }
                        if ($record->model_type === Post::class) {
                            return $record->model?->user?->name ?? 'N/A';
                        }

                        return 'N/A';
                    })
                    ->searchable()
                    ->sortable(),
                TextColumn::make('model_type')->label('Modelo')->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('size')->label('Tamaño')->formatStateUsing(fn ($state) => number_format($state / 1024, 2).' KB'),
                IconColumn::make('custom_properties.archived')->boolean()->label('Archivado')->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('created_at')->dateTime()->sortable(),
            ])
            ->filters([
                SelectFilter::make('collection_name')
                    ->options(
                        fn () => Media::query()
                            ->select('collection_name')
                            ->distinct()
                            ->pluck('collection_name', 'collection_name')
                            ->filter()
                            ->toArray()
                    ),
                SelectFilter::make('owner')
                    ->label('Usuario')
                    ->options(fn () => User::orderBy('name')->pluck('name', 'id')->toArray())
                    ->query(function (Builder $query, array $data) {
                        $userId = $data['value'] ?? null;
                        if (! $userId) {
                            return;
                        }
                        $query->where(function (Builder $q) use ($userId) {
                            // Media adjunta a Posts del usuario
                            $q->where(function (Builder $q1) use ($userId) {
                                $q1->where('model_type', Post::class)
                                    ->whereIn('model_id', Post::where('user_id', $userId)->pluck('id'));
                            })
                            // Media adjunta directamente al User
                                ->orWhere(function (Builder $q2) use ($userId) {
                                    $q2->where('model_type', User::class)
                                        ->where('model_id', $userId);
                                });
                        });
                    }),
            ])
            ->recordActions([
                DeleteAction::make()
                    ->requiresConfirmation()
                    ->modalHeading('Eliminar archivo')
                    ->modalDescription('¿Estás seguro de que deseas eliminar este archivo? Esta acción no se puede deshacer.')
                    ->successNotificationTitle('Archivo eliminado'),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                    BulkAction::make('regenerate')
                        ->label('Regenerar Thumbnails y Watermark')
                        ->icon('heroicon-o-arrow-path')
                        ->requiresConfirmation()
                        ->modalHeading('Regenerar Conversiones')
                        ->modalDescription('Se regenerarán todos los thumbnails y se aplicará el watermark a las imágenes seleccionadas. Esta acción puede tardar varios minutos.')
                        ->modalSubmitActionLabel('Regenerar')
                        ->action(function ($records) {
                            $processed = 0;
                            foreach ($records as $media) {
                                try {
                                    // Solo procesar imágenes que no sean del sistema
                                    $systemCollections = ['logo', 'favicon', 'default_avatar'];
                                    if (in_array($media->collection_name, $systemCollections)) {
                                        continue;
                                    }

                                    if (str_starts_with($media->mime_type, 'image/')) {
                                        // Regenerar conversiones
                                        $media->model->registerMediaConversions($media);
                                        $media->regenerateConversions();

                                        // Aplicar watermark al original
                                        $originalPath = $media->getPath();
                                        if (file_exists($originalPath)) {
                                            WatermarkManipulator::apply($originalPath);
                                        }

                                        // Aplicar watermark a conversiones
                                        foreach ($media->getGeneratedConversions() as $conversionName => $generated) {
                                            if ($generated) {
                                                $conversionPath = $media->getPath($conversionName);
                                                if (file_exists($conversionPath)) {
                                                    WatermarkManipulator::apply($conversionPath);
                                                }
                                            }
                                        }

                                        $processed++;
                                    }
                                } catch (\Exception $e) {
                                    Log::error('Error regenerando media: '.$e->getMessage());
                                }
                            }

                            Notification::make()
                                ->title('Regeneración completada')
                                ->body("{$processed} imagen(es) procesada(s) exitosamente.")
                                ->success()
                                ->send();
                        })
                        ->deselectRecordsAfterCompletion(),
                ]),
            ]);
    }
}
