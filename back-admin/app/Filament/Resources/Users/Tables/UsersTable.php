<?php

namespace App\Filament\Resources\Users\Tables;

use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Tables\Columns\BadgeColumn;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\SpatieMediaLibraryImageColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\Hash;

class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            ->columns([
                SpatieMediaLibraryImageColumn::make('avatar')
                    ->collection('avatar')
                    ->conversion('thumb')
                    ->circular()
                    ->defaultImageUrl(function () {
                        $settings = \App\Models\SiteSettings::first();

                        return $settings?->getFirstMediaUrl('default_avatar') ?: url('/images/default-avatar.png');
                    })
                    ->label('Avatar'),
                TextColumn::make('name')
                    ->searchable(),
                TextColumn::make('username')
                    ->searchable(),
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
                BadgeColumn::make('roles.name')
                    ->label('Roles')
                    ->separator(', ')
                    ->colors([
                        'secondary',
                        'primary' => 'creator',
                        'warning' => 'moderator',
                        'danger' => 'admin',
                    ]),
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
                EditAction::make(),
                Action::make('resetPassword')
                    ->label('Reset Password')
                    ->form([
                        \Filament\Forms\Components\TextInput::make('password')
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
                    DeleteBulkAction::make(),
                ]),
            ]);
    }
}
