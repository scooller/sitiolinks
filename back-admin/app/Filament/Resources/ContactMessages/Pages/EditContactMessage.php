<?php

namespace App\Filament\Resources\ContactMessages\Pages;

use App\Filament\Resources\ContactMessages\ContactMessageResource;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditContactMessage extends EditRecord
{
    protected static string $resource = ContactMessageResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('replyByEmail')
                ->label('Responder por email')
                ->icon('heroicon-o-envelope')
                ->color('primary')
                ->url(function (): string {
                    $email = (string) ($this->record->email ?? '');
                    $subject = 'Re: '.(string) ($this->record->subject ?? 'consulta');
                    $body = trim((string) ($this->record->admin_response ?? ''));

                    $mailto = 'mailto:'.$email.'?subject='.rawurlencode($subject);
                    if ($body !== '') {
                        $mailto .= '&body='.rawurlencode($body);
                    }

                    return $mailto;
                }),
            DeleteAction::make(),
        ];
    }
}
