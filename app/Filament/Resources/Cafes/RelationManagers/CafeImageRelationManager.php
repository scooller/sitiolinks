<?php

namespace App\Filament\Resources\Cafes\RelationManagers;

use App\Models\Cafe;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Forms\Components\FileUpload;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Tables\Columns\ImageColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CafeImageRelationManager extends RelationManager
{
    protected static string $relationship = 'media';

    protected static ?string $title = 'Imagen del Café';

    public function table(Table $table): Table
    {
        return $table
            ->modifyQueryUsing(fn (Builder $query) => $query
                ->where('collection_name', 'cafe_image')
                ->orderByDesc('created_at')
                ->orderByDesc('id'))
            ->columns([
                ImageColumn::make('preview')
                    ->label('Vista Previa')
                    ->getStateUsing(function ($record) {
                        // $record ya es un Media
                        if ($record->hasGeneratedConversion('thumb')) {
                            return $record->getUrl('thumb');
                        }

                        return $record->getUrl();
                    })
                    ->size(80)
                    ->circular(false)
                    ->url(fn ($record) => $record->getUrl(), shouldOpenInNewTab: true),
            ])
            ->defaultSort('created_at', 'desc')
            ->paginated([10, 25, 50, 100])
            ->headerActions([
                Action::make('upload')
                    ->label('Subir Imagen')
                    ->icon('heroicon-o-arrow-up-tray')
                    ->modalHeading('Cambiar Imagen del Café')
                    ->form([
                        FileUpload::make('image')
                            ->label('Imagen del Café')
                            ->image()
                            ->imageEditor()
                            ->maxSize(10240)
                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                            ->disk(config('media-library.disk_name', 'public'))
                            ->directory('cafe-uploads')
                            ->helperText('Máx. 10MB. La imagen anterior se reemplazará.')
                            ->columnSpanFull()
                            ->required(),
                    ])
                    ->action(function (array $data, RelationManager $livewire): void {
                        $cafe = $livewire->getOwnerRecord();
                        /** @var Cafe $cafe */
                        $uploaded = $data['image'] ?? null;
                        $disk = config('media-library.disk_name', 'public');

                        if (! $uploaded) {
                            return;
                        }

                        // Remover imagen anterior si existe
                        $cafe->clearMediaCollection('cafe_image');

                        try {
                            // Caso 1: viene como string (ruta relativa en el disco 'public')
                            if (is_string($uploaded)) {
                                $fullPath = Storage::disk($disk)->path($uploaded);

                                if (! file_exists($fullPath)) {
                                    $fallbackPath = Storage::disk('local')->path($uploaded);
                                    if (! file_exists($fallbackPath)) {
                                        return;
                                    }
                                    $fullPath = $fallbackPath;
                                }

                                $cafe->addMedia($fullPath)
                                    ->usingFileName(basename($fullPath))
                                    ->preservingOriginal()
                                    ->toMediaCollection('cafe_image');
                            }
                            // Caso 2: viene como UploadedFile/TemporaryUploadedFile
                            elseif (is_object($uploaded) && method_exists($uploaded, 'getRealPath')) {
                                $real = $uploaded->getRealPath();
                                $orig = method_exists($uploaded, 'getClientOriginalName')
                                    ? ($uploaded->getClientOriginalName() ?: basename($real))
                                    : basename($real);

                                if (! $real || ! file_exists($real)) {
                                    return;
                                }

                                $cafe->addMedia($real)
                                    ->usingFileName($orig)
                                    ->preservingOriginal()
                                    ->toMediaCollection('cafe_image');
                            }

                            $livewire->dispatch('$refresh');
                        } catch (\Throwable $e) {
                            Log::error('Error uploading cafe image', [
                                'exception' => $e->getMessage(),
                                'cafe_id' => $cafe->id,
                            ]);
                        }
                    })
                    ->successNotificationTitle('Imagen subida correctamente'),
            ])
            ->recordActions([
                DeleteAction::make()
                    ->label('Eliminar')
                    ->action(function (Cafe $record): void {
                        $record->clearMediaCollection('cafe_image');
                    }),
            ]);
    }
}
