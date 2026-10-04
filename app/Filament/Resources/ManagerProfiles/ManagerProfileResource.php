<?php

namespace App\Filament\Resources\ManagerProfiles;

use App\Filament\Resources\ManagerProfiles\Pages\EditManagerProfile;
use App\Filament\Resources\ManagerProfiles\Pages\ListManagerProfiles;
use App\Models\ManagerProfile;
use BackedEnum;
use Filament\Actions\Action;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables;
use Filament\Tables\Table;

class ManagerProfileResource extends Resource
{
    protected static ?string $model = ManagerProfile::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedBriefcase;

    protected static string|\UnitEnum|null $navigationGroup = 'Managers';

    protected static ?string $modelLabel = 'Perfil de Manager';

    protected static ?string $pluralModelLabel = 'Perfiles de Managers';

    protected static ?int $navigationSort = 1;

    public static function form(Schema $schema): Schema
    {
        return $schema
            ->components([
                Select::make('user_id')
                    ->relationship('user', 'name')
                    ->searchable()
                    ->preload()
                    ->required()
                    ->disabledOn('edit')
                    ->label('Usuario'),

                Select::make('cafe_id')
                    ->relationship('cafe', 'name')
                    ->searchable()
                    ->preload()
                    ->nullable()
                    ->label('Café Vinculado'),

                Select::make('status')
                    ->options([
                        'pending' => 'Pendiente',
                        'active' => 'Activo',
                        'suspended' => 'Suspendido',
                    ])
                    ->required()
                    ->label('Estado'),

                Textarea::make('notes')
                    ->maxLength(1000)
                    ->columnSpanFull()
                    ->label('Notas administrativas'),
            ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')
                    ->label('Nombre')
                    ->searchable()
                    ->sortable(),

                Tables\Columns\TextColumn::make('user.email')
                    ->label('Email')
                    ->searchable(),

                Tables\Columns\TextColumn::make('cafe.name')
                    ->label('Café')
                    ->placeholder('Sin café')
                    ->sortable(),

                Tables\Columns\BadgeColumn::make('status')
                    ->label('Estado')
                    ->colors([
                        'warning' => 'pending',
                        'success' => 'active',
                        'danger' => 'suspended',
                    ]),

                Tables\Columns\TextColumn::make('creators_count')
                    ->counts('creators')
                    ->label('Creadores a cargo')
                    ->sortable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->dateTime('d/m/Y H:i')
                    ->label('Fecha alta')
                    ->sortable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('status')
                    ->options([
                        'pending' => 'Pendiente',
                        'active' => 'Activo',
                        'suspended' => 'Suspendido',
                    ]),
            ])
            ->actions([
                EditAction::make(),
                Action::make('activate')
                    ->label('Activar')
                    ->icon('heroicon-o-check')
                    ->color('success')
                    ->visible(fn ($record) => $record->status !== 'active')
                    ->requiresConfirmation()
                    ->action(function ($record) {
                        $record->update(['status' => 'active']);
                        if (! $record->user->hasRole('manager')) {
                            $record->user->assignRole('manager');
                        }
                    }),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => ListManagerProfiles::route('/'),
            'edit' => EditManagerProfile::route('/{record}/edit'),
        ];
    }
}
