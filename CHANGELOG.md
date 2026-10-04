# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.31.0] - 2026-10-04

### Added
- **Sistema Integral de Manager y Workflow de Aprobación de Creadores**:
  - Panel Filament dedicado `/manager` (`ManagerPanelProvider`) para usuarios con rol `manager`.
  - Recursos de gestión en el panel manager: `CreatorResource` (creación, edición, baja, links rápidos), `MyCafeResource` (gestión de café propio y asignación a sucursales) y `ManagerTagResource` (creación de etiquetas bajo permiso).
  - Verificación obligatoria de mayoría de edad (+18) con subida de 3 documentos fotográficos privados: cédula/pasaporte frontal, reverso y selfie sosteniendo el documento.
  - Almacenamiento seguro en disco local con registro de auditoría de vistas (GDPR / Ley 21.719) vía `MediaController::serveDocumentMedia`.
  - Acceso seguro para creadores sin correo obligatorio mediante Magic Link de un solo uso con caducidad de 72 horas (`MagicLinkController`).
  - Workflow de aprobación admin en `/admin`: `ManagerCreatorResource` con visor modal de fotos de verificación y acciones para aprobar o rechazar con motivo.
  - Eventos y oyentes `CreatorApproved` y `CreatorRejected` con despacho de notificaciones in-app y correos asíncronos (`CreatorApprovedMail`, `CreatorRejectedMail`).
  - Sistema de mensajería unidireccional manager ➔ creadores con tipo de notificación `manager_message`.
  - Límites configurables por manager (`max_creators_per_manager` y `manager_can_create_tags`) en `SiteSettings`.
  - Solicitud de perfil de manager desde el frontend: Banner y modal interactivo en [EditProfile.tsx](file:///d:/laragon/www/link-persons/front-site/src/pages/EditProfile.tsx) con opción de indicar café/local físico, switch en formulario de registro ([Register.tsx](file:///d:/laragon/www/link-persons/front-site/src/pages/Register.tsx)), creación automática de `ManagerProfile` pendiente y ticket de soporte para el equipo administrativo.
  - Indicador de estado de manager y enlace directo al panel `/manager` en el menú de navegación ([Navigation.tsx](file:///d:/laragon/www/link-persons/front-site/src/components/Navigation.tsx)).
### Security
- **Auditoría y Blindaje de Flujo Manager & Creadores**:
  - `SEC-01`: Restricción estricta de acceso al panel Filament `/manager` validando estado activo del perfil (`ManagerProfile::isActive()`).
  - `SEC-02`: Detección de modificación posterior de documentos +18; revoca verificación (`verified = false`), regresa creador a estado pendiente (`STATUS_PENDING`) y alerta a administradores.
  - `SEC-03`: Almacenamiento seguro de tokens de enlace mágico (`magic_link_token`) mediante hash SHA-256 en base de datos; previene exposición ante volcados o fugas de BD.
  - `SEC-04`: Protección contra toma de control de cuentas (Account Takeover); bloquea regeneración de enlaces mágicos para perfiles de creador ya aprobados.
  - `SEC-05`: Streaming seguro de documentación confidencial con cabeceras anti-caché estrictas (`no-store`, `nosniff`, `Pragma: no-cache`) y acceso explícito para que el creador titular consulte sus propios documentos (cumplimiento Ley 21.719 / ARCOP).
  - `SEC-06`: Corrección de ruta de almacenamiento privado en Laravel 12 usando `Storage::disk('local')->path(...)` en acciones de carga de Filament.

## [0.30.5] - 2026-10-04


### Changed
- **Eliminación de logotipo/avatar redundante en Tarjetas QR (`CafeDetail.tsx`)**:
  - Eliminado el contenedor superior de avatar/logotipo en las tarjetas descargables de Historia (9:16) y Feed (1:1), manteniendo un único logotipo de marca posicionado exclusivamente dentro de la matriz del código QR.
  - Reorganizado y centrado el bloque de título (`displayName`) y texto de detalle (`detailTxt`) con proporciones equilibradas y espacios armónicos.

## [0.30.4] - 2026-10-04

### Fixed
- **Logo del Café vs Avatar en Tarjetas y Código QR (`CafeDetail.tsx`, `MediaController.php`, `web.php`)**:
  - Eliminado por completo `drawCircularAvatar` y el formato de avatar circular en las tarjetas de exportación QR (Story 9:16 y Feed 1:1), reemplazándolo por renderizado directo del logotipo de marca (`drawImageContain`) con su proporción nativa.
  - Eliminado el bloqueo por CORS (`crossOrigin = 'anonymous'`) en la medición de dimensiones de `loadQrLogo` que provocaba que la imagen del café fallara y cayera en el fallback del logotipo del sitio.
  - Agregadas cabeceras directas `Access-Control-Allow-Origin: *` y soporte de preflight `OPTIONS` en `MediaController.php` y `routes/web.php` para endpoints de medios de café.

## [0.30.3] - 2026-10-04

### Changed
- **Logo del Café en Código QR (`CafeDetail.tsx`, `cors.php`)**:
  - El código QR de perfil de café ahora incrusta directamente el logotipo del café con su relación de aspecto original (calculada dinámicamente) y excavación proporcional en la matriz del QR.
  - Como fallback automático si el café no posee imagen o falla su carga, se utiliza el logotipo oficial del sitio.
  - Eliminado el recorte y token de avatar circular para el QR (`generateCafeQrAvatar`), empleando el logotipo como tal sin forzar apariencia de avatar.
  - Incorporadas rutas de medios de café y sucursales (`cafe-media/*`, `branch-media/*`, `gallery-media/*`) en `config/cors.php` para asegurar cabeceras CORS permisivas en operaciones de canvas.

## [0.30.2] - 2026-10-04

### Fixed
- **Descarga de Códigos QR para Cafeterías (`CafeDetail.tsx`)**:
  - Corregido error de seguridad por canvas contaminado (CORS / `tainted canvas`) al intentar exportar la imagen con `toDataURL()`.
  - En caso de que la imagen remota del café no cuente con cabeceras CORS permisivas, `generateCafeQrAvatar` descarta la URL externa sin asignar un enlace inseguro al código QR, usando en su lugar el logotipo local o base64 limpio.
  - Añadido fallback visual elegante con icono de café si la imagen remota no puede ser renderizada en el canvas de la tarjeta.
  - Implementada recuperación de errores con respaldo a `offCanvas` para garantizar siempre la descarga exitosa del archivo QR.

## [0.30.1] - 2026-10-04

### Changed
- **Diseño Apple HIG para Dropdown de Descarga QR (`CafeDetail.tsx`, `cafes.css`)**:
  - Reemplazado grupo de botones tosco por control segmentado Apple HIG (`.cafe-qr-download-group`) con terminación píldora unificada, divisor fino y botón chevron integrado.
  - Menú flotante Liquid Glass con desenfoque de fondo (`blur(28px) saturate(180%)`), borde translúcido y animación fluida `appleEase`.
  - Elementos de lista enriquecidos con iconos dedicados, títulos destacados y descripciones de uso (Historias/Reels, Feed/Post, Solo QR).
- **Logo / Avatar del Café incrustado en el Código QR (`CafeDetail.tsx`, `cafes.css`)**:
  - Generación de token circular de avatar del café con borde blanco protector (`256x256`) procesado en canvas.
  - El código QR en pantalla y las descargas en alta resolución ahora incrustan el logo/foto del café en el centro en lugar del logo genérico del sitio.

## [0.30.0] - 2026-10-02

### Added
- **Descarga de Códigos QR para Cafeterías (`CafeDetail.tsx`, `cafes.css`, `translation.json`)**:
  - **Tarjeta dedicada en barra lateral**: Tarjeta Apple HIG con vista previa de código QR interactivo (`QRCodeCanvas`) con el logotipo del sitio incrustado y escalado proporcionalmente.
  - **Opciones de descarga multiformato**: Botón split con soporte para 3 formatos de exportación en alta resolución (JPEG 0.95):
    - **Historia / Reels (9:16 - 1080x1920)**: Fondo blur con la fotografía del café, branding superior, tarjeta central blanca, imagen con recorte circular `cover`, nombre, ubicación/sucursales, calificación por estrellas, código QR con logo central, llamada a la acción y pie de página oficial.
    - **Feed / Post (1:1 - 1080x1080)**: Diseño cuadrado para publicaciones con avatar de cabecera, nombre, ubicación, código QR y branding oficial.
    - **Solo Código QR (1024x1024)**: Código QR nítido con fondo blanco y logo centralizado.
  - **Acceso rápido en Modal de Compartir**: Integrado selector desplegable de descarga de QR dentro del modal de compartir del café.
  - **Soporte multi-idioma**: Claves de localización agregadas en español e inglés.

## [0.29.2] - 2026-10-01

### Fixed
- **Avatar y Logo en Tarjetas y Código QR (`UserProfile.tsx`)**:
  - Implementado `drawImageCover` en canvas para que el avatar circular de las tarjetas descargables (Story 9:16 y Feed 1:1) mantenga proporción `object-fit: cover` con recorte central en lugar de deformarse o estirarse.
  - Aplicado `drawImageCover` al desenfoque de fondo en ambas tarjetas para evitar aberraciones de relación de aspecto.
  - Implementado `drawImageContain` para el logo central en tarjetas QR y cálculo dinámico de dimensiones en `<QRCodeCanvas>` para evitar estiramientos si el logo no es cuadrado.

## [0.29.1] - 2026-10-01

### Fixed
- **`graphqlRequest` — query faltante `siteSettingsThemeColors`** (`queries.ts`): El query referenciado en `App.tsx` no estaba definido, causando `query: undefined` silencioso en la segunda carga de colores del tema.
- **`graphqlRequest` — fallback 4xx con caché** (`graphqlRequest.ts`): Ahora se sirve desde localStorage también en respuestas 401, 403 y 419 (no solo 5xx) para queries no-mutation, evitando pantallas de error cuando el backend es accesible pero la sesión caducó.
- **`graphqlRequest` — reset automático de CSRF en 419** (`graphqlRequest.ts`): Si el backend retorna 419 (token CSRF expirado), se resetea `csrfEnsured` para que la siguiente request autenticada reobtonga el token automáticamente.
- **`graphqlRequest` — logs eliminados de producción** (`graphqlRequest.ts`): Los `console.log` de debug estaban activos en producción; ahora se guardan detrás de `import.meta.env.DEV`.
- **`useFetchData` — retry automático con backoff** (`useFetchData.ts`): En errores de red (`Failed to fetch`) el hook reintenta automáticamente hasta 3 veces con backoff exponencial (1s→2s→4s) antes de mostrar el error al usuario. Errores de negocio/auth no generan retries.

## [0.29.0] - 2026-10-01


### Added
- **Funcionalidad de Denuncia de Perfiles con Tickets en Backend (`UserProfile.tsx`, `profile.css`, `translation.json`)**:
  - **Botón sutil Apple HIG**: Integrado botón con icono `fas fa-flag` en la tarjeta lateral de perfiles ajenos (`currentUser?.username !== user.username`).
  - **Modal de Denuncia Interactivo**:
    - Gate de inicio de sesión para usuarios no autenticados.
    - Selector de motivos de denuncia: Suplantación de identidad, contenido no permitido o inapropiado, spam/fraude, fotos falsas, sospecha de menor (+18) u otros motivos.
    - Campo de descripción detallada con validación mínima.
    - Integración directa con la mutación GraphQL `createTicket` (categoría `contenido`, prioridad `alta`) que genera automáticamente el ticket en el panel de soporte y notifica a los moderadores.
    - Confirmación inmediata con número de ticket generado.

## [0.28.0] - 2026-10-01

### Added
- **Selectores Vinculados de Ciudad/Región y Comuna en Cafés (`CafeBranchForm.php`, `SuggestCafe.tsx`, `ChileLocations.php`, `chileLocations.ts`)**:
  - **Backend Filament Admin (`CafeBranchForm.php`, `ChileLocations.php`)**:
    - Reemplazados campos de texto plano por selectores dinámicos vinculados con autocompletado y búsqueda reactiva (`live()`).
    - Al cambiar la Ciudad/Región seleccionada, se actualizan dinámicamente las Comunas disponibles y se limpia la selección previa.
  - **Frontend Sugerir Café (`SuggestCafe.tsx`, `chileLocations.ts`, `suggest.css`)**:
    - Menús desplegables enlazados de Región y Comuna de Chile con estética Apple HIG.
    - Soporte completo para el envío de `$state` (Comuna) en la mutación GraphQL `createCafeSuggestion`.
    - Actualización en backend de `CafeSuggestion` model, migración y tabla de administración para aprobar sucursales con su comuna.

## [0.27.0] - 2026-10-01

### Added
- **Pestaña de Perfiles Similares y Recomendados Apple HIG (`SimilarUsersQuery.php`, `UserProfile.tsx`, `UserGalleries.tsx`, `queries.ts`)**:
  - **Query GraphQL `similarUsers`**:
    - Algoritmo de afinidad basado en coincidencia de etiquetas (tags), género y nacionalidad.
    - **Prioridad VIP**: Los perfiles VIP similares se ordenan primero, seguidos por relevancia de afinidad y popularidad.
    - Filtro de exclusión automática del perfil consultado y respeto al geobloqueo/país.
  - **Segmented Control Apple HIG**:
    - Agregado botón interactivo con icono `fas fa-wand-magic-sparkles` en la barra de pestañas de [UserProfile.tsx](file:///d:/laragon/www/link-persons/front-site/src/pages/UserProfile.tsx).
    - Segmented control sincronizado también en [UserGalleries.tsx](file:///d:/laragon/www/link-persons/front-site/src/pages/UserGalleries.tsx) con soporte para navegación directa vía `?tab=similar`.
  - **Grilla de Perfiles Recomendados**:
    - Integración de `UsersGrid` con animaciones táctiles, halo VIP distintivo, etiquetas interactivas y paginación fluida.
    - Estado de carga con skeleton placeholders y empty state accesible.

### Fixed
- **Auditoría y Cierre Reactivo de Todos los Menús Dropdown (`CafeDetail.tsx`, `Navigation.tsx`, `LanguageSwitcher.tsx`, `UserProfile.tsx`, `cafes.css`)**:
  - **Selector de Sucursales de Café (`CafeDetail.tsx`)**: Vinculado con estado `branchDropdownOpen`, `autoClose={true}` y cierre inmediato en cada selección de sucursal.
  - **Menús de Navegación (`Navigation.tsx`)**: Menús desplegables de Cafés e Información (`NavDropdown`) y panel flotante de Notificaciones (`Dropdown`) convertidos a estado reactivo controlado con `autoClose={true}` y cierre automático al interactuar con cualquier elemento o enlace.
  - **Selector de Idioma (`LanguageSwitcher.tsx`)**: Integrado estado `showDropdown` con `autoClose={true}` y cierre garantizado al seleccionar Español o Inglés.
  - **Descarga de Códigos QR (`UserProfile.tsx`)**: Conmutador de formatos de tarjeta QR controlado con `showQrDropdown` y `autoClose={true}`.
  - Ocultación del caret nativo de Bootstrap en selectores Apple HIG personalizados.

## [0.26.11] - 2026-09-27

### Added
- **Asistente de Perfil Completo para Creadores Apple HIG (`ProfileCompletenessCard.tsx`, `profileCompleteness.ts`, `UserProfile.tsx`, `EditProfile.tsx`)**:
  - Motor de cálculo de completitud de perfil (0 a 100%) basado en: foto de avatar, biografía, redes sociales / WhatsApp, galerías publicadas, etiquetas y tarifa/ubicación.
  - **Tarjeta interactiva en Perfil Público (`UserProfile.tsx`)**: Visible exclusivamente para el creador autenticado al visitar su propio perfil, con barra de progreso fluida y accesos directos a las secciones pendientes.
  - **Asistente interactivo en Editar Perfil (`EditProfile.tsx`)**: Barra de progreso y chips de tareas pendientes con conmutación instantánea de pestañas al hacer clic.
  - Ocultamiento automático al alcanzar el 100% y opción de colapsar/expandir en cualquier momento.

## [0.26.10] - 2026-09-27

### Added
- **Flujo de Solicitud de Rol Creador(a) y Notificación Administrativa por Ticket (`Register.tsx`, `EditProfile.tsx`, `AuthController.php`, `mutations.ts`, `AuthContext.tsx`)**:
  - **Switch en el Registro de Nuevos Usuarios (`Register.tsx`, `AuthController.php`)**:
    - Agregado switch visual Apple HIG *"Quiero ser Creador(a) de Contenido"*.
    - Al registrarse con el switch activado, el backend genera automáticamente un ticket de soporte interno (`Ticket::CATEGORY_ACCOUNT`, prioridad alta) con los datos del usuario para revisión del admin.
  - **Banner y Modal de Solicitud en Editar Perfil (`EditProfile.tsx`)**:
    - Si el usuario logueado tiene rol estándar (`!isCreator`), se presenta un banner editorial Liquid Glass con botón *"Solicitar Perfil de Creador"*.
    - Modal interactivo para ingresar notas opcionales o enlaces de muestra, enviando la solicitud vía GraphQL al sistema de tickets interno.
    - El administrador puede revisar el ticket y cambiar el rol a `creator` directamente desde la tabla de Usuarios en Filament con 1 clic y notificación por correo.

## [0.26.9] - 2026-09-27

### Added
- **Gestión Inteligente de Enlaces Sociales y de Perfil Apple HIG (`LinkEditorModal.tsx`, `socialLinks.ts`, `EditProfile.tsx`, `edit-profile.css`)**:
  - Catálogo de plataformas enriquecido con soporte específico para WhatsApp, Telegram, Instagram, X (Twitter), TikTok, Discord, Snapchat, Signal, YouTube, Facebook, OnlyFans, Twitch, Spotify y Enlaces Personalizados.
  - **Entrada simplificada de identificadores**: Prefijos visuales fijos (`wa.me/`, `t.me/`, `@`, etc.) donde el creador solo debe escribir su nombre de usuario o número telefónico.
  - **Detección y extracción automática de URLs pegadas**: Si el usuario pega un enlace completo externo en el campo, el modal detecta la plataforma, conmuta al preset correspondiente y extrae el identificador automáticamente.
  - **Rejilla táctil de plataformas (Touch Targets ≥ 44pt)** con paletas de color de marca y estados activos con feedback visual.
  - **Píldoras de acceso rápido** en la pestaña de enlaces para crear links de las redes más populares con 1 solo toque.
  - **Listado moderno de enlaces en tarjeta Apple HIG** con ordenamiento interactivo (subir / bajar posición), edición modal in-situ y borrado directo.
  - Switch nativo de contenido para adultos (+18) con marcado inteligente por defecto en redes adultas.
  - Previsualización en vivo dentro del modal idéntica a la tarjeta final del perfil público.

## [0.26.8] - 2026-09-27

### Added
- **Tarjetas QR Listas para Compartir en Redes Sociales (`UserProfile.tsx`)**:
  - Incorporado generador multi-formato en el perfil público:
    - **Tarjeta Historia / Reels (9:16 - 1080x1920 px)**: Fondo de avatar con efecto blur ambiental y oscurecido, tarjeta central Liquid Glass con avatar circular, badge verificado, nombre `@username`, QR de alta definición con logo del sitio, URL del perfil y advertencia de mayoría de edad (`+18 Solo Adultos`).
    - **Tarjeta Cuadrada / Feed (1:1 - 1080x1080 px)**: Formato optimizado para posts y chats con fondo blur y tarjeta central estilizada.
    - **Código QR Clásico (1:1 - 1024x1024 px)**: Código QR limpio de alta resolución con logo del sitio y márgenes uniformes.
  - Selector desplegable (`Dropdown.ButtonGroup`) con estado de generación y feedback visual.

## [0.26.7] - 2026-09-27

### Fixed
- **Descarga de Código QR de Perfil con Logo y Márgenes (`UserProfile.tsx`)**:
  - Corregida la exportación del código QR en el perfil de usuario para incrustar y excavar el logo del sitio de forma nítida.
  - Generada imagen de alta resolución (1024x1024 px) en formato JPEG con fondo blanco sólido y márgenes uniformes (~56px) para compartir en redes y mensajería sin pérdida de escaneabilidad.
- **Previsualización de Imagen al Compartir Enlace de Perfil (`UserProfile.tsx`, `OpenGraphController.php`)**:
  - Configurada jerarquía de imagen de previsualización (Open Graph / Twitter Cards / crawler preview): avatar de usuario como prioridad principal, logo del sitio (`SiteSettings`) como fallback inmediato, avatar por defecto o logo institucional (`logo500.png`).
- **Normalización de Marca y Títulos Dinámicos SEO (`seo.ts`, `UserProfile.tsx`, `OpenGraphController.php`, `index.html`, `manifest.json`, `llms.txt`, `llms-full.txt`)**:
  - Eliminado el nombre interno del repositorio ("Link Persons") de títulos de página, metadatos Open Graph, Twitter Cards y etiquetas JSON-LD.
  - La plataforma ahora utiliza siempre de forma dinámica el título real del sitio configurado en el panel administrativo (`SiteSettings::site_title`) con fallback al dominio real instalado (`Only Models`).
  - Optimizado el posicionamiento SEO para el directorio de creadoras y creadores adultos (+18) (OnlyFans, Arsmate), escorts, casas de citas y damas de compañía enfocado principalmente en Chile, Colombia y Latinoamérica.
  - Integración en metadatos y vistas compartidas de búsqueda por tags/categorías, tarifas referenciales por hora (`price_from`), todas las redes sociales oficiales y advertencia obligatoria de mayoría de edad (+18).

## [0.26.6] - 2026-09-20

### Changed
- **Preservación de colores de etiquetas de perfil (`UserProfile.tsx`, `profile.css`, `queries.ts`)**:
  - Las etiquetas (`profile-tags`) en el perfil público ahora reflejan fielmente la paleta de colores asignada desde el backend (`primary`, `secondary`, `success`, `danger`, `warning`, `info`, `light`, `dark` o código HEX personalizado) con soporte translúcido para temas claro y oscuro según Apple HIG.

### Fixed
- **Validación de Opacidad de Card en Filament (`UserForm.php`)**:
  - Configurado `->numeric()` en `card_bg_opacity` para evitar que Laravel aplique regla de longitud de string sobre valores decimales (0.1 a 1.0).

## [0.26.5] - 2026-09-20

### Added
- **Selector rápido de tipo de usuario en Filament (`UsersTable.php`)**:
  - Incorporado `SelectColumn` interactivo en la tabla de usuarios (`/admin/users`) para cambiar el rol/tipo de usuario (`user`, `vip`, `creator`, `moderator`, `admin`, `super_admin`) en tiempo real con sincronización Spatie Permissions y purga de caché GraphQL.
  - **Notificación por Correo Electrónico (`UserRoleChangedMail`, `user-role-changed.blade.php`)**: Envío automático de correo con plantilla HTML responsiva alertando al usuario sobre su nuevo nivel y destacando los beneficios correspondientes (VIP, Creador, etc.).
  - **Notificación Interna del Sistema (`NotificationService::notifyRoleChanged`)**: Registro de notificación in-app para el usuario destinatario.
- **Acceso directo al Perfil Público de Usuario en Filament**:
  - En la tabla de usuarios (`UsersTable.php`), la columna `username` y la acción de registro `Ver Perfil` abren directamente `/u/{username}` en el frontend SPA en una pestaña nueva.
  - En el formulario de edición de usuario (`EditUser.php` y `UserForm.php`), añadidos botones de acción directa en la cabecera, junto al campo `username` y en la sección `Perfil público`.
- **Catálogo Expandido de Ciudades de LATAM y Países Hispanohablantes (`cities_by_country_es.json`)**:
  - Incorporadas más de 770 ciudades y capitales provinciales para 23 países (Ecuador, República Dominicana, México, Argentina, Colombia, Chile, Venezuela, Perú, Bolivia, Paraguay, Uruguay, Costa Rica, Panamá, Guatemala, Honduras, El Salvador, Nicaragua, Cuba, Puerto Rico, Brasil, España, Estados Unidos y Canadá) disponibles de inmediato tanto en el backend Filament como en el frontend SPA.
### Changed
- **Flexibilidad de campos de perfil (`UserForm.php`, `EditProfile.tsx`)**: Los campos `descripción`, `nacionalidad`, `país` y `ciudad` ahora son completamente opcionales (nullable) tanto en el panel Filament como en la edición de perfil del frontend, sin afectar relaciones ni tablas vinculadas.
- **Aclaración de precio referencial responsive Apple Design (`UserProfile.tsx`, `profile.css`)**: Integrado botón icono interactivo con tooltip flotante en Desktop/Tablet e indicador callout compacto con acabado translúcido en Mobile.
### Fixed
- **Validación de Opacidad de Card en Filament (`UserForm.php`)**: Corregido campo `card_bg_opacity` añadiendo `->numeric()` para que las reglas `minValue(0.1)` y `maxValue(1)` validen rango numérico en lugar de longitud de caracteres de texto.
- **Botón "Ver Sitio" en Filament (`AdminPanelProvider.php`)**: Corregido el enlace para redirigir a `config('app.frontend_url')` (o fallback `http://127.0.0.1:3000`) en lugar de apuntar a la ruta raíz `/` del backend.

## [0.26.4] - 2026-09-17

### Added
- **Filament Log Viewer Plugin (`achyutn/filament-log-viewer`)**:
  - Integrated `AchyutN\FilamentLogViewer\FilamentLogViewer` plugin in Filament Admin Panel (`AdminPanelProvider.php`).
  - Added dedicated `/admin/logs` interactive interface to monitor, filter, search, copy, and manage Laravel logs directly from the administration dashboard.
  - Published and customized `config/filament-log-viewer.php`.
- **Resilient Offline & Database Fallback Cache (`graphqlRequest.ts`, `CacheNoticeToast.tsx`)**:
  - Implemented automatic local caching for read GraphQL queries.
  - On sporadic database connectivity dropouts (`SQLSTATE[HY000] [2002]` / HTTP 500), frontend falls back to cached data seamlessly without displaying disruptive error modals.
  - Added subtle Apple HIG Liquid Glass floating toast (`CacheNoticeToast`) notifying users that cached data is being displayed.

### Changed
- **Repository Hygiene (`.gitignore`, `bootstrap/cache/.gitignore`)**: Ignored environment-specific cached manifest files (`packages.php`, `services.php`, `config.php`, `routes-*.php`) in `bootstrap/cache/` to prevent cross-environment conflicts.

## [0.26.3] - 2026-09-17

### Fixed
- **Configuration Serialization (`config/graphql.php`)**: Replaced non-serializable closure in `graphql.errors_handler` with `[GraphQL::class, 'handleErrors']` to support `php artisan config:cache`.

## [0.26.2] - 2026-09-17

### Security
- **GraphQL BOLA Mitigation (`GalleriesQuery.php`)**: Enforced mandatory status and visibility authorization scoping unconditionally before applying optional `visibility` query argument, preventing unauthorized access to private/unapproved galleries.
- **Media Ownership Validation & IDOR Defense (`AddMediaToGalleryMutation.php`, `RemoveMediaFromGalleryMutation.php`)**: Enforced strict media ownership verification (`model_type === User::class && model_id === user.id`) preventing users from attaching or deleting third-party media.
- **CSRF & Session Cookie Hardening (`bootstrap/app.php`, `config/session.php`)**: Enforced CSRF validation on default stateful `/graphql` schema and switched fallback cookie `SameSite` attribute from `none` to `lax`.
- **Stored XSS Prevention on Links (`CreateLinkMutation.php`, `UpdateLinkMutation.php`, `UpdateLinksMutation.php`, `UserProfile.tsx`, `Go.tsx`)**: Enforced strict `http://` and `https://` protocol validation both backend and frontend, blocking `javascript:` execution.
- **Plaintext Session Cookie Log Leak Removal (`AuthController.php`, `CreateGalleryMutation.php`)**: Stripped session identifiers, cookie headers, and cookie arrays from application log statements.
- **Captcha Verification Fix (`config/services.php`)**: Added default `captcha.provider => 'altcha'` configuration to ensure Altcha challenges validate correctly on registration and contact forms.
- **Authentication Rate Limiting (`routes/api.php`)**: Applied `throttle` middleware to `/api/login` (6/min), `/api/register` (10/min), `/api/altcha/challenge` (30/min), and `/api/email/resend` (5/min).
- **PII Protection (`UserType.php`)**: Restricted `birth_date` and `privacy_consent_at` resolution exclusively to profile owners and administrators/moderators.
- **GraphQL DoS Hardening (`config/graphql.php`)**: Configured query max depth (10) and complexity (300) safeguards.
- **Search Indexing Privacy (`SitemapController.php`)**: Filtered out creators with `search_indexing_opt_in = false` or `country_block = true` from `sitemap.xml`.

## [0.26.1] - 2026-09-12

### Changed
- **Global & International Scope for SEO & AI Grounding**:
  - Broadened metadata across `front-site/index.html`, `public/index.html`, `seo.ts`, and `UserProfile.tsx` to position Link Persons as a worldwide/international platform for creators, models, escorts, and adult content (+18), rather than restricting focus solely to Chile.
  - Positioned the "cafés con piernas" vertical as a specialized cultural directory feature without narrowing the global scope of the creators and models network.
  - Sychronized global taxonomy in `llms.txt`, `llms-full.txt`, `manifest.json`, `vite.config.ts`, and backend `SiteSettings`.

## [0.26.0] - 2026-09-12

### Added
- **Dynamic User Profile Meta Tags & Social Sharing Engine**:
  - Implemented dynamic client-side metadata management (`seo.ts`) in React. When navigating to `/u/:username`, document title, description, keywords, Open Graph (`og:title`, `og:description`, `og:image`, `og:url`, `og:type=profile`), Twitter Cards, and canonical URLs are updated in real-time with the profile user's real display name, bio, and avatar.
  - Added 1-tap "Compartir" (Share) action button adhering to Apple HIG on user cards (`UserProfile.tsx`), supporting native Web Share API on mobile (WhatsApp, Messages, Instagram) with fallback clipboard copy.
  - Implemented crawler-friendly Open Graph preview endpoint in Laravel (`OpenGraphController.php` at `/api/og/user/{username}` and `/share/u/{username}`) with automated `.htaccess` User-Agent routing for WhatsApp, Facebook, Twitter, Telegram, Discord, and LinkedIn bots.

## [0.25.2] - 2026-09-12

### Changed
- **Comprehensive Frontend & LLM SEO Optimization**:
  - Enriched primary meta titles, meta descriptions, and search keywords in `front-site/index.html` and `front-site/public/index.html` with high-intent Chilean terms: "Escort y damas de compañía", "Links de venta de contenido para adulto", "Galería con desnudos explícitos", and "Cafés con piernas en Chile".
  - Updated structured schema.org JSON-LD and OpenGraph/Twitter Card metadata for maximum indexing fidelity across Google, Bing, and AI search crawlers.
  - Deepened semantic grounding in `llms.txt` and `llms-full.txt` with structured discovery pillars, explicit content taxonomy, search intent mapping, and query vectors.
  - Synchronized default backend `SiteSettings` (title and description) and PWA `manifest.json` / `vite.config.ts` with enhanced branding.

## [0.25.0] - 2026-09-12

### Added
- **Automated VPN / Proxy / Datacenter Detection & Country Block Engine (`GeoLocationService.php`)**: Implemented intelligent geolocation service in Laravel with multi-provider detection (`ip-api.com` proxy and hosting analysis, ASN signatures, 24h caching).
- **Anti-Bypass Protection for `country_block`**: Profiles with `country_block = true` automatically block visitors using known VPNs, proxies, Tor, or datacenter IPs, preventing local users from evading geographic blocks.
- **Unified Query Scopes (`UserQuery`, `UsersQuery`, `TopViewedUsersQuery`, `GalleriesQuery`, `GalleryQuery`)**: Sealed privacy leaks across creator profiles, explore directory, ranking leaderboard, and galleries. Authenticated creators viewing their own profile and platform administrators retain full supervisory bypass.

## [0.24.1] - 2026-09-12

### Changed
- **LLM SEO & Semantic Disambiguation for "Cafés con Piernas"**: Updated `/llms.txt`, `/llms-full.txt`, and `index.html` metadata to accurately specify that coffee venues in Link Persons are Chilean *"cafés con piernas"* (traditional urban espresso bars featuring model hostesses) rather than generic specialty coffee shops, providing precise grounding for AI answer engines (ChatGPT, Claude, Perplexity).

## [0.24.0] - 2026-09-12

### Added
- **Dynamic Database Sitemap Controller (`SitemapController.php`)**: Live XML sitemap generator in Laravel (`GET /sitemap.xml`) combining core static routes with dynamic creator handles (`/u/:username`) and active cafes (`/cafes/:slug`), automatically pulling domain from `config('app.frontend_url')` and caching for 1 hour.
- **Automated Frontend Sitemap Build Script (`generate-sitemap.mjs`)**: Build-step script for Vite that parses `VITE_FRONTEND_URL` and `VITE_BACKEND_URL` from `.env.production` to automatically output production-ready `sitemap.xml`, sync `robots.txt`, and update canonical JSON-LD domains in `index.html`.
- **Hybrid English/Spanish `llms.txt` & `llms-full.txt`**: Standardized AI grounding documentation with high-density English technical grammar and directives for optimal token efficiency in LLM reasoning engines (GPT-4o, Claude, Perplexity), while preserving exact Spanish routing, domain keywords, and Chilean legal citations (Ley N° 21.719, ARCOP).

## [0.23.0] - 2026-09-12

### Added
- **LLM SEO & Generative Engine Optimization (GEO)**: Implemented full accessibility for AI crawlers, search LLMs (ChatGPT, Claude, Gemini, Perplexity), and search engine bots.
- **Official Standard `/llms.txt` and `/llms-full.txt`**: Added root-level Markdown index files defining platform architecture, public entities, café directories, creator profiles, ARCOP privacy rights, and guidance on factual grounding for LLM answers.
- **AI Crawler Directives in `robots.txt`**: Explicitly permitted all major AI web crawlers (`GPTBot`, `ChatGPT-User`, `OAI-SearchBot`, `ClaudeBot`, `anthropic-ai`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `cohere-ai`, `Bytespider`, `CCBot`) while protecting private administrative routes.
- **Search Engine Sitemap (`sitemap.xml`)**: Standard XML sitemap containing all public platform routes (`/`, `/explorar`, `/cafes`, `/ranking`, `/sugerir-cafe`, `/faqs`, `/contacto`, `/privacidad-datos`, `/terminos-y-condiciones`).
- **Structured Data JSON-LD & Rich Metadata (`index.html`)**: Injected Schema.org `WebSite` and `Organization` JSON-LD graphs, alternate links to `/llms.txt`, full Open Graph tags, and Twitter Cards.
- **Server Cache & MIME Type Optimization (`.htaccess`)**: Configured UTF-8 MIME types and fresh caching rules for text/markdown and XML indexing endpoints on Hostinger / LiteSpeed.

## [0.22.0] - 2026-09-12

### Added
- **Native Email Management & Automation Engine in Filament (Laravel 12 / Filament v5)**: Complete built-in communications subsystem without third-party plugin incompatibilities.
- **Email Logs & Auditing (`EmailLogResource`, `LogSentMessageListener`)**: Automatic transparent capture of all system emails (tickets, notifications, contact messages) with full HTML preview modal in sandboxed iframe and 1-click resend capability.
- **Dynamic Email Templates (`EmailTemplateResource`, `EmailTemplateSeeder`)**: Rich editor template builder supporting reusable dynamic placeholders (`{{ user.name }}`, `{{ user.email }}`, `{{ user.username }}`, `{{ site.name }}`, `{{ action_url }}`) with live test email dispatch action.
- **Bulk Manual Emailing (`UsersTable.php`, `SendBulkEmailJob`)**: Bulk Action in Filament Users table allowing selection of users with checkboxes to compose and send queued personalized emails in chunks of 50.
- **Scheduled & Recurring Email Campaigns (`EmailCampaignResource`, `ProcessEmailCampaignsCommand`)**: Campaign manager supporting audience segmentation (*All Users*, *Creators*, *VIPs*, *Unverified Email*, *Active Subscribers*, *Inactive 30+ Days*), one-time scheduling, and automated recurrence (daily, weekly, monthly) processed through Laravel Queue and Scheduler.
- **Responsive Dynamic Email Layout (`dynamic-template.blade.php`, `DynamicTemplateMail`)**: High-contrast, mobile-first email layout with official branding, dynamic body, and customizable notification preference link.

## [0.21.0] - 2026-09-12

### Added
- **Chilean Personal Data Protection Compliance (Ley N° 21.719 & Ley N° 19.628)**: Complete institutional compliance system implementing SERNAC transparency duties, CPLT cookie guidelines, and Digital Government ARCOP rights (Acceso, Rectificación, Cancelación, Oposición, Portabilidad).
- **Dedicated Privacy & ARCOP Rights Center (`PrivacyPolicy.tsx`, `privacy.css`)**: Comprehensive, modern editorial portal with 4 categorized tabs (*Tratamiento de Datos*, *Derechos ARCOP*, *Política de Cookies CPLT*, and *Canal de Solicitudes*) at `/privacidad-datos`, `/derechos-arcop`, and `/politica-de-privacidad`.
- **Liquid Glass Cookie Consent Banner & Preferences Modal (`CookieConsentBanner.tsx`, `cookie-banner.css`)**: Floating translucent Apple Liquid Glass banner and modal allowing granular control over Technical (necessary), Preference, and Analytical cookies (Google Analytics gating).
- **Data Portability Engine (`ExportMyDataQuery.php`, `exportMyData` GraphQL query)**: Real-time structured, interoperable JSON download of user account details, profile metadata, custom links, and photo galleries with timestamps and privacy status.
- **Direct User Profile Privacy Controls (`EditProfile.tsx`)**: Added dedicated "Protección de Datos & Derechos ARCOP" card in Security tab with explicit consent switch, recorded timestamp badge, right to object (search engine indexing opt-out), direct JSON portability download, and quick link to the ARCOP center.
- **Dedicated Registration Privacy Consent Checkbox (`Register.tsx`)**: Disaggregated legal terms into separate checkboxes for Terms of Service and ARCOP Privacy Consent (Ley N° 21.719) with strict validation.
- **Database Schema Migration (`users` table)**: Added `privacy_consent` (boolean), `privacy_consent_at` (timestamp), `privacy_policy_version` (string), and `search_indexing_opt_in` (boolean) fields.
- **Filament Admin Audit & Management (`UserForm.php`, `UsersTable.php`)**: Integrated Privacy & Data Protection audit section with consent toggle, timestamp, policy version, and table status icon.
- **Full i18n Localization (`es`, `en`)**: Complete bilingual coverage for `auth`, `privacy`, `cookies`, `profile`, and `nav` namespaces.

## [0.20.2] - 2026-09-12

### Added
- **Dynamic Contact Page Title & Subtitle from Backend (`Contact.tsx`, `queries.ts`)**: Integrated GraphQL `pageBySlug` query to dynamically load page title and intro description from the backend CMS `Page` model (`slug: 'contacto'` / `'contact'`) with DOM parsing to cleanly extract subtitle text without duplicate headers.
- **Robust i18n Fallback**: Seamlessly falls back to local translation keys (`contact.title` and `contact.intro`) when backend records are loading, empty, or unavailable.

## [0.20.1] - 2026-09-12

### Added
- **Interactive Google Maps Branch Address Link (`CafeDetail.tsx`, `cafes.css`)**: Converted static address badge into a tactile Apple pill link (`.apple-address-pill`) that opens Google Maps in a new tab with location pin icon and external link arrow.
- **Smart Fallback Search Resolver**: If `google_maps_url` is not set or contains an iframe embed, dynamically constructs a query URL targeting `[cafe name, branch name, address, comuna/city]` on Google Maps.
- **i18n Localization**: Added `open_in_maps` translation key in `es` and `en`.

## [0.20.0] - 2026-09-12

### Added
- **Apple HIG Branch Selector Pop-Up Dropdown (`CafeDetail.tsx`, `cafes.css`)**: Replaced overflowing and overlapping branch tabs with an Apple Pop-Up Dropdown selector (`.apple-branch-picker-btn`, `.apple-branch-dropdown-menu`).
- **Tactile Branch Stepper Navigation**: Added quick previous/next branch chevron buttons (`.apple-branch-step-btn`) allowing 1-tap switching between branches without opening the menu.
- **Rich Branch List Items**: Dropdown menu displays each branch with optical icon, location name, address, and selected checkmark state with smooth scroll for large branch lists.
- **Adaptive Responsive Layout**: Automatically activates the compact Dropdown on mobile viewports for all branch counts, and on desktop whenever a cafe has more than 3 branches. For <= 3 branches on desktop, tabs use non-overlapping flex bounds (`flex: 1 1 0`, `min-width: 0`, `text-truncate`).
- **i18n Localization**: Added keys `select_branch`, `prev_branch`, and `next_branch` in `es` and `en`.

### Fixed
- Fixed visual overlap and text clipping occurring in cafe branch tabs when cafes have many branches or long address labels.

## [0.19.0] - 2026-09-12

### Added
- **Apple HIG Edit Profile Experience (`EditProfile.tsx`, `edit-profile.css`)**: Completely redesigned the profile editor into a macOS/iOS System Settings inspector using Apple Human Interface Guidelines (HIG 2026).
- **Apple Segmented Inspector Navigation**: Implemented a responsive horizontal segmented bar (`.edit-profile-segmented`) organizing settings into clean tabs: *General*, *Creador*, *Enlaces*, *Etiquetas*, and *Seguridad*.
- **Editorial Hero Header**: Added return pill link (`.edit-profile-back-link`) to public profile, kicker badge (`.edit-profile-kicker`), Large Title, and quick profile link.
- **Continuous Squircle Avatar Preview**: Added an 84px squircle avatar box with optical borders, camera section plate, and integrated frosted FilePond drop zone.
- **Section Headers with Optical Icon Plates**: 36px squircle plates (`.edit-profile-icon-plate`) in Apple functional gradients (blue, teal, orange, purple, rose, indigo, emerald) for rapid visual scanning.
- **Apple Styled Inputs & Switches**: Replaced default Bootstrap form controls with `.apple-input`, `.apple-select`, and `.apple-textarea` featuring continuous squircles, 48px touch targets, focus glow rings, and Apple toggles.
- **Interactive Card Customization Live Preview**: Added real-time simulated creator card (`.apple-card-live-preview`) reflecting background color, opacity slider, dynamic text luminance contrast, and sample badges.
- **Tactile Link Management**: Redesigned link items with squircle cards, optical platform icon picker, age-gate (+18) checkbox, and 44pt tactile destructive delete buttons.
- **Apple Tag Pills**: Designed `.apple-tag-pill` with icon support, active solid tinting, fixed tag indicators, search filter, and zero outline buttons.
- **Apple Destructive Danger Zone & Modal**: Enclosed account deletion in an isolated `.apple-danger-zone-card` with 48px solid red action and frosted confirmation modal.
- **i18n Localization**: Added keys in `es/translation.json` and `en/translation.json` for new tabs, titles, and avatar sections.

### Changed
- Replaced monolithic 800+ lines scrolling form and default Bootstrap cards/alerts with modular Apple Liquid Glass cards and 100% solid tactile buttons (zero outline buttons).

## [0.18.0] - 2026-09-12

### Added
- **Apple Liquid Glass Offcanvas Sheet Navigation**: Completely redesigned the user profile slide-over sheet (`Navigation.tsx`, `offcanvas.css`) following Apple Human Interface Guidelines (HIG 2026).
- **User Identity Hero Card**: Added an elevated squircle profile card (`.apple-offcanvas-user-card`) linking to `/u/:username` with squircle avatar, verified badge, handle, and dynamic role pills (`VIP`, `Creador`, `Staff`).
- **Inset Grouped Navigation Lists**: Structured navigation into iOS Settings-style inset grouped cards (`.apple-offcanvas-inset-group`) with 32px optical icon plates (`.apple-offcanvas-icon-plate`) in functional Apple gradients (blue, teal, purple, rose, orange, slate, emerald, indigo).
- **Comprehensive Account & Management Links**: Added direct navigation items for "Mi Perfil", "Editar Perfil", "Mis Galerías", "Nueva Galería", "Notificaciones" (with unread count badge), "Panel Admin" (staff only), and "Tickets de Soporte".
- **System Preferences Rows**: Embedded Language switcher and Theme switcher as native inset group rows (`.apple-offcanvas-pref-row`) with Apple capsule dropdown styling.
- **Solid Tactile Logout Button**: Replaced legacy `outline-danger` button with 100% solid, tactile Apple destructive action button (`.apple-offcanvas-logout-btn`) meeting ≥ 44pt touch targets with active scale feedback.
- **Capsule User Pill Trigger**: Replaced bare text navbar triggers with `.apple-nav-user-pill` featuring a 28px mini-avatar squircle, user name, and subtle chevron for desktop and mobile viewports.
- **i18n Localization**: Added internationalization keys in `es` and `en` for new offcanvas sections, actions, and roles.

### Changed
- Replaced plain text drawer links and generic Bootstrap Offcanvas styles with high-craft translucent Liquid Glass (`blur(28px) saturate(180%)`), 28px corner squircles, and frosted circular close button.

## [0.17.1] - 2026-09-12

### Security
- **Email Privacy Protection**: Added permission-check resolver to `UserType.php` for `email` and `email_verified_at` fields. Email addresses are now strictly restricted to the user themselves or staff (`super_admin`, `admin`, `moderator`), blocking public scraping.
- **Support Ticket Authorization**: Enforced viewer ownership and role checks on `TicketQuery` and `TicketsQuery`. Guests and unauthorized users can no longer read other users' support tickets or access full ticket listings.
- **Support Ticket Impersonation Prevention**: Hardened `CreateTicketMutation` to require an authenticated session and verify `user_id` matches the caller (preventing forging tickets on behalf of others). Added rate limiting of 5 tickets/hour per user.
- **Staff Internal Comments Isolation**: Filtered `is_internal` comments and comments count in `TicketType.php` so staff notes are completely hidden from regular users.

### Fixed
- **Default GraphQL Schema Alignment**: Registered `TicketQuery`, `TicketsQuery`, and `CreateTicketMutation` in `default` schema in `config/graphql.php` so authenticated SPA queries work consistently on both endpoints.
- **Backend Test Suite**: Added `TicketsGraphqlTest.php` covering authorization, isolation, staff comments privacy, ticket creation rules, and email masking (24 passing assertions across 6 test suites).

## [0.17.0] - 2026-09-12

### Added
- Implemented high-fidelity Apple HIG skeleton preloader system matching 1:1 real component geometries with smooth hardware-accelerated light reflection shimmer (`apple-skeleton-shimmer`).
- Created 1:1 `UserCardSkeleton` in `UsersGrid.tsx` preserving exact squircle card curvature, avatar diameter, handle line, 2-line bio width, meta pills row (country, age, gender, price), tags row, and full-width CTA pill button to achieve zero Cumulative Layout Shift (CLS: 0).
- Integrated `UsersGrid` skeletons into `Home.tsx` (VIP creators), `Explore.tsx`, and `Tag.tsx`, replacing generic spinners with structured preloaded cards.
- Designed faithful skeleton grid for `FeaturedGalleries.tsx` matching cover image, title line, author chip, and like button metrics.
- Designed faithful tag cloud skeletons for `PopularTags.tsx` matching pill geometries and realistic varied widths.
- Designed faithful cafe card skeletons for `CafesWithReviews.tsx` matching image cover, rating pill, branch count, and review badges.
- Designed faithful creator hero and gallery card skeletons for `UserGalleries.tsx` and `GalleryDetail.tsx`.
- Designed faithful profile card skeleton for `UserProfile.tsx` matching avatar 150px, handle, bio, actions, counters, and links list.
- Upgraded `OptimizedImage.tsx` to use dark/light adaptive Apple shimmer instead of static grey Bootstrap placeholders.

### Changed
- Replaced mismatched Bootstrap `Placeholder` wave animations and spinners across home, explorer, tags, galleries, profile, and cafes with authentic Apple HIG shimmer skeletons.

## [0.16.0] - 2026-09-12

### Added
- Redesigned User Galleries directory (`UserGalleries.tsx` at `/u/:username/galleries`) and Gallery Detail viewer (`GalleryDetail.tsx` at `/galleries/:id`) under Apple Human Interface Guidelines (HIG 2026).
- Enhanced `galleries.css` with Apple Liquid Glass empty states (`.galleries-empty-card`) featuring frosted halos, clear messaging, and solid CTA buttons for empty search and empty creator states.
- Added Apple Liquid Glass error cards (`.gallery-error-card`) with error halos, retry actions, and direct navigation.
- Created tactile Apple HIG return navigation (`.gallery-back-link`) with squircle geometry and touch target heights ≥ 44pt.
- Redesigned search bar with 48px height, optical search icon, and smooth clear button with touch target compliance.
- Upgraded gallery cards (`.gallery-apple-card`) with 24px continuous squircles, hover micro-interactions, Liquid Glass visibility badges, and image lazy loading.
- Redesigned gallery detail header card (`.gallery-detail-header-card`) with author chip, photo counter, and solid tactile edit/back buttons (zero outline buttons).
- Added i18n support strings in `es` and `en` for empty states, clear search, and creator collections.

### Changed
- Replaced legacy Bootstrap alerts and undersized 36px buttons with Apple HIG squircle cards and 100% solid tactile buttons (≥ 44pt touch targets).

## [0.15.0] - 2026-09-12

### Added
- Redesigned Tag Explorer page (`Tag.tsx` at `/t/:tag`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `tag.css` featuring Apple Liquid Glass filter bar (`.tag-filters-card`), continuous squircle corners (`var(--rounded-2xl)`), and elevated shadows.
- Designed Apple editorial Hero section with kicker badge (`.tag-kicker`), Large Title typography, and glowing Liquid Glass `#tag` pill (`.tag-hero-pill`).
- Added responsive Liquid Glass filter controls with optical icons: Min/Max Price (`fa-dollar-sign`), Gender (`fa-venus-mars`), Country (`fa-globe`), and 100% solid reset button (`.tag-filter-reset-btn`) with touch targets ≥ 44pt (48px).
- Implemented Apple HIG empty state card (`.tag-empty-card`) with luminous frosted halo, clear messaging, and solid CTA back to `/explorar`.
- Integrated fluid Apple motion curves (`fadeIn`, `defaultTransition`, `appleEase`) from `motion/react`.
- Added complete i18n support strings in `es` and `en` for tag explorer kicker, subtitles, filters, and empty states.

### Changed
- Replaced legacy Bootstrap form controls and outline buttons with Apple HIG squircle inputs and 100% solid tactile buttons (zero outline buttons).

## [0.14.0] - 2026-09-12

### Added
- Redesigned Help & Support Tickets module (`Tickets.tsx`, `NewTicket.tsx`, `TicketDetail.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `tickets.css` featuring Apple Liquid Glass cards (`.ticket-apple-card`, 20px squircle), `--shadow-card` elevation, and hover transitions.
- Replaced legacy Bootstrap HTML tables with responsive Apple HIG card lists with status pills (`.ticket-status-pill`), priority pills (`.ticket-priority-pill`), category badges, and solid view action buttons.
- Redesigned ticket creation form (`NewTicket.tsx`) with 48px touch targets, optical icons (`.ticket-input-icon`), and 100% solid submission buttons.
- Redesigned ticket detail and conversation thread (`TicketDetail.tsx`) featuring discussion bubble cards, comment timeline, and glassmorphic ticket metadata sidebar.
- Added Apple HIG empty state card (`.tickets-empty-card`) with support headset icon and direct solid CTA.
- Added i18n support strings in `es` and `en` for ticket kicker, subtitle, creation flow, and discussion threads.

### Changed
- Replaced all outline buttons across the tickets module with 100% solid tactile buttons (`.tickets-new-btn`, `.ticket-submit-btn`, `.ticket-view-btn`).

## [0.13.0] - 2026-09-12

### Added
- Redesigned Notifications page (`Notifications.tsx` at `/notificaciones`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `notifications.css` featuring Apple Liquid Glass cards (`.notif-apple-card`, 20px squircle), `--shadow-card` elevation and unread indicator accents.
- Implemented Apple HIG Segmented Control (`.notif-segmented-nav`, `.notif-segment-btn`) for filtering notifications (Todas, Sin leer, VIP) with continuous pill geometry and touch targets ≥ 44pt.
- Added Apple editorial Hero section with kicker badge (`.notif-kicker`), Large Title hierarchy, and unread counter badge.
- Designed distinctive notification type halo badges (`.notif-type-badge`) with curated soft halos for follows, VIP messages, featured galleries, approvals, rejections, and system alerts.
- Added 100% solid "Marcar todas como leídas" button (`.notif-mark-all-btn`) and VIP reply button (`.notif-reply-btn`) with zero outline buttons.
- Redesigned VIP message reply modal into an authentic Apple Liquid Glass dialog (`.notif-modal-card`, 24px squircle, `blur(28px) saturate(160%)`) with 100% solid actions.
- Added Apple HIG empty state cards (`.notif-empty-card`) with frosted halos for each filter state.
- Added i18n support strings in `es` and `en` for notification kicker, subtitle, VIP filters, and reply actions.

### Changed
- Converted notifications feed and reply dialog from plain Bootstrap cards and modal into fluid Apple motion components (`motion/react`, `appleEase`).

## [0.12.0] - 2026-09-12

### Added
- Redesigned Age & Warning Modal (`WarningModal.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `warning-modal.css` featuring Apple Liquid Glass frosted veil (`.warning-modal-backdrop`, `blur(36px) saturate(180%)`) with full-screen coverage (`z-index: 100000`).
- Implemented immediate zero-leak content gating: when the age modal is enabled and unconfirmed, the frosted glass barrier activates immediately on mount, preventing any flash or leak of adult/creator content before age confirmation.
- Implemented persistent client-side cache and dismissal tracking in `localStorage` (`warning_modal_dismissed` and `warning_modal_cached_config`) alongside authenticated GraphQL dismissal sync (`mutation { dismissWarning }`).
- Designed Apple HIG squircle card (`.warning-modal-card`, 28px continuous squircle) with elevated 3D shadow and dynamic light reflection borders.
- Added glowing +18 age verification badge (`.warning-modal-badge`) with gradient amber/rose accents and security kicker (`.warning-modal-kicker`).
- Added legal/jurisdiction disclaimer callout (`.warning-modal-disclaimer`).
- Added 100% solid primary accept button (`.warning-modal-accept-btn`) and solid neutral cancel/exit button (`.warning-modal-cancel-btn`) with zero outline buttons.
- Added i18n support strings in `es` and `en` for age kicker, disclaimer, and exit CTAs.

### Changed
- Converted WarningModal from plain Bootstrap `<Modal>` into an authentic Apple Liquid Glass dialog with `motion/react` fluid transitions (`appleEase`).

## [0.11.0] - 2026-09-12

### Added
- Redesigned Suggest Café page (`SuggestCafe.tsx` at `/suggest-cafe`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `suggest.css` featuring Apple Liquid Glass squircle cards (`.suggest-apple-card`, 24px continuous squircle) with `--shadow-card` elevation.
- Added Apple editorial Hero section with kicker badge (`.suggest-kicker`), Large Title hierarchy, and high-contrast subtitle.
- Implemented Apple HIG notice callout (`.suggest-notice-callout`) for community moderation policies.
- Designed structured input layout with two-column responsive grouping for City & Address, Website & Maps with optical icon alignment.
- Added frosted squircle Altcha anti-spam container (`.suggest-altcha-wrapper`).
- Implemented Apple HIG success confirmation view (`.suggest-state-card`) with checkmark badge and solid navigation actions ("Sugerir otro café", "Explorar Cafés").
- Implemented Apple HIG authentication gate card with locked state and solid login/register action buttons.
- Added i18n support strings in `es` and `en` for suggest kicker, subtitle, placeholders, success state, and auth gate.

### Changed
- Converted suggestion submit button to 100% solid pill button (`.suggest-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.10.0] - 2026-09-12

### Added
- Redesigned Creator Ranking page (`Ranking.tsx` at `/ranking`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `ranking.css` featuring Apple Liquid Glass squircle cards (`.ranking-apple-card`, 24px continuous squircle) with `--shadow-card` elevation and hover depth.
- Implemented Apple HIG visual podium treatment for Top 3 creators:
  - #1 (Gold): Subtle warm golden aura, `.avatar-gold` halo, and crown position badge (`.badge-gold`).
  - #2 (Silver): Sleek silver gradient aura and position badge (`.badge-silver`).
  - #3 (Bronze): Warm bronze gradient aura and position badge (`.badge-bronze`).
  - #4 - #10: Clean Liquid Glass card with standard position pill (`.badge-standard`).
- Redesigned creator metrics row (`.ranking-stats-row`, `.ranking-stat-box`) with WCAG AAA high-contrast tokens for views, followers, and following.
- Added 100% solid profile access button (`.ranking-profile-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).
- Added i18n support strings in `es` and `en` for ranking kicker and view profile CTA.

### Fixed
- Fixed `.ranking-tag-pill` text contrast by adopting crisp high-contrast black (`#111827`) in light mode and white (`#ffffff`) in dark mode with subtle border styling.
- Enabled interactive navigation on ranking creator tags to `/t/:slug`.

## [0.9.1] - 2026-09-12

### Added
- Redesigned Login page (`Login.tsx` at `/login`) under Apple Human Interface Guidelines (HIG 2026).
- Extended modular stylesheet `auth.css` for login views with squircle Liquid Glass card (`.auth-apple-card`, 24px continuous squircle), ergonomic touch targets (≥ 44pt), and optical icon alignment for email (`fa-envelope`) and password (`fa-lock`).
- Added Apple editorial Hero section with kicker badge (`.auth-kicker`), Large Title hierarchy, and high-contrast typography.
- Added i18n support strings in `es` and `en` for login kicker and subtitle.

### Changed
- Converted login submit button to 100% solid pill button (`.auth-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.9.0] - 2026-09-12

### Added
- Redesigned Register page (`Register.tsx` at `/register`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `auth.css` featuring Apple Liquid Glass cards (`.auth-apple-card`, 24px continuous squircle), ergonomic input groups (≥ 44pt touch targets), and optical icon alignment.
- Added Apple editorial Hero section with kicker badge (`.auth-kicker`), Large Title hierarchy, and high-contrast typography.
- Designed structured input layout with two-column responsive grouping for gender, birth date, and password confirmation.
- Added frosted glass Altcha anti-spam container (`.auth-altcha-container`) and 256-bit SSL trust badge (`.auth-trust-badge`).
- Added i18n support strings in `es` and `en` for registration kicker, subtitle, and SSL security badge.

### Changed
- Converted registration submit button to 100% solid pill button (`.auth-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.8.1] - 2026-09-12

### Changed
- Refactored `Faq.tsx` to dynamically query and consume all FAQ titles, content, and answers directly from the Laravel backend (`App\Models\Page`) via GraphQL `page(slug: $slug)`, eliminating static client-side FAQ data arrays.
- Implemented client-side DOM parser in `Faq.tsx` to automatically transform backend rich HTML (`<h2>`, `<h3>`) into interactive Apple HIG squircle accordions with `appleEase` micro-animations while supporting fallback raw HTML rendering.
- Updated `PageSeeder.php` and refreshed Laravel database with structured HTML content for `preguntas-frecuentes` and `faqs`.

## [0.8.0] - 2026-09-12

### Added
- Redesigned Frequently Asked Questions module (`Faq.tsx` at `/preguntas-frecuentes` and `/faqs`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `faq.css` with squircle Liquid Glass cards (`.faq-apple-card`, 24px continuous squircle), real-time live search capsule (`.faq-search-input`), and categorized segmented control pills (`.faq-category-btn`).
- Implemented Apple HIG disclosure accordion rows with hairline dividers, optical category pills, and canonical `appleEase` cubic-bezier animated chevron rotation.
- Added contextual assistance card (`.faq-cta-card`) with direct communication channels and 100% solid buttons (`--shadow-primary-btn`, `--shadow-button`) to `/contacto` and `/tickets` (zero outline buttons).
- Added structured FAQ knowledge base covering platform overview, creators & VIP galleries, cafes directory & reviews, and 256-bit SSL security & Altcha anti-spam protection.
- Added i18n localization strings in `es` and `en` for all FAQ categories, search placeholders, and assistance actions.

## [0.7.0] - 2026-09-12

### Added
- Redesigned Contact page (`Contact.tsx` at `/contacto`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `contact.css` with squircle Liquid Glass cards (`.contact-apple-card`, 24px continuous squircle), ergonomic input groups (≥ 44pt touch targets), and optical icon alignment.
- Added Apple editorial Hero section with kicker badge (`.contact-kicker`), Large Title hierarchy, and high-contrast typography.
- Added contextual Support & Assistance card (`.contact-info-card`) with response SLA indicator (< 24h), direct inquiry channel, and 256-bit SSL encrypted security badge.
- Added capsule character counter pill (`.contact-char-pill`) and glass-styled Altcha anti-spam container (`.contact-altcha-container`).
- Added i18n support strings in `es` and `en` for all contact page cards, channels, and security notes.

### Changed
- Converted contact submit button to 100% solid pill button (`.contact-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).
- Enhanced form validation and status alerts with translucent squircle Apple banners (`.contact-status-alert`).

## [0.6.3] - 2026-09-12

### Changed
- Replaced all blue tones in link color scheme with dark, high-contrast monochrome tones:
  - Light mode: Configured `--link-color: #111827` (deep charcoal slate, contrast ratio 15.6:1 on white and 13.8:1 on warm cafe beige) with hover `#000000`.
  - Dark mode: Configured neutral `--link-color: #f3f4f6` (silver/white, 0% blue, contrast ratio 14.2:1) with hover `#ffffff`.
  - Updated `--color-link` in root tokens and removed blue utility classes from profile stats and link icons.

## [0.6.2] - 2026-09-11

### Fixed
- Fixed link visibility and contrast across all website backgrounds (cream/cafe gradients, white surfaces, translucent liquid glass, and dark theme):
  - Light mode: Defined `--link-color: #0052cc` and hover `--link-hover-color: #003380` (contrast ratio > 6.5:1 on white and > 5.8:1 on warm beige).
  - Dark mode: Defined vibrant `--link-color: #70b5ff` and hover `--link-hover-color: #bfe3ff` (contrast ratio > 9.0:1 on dark surfaces).
  - Synchronized `--bs-link-color` and `--bs-link-color-rgb` custom properties.
  - Implemented global link override in `base.css` with component exclusions to avoid affecting buttons, badges, navbars, and cards.
  - Enhanced creator handles in `galleries.css` to use high-contrast link tokens with underline hover.

## [0.6.1] - 2026-09-11

### Fixed
- Increased contrast and legibility of `--text-muted` and `.text-muted` to satisfy WCAG AA contrast standards:
  - Light mode: Changed from washed-out `#6c757d` to high-contrast `#374151` (contrast ratio > 8.5:1).
  - Dark mode: Changed from dim `#adb5bd` to crisp `#cbd5e1` (contrast ratio > 9:1).
  - Synchronized `--apple-glass-text-muted` and `--bs-secondary-color` with high-contrast tokens.
  - Added global override in `base.css` to ensure `.text-muted` renders with high contrast across both light and dark themes.

## [0.6.0] - 2026-09-11

### Added
- Redesigned Galleries module (`UserGalleries.tsx` at `/u/:username/galleries` and `GalleryDetail.tsx` at `/galleries/:id`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `galleries.css` with squircle cards (`.gallery-apple-card`), creator hero banner (`.gallery-creator-hero`), and Apple photo grid (`.apple-gallery-grid`).
- Implemented Apple Segmented Control in `UserGalleries.tsx` (`Perfil` | `Galerías`) for bidirectional navigation with `UserProfile.tsx`.
- Implemented Liquid Glass search capsule (`.gallery-search-bar`, `.gallery-search-input`) with touch targets ≥ 44pt.
- Implemented Apple Liquid Glass header card in `GalleryDetail.tsx` with author chip, metadata strip, and squircle photo grid with LightGallery support.

### Changed
- Replaced 100% of outline buttons (`btn-outline-*`, `variant="outline-*"`) across `GalleryDetail.tsx`, `FeaturedGalleries.tsx`, `MyGalleries.tsx` and `EditGallery.tsx` with solid elevated buttons.
- Replaced hardcoded CSS box-shadows with modular CSS custom property tokens.

## [0.5.0] - 2026-09-11

### Added
- Redesigned User/Model Profile page (`UserProfile.tsx`, `/u/:username`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `profile.css` with squircle cards (`.profile-apple-card`), avatar halo container (`.profile-avatar-container`), and floating VIP badge (`.profile-vip-pill`).
- Implemented Apple Segmented Control (`.profile-segmented-control`) with sliding glass pill effect for Perfil / Galerías navigation.
- Implemented Apple Inset Grouped List (`.profile-details-list`, `.profile-detail-row`) for user metadata, links, and details with hairline dividers.
- Added Apple metric stat strip (`.profile-stats-bar`, `.profile-stat-item`) for followers, following, and views counter.

### Changed
- Replaced all outline buttons (`btn-outline-secondary`, `btn-outline-dark`) with solid elevated buttons (`profile-btn-solid`, `btn-secondary`, `btn-dark`) featuring tactile active states and box-shadow variables across profile views and modals.
- Converted QR code card to Apple Inset Grouped card with solid download and copy actions.

## [0.4.0] - 2026-09-11

### Added
- Redesigned `/explorar` page (`Explore.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Implemented Apple Hero Section with Large Title hierarchy, kicker, and live creator counter pill (`.explore-counter-pill`).
- Implemented Apple Liquid Glass filter bar (`.explore-filter-bar`) with search input capsule (`.explore-search-input-wrapper`), clear button, country flags, and solid reset button.
- Refactored `UsersGrid.tsx` to Apple Grouped Inset Card (`.user-apple-card`) with continuous squircle corners (24px), elevated `:hover` states, metadata pill chips, and solid CTA buttons.
- Created dedicated modular stylesheet `explore.css` using centralized CSS variables and dark mode elevation tokens.

## [0.3.2] - 2026-09-11

### Added
- Expanded full modular box-shadow scale (`--shadow-2xs` to `--shadow-2xl`, `--shadow-card`, `--shadow-card-hover`, `--shadow-button`, `--shadow-button-hover`, `--shadow-button-active`, `--shadow-primary-btn`, `--shadow-primary-btn-hover`, `--shadow-focus-ring`, `--shadow-pill`, `--shadow-sheet`) in `variables.css`.
- Added dark mode box-shadow elevation tokens under `[data-bs-theme="dark"]`.

### Changed
- Replaced hardcoded box-shadow values across `cafes.css`, `apple-components.css`, and `apple-glass.css` with CSS custom property tokens.
- Enhanced button interaction feedback with tactile active states (`:active`) and shadow depth.

## [0.3.1] - 2026-09-11

### Changed
- Replaced all outline buttons (`btn-outline-secondary`, `outline-dark`) with solid buttons (`btn-secondary`, `btn-dark`) in Cafes explorer and interior detail pages.
- Updated `cafes.css` button classes (`.cafes-filter-reset-btn`, `.cafe-detail-back-btn`, `.cafe-detail-action-btn`, `.cafe-secondary-action-btn`) to solid background styles with contrast elevation.

## [0.3.0] - 2026-09-11

### Added
- Redesigned Cafes Module and Interior Detail under Apple Human Interface Guidelines (HIG 2026).
- Implemented Apple Segmented Control (`.apple-segmented-control`) for seamless branch switching.
- Implemented Apple Grouped Inset Cards (`.cafe-apple-card`) with hairline rows and metadata icons.
- Implemented Hero visual banner on `CafeDetail.tsx` with floating rating pill and glass action bar.
- Added quick action sidebar with direct Google Maps trigger, menu QR access, and official website links.

### Changed
- Replaced legacy 01/02 accordion in `CafeDetail.tsx` with a continuous two-column editorial layout.
- Replaced 5-column rectangular form filter grid with an Apple Liquid Glass filter bar (`.cafes-filter-bar`).
- Refactored `Cafes.tsx` with Apple Hero typography and rounded-pill actions.
- Reduced Bootstrap bundle by 7 kB by pruning unused accordion and tab components.

## [0.2.7] - 2026-09-11

### Added
- Added Opacity tokens (`--opacity-faint`, `--opacity-muted`, `--opacity-pulse-min`, `--opacity-backdrop`, etc.) in `variables.css`.
- Added Rounded scale aliases (`--rounded-none`, `--rounded-sm`, `--rounded-md`, `--rounded-lg`, `--rounded-full`, `--rounded-circle`).
- Added Font sizes (`--fs-2xs` to `--fs-hero`), icon sizes (`--icon-xs` to `--icon-xl`), and component sizes (`--size-touch-min`, `--size-arrow-circle`, etc.).

### Changed
- Integrated opacity, rounded, and size variables across `apple-components.css`, `cafes.css`, and `base.css`.

## [0.2.6] - 2026-09-11

### Added
- Expanded `variables.css` with modular spacing scale (`--space-1` to `--space-12`), z-index hierarchy (`--z-navbar`, `--z-modal`, etc.), Apple HIG touch targets & dimensions (`--touch-target-min`, `--tab-min-w`, etc.), aspect ratios (`--ratio-tile`, `--ratio-square`), composite glass filters, typography weights/tracking, and icon theme filters.

### Changed
- Refactored `apple-components.css`, `apple-glass.css`, and `cafes.css` to adopt dimensions, z-index, aspect ratios, and spacing variables.

## [0.2.5] - 2026-09-11

### Added
- Created `src/styles/variables.css` centralizing CSS Custom Properties (Sass-like tokens) for typography, brand, warm coffee palette, border radii, transitions, shadows, and light/dark theme adaptive tokens.

### Changed
- Refactored `base.css`, `apple-glass.css`, `apple-components.css`, and `cafes.css` to consume centralized native CSS variables instead of hardcoded hex/rgba values.
- Imported `variables.css` at the top of `index.css` ensuring global design token availability without Sass compiler overhead.

## [0.2.4] - 2026-09-11

### Changed
- Modularized monolithic `index.css` (1000+ lines) into clean native CSS modules under `src/styles/` (`base.css`, `cafes.css`, `apple-glass.css`, `apple-components.css`) bundled via native Vite `@import` without extra dependencies.

## [0.2.3] - 2026-09-11

### Added
- Added Apple HIG Hero section on homepage (`Home.tsx`) featuring Large Title typography, descriptive subtitle, and integrated Liquid Glass search pill.
- Added Skeleton screen placeholders (`apple-skeleton-card`, `apple-skeleton-avatar`, `apple-skeleton-text`) for VIP creator loading states to avoid layout jumps.
- Added search query synchronization (`?search=...`) between the Home search pill and `Explore.tsx`.

### Changed
- Replaced `btn-outline-warning` with Apple-standard filled capsule button (`rounded-pill`, 44pt touch target) in VIP creators section.
- Wrapped homepage editorial content in Apple grouped card container (`.apple-grouped-card`, 24px squircle border-radius, hairline border).

## [0.2.2] - 2026-09-11

### Added
- Created unified `<RouteGuard />` component consolidating route protection, role requirements, and email verification in a single place.
- Added Section 6 to `AGENTS.md` enforcing mandatory `caveman` (chat & code comments) and `caveman-commit` (Conventional Commits) rules.

### Changed
- Replaced font preload React component (`PreloadCriticalAssets`) with static `<link rel="preload">` in `index.html`.
- Consolidated 12 separate `useState` hooks in `WarningModal.tsx` into a single `modalConfig` state object, reducing redundant re-renders.
- Converted `useOnlineStatus` hook to native React 18 `useSyncExternalStore`.
- Enhanced `countryUtils.ts` with browser-native `Intl.DisplayNames` for localized country names worldwide.
- Inlined GraphQL error handler in `config/graphql.php`.

### Removed
- Deleted unused ghost re-export component `GalleryImage.tsx`.
- Deleted single-purpose route wrappers `CreatorRoute.tsx`, `ProtectedRoute.tsx`, and `VerifiedRoute.tsx`.
- Deleted `PreloadCriticalAssets.tsx` component.
- Deleted redundant delegation wrapper class `app/Support/GraphQLErrorsHandler.php`.

## [0.2.1] - 2026-09-11

### Added
- Installed `DietrichGebert/ponytail` skill suite (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`) in `.agents/skills/`.
- Created `AGENTS.md` establishing mandatory guidelines for AI agents (skills adoption, RTK standard, Graphify queries, version bumping, changelog maintenance, and Apple HIG compliance).
- Apple Tab Bar navigation styles (`.apple-tab-link`, `.apple-tab-dropdown`, `.apple-tab-content`, `.apple-tab-icon`, `.apple-tab-label`, `.apple-tab-caret`).
- Liquid Glass floating material styling (`.apple-liquid-glass-nav`, `.apple-liquid-glass-dropdown`, `.apple-liquid-glass-offcanvas`) with `@media (prefers-reduced-transparency: reduce)` fallbacks.
- Apple canonical motion curve `appleEase` (`[0.16, 1, 0.3, 1]`) and `appleSpring` physics in `front-site/src/lib/animations.ts`.

### Changed
- Replaced side-by-side navbar links with Apple Tab Bar stacked layout (icon centered above single-word label).
- Replaced default Bootstrap dropdown arrow with a rotating Apple micro-chevron.
- Reduced entrance animation durations across `Home.tsx`, `CafesWithReviews.tsx`, and `PopularTags.tsx` from 0.6s to 0.28s.
- Converted `ThemeSwitcher` from floating screen-fixed overlay to an inline navigation element.

### Fixed
- Fixed contrast ratio on VIP badges and category tags to satisfy WCAG AA (≥ 4.5:1).
- Enforced minimum 44 × 44 pt touch targets on interactive buttons and notification dismiss triggers.
- Added accessible `visually-hidden` text labels to loading spinners for VoiceOver / screen reader support.
