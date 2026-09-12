<?php

namespace App\Filament\Resources\EmailLogs\Tables;

use App\Mail\DynamicTemplateMail;
use App\Models\EmailLog;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Forms\Components\Placeholder;
use Filament\Notifications\Notification;
use Filament\Support\Enums\FontWeight;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\HtmlString;

class EmailLogsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i:s')
                    ->sortable(),
                TextColumn::make('to')
                    ->label('Destinatario')
                    ->searchable()
                    ->copyable()
                    ->weight(FontWeight::Bold),
                TextColumn::make('subject')
                    ->label('Asunto')
                    ->searchable()
                    ->limit(45),
                TextColumn::make('campaign.name')
                    ->label('Campaña')
                    ->placeholder('Transaccional / Directo')
                    ->searchable(),
                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'sent' => 'Enviado',
                        'failed' => 'Fallido',
                        'queued' => 'En cola',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'sent' => 'success',
                        'failed' => 'danger',
                        'queued' => 'warning',
                        default => 'gray',
                    }),
                TextColumn::make('error_message')
                    ->label('Error')
                    ->limit(35)
                    ->color('danger')
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                SelectFilter::make('status')
                    ->label('Estado')
                    ->options([
                        'sent' => 'Enviado',
                        'failed' => 'Fallido',
                        'queued' => 'En cola',
                    ]),
            ])
            ->actions([
                Action::make('preview')
                    ->label('Ver Correo')
                    ->icon(Heroicon::OutlinedEye)
                    ->color('info')
                    ->modalHeading(fn (EmailLog $record) => 'Asunto: ' . $record->subject)
                    ->modalSubheading(fn (EmailLog $record) => "Destinatario: {$record->to} | Fecha: " . ($record->sent_at?->format('d/m/Y H:i:s') ?? $record->created_at->format('d/m/Y H:i:s')))
                    ->modalWidth('4xl')
                    ->form([
                        Placeholder::make('email_preview')
                            ->label('')
                            ->content(function (EmailLog $record) {
                                $encodedHtml = htmlspecialchars($record->body_html, ENT_QUOTES, 'UTF-8');
                                return new HtmlString("
                                    <div class=\"border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white shadow-sm\">
                                        <iframe srcdoc=\"{$encodedHtml}\" style=\"width: 100%; height: 500px; border: none;\"></iframe>
                                    </div>
                                ");
                            }),
                    ]),

                Action::make('resend')
                    ->label('Reenviar')
                    ->icon(Heroicon::OutlinedArrowPath)
                    ->color('warning')
                    ->requiresConfirmation()
                    ->modalHeading('Reenviar Correo')
                    ->modalDescription(fn (EmailLog $record) => "¿Deseas reenviar este email a {$record->to}?")
                    ->action(function (EmailLog $record): void {
                        try {
                            Mail::to($record->to)->send(new DynamicTemplateMail(
                                mailSubject: $record->subject,
                                contentHtml: $record->body_html,
                                campaignId: $record->email_campaign_id,
                                userId: $record->user_id,
                            ));

                            Notification::make()
                                ->title('Email reenviado')
                                ->body("Se ha vuelto a enviar a {$record->to}")
                                ->success()
                                ->send();
                        } catch (\Throwable $e) {
                            Notification::make()
                                ->title('Fallo en reenvío')
                                ->body($e->getMessage())
                                ->danger()
                                ->send();
                        }
                    }),
            ])
            ->bulkActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
