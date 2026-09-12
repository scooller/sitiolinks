# Guía y Runbook de Paso a Producción - Link Persons (v0.17.1)

Documento operativo con todos los pasos, configuraciones críticas, verificaciones y contingencias para el despliegue a producción de **Link Persons / Only Models**.

---

## 1. Resumen de Cambios a Desplegar (Hasta v0.17.1)

El despliegue actual comprende una evolución integral de la plataforma:

1. **Frontend (SPA React 18 / Vite / Redux Toolkit)**:
   - Rediseño editorial completo bajo **Apple Human Interface Guidelines (HIG 2026)**.
   - Squircles continuos de 24px (`--rounded-2xl`), elevaciones y materiales Liquid Glass (`blur(24px) saturate(140%)`).
   - Botones táctiles 100% sólidos con áreas de contacto ≥ 44pt (48px en formularios). Cero botones tipo outline.
   - Sistema de precarga **Apple Skeleton Shimmer** réplica 1:1 con aceleración por hardware (CLS = 0).
   - Soporte multidioma completo (Español `es` e Inglés `en`) en todas las vistas públicas, páginas del sistema y formularios.
   - Modal de Advertencia (+18) con telón de desenfoque líquido inmediato (`z-index: 100000`) sin filtración de contenido previo a la aceptación.
   - Módulo de Soporte y Tickets (`/tickets`, `/tickets/nuevo`, `/tickets/:id`).
   - Módulo de Cafeterías temáticas y sugerencias con validación ALTCHA (`/cafes`, `/cafes/:slug`, `/sugerir-cafe`).
   - Directorio de Galerías y visor fotográfico LightGallery (`/u/:username/galleries`, `/galleries/:id`).
   - PWA con Service Worker activo y caché de assets estáticos (`dist/sw.js`).

2. **Backend (Laravel 12 / GraphQL / Filament 5)**:
   - **Blindaje de Privacidad de Emails**: Campos `email` y `email_verified_at` en `UserType` restringidos exclusivamente al dueño de la cuenta o staff (`super_admin`, `admin`, `moderator`). Bloquea scraping público en `/graphql/public`.
   - **Aislamiento de Tickets de Soporte**: Consultas `ticket` y `tickets` protegidas; usuarios normales solo ven sus propios casos.
   - **Prevención de Suplantación en Tickets**: `CreateTicketMutation` requiere sesión autenticada, valida propiedad del `user_id` e implementa rate limiting de 5 tickets/hora por usuario.
   - **Aislamiento de Notas Internas**: Comentarios y conteos con `is_internal = true` ocultos para usuarios comunes.
   - **Alineación de Esquemas GraphQL**: Sincronización de operaciones en esquema `default` (`auth:web`) y `public`.
   - **Contenido del Sistema**: `PageSeeder` actualizado con FAQs detalladas y estructuradas en español e inglés.
   - **Suite de Pruebas**: 24 tests feature automatizados aprobados (89 aserciones).

---

## 2. Requisitos Previos del Servidor

- **PHP**: 8.2 o superior (extensiones: `pdo_mysql`, `mbstring`, `openssl`, `fileinfo`, `gd` o `imagick`, `curl`, `xml`, `zip`).
- **Base de Datos**: MySQL 8.0+ o MariaDB 10.5+.
- **Node.js**: v20.x LTS o superior + npm en máquina de compilación.
- **Servidor Web**: Nginx o Apache 2.4 con módulos `mod_rewrite`, `mod_headers`, `mod_ssl`.
- **Certificados SSL**: HTTPS activo tanto en `only-models.online` como en `admin.only-models.online`.
- **Dominios / Subdominios**:
  - Frontend SPA: `https://only-models.online`
  - Backend API & Admin: `https://admin.only-models.online`

---

## 3. Variables de Entorno de Producción

### 3.1 Backend (`.env` en la raíz del backend)

Verificar y aplicar los valores basados en `.env.production`:

