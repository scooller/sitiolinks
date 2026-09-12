<?php

namespace App\Filament\Resources\EmailTemplates\Tables;

use App\Mail\DynamicTemplateMail;
use App\Models\EmailTemplate;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Support\Enums\FontWeight;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Mail;

class EmailTemplatesTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable()
                    ->weight(FontWeight::Bold),
                TextColumn::make('slug')
                    ->label('Slug')
                    ->fontFamily('mono')
                    ->searchable()
                    ->sortable(),
                TextColumn::make('subject')
                    ->label('Asunto')
                    ->searchable()
                    ->limit(45),
                IconColumn::make('is_active')
                    ->label('Activa')
                    ->boolean()
                    ->sortable(),
                TextColumn::make('updated_at')
                    ->label('Última edición')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->actions([
                Action::make('send_test')
                    ->label('Enviar Prueba')
                    ->icon(Heroicon::OutlinedPaperAirplane)
                    ->color('info')
                    ->form([
                        TextInput::make('test_email')
                            ->label('Email de destino para la prueba')
                            ->email()
                            ->required()
                            ->default(fn () => auth()->user()?->email),
                    ])
                    ->action(function (EmailTemplate $record, array $data): void {
                        $recipient = $data['test_email'];
                        $rendered = $record->render([
                            'user' => [
                                'name' => auth()->user()?->name ?: 'Usuario de Prueba',
                                'username' => auth()->user()?->username ?: 'testuser',
                                'email' => $recipient,
                            ],
                            'site' => [
                                'name' => config('app.name', 'Link Persons'),
                                'url' => config('app.url', 'http://localhost'),
                            ],
                            'action_url' => config('app.url', 'http://localhost'),
                        ]);

                        try {
                            Mail::to($recipient)->send(new DynamicTemplateMail(
                                mailSubject: '[PRUEBA] ' . $rendered['subject'],
                                contentHtml: $rendered['content'],
                                unsubscribeUrl: null,
                                templateId: $record->id,
                            ));

                            Notification::make()
                                ->title('Email de prueba enviado')
                                ->body("Se ha despachado la prueba a {$recipient}")
                                ->success()
                                ->send();
                        } catch (\Throwable $e) {
                            Notification::make()
                                ->title('Error al enviar prueba')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
                EditAction::make(),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
