<?php

namespace App\Filament\Resources\SiteSettings\Schemas;

use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Grid;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Tabs;
use Filament\Schemas\Components\Tabs\Tab;
use Filament\Schemas\Schema;
use Spatie\Permission\Models\Role;

class SiteSettingsForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->columns(1)
            ->components([
                Tabs::make('Settings')
                    ->tabs([
                        // Tab 1: General
                        Tab::make('General')
                            ->icon('heroicon-o-cog-6-tooth')
                            ->schema([
                                Section::make('Información del Sitio')
                                    ->schema([
                                        TextInput::make('site_title')
                                            ->label('Título del Sitio')
                                            ->required()
                                            ->maxLength(255)
                                            ->default('Link Persons')
                                            ->helperText('Título que aparece en el navegador y SEO'),

                                        Textarea::make('site_description')
                                            ->label('Descripción del Sitio')
                                            ->rows(4)
                                            ->maxLength(500)
                                            ->helperText('Descripción breve para SEO (máx. 500 caracteres)')
                                            ->columnSpanFull(),
                                    ]),

                                Section::make('Integraciones')
                                    ->description('Configuración de servicios externos')
                                    ->schema([
                                        TextInput::make('google_analytics_id')
                                            ->label('Google Analytics ID')
                                            ->placeholder('G-XXXXXXXXXX')
                                            ->helperText('ID de medición de Google Analytics 4 (formato: G-XXXXXXXXXX) o Universal Analytics (UA-XXXXXXXXX)')
                                            ->maxLength(50)
                                            ->columnSpanFull(),
                                    ]),

                                Section::make('Modal de Advertencia')
                                    ->description('Configura un mensaje modal que se mostrará a los usuarios')
                                    ->schema([
                                        Toggle::make('warning_modal_enabled')
                                            ->label('Activar Modal')
                                            ->default(false)
                                            ->live(),

                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('warning_modal_title')
                                                    ->label('Título del Modal')
                                                    ->default('Aviso Importante')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled')),

                                                TextInput::make('warning_modal_title_icon')
                                                    ->label('Icono del Título')
                                                    ->placeholder('fas fa-exclamation-triangle')
                                                    ->helperText('Clase de Font Awesome')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled')),
                                            ]),

                                        Textarea::make('warning_modal_content')
                                            ->label('Contenido del Modal')
                                            ->rows(4)
                                            ->helperText('Mensaje que se mostrará en el modal.')
                                            ->visible(fn ($get) => $get('warning_modal_enabled'))
                                            ->columnSpanFull(),

                                        Grid::make(3)
                                            ->schema([
                                                TextInput::make('warning_modal_btn_text')
                                                    ->label('Texto del Botón')
                                                    ->default('Entendido')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled')),

                                                TextInput::make('warning_modal_btn_icon')
                                                    ->label('Icono del Botón')
                                                    ->placeholder('fas fa-check')
                                                    ->helperText('Clase de Font Awesome')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled')),

                                                Select::make('warning_modal_btn_variant')
                                                    ->label('Estilo del Botón')
                                                    ->options([
                                                        'primary' => 'Primary (Azul)',
                                                        'secondary' => 'Secondary (Gris)',
                                                        'success' => 'Success (Verde)',
                                                        'danger' => 'Danger (Rojo)',
                                                        'warning' => 'Warning (Amarillo)',
                                                        'info' => 'Info (Celeste)',
                                                        'light' => 'Light (Claro)',
                                                        'dark' => 'Dark (Oscuro)',
                                                    ])
                                                    ->default('primary')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled')),
                                            ]),

                                        Toggle::make('warning_modal_show_close_icon')
                                            ->label('Mostrar Icono de Cerrar (X)')
                                            ->default(true)
                                            ->visible(fn ($get) => $get('warning_modal_enabled')),

                                        Toggle::make('warning_modal_cancel_btn_enabled')
                                            ->label('Activar Botón Cancelar/Redirigir')
                                            ->default(false)
                                            ->live()
                                            ->visible(fn ($get) => $get('warning_modal_enabled')),

                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('warning_modal_cancel_btn_text')
                                                    ->label('Texto Botón Cancelar')
                                                    ->default('Cancelar')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled') && $get('warning_modal_cancel_btn_enabled')),

                                                TextInput::make('warning_modal_cancel_btn_url')
                                                    ->label('URL de Redirección')
                                                    ->placeholder('https://google.com')
                                                    ->helperText('Si se deja vacío, cierra el modal.')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled') && $get('warning_modal_cancel_btn_enabled')),

                                                TextInput::make('warning_modal_cancel_btn_icon')
                                                    ->label('Icono Botón Cancelar')
                                                    ->placeholder('fas fa-times')
                                                    ->helperText('Clase de Font Awesome')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled') && $get('warning_modal_cancel_btn_enabled')),

                                                Select::make('warning_modal_cancel_btn_variant')
                                                    ->label('Estilo Botón Cancelar')
                                                    ->options([
                                                        'primary' => 'Primary (Azul)',
                                                        'secondary' => 'Secondary (Gris)',
                                                        'success' => 'Success (Verde)',
                                                        'danger' => 'Danger (Rojo)',
                                                        'warning' => 'Warning (Amarillo)',
                                                        'info' => 'Info (Celeste)',
                                                        'light' => 'Light (Claro)',
                                                        'dark' => 'Dark (Oscuro)',
                                                        'link' => 'Link (Enlace)',
                                                    ])
                                                    ->default('secondary')
                                                    ->visible(fn ($get) => $get('warning_modal_enabled') && $get('warning_modal_cancel_btn_enabled')),
                                            ]),
                                    ]),
                            ]),

                        // Tab 2: Medios
                        Tab::make('Medios')
                            ->icon('heroicon-o-photo')
                            ->schema([
                                Section::make('Archivos del Sitio')
                                    ->schema([
                                        SpatieMediaLibraryFileUpload::make('logo')
                                            ->collection('logo')
                                            ->label('Logo del Sitio')
                                            ->image()
                                            ->imageEditor()
                                            ->maxSize(2048)
                                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'])
                                            ->helperText('Formatos: JPG, PNG, SVG, WebP. Máx. 2MB')
                                            ->columnSpanFull(),

                                        SpatieMediaLibraryFileUpload::make('favicon')
                                            ->collection('favicon')
                                            ->label('Favicon')
                                            ->image()
                                            ->maxSize(512)
                                            ->acceptedFileTypes(['image/x-icon', 'image/png'])
                                            ->helperText('Formatos: ICO, PNG. Recomendado: 32x32px. Máx. 512KB')
                                            ->columnSpanFull(),

                                        SpatieMediaLibraryFileUpload::make('default_avatar')
                                            ->collection('default_avatar')
                                            ->label('Avatar Genérico')
                                            ->image()
                                            ->imageEditor()
                                            ->maxSize(2048)
                                            ->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])
                                            ->helperText('Avatar predeterminado para usuarios sin imagen. Formatos: JPG, PNG, WebP. Máx. 2MB')
                                            ->columnSpanFull(),
                                    ]),

                                Section::make('Tamaños de Recorte')
                                    ->description('Define las dimensiones para recorte automático de imágenes')
                                    ->schema([
                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('avatar_width')
                                                    ->label('Ancho Avatar (px)')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(50)
                                                    ->maxValue(1000)
                                                    ->default(200)
                                                    ->suffix('px'),

                                                TextInput::make('avatar_height')
                                                    ->label('Alto Avatar (px)')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(50)
                                                    ->maxValue(1000)
                                                    ->default(200)
                                                    ->suffix('px'),

                                                TextInput::make('thumbnail_width')
                                                    ->label('Ancho Thumbnail Galería (px)')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(100)
                                                    ->maxValue(2000)
                                                    ->default(368)
                                                    ->suffix('px'),

                                                TextInput::make('thumbnail_height')
                                                    ->label('Alto Thumbnail Galería (px)')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(100)
                                                    ->maxValue(2000)
                                                    ->default(232)
                                                    ->suffix('px'),
                                            ]),
                                    ]),

                                Section::make('Watermark')
                                    ->description('Configura la marca de agua automática en imágenes')
                                    ->schema([
                                        Toggle::make('watermark_enabled')
                                            ->label('Activar Watermark')
                                            ->default(true)
                                            ->live()
                                            ->helperText('Aplica marca de agua a todos los avatares e imágenes de medios'),

                                        TextInput::make('watermark_text')
                                            ->label('Texto del Watermark')
                                            ->maxLength(100)
                                            ->placeholder('© Mi Sitio Web')
                                            ->helperText('Texto que aparecerá como marca de agua')
                                            ->visible(fn ($get) => $get('watermark_enabled')),

                                        Select::make('watermark_font')
                                            ->label('Fuente del Watermark')
                                            ->options(fn () => self::getAvailableFonts())
                                            ->default('system')
                                            ->helperText('Fuentes disponibles en storage/app/fonts/')
                                            ->visible(fn ($get) => $get('watermark_enabled')),

                                        Select::make('watermark_position')
                                            ->label('Posición')
                                            ->options([
                                                'top-left' => 'Superior Izquierda',
                                                'top-center' => 'Superior Centro',
                                                'top-right' => 'Superior Derecha',
                                                'center-left' => 'Centro Izquierda',
                                                'center' => 'Centro',
                                                'center-right' => 'Centro Derecha',
                                                'bottom-left' => 'Inferior Izquierda',
                                                'bottom-center' => 'Inferior Centro',
                                                'bottom-right' => 'Inferior Derecha',
                                            ])
                                            ->default('bottom-right')
                                            ->visible(fn ($get) => $get('watermark_enabled')),

                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('watermark_opacity')
                                                    ->label('Opacidad (%)')
                                                    ->numeric()
                                                    ->minValue(0)
                                                    ->maxValue(100)
                                                    ->default(50)
                                                    ->suffix('%')
                                                    ->helperText('0 = transparente, 100 = opaco')
                                                    ->visible(fn ($get) => $get('watermark_enabled')),

                                                TextInput::make('watermark_size')
                                                    ->label('Tamaño del Texto (px)')
                                                    ->numeric()
                                                    ->minValue(8)
                                                    ->maxValue(72)
                                                    ->default(14)
                                                    ->suffix('px')
                                                    ->visible(fn ($get) => $get('watermark_enabled')),
                                            ]),
                                    ]),

                                Section::make('QR del Perfil')
                                    ->description('Configuración de la superposición del logo en el código QR del perfil')
                                    ->schema([
                                        TextInput::make('qr_logo_size')
                                            ->label('Tamaño del logo en el QR (px)')
                                            ->numeric()
                                            ->minValue(16)
                                            ->maxValue(128)
                                            ->default(48)
                                            ->suffix('px')
                                            ->helperText('Recomendado: 48px para un QR de 200px (corrección de error H).'),
                                    ]),
                            ]),

                        // Tab 3: Diseño Grid
                        Tab::make('Diseño Grid')
                            ->icon('heroicon-o-squares-2x2')
                            ->schema([
                                Section::make('Grid de Tarjetas')
                                    ->description('Configura cuántas tarjetas se muestran por fila')
                                    ->schema([
                                        Grid::make(2)
                                            ->schema([
                                                Select::make('grid_cols_desktop')
                                                    ->label('Columnas en Desktop')
                                                    ->options([
                                                        1 => '1',
                                                        2 => '2',
                                                        3 => '3',
                                                        4 => '4',
                                                        6 => '6',
                                                    ])
                                                    ->required()
                                                    ->default(4)
                                                    ->helperText('Aplica a pantallas md/lg (>=768px).'),

                                                Select::make('grid_cols_mobile')
                                                    ->label('Columnas en Mobile')
                                                    ->options([
                                                        1 => '1',
                                                        2 => '2',
                                                        3 => '3',
                                                    ])
                                                    ->required()
                                                    ->default(2)
                                                    ->helperText('Aplica a pantallas pequeñas (<768px).'),
                                            ]),
                                    ]),

                                Section::make('Configuración de Grilla de Usuarios')
                                    ->description('Define qué tipos de usuarios mostrar y en qué orden')
                                    ->schema([
                                        Select::make('grid_users_sort')
                                            ->label('Orden de Usuarios')
                                            ->options([
                                                'newest' => 'Más nuevos primero',
                                                'oldest' => 'Más antiguos primero',
                                                'most_views' => 'Más visitas',
                                                'least_views' => 'Menos visitas',
                                                'name' => 'Por nombre (A-Z)',
                                                'username' => 'Por username (A-Z)',
                                                'random' => 'Al azar',
                                            ])
                                            ->default('newest')
                                            ->helperText('Orden en que se listan los usuarios en el frontend.')
                                            ->columnSpanFull(),

                                        Repeater::make('grid_roles_order')
                                            ->label('Roles a Mostrar (orden de prioridad)')
                                            ->schema([
                                                Select::make('role')
                                                    ->label('Rol')
                                                    ->options(fn () => self::getAvailableRoles())
                                                    ->required(),
                                            ])
                                            ->reorderable()
                                            ->collapsible()
                                            ->itemLabel(fn (array $state): ?string => self::getRoleLabel($state['role'] ?? null)
                                            )
                                            ->defaultItems(1)
                                            ->default([['role' => 'creator']])
                                            ->addActionLabel('Agregar Rol')
                                            ->helperText('El primer rol tiene mayor prioridad. Los usuarios se ordenarán según su rol más prioritario.')
                                            ->columnSpanFull(),

                                        TextInput::make('grid_users_per_page')
                                            ->label('Usuarios por Página')
                                            ->required()
                                            ->numeric()
                                            ->minValue(1)
                                            ->maxValue(100)
                                            ->default(12)
                                            ->suffix('usuarios')
                                            ->helperText('Cantidad de usuarios a mostrar en la grilla del home.')
                                            ->columnSpanFull(),
                                    ]),

                            ]),

                        // Tab 4: Permisos
                        Tab::make('Permisos')
                            ->icon('heroicon-o-shield-check')
                            ->schema([
                                Section::make('Límites de Galerías por Rol')
                                    ->description('Define cuántas galerías puede crear cada tipo de usuario')
                                    ->schema([
                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('max_galleries_creator')
                                                    ->label('Máximo para Creadores')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(999)
                                                    ->default(5)
                                                    ->suffix('galerías')
                                                    ->helperText('Límite de galerías para usuarios con rol "creator".'),

                                                TextInput::make('max_galleries_vip')
                                                    ->label('Máximo para VIP')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(999)
                                                    ->suffix('galerías')
                                                    ->placeholder('Ilimitado')
                                                    ->helperText('Límite para VIP. Dejar vacío = ilimitado.'),
                                            ]),
                                    ]),

                                Section::make('Límites de Medios en Galerías')
                                    ->description('Controla cuántas imágenes/videos puede subir cada rol por galería')
                                    ->schema([
                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('max_media_per_gallery_creator')
                                                    ->label('Medios por Galería - Creadores')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(999)
                                                    ->default(20)
                                                    ->suffix('archivos')
                                                    ->helperText('Máximo de imágenes/videos por galería para creadores.'),

                                                TextInput::make('max_media_per_gallery_vip')
                                                    ->label('Medios por Galería - VIP')
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(999)
                                                    ->suffix('archivos')
                                                    ->placeholder('Ilimitado')
                                                    ->helperText('Máximo para VIP. Dejar vacío = ilimitado.'),
                                            ]),
                                    ]),

                                Section::make('Tamaños de Archivo')
                                    ->description('Define los límites de tamaño de archivo según el rol del usuario')
                                    ->schema([
                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('max_upload_size_creator')
                                                    ->label('Tamaño Máximo - Creadores')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(100)
                                                    ->default(5)
                                                    ->suffix('MB')
                                                    ->helperText('Tamaño máximo por archivo para creadores.'),

                                                TextInput::make('max_upload_size_vip')
                                                    ->label('Tamaño Máximo - VIP')
                                                    ->required()
                                                    ->numeric()
                                                    ->minValue(1)
                                                    ->maxValue(100)
                                                    ->default(20)
                                                    ->suffix('MB')
                                                    ->helperText('Tamaño máximo por archivo para usuarios VIP.'),
                                            ]),
                                    ]),

                                // Comentado temporalmente - Funcionalidad futura
                                /*
                Section::make('Restricciones de Contenido')
                    ->description('Configuraciones de moderación y restricciones de publicación')
                    ->schema([
                        Toggle::make('require_approval_creator')
                            ->label('Requiere Aprobación - Creadores')
                            ->default(false)
                            ->helperText('Las galerías de creadores requieren aprobación antes de publicarse.')
                            ->columnSpanFull(),

                        Toggle::make('require_approval_vip')
                            ->label('Requiere Aprobación - VIP')
                            ->default(false)
                            ->helperText('Las galerías de VIP requieren aprobación antes de publicarse.')
                            ->columnSpanFull(),

                        Toggle::make('allow_comments_creator')
                            ->label('Permitir Comentarios - Creadores')
                            ->default(true)
                            ->helperText('Los usuarios pueden comentar en galerías de creadores.')
                            ->columnSpanFull(),

                        Toggle::make('allow_comments_vip')
                            ->label('Permitir Comentarios - VIP')
                            ->default(true)
                            ->helperText('Los usuarios pueden comentar en galerías de VIP.')
                            ->columnSpanFull(),
                    ]),
                */

                                Section::make('Visibilidad y Destacados')
                                    ->description('Controla la visibilidad y promoción de contenido por rol')
                                    ->schema([
                                        Toggle::make('vip_home_enabled')
                                            ->label('Sección VIP en Home')
                                            ->default(true)
                                            ->helperText('Muestra la sección "Creadores VIP" en la página de inicio.')
                                            ->columnSpanFull(),

                                        TextInput::make('vip_home_limit')
                                            ->label('Cantidad de VIP en Home')
                                            ->numeric()
                                            ->minValue(1)
                                            ->maxValue(50)
                                            ->default(10)
                                            ->suffix('usuarios')
                                            ->helperText('Número máximo de usuarios VIP a mostrar en Home.')
                                            ->visible(fn ($get) => (bool) $get('vip_home_enabled'))
                                            ->columnSpanFull(),
                                        Toggle::make('vip_featured_profile')
                                            ->label('Perfiles VIP Destacados')
                                            ->default(true)
                                            ->helperText('Los perfiles VIP aparecen destacados en el home.')
                                            ->columnSpanFull(),

                                        Toggle::make('vip_priority_search')
                                            ->label('Prioridad en Búsquedas - VIP')
                                            ->default(true)
                                            ->helperText('Los resultados de VIP aparecen primero en búsquedas.')
                                            ->columnSpanFull(),

                                        Grid::make(2)
                                            ->schema([
                                                TextInput::make('vip_badge_label')
                                                    ->label('Etiqueta Badge VIP')
                                                    ->maxLength(20)
                                                    ->placeholder('VIP')
                                                    ->helperText('Texto mostrado en el badge de usuarios VIP.'),

                                                TextInput::make('vip_badge_icon')
                                                    ->label('Icono Badge VIP')
                                                    ->placeholder('fas fa-crown')
                                                    ->helperText('Clase de Font Awesome, por ejemplo: "fas fa-crown".'),
                                            ]),

                                        TextInput::make('featured_galleries_vip')
                                            ->label('Galerías Destacadas - VIP')
                                            ->numeric()
                                            ->minValue(0)
                                            ->maxValue(10)
                                            ->default(3)
                                            ->suffix('galerías')
                                            ->helperText('Cuántas galerías de VIP pueden estar destacadas simultáneamente.')
                                            ->columnSpanFull(),
                                    ]),
                            ]),

                        // Tab 5: Diseño
                        Tab::make('Diseño')
                            ->icon('heroicon-o-paint-brush')
                            ->schema([
                                Section::make('Animaciones')
                                    ->description('Configura el estilo de transición de página')
                                    ->schema([
                                        Select::make('transition_type')
                                            ->label('Tipo de Transición')
                                            ->options([
                                                'fade' => 'Fade (Desvanecimiento)',
                                                'slide' => 'Slide (Deslizamiento)',
                                                'scale' => 'Scale (Escala)',
                                            ])
                                            ->default('fade')
                                            ->required()
                                            ->helperText('Efecto de animación al cambiar entre páginas')
                                            ->columnSpanFull(),
                                    ]),

                                Section::make('Esquema de Colores Bootstrap')
                                    ->description('Define los colores principales del tema basado en Bootstrap 5')
                                    ->schema([
                                        Grid::make(4)
                                            ->schema([
                                                ColorPicker::make('color_primary')
                                                    ->label('Primary')
                                                    ->required()
                                                    ->default('#0d6efd'),

                                                ColorPicker::make('color_secondary')
                                                    ->label('Secondary')
                                                    ->required()
                                                    ->default('#6c757d'),

                                                ColorPicker::make('color_success')
                                                    ->label('Success')
                                                    ->required()
                                                    ->default('#198754'),

                                                ColorPicker::make('color_danger')
                                                    ->label('Danger')
                                                    ->required()
                                                    ->default('#dc3545'),

                                                ColorPicker::make('color_warning')
                                                    ->label('Warning')
                                                    ->required()
                                                    ->default('#ffc107'),

                                                ColorPicker::make('color_info')
                                                    ->label('Info')
                                                    ->required()
                                                    ->default('#0dcaf0'),

                                                ColorPicker::make('color_light')
                                                    ->label('Light')
                                                    ->required()
                                                    ->default('#f8f9fa'),

                                                ColorPicker::make('color_dark')
                                                    ->label('Dark')
                                                    ->required()
                                                    ->default('#212529'),
                                            ]),
                                    ]),

                                Section::make('CSS Personalizado')
                                    ->description('Agrega estilos CSS personalizados para el frontend')
                                    ->schema([
                                        Textarea::make('custom_css')
                                            ->label('Custom CSS')
                                            ->rows(12)
                                            ->helperText('Estos estilos se aplicarán en el frontend después de Bootstrap')
                                            ->placeholder("/* Ejemplo:\n.btn-custom {\n  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);\n  color: white;\n}\n*/")
                                            ->columnSpanFull(),
                                    ]),
                            ]),

                        // Tab 4: Tipografía
                        Tab::make('Tipografía')
                            ->icon('heroicon-o-document-text')
                            ->schema([
                                Section::make('Google Fonts')
                                    ->description('Selecciona las tipografías para títulos y contenido')
                                    ->schema([
                                        Select::make('font_heading')
                                            ->label('Fuente para Títulos')
                                            ->required()
                                            ->searchable()
                                            ->default('Roboto')
                                            ->options(self::getGoogleFonts())
                                            ->helperText('Se aplicará a h1, h2, h3, h4, h5, h6'),

                                        Select::make('font_body')
                                            ->label('Fuente para Contenido')
                                            ->required()
                                            ->searchable()
                                            ->default('Open Sans')
                                            ->options(self::getGoogleFonts())
                                            ->helperText('Se aplicará al texto del cuerpo (body, p, div)'),
                                    ]),
                            ]),
                    ])
                    ->columnSpanFull(),
            ]);
    }

    /**
     * Lista de Google Fonts populares
     */
    protected static function getGoogleFonts(): array
    {
        return [
            'Roboto' => 'Roboto',
            'Open Sans' => 'Open Sans',
            'Lato' => 'Lato',
            'Montserrat' => 'Montserrat',
            'Poppins' => 'Poppins',
            'Raleway' => 'Raleway',
            'Inter' => 'Inter',
            'Nunito' => 'Nunito',
            'Playfair Display' => 'Playfair Display',
            'Merriweather' => 'Merriweather',
            'PT Sans' => 'PT Sans',
            'Source Sans Pro' => 'Source Sans Pro',
            'Ubuntu' => 'Ubuntu',
            'Oswald' => 'Oswald',
            'Work Sans' => 'Work Sans',
            'Rubik' => 'Rubik',
            'Quicksand' => 'Quicksand',
            'Josefin Sans' => 'Josefin Sans',
            'Fira Sans' => 'Fira Sans',
            'Mulish' => 'Mulish',
            'Dancing Script' => 'Dancing Script',
            'Pacifico' => 'Pacifico',
        ];
    }

    /**
     * Lista de fuentes TrueType disponibles en storage/app/fonts/
     */
    protected static function getAvailableFonts(): array
    {
        $fontsPath = storage_path('app/fonts');
        $fonts = ['system' => 'Fuente del Sistema'];

        if (! is_dir($fontsPath)) {
            return $fonts;
        }

        $files = glob($fontsPath.'/*.ttf');
        foreach ($files as $file) {
            $basename = basename($file, '.ttf');
            $fonts[$basename] = ucfirst(str_replace(['_', '-'], ' ', $basename));
        }

        return $fonts;
    }

    /**
     * Obtiene todos los roles disponibles en el sistema
     */
    protected static function getAvailableRoles(): array
    {
        try {
            return Role::pluck('name', 'name')
                ->mapWithKeys(fn ($name) => [$name => self::getRoleLabel($name)])
                ->toArray();
        } catch (\Exception $e) {
            // Fallback si la tabla de roles no existe aún
            return [
                'creator' => 'Creador',
                'vip' => 'VIP',
                'moderator' => 'Moderador',
                'admin' => 'Admin',
                'user' => 'Usuario',
            ];
        }
    }

    /**
     * Convierte el nombre del rol en una etiqueta legible
     */
    protected static function getRoleLabel(?string $role): string
    {
        if (! $role) {
            return 'Seleccionar rol';
        }

        // Mapeo de nombres de roles a etiquetas en español
        $labels = [
            'super_admin' => 'Super Admin',
            'admin' => 'Admin',
            'moderator' => 'Moderador',
            'vip' => 'VIP',
            'creator' => 'Creador',
            'user' => 'Usuario',
        ];

        return $labels[$role] ?? ucfirst(str_replace('_', ' ', $role));
    }
}