```dotenv
APP_NAME="Only Models"
APP_ENV=production
APP_KEY=base64:ae2IIhV3KCBZK6S17M8sHZ8CThhNVWLiz9/7pqYbW4k=
APP_DEBUG=false
APP_URL=https://admin.only-models.online

LOCALE=es
APP_FALLBACK_LOCALE=es
APP_FAKER_LOCALE=es_CL
APP_CURRENCY=CLP
APP_CURRENCY_FRACTION_DIGITS=0

# Base de Datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=u380848496_site
DB_USERNAME=u380848496_user
DB_PASSWORD="[TU_PASSWORD_SEGURO]"

# Sesión Cross-Subdomain (Crítico para SPA + Backend)
SESSION_DRIVER=file
SESSION_LIFETIME=43200
SESSION_ENCRYPT=false
SESSION_PATH=/
SESSION_DOMAIN=.only-models.online
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax
SESSION_COOKIE=link-persons-session

# CORS y Sanctum (Crítico)
FRONTEND_URL=https://only-models.online
CORS_ALLOWED_ORIGINS=https://only-models.online,https://admin.only-models.online
SANCTUM_STATEFUL_DOMAINS=only-models.online,admin.only-models.online

# Almacenamiento
FILESYSTEM_DISK=public
FILESYSTEM_PUBLIC_URL=https://admin.only-models.online
QUEUE_CONNECTION=sync
CACHE_STORE=file

# Correo (Hostinger SMTP)
MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com
MAIL_PORT=465
MAIL_USERNAME=contacto@only-models.online
MAIL_PASSWORD="[TU_PASSWORD_CORREO]"
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS="contacto@only-models.online"
MAIL_FROM_NAME="${APP_NAME}"

# Spam Protection (ALTCHA)
ALTCHA_ENABLED=true
ALTCHA_SECRET=92491a696ae6ad2dcde987583168c2d021dea562928f6a839644b62c112c566a

# Pusher Broadcasting
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=2080183
PUSHER_APP_KEY=f9904ce9537e05281fd6
PUSHER_APP_SECRET=2583ca3d2db22a43b7b6
PUSHER_APP_CLUSTER=us2
```

### 3.2 Frontend (`front-site/.env.production`)

```dotenv
VITE_BACKEND_URL=https://admin.only-models.online
VITE_ADMIN_URL=https://admin.only-models.online/admin
VITE_FRONTEND_URL=https://only-models.online
VITE_APP_CURRENCY=CLP
VITE_APP_CURRENCY_FRACTION_DIGITS=0
VITE_CAPTCHA_PROVIDER=altcha
VITE_PUSHER_APP_KEY=f9904ce9537e05281fd6
VITE_PUSHER_APP_CLUSTER=us2
```

---

## 4. Procedimiento de Despliegue Paso a Paso

### Paso 1: Respaldo Preventivo (Backup)
Antes de ejecutar cualquier cambio en el servidor de producción:
```bash
# 1. Respaldo de Base de Datos MySQL
mysqldump -u u380848496_user -p u380848496_site > backup_pre_v0171_$(date +%Y%m%d_%H%M%S).sql

# 2. Respaldo de archivos multimedia de usuarios
tar -czf storage_media_backup_$(date +%Y%m%d).tar.gz storage/app/public/
```

---

### Paso 2: Actualización y Preparación del Backend

En el servidor del backend (`/var/www/link-persons` o ruta de Hostinger/cPanel):

```bash
# 1. Obtener última versión del repositorio
git checkout main
git pull origin main

# 2. Instalar dependencias PHP de producción
composer install --no-dev --prefer-dist --optimize-autoloader

# 3. Ejecutar migraciones pendientes (si hubiera)
php artisan migrate --force

# 4. Actualizar contenido de páginas del sistema (FAQs actualizadas)
php artisan db:seed --class=PageSeeder --force

# 5. Asegurar enlace simbólico de almacenamiento público
php artisan storage:link

# 6. Permisos correctos de escritura
chmod -R 775 storage bootstrap/cache
# Si usas Nginx/Apache estándar (en VPS):
# chown -R www-data:www-data storage bootstrap/cache

# 7. Limpiar y optimizar cachés de Laravel para producción
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 8. Validar que la suite de pruebas del backend pasa al 100%
php artisan test
```

---

### Paso 3: Compilación y Despliegue del Frontend

En la carpeta `front-site/` (o en tu máquina de integración continua antes de subir):

```bash
cd front-site

# 1. Instalar dependencias exactas
npm ci

# 2. Compilar bundle de producción para Vite
npm run build
```

El comando generará la carpeta optimizada `front-site/dist/`.

#### Publicación de Archivos:
- Si el frontend y backend se sirven en carpetas separadas: Copiar **todo el contenido de `front-site/dist/`** al DocumentRoot del dominio `https://only-models.online`.
- Incluye:
  - `dist/index.html`
  - `dist/sw.js` y `dist/workbox-*.js`
  - `dist/manifest.webmanifest`
  - `dist/assets/*`
  - `dist/locales/*` (archivos `translation.json` en español e inglés).

