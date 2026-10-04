<?php

namespace App\Filament\Manager\Resources\Creators;

use App\Filament\Manager\Resources\Creators\Pages\CreateCreator;
use App\Filament\Manager\Resources\Creators\Pages\EditCreator;
use App\Filament\Manager\Resources\Creators\Pages\ListCreators;
use App\Models\CreatorDocument;
use App\Models\ManagerCreator;
use App\Models\Notification;
use App\Models\User;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Notifications\Notification as FilamentNotification;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class CreatorResource extends Resource
{
    protected static ?string $model = ManagerCreator::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserGroup;

    protected static ?string $modelLabel = 'Creador';

    protected static ?string $pluralModelLabel = 'Mis Creadores';

    protected static ?string $navigationLabel = 'Mis Creadores';

    protected static ?int $navigationSort = 1;

    public static function getEloquentQuery(): Builder
    {
        $managerProfile = auth()->user()?->managerProfile;
        $managerProfileId = $managerProfile ? $managerProfile->id : 0;

        return parent::getEloquentQuery()
            ->where('manager_profile_id', $managerProfileId);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Datos del Creador')
                ->description('Información básica de la cuenta del creador')
                ->schema([
                    TextInput::make('name')
                        ->label('Nombre Completo')
                        ->required()
                        ->maxLength(255),

                    TextInput::make('username')
                        ->label('Nombre de usuario (@)')
                        ->prefix('@')
                        ->required()
                        ->alphaDash()
                        ->minLength(3)
                        ->maxLength(30)
                        ->disabledOn('edit'),

                    TextInput::make('email')
                        ->label('Email del creador (opcional si usa magic link)')
                        ->email()
                        ->nullable(),

                    TextInput::make('contact_email')
                        ->label('Email de contacto alternativo (manager)')
                        ->email()
                        ->nullable(),

                    TextInput::make('phone')
                        ->label('Teléfono')
                        ->tel()
                        ->maxLength(30),

                    Select::make('gender')
                        ->label('Sexo / Género')
                        ->options([
                            'hombre' => 'Hombre',
                            'mujer' => 'Mujer',
                            'trans' => 'Trans',
                            'otro' => 'Otro',
                        ])
                        ->required(),

                    DatePicker::make('birth_date')
                        ->label('Fecha de Nacimiento')
                        ->native(false)
                        ->required()
                        ->rule('before_or_equal:'.now()->subYears(18)->toDateString())
                        ->helperText('Obligatorio: debe ser mayor de 18 años.'),

                    Toggle::make('legal_accepted')
                        ->label('El creador acepta los términos legales y políticas (+18)')
                        ->required()
                        ->default(true)
                        ->visibleOn('create'),
                ])
                ->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('creator.username')
                    ->label('Usuario')
                    ->prefix('@')
                    ->searchable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Estado')
                    ->colors([
                        'warning' => ManagerCreator::STATUS_PENDING,
                        'success' => ManagerCreator::STATUS_APPROVED,
                        'danger' => ManagerCreator::STATUS_REJECTED,
                        'gray' => ManagerCreator::STATUS_INACTIVE,
                    ])
                    ->formatStateUsing(fn ($state) => match ($state) {
                        ManagerCreator::STATUS_PENDING => 'Pendiente Admin',
                        ManagerCreator::STATUS_APPROVED => 'Aprobado',
                        ManagerCreator::STATUS_REJECTED => 'Rechazado',
                        ManagerCreator::STATUS_INACTIVE => 'Inactivo',
                        default => $state,
                    }),

                Tables\Columns\IconColumn::make('docs_complete')
                    ->label('Docs +18')
                    ->boolean()
                    ->getStateUsing(fn ($record) => $record->creator?->creatorDocuments()
                        ->where('manager_profile_id', $record->manager_profile_id)
                        ->first()?->isComplete() ?? false),

                Tables\Columns\TextColumn::make('rejection_reason')
                    ->label('Motivo Rechazo')
                    ->limit(30)
                    ->placeholder('-')
                    ->visible(fn ($livewire) => true),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha Alta')
                    ->dateTime('d/m/Y')
                    ->sortable(),
            ])
            ->actions([
                // Subir documentos +18
                Action::make('upload_docs')
                    ->label('Docs +18')
                    ->icon('heroicon-o-document-arrow-up')
                    ->color('warning')
                    ->modalHeading('Subir Documentación de Mayoría de Edad')
                    ->modalDescription('Es obligatorio subir foto por ambos lados del documento de identidad y selfie sosteniendo el documento.')
                    ->form([
                        FileUpload::make('id_front')
                            ->label('1. Foto Frontal del Documento (DNI/Pasaporte)')
                            ->image()
                            ->disk('local')
                            ->directory('documents')
                            ->visibility('private')
                            ->maxSize(5120),

                        FileUpload::make('id_back')
                            ->label('2. Foto Trasera del Documento')
                            ->image()
                            ->disk('local')
                            ->directory('documents')
                            ->visibility('private')
                            ->maxSize(5120),

                        FileUpload::make('selfie_with_id')
                            ->label('3. Foto de la Cara sosteniendo el Documento')
                            ->image()
                            ->disk('local')
                            ->directory('documents')
                            ->visibility('private')
                            ->maxSize(5120),
                    ])
                    ->fillForm(function ($record) {
                        return [];
                    })
                    ->action(function ($record, array $data) {
                        $document = CreatorDocument::firstOrCreate([
                            'creator_user_id' => $record->creator_user_id,
                            'manager_profile_id' => $record->manager_profile_id,
                        ], [
                            'type' => 'id_card',
                        ]);

                        $hasUpdated = false;
                        if (! empty($data['id_front'])) {
                            $document->clearMediaCollection('id_front');
                            $document->addMedia(Storage::disk('local')->path($data['id_front']))
                                ->toMediaCollection('id_front');
                            $hasUpdated = true;
                        }

                        if (! empty($data['id_back'])) {
                            $document->clearMediaCollection('id_back');
                            $document->addMedia(Storage::disk('local')->path($data['id_back']))
                                ->toMediaCollection('id_back');
                            $hasUpdated = true;
                        }

                        if (! empty($data['selfie_with_id'])) {
                            $document->clearMediaCollection('selfie_with_id');
                            $document->addMedia(Storage::disk('local')->path($data['selfie_with_id']))
                                ->toMediaCollection('selfie_with_id');
                            $hasUpdated = true;
                        }

                        if ($hasUpdated && ($document->verified || $record->status === ManagerCreator::STATUS_APPROVED)) {
                            $document->update(['verified' => false]);
                            $record->update(['status' => ManagerCreator::STATUS_PENDING]);

                            $admins = User::role(['admin', 'super_admin'])->get();
                            foreach ($admins as $admin) {
                                Notification::create([
                                    'user_id' => $admin->id,
                                    'type' => Notification::TYPE_CREATOR_DOCS_SUBMITTED,
                                    'title' => 'Documentación actualizada para verificación',
                                    'message' => "El manager ha subido nuevos documentos de identidad para el creador @{$record->creator?->username}. Requiere re-validación.",
                                    'data' => [
                                        'manager_creator_id' => $record->id,
                                        'creator_user_id' => $record->creator_user_id,
                                    ],
                                ]);
                            }
                        }

                        FilamentNotification::make()
                            ->title('Documentos actualizados correctamente')
                            ->success()
                            ->send();
                    }),

                // Enviar mensaje / notificación al creador
                Action::make('notify')
                    ->label('Notificar')
                    ->icon('heroicon-o-paper-airplane')
                    ->color('info')
                    ->modalHeading('Enviar Notificación al Creador')
                    ->form([
                        TextInput::make('title')
                            ->label('Título')
                            ->required()
                            ->maxLength(255),
                        Textarea::make('message')
                            ->label('Mensaje')
                            ->required()
                            ->maxLength(2000),
                        TextInput::make('url')
                            ->label('Enlace opcional')
                            ->url()
                            ->nullable(),
                    ])
                    ->action(function ($record, array $data) {
                        Notification::create([
                            'user_id' => $record->creator_user_id,
                            'type' => Notification::TYPE_MANAGER_MESSAGE,
                            'title' => $data['title'],
                            'message' => $data['message'],
                            'url' => $data['url'] ?? null,
                            'data' => ['manager_profile_id' => $record->manager_profile_id],
                        ]);

                        FilamentNotification::make()
                            ->title('Notificación enviada al creador')
                            ->success()
                            ->send();
                    }),

                // Magic link de acceso
                Action::make('magic_link')
                    ->label('Link Acceso')
                    ->icon('heroicon-o-key')
                    ->color('gray')
                    ->visible(fn ($record) => $record->status === ManagerCreator::STATUS_PENDING)
                    ->modalHeading('Enlace de Acceso Rápido')
                    ->modalDescription('Comparte este enlace de un solo uso con el creador para que inicie sesión y configure su clave.')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Cerrar')
                    ->modalContent(function ($record) {
                        $creator = $record->creator;
                        $plainToken = Str::random(48);
                        $creator->update([
                            'magic_link_token' => hash('sha256', $plainToken),
                            'magic_link_expires_at' => now()->addHours(72),
                        ]);
                        $link = url("/login/magic/{$plainToken}");

                        return view('filament.modals.magic-link-modal', ['url' => $link]);
                    }),

                // Dar de baja
                Action::make('deactivate')
                    ->label('Dar de Baja')
                    ->icon('heroicon-o-archive-box-x-mark')
                    ->color('danger')
                    ->visible(fn ($record) => $record->status !== ManagerCreator::STATUS_INACTIVE)
                    ->requiresConfirmation()
                    ->modalHeading('¿Dar de baja perfil?')
                    ->modalDescription('El perfil se marcará como inactivo y perderá el rol de creador activo.')
                    ->action(function ($record) {
                        $record->update(['status' => ManagerCreator::STATUS_INACTIVE]);
                        $record->creator->removeRole('creator');
                        $record->creator->assignRole('user');

                        FilamentNotification::make()
                            ->title('Creador dado de baja')
                            ->success()
                            ->send();
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListCreators::route('/'),
            'create' => CreateCreator::route('/create'),
            'edit' => EditCreator::route('/{record}/edit'),
        ];
    }
}
