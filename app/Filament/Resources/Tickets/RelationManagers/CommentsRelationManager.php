<?php

namespace App\Filament\Resources\Tickets\RelationManagers;

use Filament\Actions\CreateAction;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\Toggle;
use Filament\Resources\RelationManagers\RelationManager;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Table;
use Illuminate\Support\Facades\DB;

class CommentsRelationManager extends RelationManager
{
    protected static string $relationship = 'comments';

    protected static ?string $title = 'Comentarios';

    public function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Nuevo comentario')
                ->schema([
                    Textarea::make('comment')
                        ->label('Comentario')
                        ->rows(4)
                        ->required(),
                    Toggle::make('is_internal')
                        ->label('Interno (solo staff)')
                        ->default(false),
                ]),
        ]);
    }

    public function table(Table $table): Table
    {
        return $table
            ->defaultSort('created_at', 'desc')
            ->columns([
                TextColumn::make('created_at')
                    ->label('Fecha')
                    ->dateTime('d/m/Y H:i')
                    ->sortable(),
                TextColumn::make('user.name')
                    ->label('Usuario'),
                TextColumn::make('comment')
                    ->label('Comentario')
                    ->wrap()
                    ->limit(120),
                IconColumn::make('is_internal')
                    ->label('Interno')
                    ->boolean(),
            ])
            ->modifyQueryUsing(function ($query) {
                $user = auth('web')->user();
                if (! $user) {
                    return $query->where('is_internal', false);
                }

                // Hide internal comments from non-admin users
                // Filament Shield integration: check if user has admin role
                $userRoles = DB::table('model_has_roles')
                    ->join('roles', 'roles.id', '=', 'model_has_roles.role_id')
                    ->where('model_has_roles.model_id', $user->id)
                    ->whereIn('roles.name', ['super_admin', 'admin', 'moderator'])
                    ->exists();

                if (! $userRoles) {
                    $query->where('is_internal', false);
                }

                return $query;
            })
            ->recordTitleAttribute('comment')
            ->headerActions([
                CreateAction::make()
                    ->label('Agregar comentario')
                    ->mutateFormDataUsing(function (array $data): array {
                        $data['user_id'] = auth('web')->id();

                        return $data;
                    }),
            ]);
    }
}
