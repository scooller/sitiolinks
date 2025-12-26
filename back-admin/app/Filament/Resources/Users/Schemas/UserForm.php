<?php

namespace App\Filament\Resources\Users\Schemas;

use Carbon\Carbon;
use Filament\Actions\Action;
use Filament\Facades\Filament;
use Filament\Forms\Components\ColorPicker;
use Filament\Forms\Components\DatePicker;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Schema;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Monarobase\CountryList\CountryListFacade as Countries;

class UserForm
{
    public static function configure(Schema $schema): Schema
    {
        return $schema
            ->components([
                TextInput::make('name')
                    ->required(),

                SpatieMediaLibraryFileUpload::make('avatar')
                    ->collection('avatar')
                    ->label('Avatar')
                    ->image()
                    ->imageEditor()
                    ->imageEditorAspectRatios([
                        null,
                        '1:1',
                    ])
                    ->maxSize(2048)
                    ->helperText('Imagen de perfil. Se recortará automáticamente según la configuración del sitio. Si no subes una imagen, se usará el avatar genérico configurado en el sitio.')
                    ->columnSpanFull()
                    ->rules([
                        fn (): \Closure => function (string $attribute, $value, \Closure $fail) {
                            if ($value instanceof \Illuminate\Http\UploadedFile) {
                                $originalName = $value->getClientOriginalName();
                                if (mb_strlen($originalName) > 90) {
                                    $fail('El nombre del archivo es demasiado largo. Usa un nombre de archivo más corto (máx. 90 caracteres incluyendo extensión).');
                                }
                            }
                        },
                    ]),

                TextInput::make('username')
                    ->label('Nombre de usuario')
                    ->required()
                    ->alphaDash()
                    ->minLength(3)
                    ->maxLength(30)
                    ->prefix('@')
                    ->rule('lowercase')
                    ->unique(table: 'users', column: 'username', ignoreRecord: true)
                    ->live(debounce: 500)
                    ->validationMessages([
                        'unique' => 'Este nombre de usuario ya está en uso.',
                        'alpha_dash' => 'Solo letras, números, guiones y guiones bajos.',
                    ])
                    ->helperText('Usa letras, números, guiones (-) o guiones bajos (_)'),
                TextInput::make('email')
                    ->label('Email address')
                    ->email()
                    ->required(),
                DateTimePicker::make('email_verified_at'),
                TextInput::make('password')
                    ->label('Contraseña')
                    ->password()
                    ->rule(Password::min(12)->letters()->mixedCase()->numbers()->symbols())
                    ->suffixAction(
                        Action::make('generateSecurePassword')
                            ->label('Generar')
                            ->icon('heroicon-o-key')
                            ->action(fn ($set) => $set('password', Str::password(16)))
                    )
                    ->dehydrateStateUsing(fn (string $state) => Hash::make($state))
                    ->dehydrated(fn ($state) => filled($state))
                    ->required(fn (string $operation): bool => $operation === 'create')
                    ->revealable()
                    ->helperText('Mínimo 12 caracteres, con mayúsculas, números y símbolos.'),

                Select::make('roles')
                    ->relationship('roles', 'name')
                    ->multiple()
                    ->preload()
                    ->searchable()
                    ->live(),

                Section::make('Perfil público')
                    ->description('Datos visibles en el perfil del usuario')
                    ->visible(function ($get) {
                        $roleIds = $get('roles') ?? [];
                        if (empty($roleIds)) {
                            return false;
                        }

                        return \Spatie\Permission\Models\Role::whereIn('id', $roleIds)
                            ->where('name', 'creator')
                            ->exists();
                    })
                    ->schema([
                        Select::make('nationality')
                            ->label('Nacionalidad')
                            ->options(self::countryOptions())
                            ->optionsLimit(500)
                            ->searchable()
                            ->preload()
                            ->native(false)
                            ->required()
                            ->afterStateHydrated(function ($component, $state) {
                                $list = self::countryOptions();
                                // Si el estado guardado es un nombre, convertirlo a código
                                if ($state && ! array_key_exists($state, $list)) {
                                    $code = array_search($state, $list, true);
                                    if ($code) {
                                        $component->state($code);
                                    }
                                }
                            }),
                        Select::make('country')
                            ->label('País')
                            ->options(self::countryOptions())
                            ->optionsLimit(500)
                            ->searchable()
                            ->preload()
                            ->native(false)
                            ->live()
                            ->required()
                            ->afterStateHydrated(function ($component, $state) {
                                // Si el estado guardado es nombre, mapear a código para mostrarlo
                                $list = self::countryOptions();
                                if ($state && ! array_key_exists($state, $list)) {
                                    $code = array_search($state, $list, true);
                                    if ($code) {
                                        $component->state($code);
                                    }
                                }
                            })
                            ->afterStateUpdated(function ($state, callable $set) {
                                // Al cambiar de país, limpiar la ciudad
                                $set('city', null);
                            }),
                        Select::make('city')
                            ->label('Ciudad')
                            ->options(fn ($get) => self::cityOptions($get('country')))
                            ->reactive()
                            ->searchable()
                            ->preload()
                            ->native(false)
                            ->required()
                            ->disabled(fn ($get) => blank($get('country')))
                            ->hint('Selecciona primero el país'),
                        Select::make('gender')
                            ->label('Sexo')
                            ->options([
                                'hombre' => 'Hombre',
                                'mujer' => 'Mujer',
                                'trans' => 'Trans',
                                'otro' => 'Otro',
                            ])
                            ->native(false)
                            ->required()
                            ->helperText('Selecciona el sexo que se mostrará en el perfil'),
                        Textarea::make('description')
                            ->label('Descripción')
                            ->rows(4)
                            ->required()
                            ->columnSpanFull(),
                        ColorPicker::make('card_bg_color')
                            ->label('Color de fondo de la card')
                            ->helperText('Personaliza el color de fondo de la card del usuario en el perfil')
                            ->nullable(),
                        TextInput::make('card_bg_opacity')
                            ->label('Opacidad de la card (0.1 a 1)')
                            ->type('number')
                            ->minValue(0.1)
                            ->maxValue(1)
                            ->step(0.01)
                            ->helperText('Ajusta la transparencia del fondo de la card en el perfil. 1 = opaco, 0.1 = muy transparente')
                            ->nullable(),
                        Toggle::make('country_block')
                            ->label('Bloqueo por país')
                            ->helperText('Oculta el perfil para visitantes del país del usuario'),
                        DatePicker::make('birth_date')
                            ->label('Fecha de nacimiento')
                            ->native(false)
                            ->required()
                            ->maxDate(Carbon::now()->subYears(18))
                            ->rule('before_or_equal:'.now()->subYears(18)->toDateString())
                            ->validationMessages([
                                'before_or_equal' => 'Debes ser mayor de 18 años.',
                                'required' => 'La fecha de nacimiento es obligatoria.',
                            ]),
                        TextInput::make('price_from')
                            ->label('Precio desde')
                            ->numeric()
                            ->step('0.01')
                            ->prefix('$')
                            ->helperText('Precio de referencia mostrado en el perfil'),
                        Toggle::make('email_notifications')
                            ->label('Notificaciones por email')
                            ->default(true)
                            ->helperText('Si está activado, el usuario recibirá notificaciones por email')
                            ->columnSpanFull(),
                        Toggle::make('is_verified')
                            ->label('Usuario verificado')
                            ->helperText('Marca al usuario como verificado con badge visible')
                            ->live()
                            ->afterStateUpdated(function ($state, $set, $get) {
                                if ($state) {
                                    // Solo establecer la fecha si no existe
                                    if (! $get('verified_at')) {
                                        $set('verified_at', now());
                                    }
                                } else {
                                    $set('verified_at', null);
                                }
                            })
                            ->dehydrateStateUsing(function ($state, $get, $set) {
                                // Al guardar, si está marcado pero no tiene fecha, asignar ahora
                                if ($state && ! $get('verified_at')) {
                                    $set('verified_at', now());
                                }

                                return $state;
                            }),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),

                Section::make('Estadísticas')
                    ->description('Métricas y datos de seguimiento del usuario')
                    ->visible(function ($get) {
                        $roleIds = $get('roles') ?? [];
                        if (empty($roleIds)) {
                            return false;
                        }

                        return \Spatie\Permission\Models\Role::whereIn('id', $roleIds)
                            ->where('name', 'creator')
                            ->exists();
                    })
                    ->schema([
                        TextInput::make('views')
                            ->label('Visitas al perfil')
                            ->numeric()
                            ->default(0)
                            ->minValue(0)
                            ->helperText('Número de veces que se ha visitado el perfil'),

                        TextInput::make('followers_count')
                            ->label('Seguidores')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false)
                            ->helperText('Usuarios que siguen a este usuario (solo lectura)'),

                        TextInput::make('following_count')
                            ->label('Siguiendo')
                            ->numeric()
                            ->disabled()
                            ->dehydrated(false)
                            ->helperText('Usuarios que este usuario sigue (solo lectura)'),

                        Select::make('followers')
                            ->label('Lista de Seguidores')
                            ->relationship('followers', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->helperText('Usuarios que siguen a este usuario')
                            ->columnSpanFull(),

                        Select::make('following')
                            ->label('Lista de Siguiendo')
                            ->relationship('following', 'name')
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->helperText('Usuarios que este usuario sigue')
                            ->columnSpanFull(),
                    ])
                    ->columns(3)
                    ->collapsible()
                    ->collapsed(),

                Section::make('Etiquetas')
                    ->description('Asigna etiquetas para clasificar al usuario')
                    ->visible(function ($get) {
                        $roleIds = $get('roles') ?? [];
                        if (empty($roleIds)) {
                            return false;
                        }

                        return \Spatie\Permission\Models\Role::whereIn('id', $roleIds)
                            ->where('name', 'creator')
                            ->exists();
                    })
                    ->schema([
                        Select::make('tags')
                            ->relationship('tags', 'name', modifyQueryUsing: function (Builder $query) {
                                $user = Filament::auth()->user();
                                $roleNames = $user && property_exists($user, 'relations')
                                    ? ($user->roles?->pluck('name')->all() ?? [])
                                    : [];
                                $isAdmin = in_array('admin', $roleNames, true) || in_array('super_admin', $roleNames, true);
                                if (! $isAdmin) {
                                    $query->where('is_fixed', false);
                                }
                            })
                            ->multiple()
                            ->preload()
                            ->searchable()
                            ->helperText('Selecciona una o más etiquetas')
                            ->columnSpanFull(),
                    ])
                    ->collapsible(),

                Section::make('Enlaces')
                    ->description('Agrega enlaces personalizados del usuario')
                    ->visible(function ($get) {
                        $roleIds = $get('roles') ?? [];
                        if (empty($roleIds)) {
                            return false;
                        }

                        return \Spatie\Permission\Models\Role::whereIn('id', $roleIds)
                            ->where('name', 'creator')
                            ->exists();
                    })
                    ->schema([
                        Repeater::make('links')
                            ->relationship('links')
                            ->schema([
                                TextInput::make('name')
                                    ->label('Nombre del Link')
                                    ->required()
                                    ->maxLength(255)
                                    ->placeholder('Mi sitio web'),

                                TextInput::make('url')
                                    ->label('URL')
                                    ->required()
                                    ->url()
                                    ->maxLength(255)
                                    ->placeholder('https://example.com'),

                                Select::make('icon')
                                    ->label('Icono')
                                    ->required()
                                    ->default('fas-link')
                                    ->options(self::getIconOptions())
                                    ->searchable(),
                            ])
                            ->columns(3)
                            ->reorderable()
                            ->orderColumn('order')
                            ->defaultItems(0)
                            ->addActionLabel('Agregar Link')
                            ->collapsible()
                            ->itemLabel(fn (array $state): ?string => $state['name'] ?? null)
                            ->columnSpanFull(),
                    ])
                    ->collapsible()
                    ->collapsed()
                    ->columnSpanFull(),
            ]);
    }

    protected static function countryOptions(): array
    {
        $list = Countries::getList('es', 'php') ?? [];
        // Asegurar orden alfabético por nombre en español
        if (! empty($list)) {
            // Mantener claves (códigos ISO) y ordenar por valor (nombre)
            asort($list, SORT_LOCALE_STRING);
        }
        return $list;
    }

    protected static array $citiesCache = [];

    protected static function cityOptions(?string $country): array
    {
        if (! $country) {
            return [];
        }
        // Si el valor de país es un nombre, convertirlo a código para lookup de ciudades
        $list = self::countryOptions();
        $countryCode = array_key_exists($country, $list) ? $country : array_search($country, $list, true);
        if (! $countryCode) {
            return [];
        }
        if (empty(self::$citiesCache)) {
            $path = base_path('resources/data/cities_by_country_es.json');
            if (File::exists($path)) {
                self::$citiesCache = json_decode(File::get($path), true) ?: [];
            }
        }
        $cities = self::$citiesCache[$countryCode] ?? [];

        // options as [ 'City' => 'City' ]
        return collect($cities)->mapWithKeys(fn ($c) => [$c => $c])->all();
    }

    /**
     * Lista de iconos Font Awesome para links
     */
    protected static function getIconOptions(): array
    {
        return [
            // Font Awesome Solid - Enlaces comunes
            'fas-link' => '🔗 Link',
            'fas-globe' => '🌐 Sitio Web',
            'fas-envelope' => '✉️ Email',
            'fas-phone' => '📞 Teléfono',

            // Redes Sociales
            'fab-facebook' => '📘 Facebook',
            'fab-twitter' => '🐦 Twitter (X)',
            'fab-instagram' => '📷 Instagram',
            'fab-linkedin' => '💼 LinkedIn',
            'fab-youtube' => '📹 YouTube',
            'fab-tiktok' => '🎵 TikTok',
            'fab-github' => '💻 GitHub',
            'fab-discord' => '💬 Discord',
            'fab-whatsapp' => '💚 WhatsApp',
            'fab-telegram' => '✈️ Telegram',
            'fab-pinterest' => '📌 Pinterest',
            'fab-reddit' => '🤖 Reddit',

            // Otros
            'fas-briefcase' => '💼 Portafolio',
            'fas-blog' => '📝 Blog',
            'fas-store' => '🏪 Tienda',
            'fas-heart' => '❤️ Donaciones',
            'fas-video' => '🎥 Video',
            'fas-music' => '🎵 Música',
            'fas-book' => '📚 Publicaciones',
            'fas-camera' => '📸 Fotografía',
        ];
    }
}
