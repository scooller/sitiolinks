<?php

namespace App\Filament\Resources\EmailCampaigns\Tables;

use App\Jobs\SendBulkEmailJob;
use App\Models\EmailCampaign;
use Carbon\Carbon;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Notifications\Notification;
use Filament\Support\Enums\FontWeight;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;

class EmailCampaignsTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('name')
                    ->label('Campaña')
                    ->searchable()
                    ->sortable()
                    ->weight(FontWeight::Bold),
                TextColumn::make('target_audience')
                    ->label('Audiencia')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'all' => 'Todos los usuarios',
                        'creators' => 'Creadores',
                        'vip' => 'Usuarios VIP',
                        'unverified_email' => 'Sin verificar',
                        'verified_only' => 'Verificados',
                        'privacy_consent_pending' => 'Pendiente Privacidad (Ley 21.719)',
                        'subscribers_only' => 'Suscritos a email',
                        'inactive_30_days' => 'Inactivos +30d',
                        default => $state,
                    })
                    ->color('gray'),
                TextColumn::make('type')
                    ->label('Tipo')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'one_time' => 'Único',
                        'recurring' => 'Recursivo',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'one_time' => 'info',
                        'recurring' => 'purple',
                        default => 'gray',
                    }),
                TextColumn::make('status')
                    ->label('Estado')
                    ->badge()
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'draft' => 'Borrador',
                        'scheduled' => 'Programada',
                        'processing' => 'En Proceso...',
                        'completed' => 'Completada',
                        'paused' => 'Pausada',
                        default => $state,
                    })
                    ->color(fn (string $state): string => match ($state) {
                        'draft' => 'gray',
                        'scheduled' => 'info',
                        'processing' => 'warning',
                        'completed' => 'success',
                        'paused' => 'danger',
                        default => 'gray',
                    }),
                TextColumn::make('total_recipients')
                    ->label('Destinatarios')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('sent_count')
                    ->label('Enviados')
                    ->numeric()
                    ->sortable(),
                TextColumn::make('failed_count')
                    ->label('Fallidos')
                    ->numeric()
                    ->color('danger')
                    ->sortable(),
                TextColumn::make('next_run_at')
                    ->label('Próximo Envío')
                    ->dateTime('d/m/Y H:i')
                    ->placeholder('Manual')
                    ->sortable(),
            ])
            ->actions([
                Action::make('execute_now')
                    ->label('Ejecutar Ahora')
                    ->icon(Heroicon::OutlinedPlay)
                    ->color('success')
                    ->requiresConfirmation()
                    ->modalHeading('Confirmar Envío Inmediato de Campaña')
                    ->modalDescription('Se resolverá la audiencia objetivo y se encolarán los correos en segundo plano. ¿Deseas continuar?')
                    ->action(function (EmailCampaign $record): void {
                        $subject = $record->subject ?: $record->template?->subject;
                        $content = $record->content ?: $record->template?->content;

                        if (empty($subject) || empty($content)) {
                            Notification::make()
                                ->title('Asunto o contenido vacío')
                                ->body('Debes definir el asunto y cuerpo del mensaje antes de ejecutar.')
                                ->danger()
                                ->send();
                            return;
                        }

                        $userIds = $record->getAudienceQuery()->pluck('id')->all();
                        $total = count($userIds);

                        if ($total === 0) {
                            Notification::make()
                                ->title('Sin destinatarios')
                                ->body('No se encontraron usuarios que coincidan con la audiencia configurada.')
                                ->warning()
                                ->send();
                            return;
                        }

                        $record->status = 'processing';
                        $record->total_recipients = $total;
                        $record->sent_count = 0;
                        $record->failed_count = 0;
                        $record->save();

                        $chunks = array_chunk($userIds, 50);
                        foreach ($chunks as $chunk) {
                            SendBulkEmailJob::dispatch(
                                userIds: $chunk,
                                subject: $subject,
                                content: $content,
                                campaignId: $record->id,
                                templateId: $record->email_template_id,
                            );
                        }

                        Notification::make()
                            ->title('Campaña en ejecución')
                            ->body("Se han programado {$total} envíos a través de la cola de trabajo.")
                            ->success()
                            ->send();
                    }),
                Action::make('toggle_pause')
                    ->label(fn (EmailCampaign $record) => $record->status === 'paused' ? 'Reanudar' : 'Pausar')
                    ->icon(fn (EmailCampaign $record) => $record->status === 'paused' ? Heroicon::OutlinedPlay : Heroicon::OutlinedPause)
                    ->color(fn (EmailCampaign $record) => $record->status === 'paused' ? 'success' : 'gray')
                    ->visible(fn (EmailCampaign $record) => in_array($record->status, ['scheduled', 'paused']))
                    ->action(function (EmailCampaign $record): void {
                        if ($record->status === 'paused') {
                            $record->status = 'scheduled';
                            $record->updateNextRunTime();
                        } else {
                            $record->status = 'paused';
                        }
                        $record->save();

                        Notification::make()
                            ->title('Estado actualizado')
                            ->body("La campaña ahora está {$record->status}")
                            ->success()
                            ->send();
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
