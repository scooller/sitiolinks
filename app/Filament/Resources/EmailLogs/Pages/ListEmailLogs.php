<?php

namespace App\Filament\Resources\EmailLogs\Pages;

use App\Filament\Resources\EmailLogs\EmailLogResource;
use App\Mail\DynamicTemplateMail;
use Filament\Actions\Action;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Resources\Pages\ListRecords;
use Filament\Support\Icons\Heroicon;
use Illuminate\Support\Facades\Mail;

class ListEmailLogs extends ListRecords
{
    protected static string $resource = EmailLogResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Action::make('compose')
                ->label('Redactar Email Manual')
                ->icon(Heroicon::OutlinedPaperAirplane)
                ->color('primary')
                ->modalHeading('Enviar Correo Electrónico Directo')
                ->modalWidth('3xl')
                ->form([
                    TextInput::make('to')
                        ->label('Destinatario (Email)')
                        ->email()
                        ->required()
                        ->placeholder('usuario@ejemplo.com'),
                    TextInput::make('subject')
                        ->label('Asunto')
                        ->required()
                        ->maxLength(255)
                        ->placeholder('Ej: Información sobre tu cuenta'),
                    RichEditor::make('content')
                        ->label('Mensaje')
                        ->required()
                        ->columnSpanFull(),
                ])
                ->action(function (array $data): void {
                    try {
                        Mail::to($data['to'])->send(new DynamicTemplateMail(
                            mailSubject: $data['subject'],
                            contentHtml: $data['content'],
                        ));

                        Notification::make()
                            ->title('Email enviado correctamente')
                            ->body("El mensaje ha sido enviado a {$data['to']}")
                            ->success()
                            ->send();
                    } catch (\Throwable $e) {
                        Notification::make()
                            ->title('Error en el envío')
                            ->body($e->getMessage())
                            ->danger()
                            ->send();
                    }
                }),
        ];
    }
}
