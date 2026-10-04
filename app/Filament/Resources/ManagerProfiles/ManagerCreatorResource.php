<?php

namespace App\Filament\Resources\ManagerProfiles;

use App\Events\CreatorApproved;
use App\Events\CreatorRejected;
use App\Filament\Resources\ManagerProfiles\Pages\ListManagerCreators;
use App\Models\ManagerCreator;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Forms\Components\Textarea;
use Filament\Support\Icons\Heroicon;
use Filament\Tables;
use Filament\Tables\Table;

class ManagerCreatorResource extends \Filament\Resources\Resource
{
    protected static ?string $model = ManagerCreator::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUserGroup;

    protected static string|\UnitEnum|null $navigationGroup = 'Managers';

    protected static ?string $modelLabel = 'Solicitud Creador';

    protected static ?string $pluralModelLabel = 'Solicitudes de Creadores';

    protected static ?int $navigationSort = 2;

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('creator.name')
                    ->label('Creador')
                    ->searchable(),
                Tables\Columns\TextColumn::make('creator.username')
                    ->label('@username')
                    ->searchable(),
                Tables\Columns\TextColumn::make('manager.user.name')
                    ->label('Manager'),
                Tables\Columns\BadgeColumn::make('status')
                    ->label('Estado')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'approved',
                        'danger' => 'rejected',
                        'gray' => 'inactive',
                    ]),
                Tables\Columns\IconColumn::make('creator.creatorDocuments')
                    ->label('Docs completos')
                    ->boolean()
                    ->getStateUsing(fn ($record) => $record->creator?->creatorDocuments()
                        ->where('manager_profile_id', $record->manager_profile_id)
                        ->first()?->isComplete() ?? false),
                Tables\Columns\TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pendientes',
                        'approved' => 'Aprobados',
                        'rejected' => 'Rechazados',
                        'inactive' => 'Inactivos',
                    ]),
            ])
            ->defaultSort('created_at', 'desc')
            ->actions([
                Action::make('approve')
                    ->label('Aprobar')
                    ->icon('heroicon-o-check-circle')
                    ->color('success')
                    ->visible(fn ($record) => $record->isPending())
                    ->requiresConfirmation()
                    ->action(function ($record) {
                        $record->update([
                            'status' => ManagerCreator::STATUS_APPROVED,
                            'approved_at' => now(),
                            'approved_by' => auth()->id(),
                        ]);
                        CreatorApproved::dispatch($record, auth()->id());
                    }),

                Action::make('reject')
                    ->label('Rechazar')
                    ->icon('heroicon-o-x-circle')
                    ->color('danger')
                    ->visible(fn ($record) => $record->isPending())
                    ->form([
                        Textarea::make('reason')
                            ->label('Motivo del rechazo')
                            ->required()
                            ->maxLength(500),
                    ])
                    ->action(function ($record, array $data) {
                        $record->update([
                            'status' => ManagerCreator::STATUS_REJECTED,
                            'rejection_reason' => $data['reason'],
                        ]);
                        CreatorRejected::dispatch($record, $data['reason'], auth()->id());
                    }),

                Action::make('view_documents')
                    ->label('Ver docs')
                    ->icon('heroicon-o-document-text')
                    ->modalHeading('Documentación de Mayoría de Edad')
                    ->modalSubmitAction(false)
                    ->modalCancelActionLabel('Cerrar')
                    ->modalContent(fn ($record) => view('filament.modals.creator-documents', ['record' => $record])),

                Action::make('verify_documents')
                    ->label('Validar docs')
                    ->icon('heroicon-o-shield-check')
                    ->color('info')
                    ->visible(fn ($record) => ! ($record->creator?->creatorDocuments()
                        ->where('manager_profile_id', $record->manager_profile_id)
                        ->first()?->verified ?? false))
                    ->requiresConfirmation()
                    ->modalHeading('Confirmar mayoría de edad')
                    ->modalDescription('¿Confirmas que has revisado los documentos y el creador es mayor de 18 años?')
                    ->action(function ($record) {
                        $doc = $record->creator?->creatorDocuments()
                            ->where('manager_profile_id', $record->manager_profile_id)
                            ->first();
                        if ($doc) {
                            $doc->update([
                                'verified' => true,
                                'verified_at' => now(),
                                'verified_by' => auth()->id(),
                            ]);
                        }
                    }),
            ]);

    }

    public static function getPages(): array
    {
        return [
            'index' => ListManagerCreators::route('/'),
        ];
    }
}