---

### Paso 4: Configuración del Servidor Web para el Frontend (SPA Routing)

Para que rutas directas como `/tickets`, `/explorar`, `/cafes`, `/u/usuario` no arrojen error 404:

#### En Apache / Hostinger (`.htaccess` en la raíz de `only-models.online`):
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Encabezados de Caché
<IfModule mod_headers.c>
  # No cachear index.html ni el Service Worker para permitir actualizaciones inmediatas
  <FilesMatch "^(index\.html|sw\.js)$">
    Header set Cache-Control "no-cache, no-store, must-revalidate"
    Header set Pragma "no-cache"
    Header set Expires 0
  </FilesMatch>

  # Cachear assets versionados por 1 año
  <FilesMatch "\.(js|css|woff2|woff|ttf|png|svg|webp|gif)$">
    Header set Cache-Control "public, max-age=31536000, immutable"
  </FilesMatch>
</IfModule>
```

#### En Nginx (si aplica):
```nginx
location / {
    try_files $uri $uri/ /index.html;
}

location ~* ^/(index\.html|sw\.js)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
}

location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 5. Checklist de Verificación Post-Despliegue (Smoke Tests)

Ejecutar las siguientes validaciones manuales inmediatamente tras el despliegue:

- [ ] **1. Conexión SSL y CORS**:
  - Abrir `https://only-models.online` en pestaña privada.
  - Abrir DevTools (`F12`) -> Consola. No deben existir errores de tipo `CORS error` ni bloqueos de certificados mixtos (`Mixed Content`).
- [ ] **2. Modal de Advertencia (+18)**:
  - Verificar que el modal bloquee inmediatamente la vista sin parpadeos ni fugas de imágenes en el primer frame.
  - Al pulsar "Acepto", la pantalla debe desbloquearse suavemente.
- [ ] **3. Autenticación y Cookies Cross-Subdomain**:
  - Iniciar sesión en `https://only-models.online/login`.
  - Inspeccionar cookies: la cookie `link-persons-session` debe tener `domain: .only-models.online`, `Secure: true`, `SameSite: Lax`.
  - Verificar que la sesión persista al recargar la página (`F5`).
- [ ] **4. Seguridad y Privacidad en GraphQL**:
  - Abrir una pestaña en modo incógnito (sin sesión).
  - Enviar una consulta a `https://admin.only-models.online/graphql/public`:
    ```graphql
    query { users { data { username email } } }
    ```
  - **Verificar que el campo `email` retorne `null` para todos los usuarios** (protección activa contra scraping).
- [ ] **5. Módulo de Soporte / Tickets**:
  - Con un usuario verificado, ingresar a `https://only-models.online/tickets`.
  - Crear un ticket de prueba (`/tickets/nuevo`).
  - Responder en el detalle del caso (`/tickets/:id`).
  - Verificar que solo el dueño del ticket o admin puedan visualizar el contenido.
- [ ] **6. Directorio y Sugerencia de Cafés**:
  - Navegar a `/cafes` y comprobar la carga fluida de tarjetas sin layout shift.
  - Visitar `/sugerir-cafe` y comprobar que el widget de verificación ALTCHA cargue correctamente.
- [ ] **7. PWA y Service Worker**:
  - En DevTools -> Application -> Service Workers: verificar que `sw.js` esté en estado `Activated and is running`.
- [ ] **8. Idiomas (i18n)**:
  - Cambiar entre Español e Inglés desde el selector de idioma en la barra de navegación; verificar que botones, textos de cards y placeholders cambien correctamente.

---

## 6. Plan de Contingencia / Rollback

Si surge un error crítico durante la puesta en producción:

### Rollback Rápido de Frontend:
1. Restaurar la carpeta `dist/` previa en el servidor web.
2. Limpiar la caché de Cloudflare / CDN si aplica.

### Rollback de Base de Datos y Backend:
1. Revertir commits con git:
   ```bash
   git checkout [HASH_DEL_COMMIT_ANTERIOR]
   composer install --no-dev --optimize-autoloader
   php artisan optimize:clear
   php artisan config:cache
   php artisan route:cache
   ```
2. Si se alteró el esquema de base de datos incompatible:
   ```bash
   mysql -u u380848496_user -p u380848496_site < backup_pre_v0171_*.sql
   ```
3. Reiniciar PHP-FPM o el servidor web si es requerido.

---
**Versión del Runbook**: 1.0 (Link Persons v0.17.1)  
**Fecha de Publicación**: 2026-09-12
