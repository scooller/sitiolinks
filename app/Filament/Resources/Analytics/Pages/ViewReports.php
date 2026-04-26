<?php

namespace App\Filament\Resources\Analytics\Pages;

use App\Filament\Resources\Analytics\AnalyticsResource;
use App\Models\SiteSettings;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Concerns\InteractsWithForms;
use Filament\Forms\Contracts\HasForms;
use Filament\Resources\Pages\Page;
use Filament\Tables;
use Filament\Tables\Concerns\InteractsWithTable;
use Filament\Tables\Contracts\HasTable;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class ViewReports extends Page implements HasForms, HasTable
{
    use InteractsWithForms;
    use InteractsWithTable;

    protected static string $resource = AnalyticsResource::class;

    protected string $view = 'filament.resources.analytics.pages.view-reports';

    protected static ?string $title = 'Reportes de Analytics';

    protected static ?string $navigationLabel = 'Ver Reportes';

    protected function getHeaderActions(): array
    {
        return [
            Action::make('export')
                ->label('Exportar a Excel')
                ->icon('heroicon-o-arrow-down-tray')
                ->color('success')
                ->action(function () {
                    return $this->exportToExcel();
                }),
            Action::make('configure')
                ->label('Configurar Dashboard')
                ->icon('heroicon-o-cog-6-tooth')
                ->url(route('filament.admin.resources.analytics.index', SiteSettings::first()->id)),
        ];
    }

    protected function exportToExcel()
    {
        $users = User::query()
            ->withCount([
                'galleries',
                'galleries as approved_galleries_count' => function (Builder $query) {
                    $query->where('status', 'approved');
                },
                'galleries as pending_galleries_count' => function (Builder $query) {
                    $query->where('status', 'pending');
                },
            ])
            ->with('roles')
            ->get();

        $filename = 'reporte-usuarios-'.now()->format('Y-m-d-His').'.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
            'Pragma' => 'no-cache',
            'Cache-Control' => 'must-revalidate, post-check=0, pre-check=0',
            'Expires' => '0',
        ];

        $callback = function () use ($users) {
            $file = fopen('php://output', 'w');
            fprintf($file, chr(0xEF).chr(0xBB).chr(0xBF)); // UTF-8 BOM

            // Headers
            fputcsv($file, [
                'ID',
                'Nombre',
                'Usuario',
                'Email',
                'Rol',
                'Total Galerías',
                'Galerías Aprobadas',
                'Galerías Pendientes',
                'Vistas',
                'Email Verificado',
                'Fecha Registro',
                'Último Login',
            ], ';');

            // Data
            foreach ($users as $user) {
                fputcsv($file, [
                    $user->id,
                    $user->name,
                    $user->username,
                    $user->email,
                    $user->roles->pluck('name')->implode(', '),
                    $user->galleries_count,
                    $user->approved_galleries_count,
                    $user->pending_galleries_count,
                    $user->views,
                    $user->email_verified_at ? 'Sí' : 'No',
                    $user->created_at->format('d/m/Y'),
                    $user->last_login_at ? $user->last_login_at->format('d/m/Y H:i') : 'Nunca',
                ], ';');
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    public function table(Table $table): Table
    {
        return $table
            ->query(
                User::query()
                    ->withCount([
                        'galleries',
                        'galleries as approved_galleries_count' => function (Builder $query) {
                            $query->where('status', 'approved');
                        },
                        'galleries as pending_galleries_count' => function (Builder $query) {
                            $query->where('status', 'pending');
                        },
                    ])
                    ->with('roles')
            )
            ->columns([
                Tables\Columns\TextColumn::make('id')
                    ->label('ID')
                    ->sortable()
                    ->searchable(),

                Tables\Columns\TextColumn::make('name')
                    ->label('Nombre')
                    ->sortable()
                    ->searchable()
                    ->weight('bold'),

                Tables\Columns\TextColumn::make('username')
                    ->label('Usuario')
                    ->sortable()
                    ->searchable()
                    ->icon('heroicon-o-at-symbol'),

                Tables\Columns\TextColumn::make('email')
                    ->label('Email')
                    ->sortable()
                    ->searchable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('roles.name')
                    ->label('Rol')
                    ->badge()
                    ->color(fn (string $state): string => match ($state) {
                        'super_admin' => 'danger',
                        'admin' => 'warning',
                        'moderator' => 'info',
                        'vip' => 'success',
                        'creator' => 'primary',
                        default => 'gray'
                    })
                    ->formatStateUsing(fn (string $state): string => match ($state) {
                        'super_admin' => 'Super Admin',
                        'admin' => 'Admin',
                        'moderator' => 'Moderador',
                        'vip' => 'VIP',
                        'creator' => 'Creator',
                        'user' => 'Usuario',
                        default => $state
                    }),

                Tables\Columns\TextColumn::make('galleries_count')
                    ->label('Total Galerías')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color('info'),

                Tables\Columns\TextColumn::make('approved_galleries_count')
                    ->label('Aprobadas')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color('success'),

                Tables\Columns\TextColumn::make('pending_galleries_count')
                    ->label('Pendientes')
                    ->sortable()
                    ->alignCenter()
                    ->badge()
                    ->color('warning'),

                Tables\Columns\TextColumn::make('views')
                    ->label('Vistas')
                    ->sortable()
                    ->alignCenter()
                    ->numeric(),

                Tables\Columns\IconColumn::make('email_verified_at')
                    ->label('Verificado')
                    ->boolean()
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('created_at')
                    ->label('Registrado')
                    ->date('d/m/Y')
                    ->sortable()
                    ->toggleable(),

                Tables\Columns\TextColumn::make('last_login_at')
                    ->label('Último Login')
                    ->dateTime('d/m/Y H:i')
                    ->sortable()
                    ->toggleable(),
            ])
            ->filters([
                Tables\Filters\SelectFilter::make('role')
                    ->label('Rol')
                    ->relationship('roles', 'name')
                    ->preload()
                    ->multiple(),

                Tables\Filters\Filter::make('created_at')
                    ->form([
                        DatePicker::make('created_from')
                            ->label('Registrado desde'),
                        DatePicker::make('created_until')
                            ->label('Registrado hasta'),
                    ])
                    ->query(function (Builder $query, array $data): Builder {
                        return $query
                            ->when(
                                $data['created_from'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '>=', $date),
                            )
                            ->when(
                                $data['created_until'],
                                fn (Builder $query, $date): Builder => $query->whereDate('created_at', '<=', $date),
                            );
                    }),

                Tables\Filters\TernaryFilter::make('email_verified_at')
                    ->label('Email Verificado')
                    ->nullable()
                    ->placeholder('Todos')
                    ->trueLabel('Verificados')
                    ->falseLabel('No Verificados'),

                Tables\Filters\Filter::make('with_galleries')
                    ->label('Con Galerías')
                    ->query(fn (Builder $query): Builder => $query->has('galleries'))
                    ->toggle(),

                Tables\Filters\Filter::make('with_pending_galleries')
                    ->label('Con Galerías Pendientes')
                    ->query(fn (Builder $query): Builder => $query->whereHas('galleries', function (Builder $query) {
                        $query->where('status', 'pending');
                    }))
                    ->toggle(),
            ])
            ->defaultSort('created_at', 'desc')
            ->striped()
            ->paginated([10, 25, 50, 100]);
    }
}
