<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework. You can also check out [Laravel Learn](https://laravel.com/learn), where you will be guided through building a modern Laravel application.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

## Panel de Administración (Filament v4)

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

ALTCHA se usa como captcha por defecto. Es de código abierto y se valida localmente en el servidor.

Para usar ALTCHA:

- Agrega en `.env`:

```
ALTCHA_ENABLED=true
ALTCHA_SECRET=tu_secret_aleatorio
```

- Instala la librería en el backend:

```bash
cd back-admin
composer require altcha-org/altcha
```

Notas:

- ALTCHA requiere HTTPS para usar WebCrypto API en producción.
- El frontend consume el challenge en `/api/altcha/challenge` (proxy Vite lo redirige al backend en desarrollo).

### ALTCHA

Para usar ALTCHA en reemplazo de Google reCAPTCHA:

- Agrega a `.env`:
```
CAPTCHA_PROVIDER=altcha
ALTCHA_SECRET=tu_secret
ALTCHA_SITE_KEY=tu_site_key
```
- El frontend debe añadir `VITE_CAPTCHA_PROVIDER=altcha` y la URL del challenge `VITE_ALTCHA_CHALLENGE_URL=/altcha/challenge`.
- Asegúrate de instalar el paquete PHP `altcha-org/altcha` con `composer require altcha-org/altcha`.
- `App\\Support\\Captcha::verify` verificará las soluciones localmente con la librería ALTCHA.

## Módulo GraphQL (Auditoría y Configuración)

### Paquete y servidor
- Paquete: `rebing/graphql-laravel@^9.12` (composer.json:19).
- Ruta base: `/graphql` (config/graphql.php:5–23), controlador `Rebing\GraphQL\GraphQLController@query`, middleware de grupo `web` para cookies/sesión.
- Schemas:
  - `default`: protegido por `auth:web` (config/graphql.php:102–145), métodos `GET|POST`.
  - `public`: abierto con `throttle:60,1` (config/graphql.php:146–193), métodos `GET|POST`.
- Tipos globales: `PaginatorInfo`, `GalleryPaginator`, `UserPaginator` (config/graphql.php:199–210).

### Estructura de directorios
- `app/GraphQL/Queries`: consultas (`UsersQuery`, `UserQuery`, `GalleriesQuery`, etc.).
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
