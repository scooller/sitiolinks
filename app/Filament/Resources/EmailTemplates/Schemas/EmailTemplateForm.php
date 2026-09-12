<?php

namespace App\Filament\Resources\EmailTemplates\Schemas;

use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\RichEditor;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Support\HtmlString;

class EmailTemplateForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                Section::make('Detalles de la Plantilla')
                    ->schema([
                        TextInput::make('name')
                            ->label('Nombre descriptivo')
                            ->required()
                            ->maxLength(255)
                            ->placeholder('Ej: Recordatorio Perfil Incompleto'),
                        TextInput::make('slug')
                            ->label('Identificador (Slug único)')
                            ->required()
                            ->unique(ignoreRecord: true)
                            ->maxLength(255)
                            ->placeholder('ej: recordatorio_perfil_incompleto'),
                        TextInput::make('subject')
                            ->label('Asunto del correo')
                            ->required()
                            ->maxLength(255)
                            ->columnSpanFull()
                            ->helperText('Puedes insertar variables como {{ user.name }} o {{ site.name }}')
                            ->placeholder('Ej: ¡Hola {{ user.name }}, completa tu perfil en {{ site.name }}!'),
                        Textarea::make('description')
                            ->label('Descripción interna')
                            ->rows(2)
                            ->columnSpanFull()
                            ->placeholder('Explicación de cuándo y para qué se usa esta plantilla...'),
                        Toggle::make('is_active')
                            ->label('Plantilla Habilitada')
                            ->default(true),
                    ])->columns(2),

                Section::make('Variables Disponibles para Personalización')
                    ->collapsible()
                    ->schema([
                        Placeholder::make('variables_hint')
                            ->label('')
                            ->content(new HtmlString('
                                <div class="text-sm space-y-1">
                                    <p class="text-gray-600 dark:text-gray-400">Copia y pega cualquiera de las siguientes etiquetas en el asunto o cuerpo del correo:</p>
                                    <ul class="list-disc pl-5 font-mono text-xs text-primary-600 dark:text-primary-400">
                                        <li><code>{{ user.name }}</code> : Nombre completo del destinatario</li>
                                        <li><code>{{ user.username }}</code> : Nombre de usuario (@handle)</li>
                                        <li><code>{{ user.email }}</code> : Correo electrónico</li>
                                        <li><code>{{ site.name }}</code> : Nombre de la plataforma</li>
                                        <li><code>{{ site.url }}</code> : Dirección URL del sitio web</li>
                                        <li><code>{{ action_url }}</code> : Enlace de acción rápida</li>
                                    </ul>
                                </div>
                            ')),
                    ]),

                Section::make('Diseño y Contenido del Correo')
                    ->schema([
                        RichEditor::make('content')
                            ->label('Cuerpo del Mensaje (HTML)')
                            ->required()
                            ->columnSpanFull()
                            ->toolbarButtons([
                                'bold',
                                'italic',
                                'underline',
                                'strike',
                                'h2',
                                'h3',
                                'bulletList',
                                'orderedList',
                                'link',
                                'blockquote',
                                'undo',
                                'redo',
                            ]),
                    ]),
            ]);
    }
}
