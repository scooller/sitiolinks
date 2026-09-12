# Link Persons (only-models)

Monorepo del proyecto **only-models**: backend Laravel con API GraphQL y panel de administración, más un frontend SPA en `front-site/`.

## Estructura

- **Raíz del repositorio** — Backend **Laravel 12** (PHP 8.2+) con API GraphQL ([rebing/graphql-laravel](https://github.com/rebing/graphql-laravel)) y panel de administración **Filament v5** con **Shield** (roles y permisos).
- **`front-site/`** — SPA **React 18 + Vite** (TypeScript) con PWA; consume la API GraphQL del backend. Ver su propio `front-site/README.md`.

## Entornos

| Entorno | URL |
| --- | --- |
| Backend / API / Admin (local) | `http://127.0.0.1:8000` (`/admin`, `/graphql`, `/api/*`) |
| Frontend (local) | `http://127.0.0.1:3000` (Vite, con proxy al backend) |
| Producción | `only-models.online` (frontend) · `admin.only-models.online` (backend/admin) |

## Puesta en marcha (backend)

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
```

Después continúa con la generación de permisos de Filament Shield (ver siguiente sección).

---

## Panel de Administración (Filament v5)

### Post-instalación (Shield)

Después de instalar dependencias y configurar el proyecto, genera los permisos de Filament Shield:

```bash
php artisan shield:generate --all
```

### Página "Documentación" (leer README del proyecto)

	- Permiso de página: `View:Documentation`.
	- Asignado por defecto a roles `admin` y `super_admin` mediante el seeder `AssignDocumentationPermissionSeeder`.
	- Gate alternativo admitido: `view_Documentation` o `page_Documentation` (compatibilidad).

Para re-asignar el permiso desde consola:

```bash
php artisan db:seed --class=AssignDocumentationPermissionSeeder
```

## ALTCHA (captcha libre)

ALTCHA es el captcha por defecto (código abierto, prueba de trabajo resuelta en el navegador y verificada localmente en el servidor).

Configuración en `.env` (backend):

```
ALTCHA_ENABLED=true
ALTCHA_SECRET=tu_secret_aleatorio
```

El paquete PHP `altcha-org/altcha` ya está en `composer.json`; la configuración vive en `config/services.php` (`services.altcha`).

- Endpoint del challenge: `GET /api/altcha/challenge` (`AltchaController::challenge`), con `maxNumber: 50000`.
- Verificación: `App\Support\Captcha::verify(?string $token)` usa `AltchaOrg\Altcha\Altcha::verifySolution()`; devuelve `true` si ALTCHA está deshabilitado.
- Se aplica en registro (`/api/register`) y contacto (`CreateContactMessageMutation`).
- ALTCHA requiere HTTPS para usar WebCrypto API en producción.
- En desarrollo el widget usa el proxy de Vite; en producción apunta a `VITE_BACKEND_URL + /api/altcha/challenge` (ver `front-site/README.md`).

## Módulo GraphQL (Auditoría y Configuración)

### Paquete y servidor
- Paquete: `rebing/graphql-laravel@^9.12` (composer.json:19).
- Ruta base: `/graphql` (config/graphql.php:5–23), controlador `Rebing\GraphQL\GraphQLController@query`, middleware de grupo `web` para cookies/sesión.
- Schemas:
  - `default`: protegido por `auth:web` (config/graphql.php:102–145), métodos `GET|POST`.
  - `public`: abierto con `throttle:60,1` (config/graphql.php:146–193), métodos `GET|POST`.
- Tipos globales: `PaginatorInfo`, `GalleryPaginator`, `UserPaginator` (config/graphql.php:199–210).

### Estructura de directorios
- `app/GraphQL/Queries`: consultas (`UsersQuery`, `UserQuery`, `GalleriesQuery`, `CafesWithReviewsQuery`, `CafeDetailQuery`, `TicketsQuery`, `SiteSettingsQuery`, etc.).
- `app/GraphQL/Mutations`: mutaciones (`CreateLinkMutation`, `UpdateProfileMutation`, etc.).
- `app/GraphQL/Types`: tipos (`UserType`, `TagType`, `GalleryType`, `ContactMessageType`, etc.).

### Convenciones de imports y namespaces
- Namespace: `namespace App\GraphQL\{Queries|Mutations|Types};` en todos los archivos.
- Facade de tipos: `use Rebing\GraphQL\Support\Facades\GraphQL;` y uso `GraphQL::type('...')`.
- Clases base: `use Rebing\GraphQL\Support\Query;`, `use Rebing\GraphQL\Support\Mutation;`, `use Rebing\GraphQL\Support\Type as GraphQLType;`.
- Tipos Webonyx: `use GraphQL\Type\Definition\Type;` y, cuando aplique, `ResolveInfo`.

### Verificaciones realizadas
1) Definiciones y registro
   - Todas las Queries/Mutations/Types referenciadas están registradas en `config/graphql.php` bajo los schemas correctos.
   - Ejemplos: `ContactMessageType` (app/GraphQL/Types/ContactMessageType.php:1–36) está incluido en `public` (config/graphql.php:173–190).
2) Rutas de importación
   - Importaciones consistentes con `use` (PSR-4). No se usa `require` manual.
   - Se detectó uso mixto del facade: `\GraphQL::type('SystemStats')` en `SystemStatsQuery` (app/GraphQL/Queries/SystemStatsQuery.php:20). Funciona por alias, pero se recomienda unificar a `use Rebing\GraphQL\Support\Facades\GraphQL;` + `GraphQL::type('SystemStats')` para consistencia.
3) Ciclos y redundancias
   - No se encontraron importaciones circulares.
   - Algunas mutaciones lanzan `\Exception` para errores de usuario (p. ej., `CreateLinkMutation` app/GraphQL/Mutations/CreateLinkMutation.php:51,57; `UpdateLinkMutation` app/GraphQL/Mutations/UpdateLinkMutation.php:50,56). Se recomienda usar `GraphQL\Error\UserError` para formato de error consistente.
4) Inicialización del servidor
   - Configuración correcta del route group y schemas. El frontend usa `/graphql` y `/graphql/public` y persiste sesión vía `Sanctum` y cookie CSRF (front-site/src/lib/graphql/graphqlRequest.ts:29–38,45–56).

### Problemas encontrados
- Inconsistencia menor en uso del facade `GraphQL`:
  - `SystemStatsQuery` usa `\GraphQL::type('SystemStats')` (app/GraphQL/Queries/SystemStatsQuery.php:20). Propuesta: importar el facade y usar `GraphQL::type(...)`.
- Manejo de errores en mutaciones:
  - Uso de `\Exception` en validaciones de autorización/autenticación (Create/Update Link). Propuesta: reemplazar por `UserError` para respuestas GraphQL amigables.

### Propuestas de corrección
- Unificar facade:
  - Añadir `use Rebing\GraphQL\Support\Facades\GraphQL;` en `SystemStatsQuery` y cambiar `return \GraphQL::type('SystemStats');` por `return GraphQL::type('SystemStats');`.
- Errores de usuario:
  - En `CreateLinkMutation` y `UpdateLinkMutation`, reemplazar
    - `throw new \Exception('No autenticado');`
    - `throw new \Exception('No autorizado');`
    por
    - `throw new \GraphQL\Error\UserError('No autenticado');`
    - `throw new \GraphQL\Error\UserError('No autorizado');`

### Buenas prácticas al añadir módulos GraphQL
- Registrar nuevas Queries/Mutations/Types en el schema adecuado (`default` vs `public`) en `config/graphql.php`.
- Usar `GraphQL::type('NombreTipo')` para referencias entre tipos.
- Preferir `UserError` para errores que debe ver el cliente; reservar excepciones para fallos del servidor.
- Mantener los `use` ordenados y sin duplicados; eliminar imports no usados.
- Validar con `php artisan test` y revisar que la ruta `/graphql` esté accesible con las políticas/middlewares esperados.

## Motor Nativo de Email & Automatización (Filament v5 / Laravel 12)

Sub-sistema integrado de comunicaciones por correo electrónico sin dependencias externas:
- **Plantillas Dinámicas (`EmailTemplateResource`)**: Editor enriquecido con placeholders automáticos (`{{ user.name }}`, `{{ user.email }}`, `{{ user.username }}`, `{{ site.name }}`, `{{ action_url }}`).
- **Campañas Programadas y Recurrentes (`EmailCampaignResource`)**: Segmentación de audiencias (*Todos*, *Creadores*, *VIPs*, *No verificados*, *Inactivos 30+ días*) con envíos automáticos procesados en cola (`ProcessEmailCampaignsCommand`).
- **Auditoría e Historial de Envíos (`EmailLogResource`)**: Captura transparente de todos los correos del sistema (tickets, notificaciones, contacto, campañas) con modal de vista previa HTML en iframe seguro y reenvío manual en 1 clic.
- **Envíos Masivos Manuales**: Acción masiva desde la tabla de usuarios (`UsersTable.php`) con selector de casillas y procesamiento en lotes en segundo plano (`SendBulkEmailJob`).

## Optimización para Motores LLM y SEO (GEO)

Ecosistema preparado para la indexación y citación por modelos de Inteligencia Artificial generativa (ChatGPT, Claude, Gemini, Perplexity):
- **`/llms.txt` y `/llms-full.txt`**: Documentación estándar en Markdown con especificación de rutas públicas, entidades del dominio y contexto de Cafés con Piernas en Chile y Ley N° 21.719 (ARCOP).
- **Rastreadores IA en `robots.txt`**: Autorización explícita para `GPTBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`, `Applebot-Extended`, `cohere-ai`, `Bytespider` y `CCBot`.
- **Sitemap Dinámico (`/sitemap.xml`)**:
  - Servido en vivo desde Laravel (`SitemapController`) integrando creadores activos (`/u/:username`) y cafeterías (`/cafes/:slug`) desde base de datos.
  - Sincronizado en tiempo de compilación frontend mediante `front-site/scripts/generate-sitemap.mjs`.

## Bloqueo por País y Detección Automática de VPNs / Proxies

Privacidad y protección contra acoso local mediante `App\Services\GeoLocationService`:
- **Anti-Evasión por VPN**: Si un creador activa `country_block = true`, cualquier visitante que intente ingresar usando una VPN, Tor, proxy o IP de datacenter/hosting (AWS, DigitalOcean, Hetzner, Linode, M247, etc.) es **bloqueado automáticamente**.
- **Bloqueo Geográfico**: Los visitantes residenciales del mismo país del creador son bloqueados de ver su perfil, fotos y galerías.
- **Acceso Administrativo y Propietario**: El propio creador y los administradores/moderadores siempre tienen acceso irrestricto, incluso conectados a una VPN.
- **Pruebas en Desarrollo**: Soporta simulación mediante cabeceras HTTP (`X-Test-Country: CL`, `X-Test-VPN: 1`, `X-Test-IP: x.x.x.x`).

## Módulos del panel (Filament)

Recursos disponibles en `/admin`: **Analytics**, **Cafes** (cafés, sucursales y reseñas), **ContactMessages**, **EmailCampaigns**, **EmailLogs**, **EmailTemplates**, **Galleries**, **Media**, **Pages**, **SiteSettings**, **Tags**, **Tickets**, **Users** y **VipNotifications**.

Comandos de mantenimiento:

```bash
php artisan media:clean-orphans [--dry-run]      # limpiar media huérfana
php artisan media:regenerate [--watermark-only]  # regenerar conversiones
php artisan users:fix-country-codes             # normalizar códigos de país
php artisan emails:process-campaigns            # procesar campañas de email pendientes
```

## Cafés y Sucursales: Imágenes con Media Library

La sección de cafés y sucursales quedó alineada con el patrón ya usado en galerías: las imágenes se gestionan en backend con Spatie Media Library y no mediante rutas directas del frontend.

### Backend
- Colecciones usadas:
  - `cafe_image` y `cafe_image_temp` en `App\Models\Cafe`
  - `branch_image` y `branch_image_temp` en `App\Models\CafeBranch`
- Conversiones configuradas para ambas entidades:
  - `thumb` (`200x120`)
  - `thumb_webp` (`200x120`, calidad `75`)
  - `preview` (`600x360`)
- La carga en Filament se hace desde relation managers, no desde el formulario principal:
  - `CafeImageRelationManager`
  - `BranchImageRelationManager`

### Entrega de imágenes
- Las imágenes públicas de café y sucursal se sirven desde rutas backend:
  - `/cafe-media/{media}`
  - `/cafe-media/{media}/{conversion}`
  - `/branch-media/{media}`
  - `/branch-media/{media}/{conversion}`
- El controlador responsable es `App\Http\Controllers\MediaController`.
- En GraphQL, `CafeType.image_url` y `CafeBranchType.image_url` devuelven URLs absolutas construidas contra `APP_URL`, no contra el host del request actual.

### Regla de orden
- Cuando se necesita elegir una sola imagen para mostrar, se toma la más reciente por `created_at desc` y `id desc` como desempate.
- Esto aplica tanto en tablas de Filament como en los resolvers GraphQL de cafés y sucursales.

---

## Directrices para Agentes de IA y Registro de Cambios

- **Instrucciones para Agentes**: Consultar [AGENTS.md](AGENTS.md) para los estándares obligatorios (uso de skills, RTK para frontend, consultas mediante Graphify, versionado SemVer y pautas Apple HIG).
- **Registro de Versiones**: Consultar [CHANGELOG.md](CHANGELOG.md) para el historial de versiones según el estándar *Keep a Changelog*.

