<?php

namespace App\Filament\Resources\EmailCampaigns\Schemas;

use App\Models\EmailTemplate;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Radio;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;

class EmailCampaignForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Información de la Campaña')
                    ->schema([
                        TextInput::make('name')
                            ->label('Nombre de la campaña')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Ej: Recordatorio Semanal de Perfil')
                            ->columnSpan(1),
                        Select::make('email_template_id')
                            ->label('Cargar desde plantilla existente (opcional)')
                            ->relationship('template', 'name')
                            ->searchable()
                            ->preload()
                            ->live()
                            ->afterStateUpdated(function ($state, callable $set) {
                                if ($state) {
                                    $template = EmailTemplate::find($state);
                                    if ($template) {
                                        $set('subject', $template->subject);
                                        $set('content', $template->content);
                                    }
                                }
                            })
                            ->columnSpan(1),
                        TextInput::make('subject')
                            ->label('Asunto del correo')
                            ->required()
                            ->maxLength(255)
                            ->helperText('Soporta variables como {{ user.name }} o {{ site.name }}')
                            ->columnSpanFull(),
                        RichEditor::make('content')
                            ->label('Contenido del Mensaje (HTML)')
                            ->required()
                            ->columnSpanFull(),
                    ])->columns(2),

                Section::make('Segmentación de Audiencia')
                    ->schema([
                        Select::make('target_audience')
                            ->label('Destinatarios objetivo')
                            ->options([
                                'all' => 'Todos los usuarios registrados con email',
                                'creators' => 'Solo Creadores (rol creator)',
                                'vip' => 'Solo Usuarios VIP',
                                'unverified_email' => 'Usuarios con email pendiente de verificación',
                                'verified_only' => 'Solo usuarios verificados',
                                'subscribers_only' => 'Usuarios con notificaciones por email activas',
                                'inactive_30_days' => 'Usuarios inactivos hace más de 30 días',
                            ])
                            ->required()
                            ->default('all')
                            ->helperText('La lista se consulta dinámicamente al momento del envío para incluir siempre datos actualizados.'),
                    ]),

                Section::make('Tipo de Envío y Programación')
                    ->schema([
                        Radio::make('type')
                            ->label('Modalidad de entrega')
                            ->options([
                                'one_time' => 'Envío Único (manual o en fecha programada)',
                                'recurring' => 'Campaña Recursiva / Automatización Periódica',
                            ])
                            ->default('one_time')
                            ->inline()
                            ->live()
                            ->columnSpanFull(),

                        // Campos para one_time
                        DateTimePicker::make('scheduled_at')
                            ->label('Fecha y hora de envío programado')
                            ->helperText('Dejar vacío para mantener en borrador y enviar manualmente con "Ejecutar Ahora".')
                            ->visible(fn ($get) => $get('type') === 'one_time')
                            ->columnSpan(1),

                        // Campos para recurring
                        Select::make('recurring_frequency')
                            ->label('Frecuencia de repetición')
                            ->options([
                                'daily' => 'Diaria',
                                'weekly' => 'Semanal',
                                'monthly' => 'Mensual',
                            ])
                            ->default('weekly')
                            ->live()
                            ->visible(fn ($get) => $get('type') === 'recurring')
                            ->columnSpan(1),

                        TextInput::make('recurring_time')
                            ->label('Hora de envío (HH:MM)')
                            ->default('09:00')
                            ->placeholder('09:00')
                            ->visible(fn ($get) => $get('type') === 'recurring')
                            ->columnSpan(1),

                        Select::make('recurring_day_of_week')
                            ->label('Día de la semana para el envío')
                            ->options([
                                1 => 'Lunes',
                                2 => 'Martes',
                                3 => 'Miércoles',
                                4 => 'Jueves',
                                5 => 'Viernes',
                                6 => 'Sábado',
                                0 => 'Domingo',
                            ])
                            ->default(1)
                            ->visible(fn ($get) => $get('type') === 'recurring' && $get('recurring_frequency') === 'weekly')
                            ->columnSpan(1),

                        TextInput::make('recurring_day_of_month')
                            ->label('Día del mes (1 al 31)')
                            ->numeric()
                            ->minValue(1)
                            ->maxValue(31)
                            ->default(1)
                            ->visible(fn ($get) => $get('type') === 'recurring' && $get('recurring_frequency') === 'monthly')
                            ->columnSpan(1),

                        Select::make('status')
                            ->label('Estado de la campaña')
                            ->options([
                                'draft' => 'Borrador',
                                'scheduled' => 'Programada / Activa',
                                'paused' => 'Pausada',
                                'completed' => 'Completada',
                            ])
                            ->default('draft')
                            ->required()
                            ->columnSpan(1),
                    ])->columns(2),
            ]);
    }
}
