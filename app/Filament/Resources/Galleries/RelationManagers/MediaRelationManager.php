<?php

namespace App\Filament\Resources\Galleries\RelationManagers;

use App\Filament\Resources\Media\MediaResource;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Actions\AttachAction;
use Filament\Actions\DetachAction;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Spatie\MediaLibrary\HasMedia;

class MediaRelationManager extends RelationManager
{
    protected static string $relationship = 'media';

    protected static ?string $relatedResource = MediaResource::class;

    protected static ?string $recordTitleAttribute = 'title';

    protected static ?string $title = 'Imágenes de la Galería';

    public function table(Table $table): Table
    {
        return $table
            ->columns([
                ImageColumn::make('preview')
                    ->label('Vista Previa')
                    ->getStateUsing(function ($record) {
                        // $record ya es un Media, no un modelo con medios
                        if ($record->hasGeneratedConversion('thumb')) {
                            return $record->getUrl('thumb');
                        }

                        return $record->getUrl();
                    })
                    ->size(60)
                    ->circular(false)
                    ->url(fn ($record) => $record->getUrl(), shouldOpenInNewTab: true),

                TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),

                TextColumn::make('pivot.caption')
                    ->label('Descripción')
                    ->limit(40)
                    ->placeholder('Sin descripción'),

                TextColumn::make('pivot.order')
                    ->label('Orden')
                    ->sortable(query: function ($query, string $direction) {
                        return $query->orderBy('gallery_media.order', $direction);
                    }),

                TextColumn::make('size')
                    ->label('Tamaño')
                    ->formatStateUsing(fn ($state) => number_format($state / 1024, 2).' KB'),
            ])
            ->defaultSort('gallery_media.order')
            ->reorderable('gallery_media.order')
            ->paginated([10, 25, 50, 100])
            ->headerActions([
                Action::make('upload')
                    ->label('Subir Nuevas Imágenes')
                    ->icon('heroicon-o-arrow-up-tray')
                    ->modalHeading('Subir Imágenes a la Galería')
                    ->form([
                        FileUpload::make('images')
                            ->label('Imágenes')
                            ->multiple()
                            ->image()
                            ->imageEditor()
                            ->maxSize(10240)
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/gif', 'image/webp'])
                            ->disk(config('media-library.disk_name', 'public'))
                            ->directory('gallery-uploads')
                            ->helperText('Puedes subir múltiples imágenes. Máx. 10MB cada una.')
                            ->columnSpanFull()
                            ->required(),
                    ])
                    ->action(function (array $data, RelationManager $livewire): void {
                        $gallery = $livewire->getOwnerRecord();
                        $files = $data['images'] ?? [];
                        $disk = config('media-library.disk_name', 'public');

                        Log::info('Gallery upload action triggered', [
                            'gallery_id' => $gallery?->id,
                            'files_type' => gettype($files),
                            'files_count' => is_countable($files) ? count($files) : null,
                            'disk' => $disk,
                        ]);

                        $user = auth('web')->user();
                        /** @var User&HasMedia $user */
                        if (! $user) {
                            return;
                        }

                        if (! method_exists($user, 'addMedia')) {
                            Log::error('User model missing addMedia/HasMedia', [
                                'user_id' => $user?->id,
                                'traits' => class_uses_recursive($user),
                            ]);

                            return;
                        }

                        $maxOrder = $gallery->media()->max('gallery_media.order') ?? -1;

                        foreach ($files as $index => $uploaded) {
                            try {
                                $media = null;
                                // Caso 1: viene como string (ruta relativa en el disco 'public')
                                if (is_string($uploaded)) {
                                    $fullPath = Storage::disk($disk)->path($uploaded);
                                    $exists = file_exists($fullPath);
                                    Log::info('Processing string file', [
                                        'index' => $index,
                                        'relative' => $uploaded,
                                        'disk' => $disk,
                                        'fullPath' => $fullPath,
                                        'exists' => $exists,
                                    ]);

                                    if (! $exists) {
                                        $fallbackPath = Storage::disk('local')->path($uploaded);
                                        $fallbackExists = file_exists($fallbackPath);
                                        Log::warning('Primary disk path missing, trying local fallback', [
                                            'primary_path' => $fullPath,
                                            'fallback_path' => $fallbackPath,
                                            'fallback_exists' => $fallbackExists,
                                        ]);

                                        if ($fallbackExists) {
                                            $fullPath = $fallbackPath;
                                        } else {
                                            continue;
                                        }
                                    }

                                    $media = $user->addMedia($fullPath)
                                        ->usingFileName(basename($fullPath))
                                        ->preservingOriginal()
                                        ->toMediaCollection('gallery');
                                }
                                // Caso 2: viene como UploadedFile/TemporaryUploadedFile
                                elseif (is_object($uploaded) && method_exists($uploaded, 'getRealPath')) {
                                    $real = $uploaded->getRealPath();
                                    $orig = method_exists($uploaded, 'getClientOriginalName') ? ($uploaded->getClientOriginalName() ?: basename($real)) : basename($real);
                                    Log::info('Processing uploaded object', [
                                        'index' => $index,
                                        'realPath' => $real,
                                        'original' => $orig,
                                        'exists' => $real ? file_exists($real) : null,
                                        'class' => get_class($uploaded),
                                    ]);

                                    if (! $real || ! file_exists($real)) {
                                        Log::warning('Real path missing for uploaded object');

                                        continue;
                                    }

                                    $media = $user->addMedia($real)
                                        ->usingFileName($orig)
                                        ->preservingOriginal()
                                        ->toMediaCollection('gallery');
                                } else {
                                    Log::warning('Unknown file entry type', ['type' => gettype($uploaded)]);

                                    continue;
                                }

                                Log::info('Media created', [
                                    'media_id' => $media?->id,
                                    'model' => $media?->model_type,
                                    'collection' => $media?->collection_name,
                                ]);
                            } catch (\Throwable $e) {
                                Log::error('Error creating media', [
                                    'exception' => $e->getMessage(),
                                ]);

                                continue; // si falla esta imagen, seguimos con las demás
                            }

                            try {
                                $gallery->media()->attach($media->id, [
                                    'order' => $maxOrder + $index + 1,
                                ]);

                                Log::info('Pivot attached', [
                                    'gallery_id' => $gallery->id,
                                    'media_id' => $media->id,
                                    'order' => $maxOrder + $index + 1,
                                ]);
                            } catch (\Throwable $e) {
                                Log::error('Error attaching pivot', [
                                    'gallery_id' => $gallery->id,
                                    'media_id' => $media->id,
                                    'message' => $e->getMessage(),
                                ]);
                            }

                            // Livewire se encarga de limpiar temporales
                        }

                        // Refrescar la tabla sin redirigir
                        Log::info('Dispatching table refresh for gallery', ['gallery_id' => $gallery->id]);
                        $livewire->dispatch('$refresh');
                    })
                    ->successNotificationTitle('Imágenes subidas correctamente'),

                AttachAction::make()
                    ->label('Adjuntar Imagen Existente')
                    ->recordSelectSearchColumns(['file_name', 'name'])
                    ->recordTitle(fn ($record) => $record->file_name ?? $record->name)
                    ->form(fn (AttachAction $action): array => [
                        TextInput::make('order')
                            ->label('Orden')
                            ->numeric()
                            ->default(0),
                        Textarea::make('caption')
                            ->label('Descripción')
                            ->rows(2)
                            ->maxLength(500),
                    ]),
            ])
            ->recordActions([
                DetachAction::make()
                    ->label('Quitar'),
            ]);
    }
}
