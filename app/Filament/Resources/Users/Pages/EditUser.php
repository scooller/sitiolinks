<?php

namespace App\Filament\Resources\Users\Pages;

use App\Filament\Resources\Users\UserResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditUser extends EditRecord
{
    protected static string $resource = UserResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('viewProfile')
                ->label('Ver Perfil Público')
                ->icon('heroicon-o-arrow-top-right-on-square')
                ->color('info')
                ->url(function () {
                    $baseUrl = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'http://127.0.0.1:3000')), '/');

                    return $this->record->username ? "{$baseUrl}/u/{$this->record->username}" : null;
                })
                ->openUrlInNewTab()
                ->visible(fn () => filled($this->record->username)),
            DeleteAction::make(),
        ];
    }
}
