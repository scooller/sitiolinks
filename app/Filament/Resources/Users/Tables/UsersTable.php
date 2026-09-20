<?php

namespace App\Filament\Resources\Users\Tables;

use App\Jobs\SendBulkEmailJob;
use App\Models\EmailTemplate;
use App\Models\SiteSettings;
use App\Services\GraphQLCache;
use App\Services\NotificationService;
use Filament\Actions\Action;
use Filament\Actions\BulkAction;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Notifications\Notification;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\SelectColumn;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Hash;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                SpatieMediaLibraryImageColumn::make('avatar')
                    ->collection('avatar')
                    ->conversion('thumb')
                    ->circular()
                    ->defaultImageUrl(function () {
                        $settings = SiteSettings::first();

                        return $settings?->getFirstMediaUrl('default_avatar') ?: url('/images/default-avatar.png');
                    })
                    ->label('Avatar'),
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('username')
                    ->searchable()
                    ->url(fn ($record) => $record->username ? rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'http://127.0.0.1:3000')), '/')."/u/{$record->username}" : null)
                    ->openUrlInNewTab()
                    ->tooltip('Ver perfil público'),
                TextColumn::make('email')
                    ->label('Email address')
                    ->searchable(),
                TextColumn::make('country')
                    ->label('País')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->searchable(),
                TextColumn::make('city')
                    ->label('Ciudad')
                    ->toggleable(isToggledHiddenByDefault: true)
                    ->searchable(),
                TextColumn::make('price_from')
                    ->label('Desde')
                    ->numeric()
                    ->prefix('$')
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                SelectColumn::make('role')
                    ->label('Tipo de Usuario')
                    ->options([
                        'user' => 'Normal / Usuario',
                        'vip' => 'VIP',
                        'creator' => 'Creador / Modelo',
                        'moderator' => 'Moderador',
                        'admin' => 'Administrador',
                        'super_admin' => 'Super Admin',
                    ])
                    ->selectablePlaceholder(false)
                    ->getStateUsing(fn ($record) => $record->roles->first()?->name ?? 'user')
                    ->updateStateUsing(function ($record, $state) {
                        $oldRole = $record->roles->first()?->name ?? 'user';
                        if ($oldRole === $state) {
                            return $state;
                        }

                        $record->syncRoles([$state]);
                        GraphQLCache::flushFor('users');

                        NotificationService::notifyRoleChanged($record, $state, $oldRole);

                        Notification::make()
                            ->title('Tipo de usuario actualizado')
                            ->body("El usuario @{$record->username} ahora es '{$state}'. Se envió notificación por correo.")
                            ->success()
                            ->send();

                        return $state;
                    }),
                BadgeColumn::make('roles.name')
                    ->label('Roles')
                    ->separator(', ')
                    ->colors([
                        'secondary',
                        'primary' => 'creator',
                        'warning' => 'moderator',
                        'danger' => 'admin',
                    ])
                    ->toggleable(isToggledHiddenByDefault: true),
                IconColumn::make('email_verified_at')
                    ->label('Email')
                    ->boolean()
                    ->trueIcon('heroicon-o-check')
                    ->falseIcon('heroicon-o-x-mark')
                    ->tooltip(fn ($record) => $record->email_verified_at ? 'Email verificado' : 'Email no verificado'),
                IconColumn::make('is_verified')
                    ->label('Verificado')
                    ->boolean()
                    ->trueIcon('heroicon-o-check-badge')
                    ->falseIcon('heroicon-o-x-circle')
                    ->trueColor('success')
                    ->falseColor('gray')
                    ->tooltip(fn ($record) => $record->is_verified ? 'Usuario verificado desde '.$record->verified_at?->format('d/m/Y') : 'Usuario no verificado'),
                IconColumn::make('privacy_consent')
                    ->label('Privacidad')
                    ->boolean()
                    ->trueIcon('heroicon-o-shield-check')
                    ->falseIcon('heroicon-o-shield-exclamation')
                    ->trueColor('success')
                    ->falseColor('warning')
                    ->tooltip(fn ($record) => $record->privacy_consent ? 'Consentimiento Ley 21.719 otorgado: '.$record->privacy_consent_at?->format('d/m/Y H:i') : 'Sin consentimiento registrado')
                    ->toggleable(isToggledHiddenByDefault: false),
                TextColumn::make('created_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
                TextColumn::make('updated_at')
                    ->dateTime()
                    ->sortable()
                    ->toggleable(isToggledHiddenByDefault: true),
            ])
            ->filters([
                //
            ])
            ->recordActions([
                Action::make('viewProfile')
                    ->label('Ver Perfil')
                    ->icon('heroicon-o-arrow-top-right-on-square')
                    ->color('info')
                    ->tooltip('Ver perfil público en el sitio')
                    ->url(function ($record) {
                        $baseUrl = rtrim((string) (config('app.frontend_url') ?: env('FRONTEND_URL', 'http://127.0.0.1:3000')), '/');

                        return $record->username ? "{$baseUrl}/u/{$record->username}" : null;
                    })
                    ->openUrlInNewTab()
                    ->visible(fn ($record) => filled($record->username)),
                EditAction::make(),
                Action::make('resetPassword')
                    ->label('Reset Password')
                    ->form([
                        TextInput::make('password')
                            ->password()
                            ->required()
                            ->revealable(),
                    ])
                    ->action(function ($record, array $data) {
                        $record->update(['password' => Hash::make($data['password'])]);
                    })
                    ->color('warning'),
                Action::make('toggleVerify')
                    ->label('Verificar Email')
                    ->action(function ($record) {
                        $record->forceFill([
                            'email_verified_at' => $record->email_verified_at ? null : now(),
                        ])->save();
                    })
                    ->icon('heroicon-o-envelope'),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    BulkAction::make('send_bulk_email')
                        ->label('Enviar Email Masivo')
                        ->icon(Heroicon::OutlinedPaperAirplane)
                        ->color('primary')
                        ->modalHeading('Enviar Correo Masivo a Usuarios Seleccionados')
                        ->modalWidth('3xl')
                        ->form([
                            Select::make('template_id')
                                ->label('Cargar desde plantilla (opcional)')
                                ->options(fn () => EmailTemplate::where('is_active', true)->pluck('name', 'id'))
                                ->searchable()
                                ->live()
                                ->afterStateUpdated(function ($state, callable $set) {
                                    if ($state) {
                                        $template = EmailTemplate::find($state);
                                        if ($template) {
                                            $set('subject', $template->subject);
                                            $set('content', $template->content);
                                        }
                                    }
                                }),
                            TextInput::make('subject')
                                ->label('Asunto del correo')
                                ->required()
                                ->maxLength(255)
                                ->placeholder('Ej: Novedades importantes en Link Persons')
                                ->helperText('Puedes usar variables como {{ user.name }} o {{ site.name }}'),
                            RichEditor::make('content')
                                ->label('Contenido del Mensaje')
                                ->required()
                                ->columnSpanFull(),
                        ])
                        ->action(function (Collection $records, array $data): void {
                            $userIds = $records->pluck('id')->all();
                            $total = count($userIds);

                            if ($total === 0) {
                                Notification::make()
                                    ->title('Sin destinatarios')
                                    ->body('No seleccionaste ningún usuario con email válido.')
                                    ->warning()
                                    ->send();
                                return;
                            }

                            $chunks = array_chunk($userIds, 50);
                            foreach ($chunks as $chunk) {
                                SendBulkEmailJob::dispatch(
                                    userIds: $chunk,
                                    subject: $data['subject'],
                                    content: $data['content'],
                                    templateId: !empty($data['template_id']) ? (int) $data['template_id'] : null,
                                );
                            }

                            Notification::make()
                                ->title('Envíos masivos encolados')
                                ->body("Se han programado envíos para {$total} usuarios a través de la cola de trabajo.")
                                ->success()
                                ->send();
                        }),
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
