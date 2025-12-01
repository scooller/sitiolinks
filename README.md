# Link Persons

Plataforma full‑stack para perfiles, galerías y descubrimiento de creadores con roles (creator/VIP/admin), API GraphQL y panel de administración con Filament.

## Índice
- [Visión General](#visión-general)
- [Tecnologías](#tecnologías)
- [Arranque Rápido](#arranque-rápido)
- [Características Clave](#características-clave)
- [Roadmap](#roadmap)
  - [Hecho (últimas versiones)](#hecho-v27x-recientes)
  - [En curso / Siguientes](#en-curso--siguientes)
  - [Backlog de deseados](#backlog-de-deseados)
- [Convenciones del Proyecto](#convenciones-del-proyecto)
- [Enlaces útiles](#enlaces-útiles)
- [Producción](#producción)
- [Changelog (detalle histórico)](#changelog-detalle-histórico)

---

## Visión General
- Backend Laravel 12 + GraphQL (rebing) + Sanctum (SPA).
- Frontend React 18 + TypeScript 5 + Vite + Bootstrap 5.
- Media con Spatie Media Library (watermark, thumbnails) y panel Filament v4.
- Roles y límites por rol (cuotas, tamaños, visibilidad, destacados VIP).

## Tecnologías
- Backend: Laravel 12.38.1, Filament v4, rebing/graphql-laravel, Sanctum, Spatie Media Library, Spatie Permission, MySQL.
- Frontend: React 18, TypeScript 5, Vite 5, React Bootstrap, FilePond, lightGallery 2.9, Motion (framer-motion), i18next + react-i18next.
- Optimización: WebP images, GraphQL cache con invalidación automática, Service Worker, lazy loading, database indexes.

## Arranque Rápido

### Backend
```bash
cd back-admin
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan storage:link
php artisan optimize:clear
php artisan serve
```

### Frontend
```bash
cd front-site
npm install
cp .env.example .env  # Configurar VITE_BACKEND_URL si es necesario
npm run dev
npx tsc --noEmit  # Chequeo de tipos recomendado
```

**Nota:** El frontend usa `VITE_BACKEND_URL` para conectarse al backend. Por defecto es `http://127.0.0.1:8000`.

## Características Clave
- Galerías de imágenes con visibilidad (público/privado/seguidores) y moderación.
- Límites y tamaños por rol; validación de cuota en upload y en mutaciones.
- Perfiles con tags (color + icono) y links personalizados.
- Seguimiento (follow), tickets de soporte, páginas CMS básicas.
- VIP: galerías destacadas, prioridad (pendiente), y badges en UI.
- Optimización completa: WebP images (~25-35% reducción de ancho de banda), GraphQL cache, Service Worker, lazy loading.

## Roadmap

### Hecho (v2.7.x recientes)
- [x] v2.7.30 (Actual) ✅
  - **Tags bilingües (ES/EN) — sin cambiar slug:**
    - Backend:
      - Nueva columna `name_en` en `tags` (nullable) con migración.
      - `Tag` actualiza `fillable` para incluir `name_en`.
      - GraphQL `Tag` expone `name_en` en ambos esquemas (`default`, `public`).
    - Frontend:
      - Tipo `Tag` ahora incluye `name_en`.
      - Queries actualizadas: `tags`, `users` (tags embedded) y `following`.
      - Inline queries actualizadas: `PopularTags.tsx`, `EditProfile.tsx`, `UserProfile.tsx`.
      - Componentes muestran nombre según idioma:
        - `UsersGrid.tsx` badges → `name_en` si `i18n.language === 'en'`, fallback `name`.
        - `PopularTags.tsx` badges visibles bilingües; link usa slug derivado de `name` (ES).
        - `Explore.tsx` selector de tag muestra label bilingüe, `value` mantiene `id`.
        - `UserProfile.tsx` filtro “Siguiendo” muestra label bilingüe; el filtro sigue enviando `name`.
        - `EditProfile.tsx` chips/botones de tags muestran label bilingüe; búsqueda considera `name_en`.
        - `Ranking.tsx` muestra tags con label bilingüe.
    - Importante:
      - El `slug` y los filtros por nombre en backend permanecen basados en `name` (ES).
      - Si falta `name_en`, se usa `name` como fallback.
  - **Verificación de build:** `npm run build` exitoso; assets actualizados (`Ranking`, `UsersGrid`, `PopularTags`, `Explore`, `UserProfile`, `EditProfile`).
- [x] v2.7.29 (Actual) ✅
  - **Limpieza global de logs de consola (Frontend):**
    - Se eliminaron llamadas `console.*` en páginas clave: `Home.tsx`, `Explore.tsx`, `Tag.tsx`, `Notifications.tsx`, `GalleryDetail.tsx`, `MyGalleries.tsx`, `NewGallery.tsx`, `UserGalleries.tsx`, `EditProfile.tsx`, `EditGallery.tsx`, `UserProfile.tsx`.
    - Componentes: `Navigation.tsx`, `LikeButton.tsx`, `FeaturedGalleries.tsx`, `PopularTags.tsx`, `WarningModal.tsx`, `ErrorBoundary.tsx`, `InstallPWA.tsx`.
    - Hooks: `useSiteSettings.ts`, `useFetchData.ts`, `useErrorHandler.ts`.
  - **Verificación de build:**
    - `npm run build` exitoso (Vite 5.4.21), assets generados en `dist/` con PWA (`generateSW`).
  - **Impacto:**
    - Salida limpia en producción, menor ruido en clientes y en herramientas de monitoreo.
    - Tamaño de bundle ligeramente reducido por ausencia de trazas.
  - **Nota técnica:**
    - Para depuración local, usar guardas `if (import.meta.env.DEV) { ... }` o un utilitario centralizado de logging.
- [x] v2.7.28 (Actual) ✅
  - **Localización completa de páginas restantes (Frontend):**
    - ✅ Notificaciones (`front-site/src/pages/Notifications.tsx`): títulos, filtros, contadores y estados vacíos traducidos; fecha formateada usando `i18n.language`.
    - ✅ Offline (`front-site/src/pages/Offline.tsx`): título, descripción, botón de reintento y mensaje informativo traducidos.
    - ✅ Página genérica (`front-site/src/pages/Page.tsx`): mensajes de error y fallback de contenido traducidos.
    - ✅ Detalle de galería (`front-site/src/pages/GalleryDetail.tsx`): mensaje de galería sin imágenes traducido; badges de visibilidad usan claves de i18n.
  - **Traducciones añadidas:**
    - `notifications.title`, `notifications.loading`, `notifications.mark_all_read`, `notifications.filter_all`, `notifications.filter_unread`, `notifications.unread_count`, `notifications.empty_unread`, `notifications.empty_all`, `entities.notifications`.
    - `offline.title`, `offline.description`, `offline.retry`, `offline.recent_available`.
    - `galleries.no_images`.
  - **Calidad y TypeScript:**
    - `tsconfig.json`: añadido `types: ["vite/client", "jest"]` para reconocimiento de pruebas.
    - Instalado `@types/jest`; `src/App.test.tsx` importa `@testing-library/jest-dom`.
    - Corrección de tipos en `lib/echo.ts` usando `Echo<any>` y eliminación de parámetros no usados.
    - Limpieza de variable no usada en `components/UsersGrid.tsx`.
    - Corrección de actualización local tras eliminar galería en `pages/MyGalleries.tsx`.
  - **Verificación:**
    - `npm run build` exitoso (Vite 5).
    - `npx tsc --noEmit` sin errores.
  - **Home y Páginas (i18n + GraphQL):**
    - Home usa slug por idioma: `en → home`, `es → inicio`; si falla el primario alterna al otro idioma.
    - Resolver GraphQL `page(slug)` ahora devuelve `null` cuando no existe en vez de lanzar excepción (evita 500 en público).
    - Se removieron logs de consola en `Home.tsx` y `Page.tsx`; el build ya aplica `drop_console` via Terser.
- [x] v2.7.27 ✅
  - **Multilenguaje en Frontend (i18next):**
    - ✅ Inicialización en `front-site/src/i18n.ts` con `react-i18next`, `i18next-browser-languagedetector` y `i18next-http-backend`.
    - ✅ Idioma por defecto `es` y detección vía `localStorage` y `navigator`.
    - ✅ Carga de traducciones desde `/public/locales/{lng}/translation.json` (ej. `es`, `en`).
    - ✅ Conmutador de idioma en la navegación `LanguageSwitcher` (`front-site/src/components/LanguageSwitcher.tsx`), integrado en `Navigation.tsx`.
    - ✅ Import global en el arranque (`front-site/src/index.tsx:5`).
    - Uso en componentes: `const { t } = useTranslation();` → `t('nav.home')`, `t('profile.follow')`, etc.
    - Añadir nuevo idioma: crear `public/locales/<code>/translation.json` y opcionalmente agregar opción en `LanguageSwitcher`.
    - Nota: multilenguaje solo en Frontend; el Backend mantiene textos en español.

- [x] v2.7.26 ✅
  - **Búsqueda por Tag corregida (slug + case-insensitive):**
    - ✅ Slugs en frontend: `/t/real-verificada` en lugar de `%20` (`front-site/src/components/UsersGrid.tsx:118`).
    - ✅ Decodificación de slug a nombre con espacios en la página (`front-site/src/pages/Tag.tsx:16`).
    - ✅ Backend filtra por nombre de tag en minúsculas exactas (`back-admin/app/GraphQL/Queries/UsersQuery.php:177`).
    - ✅ Query `users` ahora acepta la variable `$tag` (`front-site/src/lib/graphql/queries.ts:86`).
    - ✅ Listados públicos muestran SOLO creadores (`back-admin/app/GraphQL/Queries/UsersQuery.php:106`).
  - **Bloqueo por País robusto (perfil y listados):**
    - ✅ Fallback por IP si no vienen headers de país (`CF-IPCountry`/`X-Country-Code`) con cache 12h (`back-admin/app/GraphQL/Queries/UserQuery.php:71`, `UsersQuery.php:88`).
    - ✅ Dueño, admin y moderador ven el perfil aunque coincida país bloqueado (`back-admin/app/GraphQL/Queries/UserQuery.php:74`).
    - ✅ Endpoint de inspección de headers (auth requerido): `/debug/headers` (`back-admin/routes/web.php:55`).
  - **UI Frontend:**
    - ✅ Animación de hover en enlaces del perfil (`front-site/src/index.css:89`, `front-site/src/pages/UserProfile.tsx:839`).
    - ✅ Precio sin decimales en grid y perfil (`front-site/src/components/UsersGrid.tsx:29`, `front-site/src/pages/UserProfile.tsx:362`).

- [x] v2.7.25 ✅
  - **Tema Bootstrap dinámico (Front):**
    - ✅ Inyección de variables `--bs-*` y estados de botones `.btn-*`, `.btn-outline-*`, `.btn-link` basados en colores del admin.
    - ✅ Hover/active calculados automáticamente oscureciendo el color base y ajuste de contraste del texto.
    - Archivos: `front-site/src/App.tsx` (función `applyThemeColors`)
    - Referencias: `front-site/src/App.tsx:236`, `front-site/src/App.tsx:209`, `front-site/src/App.tsx:252`.
  - **Colores en GraphQL (Back):**
    - ✅ Tipo `SiteSettings` expone campos `primary_color`, `secondary_color`, `success_color`, `danger_color`, `warning_color`, `info_color`, `light_color`, `dark_color`.
    - Archivos: `back-admin/app/GraphQL/Types/SiteSettingsType.php`.
    - Referencias: `back-admin/app/GraphQL/Types/SiteSettingsType.php:163`, `back-admin/app/GraphQL/Types/SiteSettingsType.php:169`, `back-admin/app/GraphQL/Types/SiteSettingsType.php:175`.
    - Nota de despliegue: tras actualizar, limpiar cachés (`php artisan optimize:clear`, `config:clear`, `cache:clear`, reiniciar opcache) para evitar errores “Cannot query field …”.
  - **Botón “Ver Sitio” en Admin (Back):**
    - ✅ Se añade botón en la barra superior del panel, antes del buscador global.
    - Hook: `GLOBAL_SEARCH_BEFORE`.
    - URL leída desde `FRONTEND_URL` en `.env` (fallback `/`).
    - Archivo: `back-admin/app/Providers/Filament/AdminPanelProvider.php`.
    - Referencia: `back-admin/app/Providers/Filament/AdminPanelProvider.php:49`.
- [x] v2.7.24 ✅
  - **Sistema de Likes en Galerías:**
    - **Backend:**
      - ✅ Tabla `likes` con constraint `unique(user_id, gallery_id)`
      - ✅ Modelo `Like` con relaciones a `User` y `Gallery`
      - ✅ Relaciones `hasMany(Like::class)` en modelos `User` y `Gallery`
      - ✅ Campo `likes_count` en tabla `galleries` para cachear el contador
      - ✅ `ToggleLikeMutation` para dar/quitar likes de forma atómica
      - ✅ `GalleryType` expone `likes_count` y `liked_by_user` (booleano)
      - ✅ `GalleriesQuery` actualizada con `withCount('likes')` y ordenación por `most_liked` y `recent_likes`
    - **Frontend:**
      - ✅ Componente `LikeButton.tsx` reutilizable con UI optimista y tooltips
      - ✅ Integrado en `UserGalleries.tsx` (tarjetas) y `GalleryDetail.tsx` (detalle)
      - ✅ Queries de GraphQL refactorizadas en `queries.ts`, `mutations.ts` y `fragments.ts`
    - **Admin Panel:**
      - ✅ Widget `EngagementStatsWidget` actualizado con "Total de Likes" y "Galería con Más Likes"

- [x] v2.7.23 ✅
  - **Sistema Completo de Analytics y Reportes:**
    - **10 Widgets de Dashboard Configurables:**
      - ✅ `StatsOverviewWidget`: Métricas generales (usuarios, creadores, galerías, medios) + chart crecimiento usuarios
      - ✅ `EngagementStatsWidget`: Follows, vistas perfil, galerías activas, usuario más activo + chart follows
      - ✅ `QuotaUsageWidget`: Uso cuotas por rol (creator/VIP) con indicadores de color y galerías al límite
      - ✅ `GrowthChartWidget`: Gráfica línea de crecimiento usuarios y galerías (últimos 12 meses)
      - ✅ `OverviewStats`: Estadísticas generales del sistema
      - ✅ `GalleryStatsWidget`: Estadísticas detalladas de galerías
      - ✅ `UserActivityWidget`: Actividad de usuarios
      - ✅ `TicketsOverview`: Resumen tickets de soporte
      - ✅ `RecentNotificationsWidget`: Notificaciones recientes
      - ✅ `PopularGalleriesWidget`: Galerías más populares
    - **Sistema de Configuración de Widgets:**
      - ✅ AnalyticsResource con formulario de configuración (patrón Resource + EditRecord singleton)
      - ✅ Tab "Configurar Dashboard": 10 widgets con toggle enabled/disabled y campo order (1-10)
      - ✅ Widgets con método `canView()`: verifican `dashboard_widgets[key]['enabled']` en SiteSettings
      - ✅ Widgets con método `getSort()`: orden dinámico desde `dashboard_widgets[key]['order']`
      - ✅ Auto-inicialización: `mount()` crea valores default si no existen
      - ✅ Type-safe: `mutateFormDataBeforeSave()` fuerza casting boolean/integer
      - ✅ AdminPanelProvider simplificado: widgets se autodescubren con `discoverWidgets()`
    - **Página de Reportes Completa (ViewReports):**
      - ✅ Tabla de usuarios con métricas detalladas (ID, Name, Username, Email, Role, Galerías, Vistas)
      - ✅ Columnas calculadas: Total Galerías, Galerías Aprobadas, Galerías Pendientes
      - ✅ Filtros avanzados: Rol (multi-select), Rango fechas, Email verificado, Con galerías, Pendientes
      - ✅ 4 Cards de estadísticas horizontales: Total Usuarios, Galerías Aprobadas, Pendientes, Nuevos (7 días)
      - ✅ Grid layout CSS: `display:grid; grid-template-columns:repeat(4,1fr)` para cards
      - ✅ Exportación CSV: Botón "Exportar a Excel" con UTF-8 BOM y delimitador punto y coma
    - **Implementación Técnica:**
      - ✅ Patrón singleton: SiteSettings con campo JSON `dashboard_widgets`
      - ✅ Estructura JSON: `dashboard_widgets['widget_key'] = ['enabled' => bool, 'order' => int]`
      - ✅ Filament native approach: canView() en cada widget, NO filtrado en AdminPanelProvider
      - ✅ Tab "Reportes": Placeholder informativo apuntando a botón "Ver Reportes"
    - **Archivos creados/modificados:**
      - Nuevos: AnalyticsResource.php, ManageAnalytics.php, ViewReports.php, AnalyticsForm.php, view-reports.blade.php
      - Actualizados: 10 widgets con canView()/getSort(), AdminPanelProvider.php simplificado
    - **Ubicación:**
      - Menú: "Analytics" en grupo "Configuración"
      - Dashboard: Solo widgets habilitados se muestran en orden configurado
      - Rutas: `/admin/analytics` (config), `/admin/analytics/reports` (reportes)
  
- [x] v2.7.22
  - **Modal de Advertencia Avanzado:**
    - **Botón Cancelar/Redirigir:**
      - ✅ Nueva opción para agregar un botón secundario de "Cancelar" o "Salir"
      - ✅ Configurable: Texto, Icono, Estilo (Variant) y URL de redirección
      - ✅ Útil para advertencias de contenido sensible (+18) donde el usuario puede optar por salir
    - **Control de Cierre:**
      - ✅ Opción para ocultar el botón de cierre (X) en la cabecera
      - ✅ Modal se vuelve "bloqueante" (backdrop static) obligando a elegir una acción
    - **Backend & API:**
      - ✅ Migración de base de datos con nuevos campos en `site_settings`
      - ✅ Formulario Filament actualizado con toggles y campos condicionales
      - ✅ GraphQL Type y Query actualizados para exponer nueva configuración
    - **Frontend:**
      - ✅ Lógica actualizada en `WarningModal.tsx` para manejar redirección
      - ✅ CSS ajustado: `modal-backdrop` opacity 0.97 para mayor énfasis visual
  - **Mejoras Generales:**
    - 🧹 Limpieza de logs de depuración en `UserProfile.tsx`
    - 🔒 Opción de "Personalizar Tarjeta" en `EditProfile` restringida solo a creadores

- [x] v2.7.21
  - **Configuración Dinámica del Backend y Mejoras de Producción:**
    - **Centralización de URLs del Backend:**
      - ✅ Variable `BACKEND_URL` en `vite.config.ts` para proxy (dev/preview)
      - ✅ Variable de entorno `VITE_BACKEND_URL` para código frontend
      - ✅ Archivo `src/config/constants.ts` para importar en componentes
      - ✅ Eliminadas URLs hardcodeadas en VerifyEmail.tsx y Navigation.tsx
    - **Configuración Dinámica desde Backend:**
      - ✅ Título del sitio cargado desde `siteSettings.site_name`
      - ✅ Meta descripción desde `siteSettings.site_description`
      - ✅ Favicon dinámico desde `siteSettings.site_logo`
      - ✅ Google Analytics configurado dinámicamente
    - **Mejoras de Preview:**
      - ✅ Proxy configurado en `preview` para GraphQL, storage, API y Sanctum
      - ✅ Soporta `npm run preview` con backend activo
    - **Impacto:**
      - ✅ Transición a producción simplificada (solo cambiar 1 variable)
      - ✅ SEO dinámico según configuración del backend
      - ✅ Favicon y branding personalizables desde admin

- [x] v2.7.20
  - **Consolidación Completa de Componentes de Imagen:**
    - **Migración Total a OptimizedImage:**
      - ✅ Actualizadas TODAS las importaciones de `GalleryImage` a `OptimizedImage` directo
      - ✅ Archivos corregidos: UserGalleries, MyGalleries, EditGallery, FeaturedGalleries, GalleryDetail
      - ✅ Eliminado uso del wrapper GalleryImage (mantenido solo re-export por compatibilidad)
    - **Correcciones de Runtime:**
      - 🐛 Solucionado error "OptimizedImage is not defined" causado por re-export pattern
      - 🐛 Importaciones directas evitan problemas de resolución de módulos en Vite/React
    - **Impacto:**
      - ✅ Build exitoso: 6.32s, bundle 168.30 kB (49.96 kB gzip)
      - ✅ Sin errores de runtime en componentes de galería
      - ✅ Consistencia total en uso de OptimizedImage en toda la app

- [x] v2.7.19
  - **Consolidación y Optimización del Código Frontend:**
    - **Hooks Consolidados:**
      - `useSiteSettings()`: Hook centralizado para cargar y cachear configuración del sitio
      - `useFetchData<T>()`: Hook genérico para manejar fetching con loading, error y retry
      - Cache en memoria para evitar recargas innecesarias de settings
    - **Queries GraphQL Centralizadas:**
      - `queries.users`: Query paginada consolidada con todos los filtros
      - `queries.tags`: Query de tags reutilizable
      - `queries.siteSettings`: Campos completos incluyendo VIP y QR settings
      - Eliminadas ~15 queries inline duplicadas en páginas
    - **Componentes Limpiados:**
      - ❌ Eliminado `ResponsiveImage.tsx` (no usado, enfoque incompatible)
      - ❌ Eliminado `ImageUploader.tsx` (wrapper no usado)
      - ❌ Eliminado `VideoUploader.tsx` (wrapper no usado)  
      - ❌ Eliminado `FileUploader.tsx` (componente genérico no usado)
      - ✅ `GalleryImage.tsx` simplificado a re-export de OptimizedImage
    - **Páginas Refactorizadas:**
      - `Home.tsx`: Usa `useSiteSettings()`, reducción de 45 líneas
      - `Explore.tsx`: Usa `useSiteSettings()` + `queries.users`, reducción de 80 líneas
      - `Tag.tsx`: Usa `useSiteSettings()` + `queries.users`, reducción de 75 líneas
      - Consistencia en manejo de loading states y configuración
    - **Correcciones de Bugs:**
      - 🐛 Corregido parámetro GraphQL `tag_id` → `tagId` en query de usuarios
      - 🐛 Agregado campo `hasMorePages` faltante en UsersQuery del backend
    - **Impacto:**
      - ✅ ~200 líneas de código duplicado eliminadas
      - ✅ 4 archivos innecesarios removidos
      - ✅ Mejor mantenibilidad y consistencia
      - ✅ Cache de settings reduce llamadas GraphQL redundantes
      - ✅ Build exitoso sin errores (5.40s)

- [x] v2.7.18
  - **Optimización Avanzada de Imágenes - Responsive Images con srcset:**
    - **Calidad WebP Optimizada:**
      - Reducción de calidad WebP: 85-90% → 75-80%
      - Lighthouse recomienda 75-85% para balance perfecto tamaño/calidad
      - Aplicado a thumbnails (75%), avatars completos (80%), gallery (75%)
      - Reducción adicional de ~15-20% en tamaño de archivos
      - Sin pérdida visual perceptible
    - **Tamaños Responsive Múltiples:**
      - Avatar pequeño: 120x120 WebP (móviles)
      - Avatar mediano: 240x240 WebP (tablets)
      - Avatar completo: 500x500 WebP (desktop)
      - Thumbnail: 200x200 WebP (grids)
    - **srcset con Sizes Optimizados:**
      - `srcset="120w, 240w, 500w"` en todas las imágenes de avatar
      - `sizes="(max-width: 576px) 120px, (max-width: 992px) 240px, 500px"`
      - Navegador elige tamaño óptimo según viewport
      - Móviles cargan ~70-80% menos datos (120px vs 500px)
    - **Atributos width/height:**
      - Agregados a todas las imágenes para prevenir CLS
      - Lighthouse premia la estabilidad visual (layout shift)
    - **GraphQL Actualizado:**
      - Nuevos campos: `avatar_small_webp`, `avatar_medium_webp`
      - Queries actualizadas: `userByUsername`, `usersByTag`, `following`
      - TypeScript interfaces con nuevos campos opcionales
    - **Backend Regeneración:**
      - `php artisan media-library:regenerate --force` ejecutado
      - 36 media files regenerados con nuevas conversiones
      - Todas las imágenes existentes optimizadas
    - **Componentes Actualizados:**
      - AvatarPicture: Soporte srcset con buildSrcSet() helper
      - UserProfile, UserGalleries, GalleryDetail, UsersGrid, Ranking
      - Props smallWebpUrl y mediumWebpUrl agregados
      - Ranking.tsx: Migrado de `<img>` a AvatarPicture con priority para TOP 3
    - **Impacto Esperado en Lighthouse:**
      - LCP: Mejora significativa en móviles (imágenes más pequeñas)
      - Bandwidth: ~40-50% menos datos en móviles
      - Score: Proyectado de 50 → 65-70
      - CLS: Mejora por width/height explícitos
- [x] v2.7.17
  - **Optimizaciones de Rendimiento Lighthouse:**
    - **Code Splitting Agresivo:**
      - Todos los componentes lazy-loaded incluyendo Home
      - Manual chunks: react-vendor (161KB), bootstrap (97KB), motion (57KB), lightgallery (47KB)
      - Bundle inicial reducido significativamente
    - **Minificación Terser:**
      - drop_console y drop_debugger habilitados
      - CSS code splitting
      - Sourcemaps deshabilitados en producción
    - **Critical CSS Inline:**
      - Loading spinner crítico en `<head>`
      - Reduce bloqueo de render
    - **Font Loading Optimizado:**
      - Font Awesome con async loading (onload)
      - Preload de webfonts críticas (woff2)
      - DNS prefetch para CDNs
    - **Image Optimization:**
      - fetchPriority="high" para imágenes LCP
      - loading="lazy" para imágenes below-fold
      - Soporte priority prop en AvatarPicture
    - **Service Worker Mejorado:**
      - StaleWhileRevalidate para fuentes y CDN
      - CacheFirst para webfonts (1 año) e imágenes (30 días)
      - NetworkFirst para GraphQL (3min timeout 5s)
      - Cache separado por tipo de recurso
      - 200 imágenes en cache
    - **Preconnect Estratégico:**
      - Google Tag Manager
      - CloudFlare CDN
      - Fuentes externas
    - **Resultados Lighthouse:**
      - Rendimiento: 41 → 50+ (mejora continua)
      - FCP: 5.8s → 2.4s (59% más rápido)
      - LCP: 13.7s → 7.4s (46% más rápido)
      - Speed Index: 8.1s → 6.2s (23% más rápido)
      - TBT: 40ms → 70ms (aceptable)
- [x] v2.7.16
  - **PWA Completo - Progressive Web App:**
    - **Manifest Mejorado:**
      - Configuración completa con nombre, descripción, iconos adaptables
      - Shortcuts de app: Explorar, Mi Perfil, Mis Galerías
      - Orientación portrait-primary, categorías social/entertainment
      - Soporte para iconos maskable (Android adaptive icons)
      - Theme color dinámico (#0d6efd)
    - **Service Worker con Workbox:**
      - Plugin vite-plugin-pwa integrado con auto-update
      - Estrategias de cache diferenciadas:
        - CacheFirst: Fuentes, CDN, media (storage) - cache prolongado
        - NetworkFirst: GraphQL (5min), Analytics - prioridad red con fallback
      - Cache de Google Fonts (1 año), CDN CloudFlare (30 días), media (7 días)
      - Cleanup automático de caches obsoletos
      - Skip waiting y clients claim para actualizaciones inmediatas
    - **Instalabilidad:**
      - Componente InstallPWA: Toast con prompt de instalación
      - Detección de beforeinstallprompt event
      - Persistencia de dismissal en localStorage
      - Prompt automático después de 10 segundos
      - Detección si ya está instalada (display-mode: standalone)
    - **Modo Offline:**
      - Hook useOnlineStatus para detectar conexión
      - Componente OfflineIndicator: Banner animado en top
      - Página Offline.tsx dedicada con retry y navegación
      - Indicador visual con Motion (animaciones suaves)
    - **Mejoras de Meta Tags:**
      - Apple mobile web app capable y status bar style
      - Viewport optimizado para PWA
      - Lang español, keywords SEO
      - Theme color y apple-touch-icon
    - **Integración Completa:**
      - Componentes en App.tsx: OfflineIndicator, InstallPWA
      - Service Worker deshabilitado en dev (evita conflictos con proxy)
      - Build optimizado para producción con precaching
- [x] v2.7.15
  - **Modo Oscuro/Claro con Persistencia:**
    - Componente ThemeSwitcher: Toggle flotante con iconos sol/luna
    - Persistencia en localStorage (key: 'theme')
    - Detección automática de preferencia del sistema (`prefers-color-scheme: dark`)
    - Uso de atributo `data-bs-theme` de Bootstrap 5 (soporte nativo)
    - Botón flotante posicionado bottom-right con sombra y transiciones
    - Cambio instantáneo sin recargar página
    - Estados: 'light' y 'dark' con toggle entre ambos
    - Accesibilidad: aria-label y title descriptivos
    - Integrado en App.tsx (disponible en todas las páginas)
- [x] v2.7.14
  - **Integración de Google Analytics:**
    - Backend: Migración con campo `google_analytics_id` en tabla `site_settings`
    - Model SiteSettings: Campo agregado a `$fillable`
    - GraphQL: Campo `google_analytics_id` expuesto en SiteSettingsType
    - Filament: TextInput en tab "General" > sección "Integraciones" con validación y helper text
    - Frontend: Query `siteSettings` actualizada para incluir `google_analytics_id`
    - App.tsx: Inyección automática de scripts Google Analytics (gtag.js) si está configurado
    - Soporte para GA4 (formato `G-XXXXXXXXXX`) y Universal Analytics (formato `UA-XXXXXXXXX`)
    - TypeScript: Interface `SiteSettings` actualizada con campo opcional
    - Scripts se cargan dinámicamente en `<head>` al iniciar la aplicación
    - Configuración centralizada en panel admin: `/admin/site-settings` > tab General
- [x] v2.7.13
  - **Sistema de Verificación de Usuarios:**
    - Backend: Migración con campos `is_verified` (boolean default false) y `verified_at` (timestamp nullable)
    - Model User: Campos agregados a `$fillable` con casts apropiados (boolean, datetime)
    - GraphQL: Campos `is_verified` y `verified_at` (ISO8601) expuestos en UserType
    - Filament: Toggle para marcar usuarios como verificados con auto-asignación de fecha
    - Filament Table: IconColumn con badge check-badge/x-circle (verde verificado, gris no verificado)
    - Frontend: Componente `VerifiedBadge` con icono Font Awesome, badge azul circular, tooltip Bootstrap
    - Badge visible en: UserProfile (junto al username), UsersGrid (cards de usuarios), Explore (grid), Following modal, Ranking
    - Queries GraphQL actualizadas: `userByUsername`, `following`, users en Explore y Ranking incluyen `is_verified`
    - TypeScript: Interface `User` actualizada con `is_verified?: boolean` y `verified_at?: string`
    - Diseño: Badge azul (#0d6efd) diferenciado del VIP (dorado), tooltip "Usuario verificado"
- [x] v2.7.12
  - **Modal de Siguiendo con Paginación y Filtros:**
    - Modal "Siguiendo" clickeable en perfil propio (no en perfiles de otros usuarios)
    - Backend: `FollowingQuery` actualizado a estructura paginada con búsqueda y filtro por tag
    - Query retorna `UserPaginator` con `data` y `paginatorInfo` (estructura manual desde paginate())
    - Frontend: Paginación completa (20 usuarios por página, máx 50 configurable)
    - Buscador por username o descripción con botón "X" para limpiar
    - Filtro de tags en dropdown (ordenados por peso)
    - Layout responsive: 8 columnas búsqueda, 4 columnas filtro tag
    - Contador de resultados: "Mostrando X - Y de Z"
    - Paginador con First, Prev, Next, Last (muestra 5 páginas centradas)
    - Estados disabled durante carga para evitar clicks múltiples
    - Click en usuario cierra modal y navega a su perfil
    - Badges VIP, avatares WebP, tags visuales (máx 3 por usuario)
    - Filtros combinables: búsqueda + tag simultáneos
    - Reseteo completo al cerrar modal
  - **Correcciones Técnicas:**
    - FollowingQuery: Retorno manual de array con items() y paginatorInfo
    - Select corregido a `['users.*']` para relaciones many-to-many
    - Búsqueda con prefijo `users.username` y `users.description`
    - whereHas('tags') para filtro de tags
    - Fallback en título modal: followingTotal || user.following_count
- [x] v2.7.11
  - **Optimización de Imágenes con WebP:**
    - Backend: 4 tipos de conversiones en `User` model (thumb 200x200, thumb_webp, avatar 500x500, avatar_webp)
    - Spatie Media Library configurado con calidad 85-90% para WebP
    - GraphQL: Campos `avatar_thumb_webp`, `avatar_webp` en UserType; `thumb_webp_url` en GalleryMediaItemType
    - Frontend: Componentes `AvatarPicture` y `GalleryImage` con elemento `<picture>` para soporte WebP + fallback
    - Skeleton loaders integrados en AvatarPicture con estado de carga
    - MediaController corregido: detección correcta de MIME type `image/webp`
    - TypeScript: tipos actualizados con campos WebP
    - Implementado en 10+ páginas: Home, Explore, Tag, UserProfile, UserGalleries, GalleryDetail, MyGalleries, FeaturedGalleries, UsersGrid
    - Reducción de ancho de banda ~25-35% con calidad visual equivalente
    - Comando regeneración: `php artisan media-library:regenerate` (36 usuarios procesados)
  - **Optimización de Base de Datos:**
    - Índices de rendimiento: `users(username)`, `users(email)`, `galleries(user_id, status)`, `galleries(is_featured)`, `media(model_id, collection_name)`, `notifications(notifiable_type, notifiable_id, read_at)`
    - Índices en tablas pivot: `gallery_tag(gallery_id, tag_id)`, `follows(follower_id, following_id)`, `user_tag(user_id, tag_id)`, `likes(user_id, gallery_id)`
    - GalleriesQuery refactorizado: filtrado SQL directo (sin in-memory filtering) para paginación eficiente
    - Servicio GraphQLCache con invalidación selectiva vía Observers (UserObserver, GalleryObserver)
    - Cache automático con tracking de keys para limpieza quirúrgica
  - **Optimización de Frontend:**
    - Lazy loading completo: todas las rutas con React.lazy + Suspense (code splitting)
    - Testing deps movidas a devDependencies (package.json cleanup)
    - Service Worker implementado para caching de assets estáticos e imágenes
    - Exclusiones en SW para desarrollo: node_modules, .tsx/.ts, /src/, /@vite, /__vite
    - Componente NotFound lazy-loaded para reducir bundle inicial
  - **Mejoras UI/UX:**
    - Animaciones en UserGalleries: stagger effect (0.1s delay), hover scale (1.02), lift effect (y: -8)
    - Motion animations: opacity 0→1, y: 20→0, scale: 0.95→1 con delays por índice
    - Efecto blur en thumbnails de galerías restaurado: `blur(5px)` con hover removal
    - Skeleton loaders con Bootstrap Placeholder animation
    - Avatar de perfil en 500x500 (alta calidad) usando avatar_webp
  - **Correcciones Críticas:**
    - Service Worker: ya no bloquea módulos de Vite en desarrollo (NS_ERROR_CORRUPTED_CONTENT resuelto)
    - UserGalleries.tsx: corregido error de sintaxis JSX (`<>` → `</>`)
    - MediaController: MIME type correcto para archivos WebP
    - Handlers onLoad movidos a componentes correctos (GalleryImage en vez de divs wrapper)
    - Estilos rounded preservados en AvatarPicture tras refactor

**Actualización requerida:**
```bash
cd back-admin
php artisan migrate  # Ejecutar nuevas migraciones de índices
php artisan optimize:clear
php artisan media-library:regenerate  # Regenerar conversiones WebP para usuarios existentes

cd ../front-site
npm install  # Actualizar dependencias (motion, etc.)
npm run build  # Reconstruir bundle con lazy loading
```

**Notas de producción:**
- Service Worker: Solo funciona en HTTPS (producción). En desarrollo, los módulos Vite están excluidos.
- WebP: Navegadores antiguos usan fallback automático a JPEG/PNG gracias al elemento `<picture>`.
- Cache GraphQL: Se invalida automáticamente vía Observers, no requiere flush manual.
- Regeneración de medios: Procesa todos los usuarios existentes (puede tomar tiempo según cantidad).
- Bundle size: Reducción esperada ~20-30% gracias a code splitting con lazy loading.

**Troubleshooting:**
- Si Service Worker causa problemas en dev: limpia cache del navegador y hard refresh (Ctrl+Shift+R).
- Si no ves imágenes WebP: verifica que MediaController esté actualizado y que existan las conversiones.
- Si falla regeneración de medios: ejecuta `php artisan media-library:regenerate --ids=1,2,3` para usuarios específicos.

- [x] v2.7.10
  - **Notificaciones por Email:**
    - Campo `email_notifications` en tabla `users` (boolean, default true)
    - Mailable `NotificationEmail` con template HTML responsive
    - Listener `SendNotificationEmail` (queued) que envía emails automáticamente
    - Solo envía si el usuario tiene `email_notifications = true`
    - Template personalizado con branding y link a notificaciones
    - Integrado con evento `NotificationCreated` vía listener
    - Toggle en Filament para activar/desactivar emails por usuario
    - Campo `email_notifications` expuesto en GraphQL UserType
  - **Cache y Optimización de Consultas GraphQL:**
    - `SiteSettingsQuery`: Cache de 1 hora (3600s) para configuración del sitio
    - `TagsQuery`: Cache de 30 minutos (1800s) con keys diferenciadas (all/selectable)
    - `SiteSettingsObserver`: Limpia caché automáticamente al actualizar settings
    - `TagObserver`: Limpia caché de tags al crear/editar/eliminar tags
    - Reducción significativa de queries a BD en consultas frecuentes
    - Sin impacto en DX: caché se invalida automáticamente con observers
  - **Mejoras UI/UX:**
    - Avatar clickeable en UsersGrid: ahora se puede hacer clic en el avatar para ir al perfil
    - Efecto blur en thumbnails de galerías: `blur(5px)` por defecto, se quita en hover
    - Transición suave de 0.3s para el efecto blur
    - Aplicado en `FeaturedGalleries` (Home) y `UserGalleries` (perfil de usuario)
  - **Seguridad y Privacidad:**
    - Campo `name` en GraphQL UserType ahora protegido: solo visible para el propio usuario o admins/moderadores
    - Búsqueda de usuarios ya no incluye el campo `name` (solo `username` y `description`)
    - Mitigación de exposición de PII en consultas públicas
- [x] v2.7.9
  - **ErrorBoundary Global:** Componente de clase React para capturar errores no manejados en toda la aplicación
    - Pantalla amigable con opciones de "Recargar" e "Ir al inicio"
    - Detalles técnicos visibles en modo desarrollo
    - Integrado en App.tsx envolviendo toda la aplicación
  - **Hook useErrorHandler:** Manejo centralizado de errores de red y GraphQL
    - Detección automática de errores de red (Failed to fetch)
    - Parsing de errores GraphQL con códigos y detalles
    - Función retry() para reintentar operaciones fallidas
    - Estados isRetrying para feedback visual
  - **Paginación de Galerías:** Sistema completo de paginación y búsqueda
    - Backend: `PaginatorInfoType` y `GalleryPaginatorType` en GraphQL
    - Query `galleries` con `page`, `per_page` (max 50), `search` (título/descripción)
    - Componente `Paginator` reutilizable con Bootstrap (rangos, ellipsis, contadores)
    - Implementado en `UserGalleries` y `MyGalleries` con input de búsqueda
    - Respeta autorización: filtra por `isVisibleTo()` antes de paginar
  - **Paginación de Usuarios:** Sistema de paginación backend para rendimiento
    - Backend: `UserPaginatorType` registrado en GraphQL (schemas default/public/global)
    - Query `users` actualizado: `page`, `per_page` (max 100), filtros server-side
    - Filtros backend: `gender`, `nationality`, `min_price`, `max_price`, `search`, `role`, `tag`
    - Ordenamiento VIP priority preservado con `vip_priority_search`
    - Frontend: Explore.tsx y Tag.tsx con estado `currentPage`, carga dinámica sin client-side filtering
    - Componente `Paginator` integrado con scroll-to-top automático
    - Mejor performance: filtra y pagina en BD en vez de cargar todos los usuarios
    - Tag.tsx incluye filtros: país, precio (mín/máx), sexo + paginación
    - Home.tsx adaptado para usar estructura paginada (solo primera página de VIPs)
    - Configuración `grid_users_per_page` desde SiteSettings (default 12)
  - **Widgets de Administración Filament:** 4 nuevos widgets para monitoreo del sistema
    - `GalleryStatsWidget`: Estadísticas de galerías (total, estado, visibilidad, destacadas)
    - `UserActivityWidget`: Métricas de usuarios (nuevos, por rol, activos, verificados)
    - `RecentNotificationsWidget`: Tabla con últimas 10 notificaciones del sistema
    - `PopularGalleriesWidget`: Top 10 galerías por cantidad de medios
    - Todos integrados en el dashboard principal de Filament
  - **Notificaciones mejoradas:**
    - Mutación corregida con variables tipadas
    - Actualización optimista del estado local (sin refetch)
    - markNotificationAsRead() y markAllNotificationsAsRead() funcionales
    - UI más rápida sin esperar respuesta del servidor
  - **Efectos 3D en UsersGrid:**
    - Sombra dual layer en hover: `0 20px 40px rgba(0,0,0,0.15), 0 10px 20px rgba(0,0,0,0.1)`
    - Elevación de 8px (transform `y: -8`) con Motion
    - Transición suave de sombra en 0.3s con spring physics
  - **Animaciones UserProfile:**
    - 9 elementos con stagger: avatar, nombre, stats, botón, tags, links, tabs, contenido
    - Delays progresivos (0.2s a 0.7s) para revelación por partes
    - Efectos: scale, opacity, slideUp, slideRight con spring transitions
- [x] v2.7.8
  - **Animaciones Dinámicas con Motion:** Transiciones configurables, tilt 3D, scroll reveals
  - **Explore:** Título y filtros animados con whileInView
  - **Ranking:** Cards aparecen uno por uno con stagger
- [x] v2.7.7
  - **Real-time en página Notificaciones:** Suscripción Echo al canal `notifications.{userId}` en `/notificaciones`; nuevas notificaciones se prependen automáticamente sin recargar.
  - **Permisos de Galerías para Admin/Super Admin:** Admin y super_admin ahora tienen acceso completo a TODAS las galerías (públicas, privadas, seguidores, pending, rejected) sin restricciones. Actualizado `GalleryPolicy->view()` y `Gallery->isVisibleTo()` con bypass prioritario para roles administrativos.
- [x] v2.7.6
  - **Real-time Notificaciones vía Pusher/Echo:** Migrado de intento Reverb a configuración estable Pusher; eventos `NotificationCreated` privados `notifications.{userId}` y escucha instantánea en `Navigation` con fallback de polling.
  - **Limpieza final de código frontend:** Eliminados duplicados `.js` (`App.test.js`, `reportWebVitals.js`, `setupTests.js`) y migrado util `countryUtils` a TypeScript (`countryUtils.ts`).
  - **Estandarización de variables Pusher:** Unificadas variables `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER`, `VITE_PUSHER_HOST`, `VITE_PUSHER_PORT`, `VITE_PUSHER_FORCE_TLS` en `echo.ts` simplificado (singleton `initEcho`).
  - **Removido driver Reverb:** Configuración `.env` ajustada a `BROADCAST_CONNECTION=pusher` para evitar llaves nulas y errores de inicialización.
  - **UI:** Campana de notificaciones reposicionada al extremo derecho de la barra de navegación; badge dinámico y menú desplegable.
  - **Garantía TS-only:** Frontend verificado 100% TypeScript tras eliminación de todos los archivos .jsx y ahora también .js redundantes. Eliminados duplicados .jsx finales en componentes (Navigation, routes, uploaders, etc.) para completar la migración.
- [x] v2.7.5
  - **Características VIP avanzadas completadas:**
    - Prioridad VIP en listados/búsquedas: ordenamiento prioritario en `UsersQuery` controlado por `SiteSettings.vip_priority_search`.
    - Home VIP personalizable: sección configurable via `SiteSettings.vip_home_enabled` y límite `vip_home_limit`.
    - VIP badges customizables: `SiteSettings.vip_badge_label` y `vip_badge_icon` aplicados en Home, Explore, UserProfile, Ranking, y Tag.
    - Admin: controles Filament para configurar visibilidad VIP, límites y personalización de badges.
- [x] v2.7.4
  - Sistema de Galerías Destacadas (VIP/admin): campos `is_featured`, `featured_at` y límites por `SiteSettings.featured_galleries_vip`.
  - GraphQL: query pública `featuredGalleries(limit)` con guardado por `vip_featured_profile`; mutación `toggleFeaturedGallery` (auth) con validación de límites.
  - Filament: toggle de destacado + filtro/columna; tipo `Gallery` expone `is_featured`, `featured_at`, `can_be_featured`, `featured_limit`.
  - Frontend: barra de progreso en `EditGallery`, limpieza de logs, y badge “Destacada”.
  - Home: sección “Creadores VIP” (hasta 10, usando `UsersGrid`).
  - Home: “Etiquetas Populares” como badges respetando color e icono Font Awesome.
  - Home: “Galerías Destacadas” integrada y visible solo para usuarios autenticados.
- [x] v2.7.3
  - Validación de límites de medios por galería (por rol) en upload y mutaciones.
  - UX de cuota con ProgressBar, FilePond limitado por cuota restante y mensajes claros.
- [x] v2.7.2
  - Moderación de galerías (pending/approved/rejected) y límite de tamaño por rol.

### En curso / Siguientes
- Backend/API:
  - [x] Sistema completo de Analytics y Reportes - ✅ v2.7.23
    - ✅ 4 widgets de dashboard configurables (StatsOverview, EngagementStats, QuotaUsage, GrowthChart)
    - ✅ Configuración de visibilidad y orden de widgets desde panel admin
    - ✅ 6 widgets adicionales disponibles (OverviewStats, GalleryStats, UserActivity, TicketsOverview, RecentNotifications, PopularGalleries)
    - ✅ Sistema dinámico de widgets con método `canView()` para show/hide según configuración
    - ✅ Página de reportes completa con tabla de usuarios, filtros y exportación CSV
    - ✅ Estadísticas en tiempo real con métricas clave del sistema
- Admin/Analytics:
  - [ ] Sistema de membresías/suscripciones para upgrade a VIP.
- Calidad/Testing:
  - [ ] Tests frontend (Jest/RTL) y casos clave de GraphQL.

### Backlog de deseados
- [x] Sistema de likes/me gusta para fotos y galerías (solo usuarios logueados, y solo 1 me gusta por usuario, como facebook). - ✅ v2.7.24
- [ ] Watermark con imagen (PNG/SVG) además de texto y procesamiento en cola.
- [ ] Ranking y métricas de perfiles/galerías con cache programada.
- [ ] Chat/mensajería (MVP por polling; evaluar websockets más adelante).
- [ ] Página Home configurable (orden y visibilidad de secciones) desde SiteSettings.
- [ ] Optimizaciones adicionales de rendimiento (prefetch, más code-splitting granular).

## Convenciones del Proyecto
- Frontend 100% TypeScript (.tsx/.ts). No agregar .jsx/.js nuevos.
- GraphQL: usar esquema `public` para lectura y `default` para mutaciones autenticadas.
- Respetar límites y toggles de `SiteSettings` (p. ej., `vip_featured_profile`).
- Mantener logs de desarrollo mínimos; evitar `console.log` en producción.
 - Seguridad y Privacidad: mostrar solo `username` públicamente (ej. listados, badges, URLs). No exponer `name` (nombre completo) en la UI pública ni en el esquema GraphQL `public`.
   - Los campos personales (nombre completo, email, dob, etc.) sólo deben ser accesibles a través del esquema `default` o a usuarios con permisos explícitos (admins, soporte), y siempre protegidos por políticas y autorización.
   - Cuando sea necesario mostrar un nombre para uso interno, documenta el motivo y limita su exposición; evita mostrar PII en logs o respuestas públicas.

## Enlaces útiles
- Filament: https://filamentphp.com/docs/4.x/admin/resources
- Spatie Media Library: https://spatie.be/docs/laravel-medialibrary/v10/introduction
- React Router: https://reactrouter.com/en/main
- Bootstrap 5: https://getbootstrap.com
- Font Awesome: https://fontawesome.com/v6/icons
- Motion: https://motion.dev/docs/
- Alcha: https://altcha.org/docs
- Pusher: https://pusher.com/docs/

---

## Changelog (detalle histórico)

<details>
<summary>Ver changelog completo</summary>

### Cambios 2.7.23 (Actual) - COMPLETADO ✅

**Sistema Completo de Analytics y Reportes para Admin**

Backend (Laravel + Filament):
- **4 Nuevos Widgets para Dashboard:**
  - `StatsOverviewWidget` (sort: 1):
    - Total de usuarios con tendencia últimos 7 días
    - Creadores activos (% del total)
    - Galerías totales con pendientes destacadas
    - Medios almacenados (cantidad + MB)
    - Chart de crecimiento de usuarios últimos 7 días
  
  - `EngagementStatsWidget` (sort: 2):
    - Total de seguidores con tendencia semanal
    - Vistas de perfil totales (promedio por usuario)
    - Likes en galerías con actividad reciente
    - Usuario más activo (username + galerías aprobadas)
    - Chart de follows últimos 7 días
  
  - `QuotaUsageWidget` (sort: 3):
    - Uso de galerías Creators (X/Y con % y color dinámico)
    - Uso de medios Creators (total + promedio por galería)
    - Uso de galerías VIPs (con indicador "Ilimitado")
    - Galerías al límite (creators con cuota completa)
    - Colores por porcentaje: success (<50%), info (50-70%), warning (70-90%), danger (90%+)
  
  - `GrowthChartWidget` (sort: 4):
    - Gráfica de líneas últimos 12 meses
    - Dataset 1: Nuevos usuarios (azul)
    - Dataset 2: Nuevas galerías (naranja)
    - Eje Y con valores enteros (precision: 0)
    - Leyenda en top

- **Página de Analytics Completa:**
  - Ruta: `/admin/analytics`
  - Ubicación: Menú "Configuración" (sort: 3)
  - Icono: `heroicon-o-chart-bar`
  - Features:
    - Filtros dinámicos: Fecha desde/hasta, Rol (all/creator/vip/admin/moderator/user)
    - Tabla interactiva con usuarios y métricas
    - Columnas: Username, Email, Rol, Galerías, Medios, Seguidores, Vistas, Fecha registro
    - Búsqueda, ordenamiento, paginación (10/25/50/100)
    - Acción: Ver Perfil (abre en nueva pestaña)
  
  - **Exportaciones:**
    - CSV completo con todos los datos filtrados
    - Resumen Ejecutivo TXT con 4 secciones:
      - Estadísticas Generales (8 métricas)
      - Engagement (4 métricas)
      - Uso de Cuotas (4 métricas)
      - Top 5 Usuarios por Vistas
    - Nombres de archivo con timestamp: `analytics_2025-11-25_143055.csv`

- **GraphQL API (Solo Admins/Moderadores):**
  - Nueva Query: `systemStats`
  - Type: `SystemStatsType` con 13 campos:
    - `total_users`, `total_creators`, `total_vips`
    - `total_galleries`, `approved_galleries`, `pending_galleries`
    - `total_media`, `total_storage_mb`
    - `total_follows`, `total_views`, `total_likes`
    - `new_users_last_7_days`, `new_galleries_last_7_days`
  - Autorización: `hasAnyRole(['super_admin', 'admin', 'moderator'])`
  - Schema: `default` (requiere auth)

Filament Integration:
- **AdminPanelProvider:**
  - 4 widgets registrados en orden de prioridad
  - Page `Analytics` autodiscoverable
  
- **Vista Blade (`analytics.blade.php`):**
  - Sección de filtros con inputs responsivos
  - Grid 3 columnas en desktop, 1 en móvil
  - Livewire integration con `wire:model.live`
  - Tabla renderizada con `{{ $this->table }}`

Helpers y Utilidades:
- Método `countUsersByRole()`: Query optimizada con join a `model_has_roles`
- Método `getColorByPercent()`: Lógica de colores por porcentaje
- Método `generateSummary()`: Calcula todas las métricas para export
- Cache considerations: Queries directas a BD, sin cache implementado (futuro)

Beneficios:
- ✅ Visibilidad completa del estado del sistema en dashboard
- ✅ Toma de decisiones basada en datos reales
- ✅ Monitoreo de uso de cuotas por rol
- ✅ Identificación de tendencias de crecimiento
- ✅ Detección temprana de usuarios al límite
- ✅ Exports para reportes externos/ejecutivos
- ✅ API GraphQL para integraciones futuras

Actualización requerida:
```bash
cd back-admin
php artisan optimize:clear
# Los widgets y página se cargan automáticamente (autodiscover)
```

Notas técnicas:
- Todos los widgets usan queries DB directas para máximo rendimiento
- Charts con Chart.js (incluido en Filament)
- Exports con PHP nativo (fputcsv, response()->stream())
- Sin dependencias externas adicionales
- Compatible con todos los roles administrativos
- Filtros de fecha aplican a `created_at` de usuarios
- Media count calculado on-the-fly via join a `gallery_media`

Próximos pasos: ver sección [Roadmap](#roadmap).

### Cambios 2.7.18 (Actual) - COMPLETADO ✅

**Optimización Avanzada de Imágenes con Responsive srcset y WebP de Alta Compresión**

Backend (Laravel):
- **Calidad WebP Optimizada:**
  - `User.php` registerMediaConversions():
    - `thumb_webp` avatar: quality 85 → 75
    - `avatar_webp` completo: quality 90 → 80
    - `thumb_webp` gallery: quality 85 → 75
  - Reducción de ~15-20% en tamaño de archivos
  - Sin pérdida visual perceptible (Lighthouse recomienda 75-85%)

- **Nuevas Conversiones Responsive:**
  - `avatar_small_webp`: 120x120 WebP quality 75 (móviles)
  - `avatar_medium_webp`: 240x240 WebP quality 75 (tablets)
  - Agregadas a collection 'avatar' con nonQueued()
  - Regeneradas con `php artisan media-library:regenerate --force` (36 archivos)

- **GraphQL Types:**
  - `UserType`: Nuevos campos:
    - `avatar_small_webp` (String): "Avatar pequeño WebP para móviles (120x120)"
    - `avatar_medium_webp` (String): "Avatar mediano WebP para tablets (240x240)"
  - Resolvers con `getFirstMediaUrl('avatar', 'avatar_small_webp')`

- **GraphQL Queries Actualizadas:**
  - `userByUsername`: Agregados avatar_small_webp, avatar_medium_webp
  - `usersByTag`: Agregados avatar_small_webp, avatar_medium_webp
  - `following`: Agregados avatar_small_webp, avatar_medium_webp

Frontend (React + TypeScript):
- **Componente AvatarPicture Mejorado:**
  - Nuevos props: `smallWebpUrl?`, `mediumWebpUrl?`
  - Helper `buildSrcSet()`: Construye srcset con 120w, 240w, 500w
  - Atributo `sizes`: "(max-width: 576px) 120px, (max-width: 992px) 240px, 500px"
  - Atributos `width` y `height` explícitos para prevenir CLS
  - `<picture>` con `<source srcSet={srcSet} sizes={sizes} type="image/webp">`
  - Navegador elige tamaño óptimo automáticamente

- **Componentes Actualizados:**
  - `UserProfile.tsx`:
    - Avatar principal: smallWebp, mediumWebp con priority={true}
    - Modal siguiendo: smallWebp, mediumWebp
  - `UserGalleries.tsx`: Avatar con responsive props
  - `GalleryDetail.tsx`: Avatar con responsive props
  - `UsersGrid.tsx`: Cards con responsive props
  - `Ranking.tsx`:
    - Migrado de `<img>` directo a AvatarPicture
    - Query GraphQL actualizada con avatar_thumb_webp, avatar_small_webp, avatar_medium_webp
    - priority={true} para TOP 3 usuarios (mejora LCP en ranking)
    - Tamaño diferenciado: 80px para TOP 3, 60px para resto

- **TypeScript Interfaces:**
  - `User` interface: Agregados `avatar_small_webp?`, `avatar_medium_webp?`
  - `graphql.ts`: Queries actualizadas con nuevos campos

Resultados:
- ✅ Móviles cargan imágenes 70-80% más pequeñas (120px vs 500px)
- ✅ Tablets cargan imágenes 50% más pequeñas (240px vs 500px)
- ✅ Desktop sigue usando 500px de alta calidad
- ✅ srcset permite al navegador elegir tamaño óptimo según viewport y DPR
- ✅ width/height previenen Cumulative Layout Shift (CLS)
- ✅ Calidad WebP 75-80% reduce tamaño sin pérdida visible
- ✅ Impacto proyectado en Lighthouse: Score 50 → 65-70
- ✅ LCP mejorado significativamente en móviles
- ✅ Bandwidth ahorrado: ~40-50% en dispositivos móviles

### Cambios 2.7.10 - COMPLETADO ✅

**Notificaciones por Email y Cache de GraphQL**

Backend (Laravel):
- **Sistema de Notificaciones por Email:**
  - Migración: `add_email_notifications_to_users_table` - Campo boolean `email_notifications` (default true)
  - Modelo `User`: Campo agregado a fillable y casts
  - Mailable `NotificationEmail`: Email HTML responsive con branding de la app
  - Template `resources/views/emails/notification.blade.php`:
    - Header con nombre de la app
    - Contenido de la notificación (título, mensaje, fecha)
    - Botón CTA para ver todas las notificaciones
    - Footer con link para desactivar emails
    - Diseño responsive con estilos inline
  - Listener `SendNotificationEmail` (implements ShouldQueue):
    - Escucha evento `NotificationCreated`
    - Verifica que usuario tenga `email_notifications = true`
    - Envía email solo si está habilitado
    - Procesado en cola para mejor performance
  - Registrado en `AppServiceProvider` con Event::listen

- **Cache de Consultas GraphQL:**
  - `SiteSettingsQuery`: Cache de 1 hora (3600 segundos)
    - Key: `site_settings`
    - Invalidación automática con observer
  - `TagsQuery`: Cache de 30 minutos (1800 segundos)
    - Keys diferenciadas: `tags_all` y `tags_selectable`
    - Soporte para filtro `onlySelectable`
    - Invalidación automática con observer
  - `SiteSettingsObserver`:
    - Limpia cache en: created, updated, deleted, restored, forceDeleted
    - Cache::forget('site_settings')
  - `TagObserver`:
    - Limpia ambas keys de cache en todos los eventos
    - Método helper `clearTagsCache()`
  - Observers registrados en `AppServiceProvider`

- **GraphQL Types:**
  - `UserType`: Nuevo campo `email_notifications` (Boolean)
  - Descripción: "Si el usuario desea recibir notificaciones por email"

- **Filament Admin:**
  - `UserForm`: Toggle para `email_notifications` en sección "Perfil público"
  - Label: "Notificaciones por email"
  - Helper text: "Si está activado, el usuario recibirá notificaciones por email"
  - Default: true
  - Full width (columnSpanFull)

Frontend (React + TypeScript):
- **Mejoras UI/UX:**
  - `UsersGrid`: Avatar ahora es clickeable (envuelto en Link)
    - Click en avatar redirige al perfil del usuario
    - Mejora la navegación y UX
  - `FeaturedGalleries` y `UserGalleries`: Efecto blur en thumbnails
    - Filtro `blur(5px)` aplicado por defecto en imágenes de galerías
    - Hover quita el blur suavemente: `filter: blur(0px)`
    - Transición CSS de 0.3s para efecto suave
    - Clase `.gallery-thumbnail` para targeting específico
    - Aplicado en Home (galerías destacadas) y perfiles de usuario

- **Seguridad y Privacidad:**
  - `UserType` GraphQL: Campo `name` ahora protegido con resolver
    - Solo visible para el propio usuario o usuarios con rol admin/moderator
    - Retorna `null` para consultas públicas
  - `UsersQuery`: Búsqueda ya no incluye campo `name`
    - Solo busca en `username` y `description`
    - Previene exposición de nombres reales en búsquedas públicas
  - Mitigación de exposición de PII (Personally Identifiable Information)

Beneficios:
- ✅ Notificaciones por email opcionales y configurables por usuario
- ✅ Emails solo se envían si el usuario lo permite (GDPR friendly)
- ✅ Processing en cola evita bloqueos en peticiones web
- ✅ Template responsive y profesional con branding
- ✅ Reducción de carga en BD con cache inteligente
- ✅ Cache se invalida automáticamente al actualizar datos
- ✅ Sin impacto negativo en developer experience
- ✅ Queries frecuentes (tags, settings) hasta 30x más rápidas

Configuración requerida en `.env`:
```bash
# Ya configurado en versiones anteriores
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io
MAIL_PORT=2525
MAIL_USERNAME=tu_usuario
MAIL_PASSWORD=tu_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@linkpersons.com
MAIL_FROM_NAME="${APP_NAME}"

# Para procesamiento en cola (opcional, recomendado)
QUEUE_CONNECTION=database  # o redis
```

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
# Opcional: configurar worker de cola
php artisan queue:work
```

Notas técnicas:
- Emails se procesan en cola para no bloquear respuestas HTTP
- Cache usa driver configurado en `CACHE_DRIVER` (.env)
- Observers se ejecutan automáticamente en cualquier cambio (Filament, GraphQL, Tinker)
- Template de email usa estilos inline para máxima compatibilidad con clientes de correo

### Cambios 2.7.9 - COMPLETADO ✅

**ErrorBoundary, Paginación, Notificaciones y Widgets de Admin**

Frontend (React + TypeScript):
- **ErrorBoundary Global**:
  - Componente de clase para capturar errores no manejados
  - Pantalla amigable con "Recargar" e "Ir al inicio"
  - Detalles técnicos en modo desarrollo
  - Integrado en App.tsx

- **Hook useErrorHandler**:
  - Detección de errores de red (Failed to fetch)
  - Parsing de errores GraphQL
  - Función retry() con estado isRetrying
  - Manejo centralizado de errores

- **Sistema de Paginación**:
  - Componente Paginator reutilizable con Bootstrap
  - Implementado en UserGalleries y MyGalleries
  - Input de búsqueda por título/descripción
  - Rangos dinámicos con ellipsis

- **Notificaciones Mejoradas**:
  - Mutaciones con variables tipadas
  - Actualización optimista (sin refetch)
  - markNotificationAsRead() funcional
  - UI instantánea

Backend (Laravel + GraphQL):
- **Tipos de Paginación**:
  - PaginatorInfoType (metadata)
  - GalleryPaginatorType (data + paginatorInfo)
  - Registrados en config/graphql.php

- **Query Galleries Paginada**:
  - Parámetros: page, per_page (max 50), search
  - Filtro por isVisibleTo() antes de paginar
  - Búsqueda en título y descripción

- **Widgets de Admin Filament** (4 nuevos):
  - GalleryStatsWidget: estadísticas completas de galerías
  - UserActivityWidget: métricas de usuarios por rol
  - RecentNotificationsWidget: últimas 10 notificaciones
  - PopularGalleriesWidget: top 10 por medios
  - Todos con iconos, colores y ordenamiento

**Corrección Crítica**:
- ✅ Todas las referencias de `superadmin` corregidas a `super_admin`
- ✅ Actualizado en frontend (React), backend (PHP), widgets y README
 - ✅ Seguridad y privacidad: la UI pública ahora usa `username` para identificar usuarios en lugar de `name` (nombre completo). Se modificaron `Explore`, `Tag`, `UsersGrid`, `UserProfile`, `Home`, `Ranking` y otros componentes para evitar exponer PII en interfaces públicas; `name` se mantiene en el esquema `default` y solo para escenarios autorizados.


<details>
<summary>🟡 Cambios 2.7.8</summary>

**Animaciones Dinámicas con Motion + Configuración Backend**

Frontend (React + Motion):
- **Migración completa a Motion (motion.dev)**:
  - Reemplazado Framer Motion por Motion (paquete oficial optimizado)
  - Animaciones fluidas con soporte nativo para `prefers-reduced-motion`
  - Bundle más ligero y mejor rendimiento

- **Transiciones de Página Configurables**:
  - Nueva configuración `transition_type` en `SiteSettings` (backend)
  - Selector admin en Filament: Fade / Slide / Scale
  - Query GraphQL `siteSettings { transition_type }` expuesta públicamente
  - `AnimatedPage.tsx`: Componente que aplica variante dinámica según configuración
  - `animations.ts`: Mapa centralizado de variantes (fade, slide, scale)
  - `App.tsx`: Fetch de `siteSettings` al montar y aplicación global

- **Animaciones de Navegación**:
  - `Navigation.tsx`: AnimatePresence en Offcanvas con fade-in
  - `AnimatedHover`: Componente reutilizable para hover lift
  - Links principales con hover lift y brightness
  - Dropdown items con hover subtle
  - Notification bell con hover scale y rotate

- **Animaciones de Grid de Usuarios (UsersGrid.tsx)**:
  - Entrada escalonada (stagger) de cards con fade-in desde abajo
  - **Efecto tilt 3D basado en puntero**:
    - Motion values (`rotateX`, `rotateY`, `translateZ`) con springs
    - Rotación intensificada: ±12° en ambos ejes
    - Profundidad Z: 28px para mayor sensación de elevación
    - Hover lift adicional: -8px en eje Y
    - Sin escala para enfatizar solo el movimiento tilt
    - Respeta `prefers-reduced-motion`
  - Icono de botón "Ver perfil" corregido (className)
  - Texto del botón forzado a blanco para máxima legibilidad

- **Animaciones de Galerías (UserGalleries.tsx)**:
  - Cards de galería con entrada escalonada
  - Hover lift (-8px) con transición spring
  - Sombra dinámica intensificada en hover
  - Título cambia a color primary en hover
  - CSS hover-shadow eliminado (reemplazado por Motion)
  - **Animación de títulos**:
    - Header principal (nombre + avatar): fade-in desde arriba con delays escalonados
    - Avatar: scale animation desde 0.8 a 1
    - Texto: slide desde izquierda con delay

- **Animaciones de Home**:
  - Contenido principal: fade-in desde abajo (duration 0.6s)
  - Sección VIP: título animado con `whileInView` (aparece al hacer scroll)
  - **Etiquetas Populares (PopularTags.tsx)**:
    - Container con stagger de badges
    - Cada badge con hover: lift, scale y brightness
    - Título de sección animado con `whileInView`

Backend:
- **Migración**: `add_transition_type_to_site_settings_table`
  - Nuevo campo `transition_type` (string, default 'fade')
  - Valores permitidos: fade, slide, scale
- **SiteSettings Model**: Campo `transition_type` en fillable
- **GraphQL**: Campo `transition_type` expuesto en `SiteSettingsType`
- **Filament**: Select de transición en tab "Diseño" de SiteSettings

Mejoras de UX:
- ✅ Experiencia consistente en toda la app con transiciones fluidas
- ✅ Configuración centralizada sin rebuild del frontend
- ✅ Efecto 3D en user cards mejora la interactividad
- ✅ Animaciones respetan preferencias de accesibilidad del usuario
- ✅ Títulos animados guían la atención al contenido importante
- ✅ Scroll reveal animations solo se ejecutan una vez (viewport once: true)

Notas técnicas:
- Motion usa Web Animations API cuando está disponible (mejor rendimiento)
- Springs configurados con `stiffness: 260, damping: 22` para movimiento natural
- `whileInView` con `margin: "-100px"` activa animaciones antes de entrar en viewport
- Todas las animaciones tienen fallbacks para navegadores sin soporte

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear

cd front-site
npm install motion
npm uninstall framer-motion  # Si estaba instalado
```

### Cambios 2.7.7

**Real-time Notificaciones + Permisos de Galerías para Admin**

Backend:
- **Permisos Administrativos Completos**:
  - `GalleryPolicy->view()`: Admin y super_admin tienen bypass prioritario para ver TODAS las galerías
  - `Gallery->isVisibleTo()`: Admin y super_admin pueden ver galerías pending, rejected, privadas y de seguidores sin restricciones
  - Método `isAdmin()` helper en modelo User para verificar roles administrativos
  - Orden de verificación: Admin bypass → Owner → Visibilidad → Followers

- **Real-time en Página Notificaciones**:
  - Echo subscription al canal privado `notifications.{userId}` en `/notificaciones`
  - Listener de evento `NotificationCreated` con prepend automático a la lista
  - Nuevas notificaciones aparecen instantáneamente sin recargar
  - Badge de conteo actualizado en tiempo real
  - Compatible con polling fallback en Navigation

Frontend:
- **NotificationsPage.tsx**:
  - Hook `useEffect` que suscribe a canal privado de usuario autenticado
  - Callback `onNotificationCreated` que agrega notificación al inicio de la lista
  - Cleanup de suscripción al desmontar componente
  - Sincronización con backend via Echo/Pusher

Beneficios:
- ✅ Admins pueden moderar y revisar todas las galerías sin restricciones
- ✅ Notificaciones instantáneas mejoran engagement del usuario
- ✅ Sin necesidad de refresh manual para ver nuevas notificaciones
- ✅ Arquitectura escalable con WebSockets privados por usuario

Notas técnicas:
- Echo usa autenticación de Laravel para canales privados
- Event broadcasting debe estar configurado en `.env` (`BROADCAST_CONNECTION=pusher`)
- Compatible con Pusher Cloud o servidor WebSocket local

### Cambios 2.7.6

**Real-time Notificaciones via Pusher + Limpieza TypeScript**

Backend:
- **Broadcasting con Pusher**:
  - Configuración estable de Pusher (abandonado Reverb por problemas de inicialización)
  - Evento `NotificationCreated` broadcasting a canal privado `notifications.{userId}`
  - Variables `.env`: `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_APP_CLUSTER`
  - Observer `NotificationObserver` dispara evento al crear notificación

Frontend:
- **Echo Integration**:
  - `echo.ts` simplificado con singleton `initEcho()`
  - Variables estandarizadas: `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER`, `VITE_PUSHER_HOST`, `VITE_PUSHER_PORT`, `VITE_PUSHER_FORCE_TLS`
  - Detección automática de servidor local vs Pusher Cloud
  - Configuración para producción y desarrollo

- **Navigation Real-time**:
  - Suscripción Echo al canal `notifications.{userId}` en componente Navigation
  - Listener de evento `NotificationCreated` con actualización instantánea de badge
  - Fallback a polling (cada 30s) si Echo falla
  - Cleanup de suscripción al desmontar componente

- **Limpieza Código**:
  - Eliminados archivos `.js` duplicados: `App.test.js`, `reportWebVitals.js`, `setupTests.js`
  - Migrado `countryUtils.js` → `countryUtils.ts` con tipado completo
  - Frontend 100% TypeScript verificado (sin archivos .jsx o .js redundantes)

- **UI Notificaciones**:
  - Campana reposicionada al extremo derecho de la barra de navegación
  - Badge con contador dinámico (actualizado en tiempo real)
  - Dropdown con últimas 5 notificaciones y link "Ver todas"
  - Notificaciones no leídas destacadas con fondo azul claro

Configuración requerida en `.env`:
```bash
# Backend
BROADCAST_CONNECTION=pusher
PUSHER_APP_ID=tu_app_id
PUSHER_APP_KEY=tu_app_key
PUSHER_APP_SECRET=tu_app_secret
PUSHER_APP_CLUSTER=us2

# Frontend (.env.local)
VITE_PUSHER_APP_KEY=tu_app_key
VITE_PUSHER_APP_CLUSTER=us2
```

Actualización requerida:
```bash
cd back-admin
composer require pusher/pusher-php-server
php artisan optimize:clear

cd front-site
npm install pusher-js laravel-echo
```

### Cambios 2.7.5

**Características VIP Avanzadas Completadas**

Backend:
- **Prioridad VIP en Búsquedas**:
  - `UsersQuery`: Ordenamiento prioritario de usuarios VIP en listados y búsqueda
  - Controlado por `SiteSettings.vip_priority_search` (toggle en Filament)
  - SQL: `ORDER BY has_vip_role DESC, created_at DESC`
  - Query directa a `model_has_roles` para evitar N+1

- **Home VIP Personalizable**:
  - `SiteSettings.vip_home_enabled`: Toggle para mostrar/ocultar sección VIP en home
  - `SiteSettings.vip_home_limit`: Límite de usuarios VIP mostrados (default 10)
  - Query GraphQL filtra por `role: "vip"` y respeta límite configurado

- **VIP Badges Customizables**:
  - `SiteSettings.vip_badge_label`: Texto del badge (default "VIP")
  - `SiteSettings.vip_badge_icon`: Icono Font Awesome (default "fas fa-crown")
  - Aplicado en: Home, Explore, UserProfile, Ranking, Tag

Frontend:
- **UsersGrid.tsx**:
  - Props `vipBadgeLabel` y `vipBadgeIcon` para personalización
  - Badge dorado con icono dinámico para usuarios VIP
  - Compatible con iconos Font Awesome (conversión automática)

- **Home.tsx**:
  - Fetch de `siteSettings` para obtener configuración VIP
  - Sección "Creadores VIP" solo visible si `vip_home_enabled === true`
  - Respeta límite `vip_home_limit` al hacer query GraphQL
  - UsersGrid configurado con badges personalizados

- **Explore.tsx, UserProfile.jsx, Ranking.jsx, Tag.jsx**:
  - Fetch de `siteSettings` para badges VIP consistentes
  - Props dinámicos pasados a UsersGrid
  - Sin hardcodeo de labels/iconos

Filament Admin:
- **SiteSettings - Tab Permisos**:
  - Toggle "Prioridad VIP en Búsquedas"
  - Toggle "Mostrar Sección VIP en Home"
  - Número "Límite de Usuarios VIP en Home" (1-50, default 10)
  - Text Input "Etiqueta del Badge VIP" (default "VIP")
  - Text Input "Icono del Badge VIP" (default "fas fa-crown")
  - Todos con helper text explicativo

Beneficios:
- ✅ Configuración centralizada de características VIP
- ✅ Sin rebuild del frontend para cambiar textos/iconos
- ✅ Consistencia visual en toda la app
- ✅ Admins pueden A/B testear diferentes labels/iconos
- ✅ Control total sobre visibilidad y prioridad de VIPs

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

### Cambios 2.7.4

**Sistema de Galerías Destacadas para VIP + UX Mejorada en Upload**

Backend:
- **Modelo Gallery:**
  - Nuevos campos: `is_featured` (boolean), `featured_at` (timestamp)
  - Índice compuesto: `['is_featured', 'featured_at']` para consultas optimizadas
  - Métodos helper: `canBeFeatured()`, `getFeaturedLimit()`
  - Migración: `2025_11_19_154235_add_is_featured_to_galleries_table`

- **Lógica de Destacado:**
  - Solo galerías **aprobadas** y **públicas** pueden destacarse
  - Solo usuarios **VIP**, **admin** y **super_admin** pueden destacar galerías
  - Límites configurables: VIP según `SiteSettings.featured_galleries_vip` (default 3)
  - Admin/super_admin: ilimitado
  - Creator/user: sin acceso a destacado

- **GraphQL API:**
  - Nueva query pública: `featuredGalleries(limit: Int)` - Retorna galerías destacadas ordenadas por `featured_at DESC`
  - Nueva mutación autenticada: `toggleFeaturedGallery(id: Int!, is_featured: Boolean!)`
  - Campos nuevos en `GalleryType`: `is_featured`, `featured_at`, `can_be_featured`, `featured_limit`
  - Validación de límites: Error si se intenta destacar más galerías del permitido

Filament Admin:
- **GalleryForm:**
  - Toggle `is_featured`: Destacar/desdestacar galería
  - Campo `featured_at`: Fecha de destacado (auto, read-only)
  - Helper text explicativo de requisitos

- **GalleriesTable:**
  - Nueva columna `is_featured` con badge: Sí (warning) / No (gray)
  - Nuevo filtro: Destacada (Sí/No)
  - Ordenamiento disponible por is_featured

Frontend (React + TypeScript):
- **Tipos actualizados (`types/index.ts`):**
  - Interface `Gallery`: Agregados `is_featured`, `featured_at`, `can_be_featured`, `featured_limit`

- **MyGalleries.tsx:**
  - Badge "Destacada" (warning con estrella) en galerías destacadas
  - Botón "Destacar/Destacada" en cards de galerías elegibles
  - Estado `togglingFeatured` para feedback visual durante toggle
  - Spinner mientras se procesa toggle
  - Solo visible para galerías que `can_be_featured === true`
  - Llamada a mutación `toggleFeaturedGallery` con validación

- **GraphQL helper (`lib/graphql.ts`):**
  - Nueva mutación: `toggleFeaturedGallery`
  - Retorna: `id`, `is_featured`, `featured_at`

Flujo de Destacado:
1. Usuario VIP crea galería pública y es aprobada
2. En "Mis Galerías", aparece botón "Destacar" (solo si `can_be_featured`)
3. Click en "Destacar" → mutación GraphQL valida límite
4. Si OK: `is_featured = true`, `featured_at = now()`
5. Badge "Destacada" aparece en card
6. Query `featuredGalleries` retorna esta galería en home (próximo paso)

Validaciones:
- ✅ Solo galerías aprobadas y públicas
- ✅ Solo usuarios VIP/admin pueden destacar
- ✅ Límite de galerías destacadas por rol (configurable)
- ✅ Mensajes de error descriptivos
- ✅ Toggle on/off desde frontend y admin

Frontend - Mejoras de UX:
- **Barra de Progreso de Upload (EditGallery):**
  - Indicador visual durante subida de imágenes: "Subiendo imagen X de Y"
  - ProgressBar animada con porcentaje en tiempo real
  - Alert info con ícono de cloud-upload
  - Se muestra solo durante el proceso de upload
  - Mejor feedback para uploads de múltiples archivos

- **Limpieza de Código:**
  - Eliminados todos los `console.log` de debug en EditGallery
  - Mantenidos solo errores críticos para troubleshooting
  - Código más limpio y profesional
  - Mejor rendimiento sin logs innecesarios

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

Próximos pasos: ver sección [Roadmap](#roadmap).

</details>

<details>
<summary>🟡 Cambios 2.7.3</summary>

### Cambios 2.7.3

**Validación de Límites de Medios por Galería**

Backend:
- **Validación en Upload Controller:**
  - Nuevo límite anti-acumulación: máximo 50 archivos temporales sin adjuntar
  - Mensaje de error claro si se excede límite de uploads pendientes
  - Previene saturación de almacenamiento por archivos no adjuntados
  - Validación independiente del límite por galería (que se aplica en mutación)

- **Validación en GraphQL Mutation (AddMediaToGallery):**
  - Creator: 20 imágenes por galería (configurable en SiteSettings)
  - VIP: Ilimitado (o configurable según `max_media_per_gallery_vip`)
  - Admin/Super Admin: Ilimitado
  - Mensajes de error específicos: "Has alcanzado el límite de X imágenes"
  - Validación de cuota restante antes de agregar medios

Frontend:
- **Indicador Visual de Cuota (EditGallery):**
  - ProgressBar con código de colores: info (<80%), warning (≥80%), danger (100%)
  - Alert dinámico mostrando X/Y imágenes usadas
  - Mensaje de límite alcanzado con ícono de advertencia
  - Estado "Imágenes Ilimitadas" para VIP/admin en badge verde
  - Bloqueo de FilePond cuando se alcanza el límite
  - Advertencia de tamaño de archivo por rol integrada

- **Validación Pre-Upload:**
  - FilePond `maxFiles` dinámico según cuota restante
  - Prevención de selección excesiva antes de iniciar upload
  - Validación al hacer click en "Agregar (N)": verifica cuota disponible
  - Mensajes descriptivos: "Solo puedes agregar X imagen(es) más"

Beneficios:
- ✅ Usuario informado en tiempo real de su cuota disponible
- ✅ Sin sorpresas al intentar agregar medios (validación temprana)
- ✅ Prevención de uploads innecesarios que serán rechazados
- ✅ Experiencia diferenciada entre roles (creator vs VIP)
- ✅ Anti-spam: límite de 50 uploads temporales evita acumulación
- ✅ Feedback visual claro con barra de progreso y badges

Flujo de validación:
1. Usuario selecciona archivos → FilePond limita según cuota restante
2. Usuario hace click "Agregar (N)" → validación frontend verifica límite
3. Upload inicia → Controller valida límite de temporales (max 50)
4. Mutación GraphQL → validación final de límite por galería
5. Si todo OK → imágenes se adjuntan; si no → error descriptivo

Actualización requerida:
```bash
cd back-admin
php artisan optimize:clear
```

</details>

<details>
<summary>🟡 Cambios 2.7.2</summary>

### Cambios 2.7.2

**Sistema de Moderación de Galerías + Validación de Tamaño de Upload**

Backend:
- **Validación de Tamaño de Upload por Rol:**
  - Upload máximo configurado por rol en SiteSettings (tab Permisos)
  - Creator: 5MB por archivo (default)
  - VIP: 20MB por archivo (default)
  - Admin/Super Admin: Sin límite
  - Validación en `GalleryMediaController` con mensajes de error claros
  - Respuesta JSON consistente: `{success, media_id, url, thumb_url, max_upload_mb, errors?}`

- **Sistema de Moderación de Galerías:**
  - Nuevo campo `status` en tabla `galleries`: `pending`, `approved`, `rejected`
  - Migración: `2025_11_19_120001_add_status_to_galleries_table`
  - Galerías de creator/vip se crean con status `pending` por defecto
  - Galerías de admin/super_admin se crean aprobadas automáticamente
  - Constantes en modelo Gallery: `STATUS_PENDING`, `STATUS_APPROVED`, `STATUS_REJECTED`
  - Visibilidad basada en status: pending/rejected solo visible para owner y moderadores
  - Filtro de conteo público: `galleries_count` excluye galerías pending/rejected

- **GraphQL - Moderación:**
  - Nueva mutación: `moderateGallery(id: Int!, status: String!)` (solo moderadores/admin)
  - Campo `status` en `GalleryType` con valores: pending/approved/rejected
  - Campo `can_moderate` (Boolean) indica si el usuario actual puede moderar
  - Validación de roles con query directa a `model_has_roles` (evita N+1)
  - Solo galerías pending/rejected pueden cambiar de estado

Filament Admin:
- **GalleriesTable - Acciones de Moderación:**
  - Acciones individuales: "Aprobar" y "Rechazar" visibles según status actual
  - Acciones masivas (bulk): "Aprobar seleccionadas" y "Rechazar seleccionadas"
  - Notificaciones de éxito con conteo de galerías procesadas
  - Columna de status con badges de colores (warning/success/danger)
  
- **GalleryForm - Campo de Status:**
  - Select de status con opciones en español
  - Default: `approved`
  - Helper text: "Estado de moderación de la galería"
  - Sección de formulario full-width (columnSpanFull)

Frontend:
- **Badges de Status en Galerías:**
  - MyGalleries: Badge de estado (Pendiente/Rechazada) en galerías no aprobadas
  - GalleryDetail: Status visible en detalle de galería
  - UserGalleries: Status field incluido en queries
  - EditGallery: Status field incluido para edición

- **Skeleton Loaders (UX):**
  - GalleryDetail: Skeleton con animación shimmer mientras cargan imágenes
  - UserGalleries: Skeleton en thumbnails de galerías
  - MyGalleries: Skeleton en grid de galerías propias
  - CSS: Gradiente animado con transición suave de opacidad
  - Callback handleImageLoad para controlar estado de carga

- **FilePond - Refactor a Upload Manual:**
  - Eliminado: instantUpload, server config automático, uploadQueue state
  - Nuevo flujo: Seleccionar archivos → almacenar localmente → botón "Agregar (N)" → upload manual
  - State: pendingFiles (contador) actualizado por onupdatefiles
  - handleAttachUploaded: Upload manual con fetch, obtención de media_ids, mutación GraphQL
  - Beneficios: Sin sync issues, sin DELETE requests automáticos, control total del flujo

Correcciones:
- Fix: Missing status field en GalleryDetail query causaba "Error al cargar las galerías"
- Fix: UserType galleries_count ahora filtra por `status='approved'` AND `visibility='public'`
- Fix: FilePond solo adjuntaba 1 archivo de 5 seleccionados - resuelto con refactor a manual upload
- Fix: DELETE requests automáticos de FilePond eliminados con nuevo flujo

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

</details>

Workflow de Moderación:
1. Creator/VIP crea galería → status `pending`
2. Galería visible solo para owner y moderadores
3. Admin/moderador aprueba desde panel Filament (individual o bulk)
4. Status cambia a `approved` → visible según configuración de `visibility`
5. Si se rechaza, status `rejected` → solo visible para owner

Notas:
- Galerías pending no se cuentan en `galleries_count` del perfil público
- Admin/super_admin pueden ver y moderar todas las galerías independientemente del status
- Skeleton loaders mejoran percepción de velocidad durante carga de imágenes
- Upload manual elimina problemas de sincronización de cola en FilePond

### Cambios 2.7.1

**Sistema de Límites de Galerías - Mejoras de UX**

Frontend:
- **Advertencia de límite de selección de archivos:**
  - Mensaje claro en el indicador de cuota: "Si intentas seleccionar más archivos del límite permitido, no se adjuntarán"
  - Advertencia visible con ícono de información en color amarillo
  - Elimina confusión del usuario al intentar subir más archivos del límite
  - FilePond `maxFiles` dinámico según cuota restante
  - Sin depender de props no reconocidas por TypeScript

Backend:
- Sistema de límites ya implementado en v2.7.0:
  - Validación de cuota en `AddMediaToGalleryMutation`
  - Límites configurables por rol en SiteSettings
  - Auto-attach de uploads en cola cuando se libera espacio

Notas:
- FilePond no dispara eventos personalizados para `maxFiles` excedido
- La advertencia está integrada en el UI de cuota para máxima visibilidad
- Compatible con todas las versiones de react-filepond

### Cambios 2.7.0

**Migración Completa a TypeScript + Nuevo Rol VIP**

Frontend (TypeScript 100%):
- **Migración completada de todas las páginas JSX → TSX:**
  - ✅ 21 páginas totales en TypeScript (.tsx)
  - ✅ Páginas principales: Home, Explore, UserProfile, EditProfile
  - ✅ Páginas de autenticación: Login, Register, VerifyEmail, EmailVerified
  - ✅ Sistema de tickets: Tickets, TicketDetail, NewTicket
  - ✅ Sistema de galerías: UserGalleries, NewGallery, EditGallery, GalleryDetail, MyGalleries
  - ✅ Páginas estáticas: Contact, Page, Ranking, Tag, NotFound
  - ✅ Todos los archivos .jsx eliminados del proyecto
  
- **Type Safety Completo:**
  - Interfaces TypeScript para todos los modelos (User, Gallery, Ticket, Tag, Link, Role, etc.)
  - Props tipados en todos los componentes
  - GraphQL responses con tipos genéricos
  - React hooks con tipado estricto (useState, useEffect, useCallback)
  - Event handlers completamente tipados
  
- **Mejoras de Desarrollo:**
  - IntelliSense completo en VSCode
  - Detección de errores en tiempo de compilación
  - Refactoring seguro con TypeScript
  - Documentación automática vía tipos
  - Mejor experiencia de autocompletado
  
- **Build Verificado:**
  - Compilación exitosa sin errores TypeScript
  - Bundle optimizado: 520.75 kB (163.92 kB gzipped)
  - Sin cambios en tamaño del bundle
  - Compatibilidad total mantenida

- **Indicadores Visuales para Usuarios VIP:**
  - Badge VIP dorado con ícono de corona en grid de usuarios
  - Borde dorado y sombra resplandeciente en cards de usuarios VIP
  - Badge VIP prominente en página de perfil junto al username
  - Diseño consistente con tema warning/dorado de Bootstrap
  - Detección automática basada en rol `vip` del usuario

Backend (Sistema de Roles):
- **Nuevo Rol VIP:**
  - Agregado rol `vip` al sistema de roles
  - Posicionado entre `moderator` y `creator` en jerarquía
  - Base similar a `creator` con permisos extendidos
  - Diseñado para usuarios premium con funcionalidades exclusivas
  - `RolesSeeder` actualizado para crear rol en instalaciones nuevas
  - Compatible con migraciones existentes (no rompe BD actual)
  
- **Permisos Shield Regenerados:**
  - Todos los permisos generados para el rol VIP
  - 113 permisos totales en el sistema
  - 10 políticas actualizadas
  - Compatible con panel Filament

- **Sistema de Permisos y Límites por Rol:**
  - Nueva pestaña "Permisos" en SiteSettings para configuración centralizada
  - **Límites de Galerías:** Configurable por rol (creator: 5, VIP: ilimitado)
  - **Límites de Medios:** Máximo de archivos por galería según rol (creator: 20, VIP: ilimitado)
  - **Tamaños de Archivo:** Upload máximo en MB (creator: 5MB, VIP: 20MB)
  - **Moderación:** Opción de requerir aprobación de galerías por rol
  - **Comentarios:** Control de permisos de comentarios por rol
  - **Visibilidad VIP:** Perfiles destacados y prioridad en búsquedas
  - **Galerías Destacadas:** Límite configurable de galerías VIP destacadas
  - Admin/super_admin: acceso ilimitado a todas las características
  - Validación automática en `CreateGalleryMutation` con mensajes de upgrade

- **GraphQL Type System:**
  - Nuevo tipo `Role` con campos `id`, `name`, `guard_name`
  - Campo `roles` en `UserType` retorna array de objetos Role
  - Eager loading de roles en queries para evitar N+1
  - Soporte completo en esquemas público y autenticado

- **SiteSettings Dinámicos:**
  - Selector de roles ahora carga dinámicamente desde BD
  - No requiere hardcodear roles en el código
  - Detecta automáticamente nuevos roles creados
  - Etiquetas en español con fallback inteligente

- **Frontend - UI de Límites y Cuotas:**
  - **MyGalleries**: Barra de progreso mostrando cuota de galerías usadas (X de Y)
  - **NewGallery**: Validación pre-creación con alerta de límite alcanzado
  - Indicador visual por porcentaje: info (<80%), warning (≥80%), danger (100%)
  - Botón "Nueva Galería" deshabilitado cuando se alcanza el límite
  - Mensaje de upgrade a VIP para usuarios creator en límite
  - Usuarios VIP/admin ven "Galerías Ilimitadas" en verde
  - Carga dinámica de configuración desde GraphQL (SiteSettings)
  - TypeScript type-safe con interfaces SiteSettings actualizadas
  - Manejo de roles como objetos Role o strings para compatibilidad

Directiva de Desarrollo:
- **CRÍTICO: Todas las nuevas páginas o componentes DEBEN crearse en TypeScript (.tsx/.ts)**
- **PROHIBIDO: Crear nuevos archivos .jsx/.js en el frontend**
- El proyecto está 100% TypeScript para mantener consistencia y type safety

Actualización requerida:
```bash
cd back-admin
php artisan db:seed --class=RolesSeeder  # Crear rol VIP
php artisan shield:generate --all        # Regenerar permisos
php artisan optimize:clear

cd front-site
npm run build  # Verificar compilación TypeScript
```

**Nota:** Después de actualizar la configuración en SiteSettings (Filament), los usuarios deben hacer **hard refresh** (Ctrl+F5) en el navegador para ver los cambios de límites actualizados.

Próximos pasos: ver sección [Roadmap](#roadmap).

### Cambios 2.6.0

**Personalización de Opacidad en Card de Usuario**

Frontend:
- Ahora el usuario puede elegir la opacidad del color de fondo de su card en el perfil (slider de 0.1 a 1).
- Previsualización en tiempo real en la edición de perfil.
- El color de fondo en el perfil se muestra usando `rgba` según la opacidad elegida.

Backend:
- Nuevo campo `users.card_bg_opacity` (float, nullable) para almacenar la opacidad.
- `UpdateProfile` acepta y valida `card_bg_opacity` (rango 0.1 a 1).
- GraphQL `User` expone `card_bg_opacity` en esquemas público y autenticado.
- Filament: Campo numérico para opacidad en Usuarios → Perfil público.

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

Notas técnicas:
- El valor por defecto es 1 (opaco).
- El color personalizado y la opacidad solo se aplican en el perfil individual, no en el grid de exploración.
- Sin dependencias nuevas en frontend.
Version 2.4.0

# Link Persons

Proyecto web full-stack para gestión de enlaces y personas.

## Directivas a seguir
- Utilizar Laravel 12 para el backend.
- Implementar GraphQL para la API.
- siempre usar el .env y no modificar los archivos de configuracion directamente.
- No crees archivos innecesarios fuera de las carpetas designadas.
- No crees archivos README adicionales en subcarpetas, solo actualiza este archivo principal.
- el antivirus del usuario bloquea composer o npm, con url sobre ssl, recuerda eso.
- Si tienes dudas, consulta antes de agregar nuevas dependencias o tecnologías.
- Siempre verifica en que carpeta estás trabajando antes de crear nuevos archivos o ejecutar comandos.
- Usa la documentación oficial de cada tecnología como referencia primaria.
- Revisa en que carpeta estás trabajando antes de ejecutar comandos o crear nuevos archivos.
- documentacion Filament: https://filamentphp.com/docs/4.x/admin/resources
- documentacion Spatie Media Library: https://spatie.be/docs/laravel-medialibrary/v10/introduction
- documentacion Spatie Image 3.8: https://spatie.be/docs/image/v3/introduction
- documentacion React Router: https://reactrouter.com/en/main
- documentacion FilePond: https://pqina.nl/filepond/docs/
- documentacion Bootstrap: https://getbootstrap.com/docs/5.0/getting-started/introduction/
- documentacion Font Awesome: https://fontawesome.com/v6/icons
- documentacion GraphQL Laravel.
- documentacion lightGallery: https://www.lightgalleryjs.com/docs/
- documentacion TypeScript: https://www.typescriptlang.org/docs/

- luego de crear nuevo recurso o tecnologia, pidele al usuario que pruebe y si esta todo correcto, que actualice este README.md con la nueva informacion relevante y la version para llevar un control.
- para el backend utilizamos Filament v4 + Spatie Media Library + GraphQL + Laravel Sanctum.
- siempre intenta utilizar las ultimas versiones estables de las tecnologias.
- **IMPORTANTE: Todas las nuevas páginas o componentes en el frontend DEBEN crearse en TypeScript (.tsx/.ts).**
- **IMPORTANTE: NO crear nuevos archivos .jsx/.js en el frontend. El proyecto está completamente migrado a TypeScript.**
- usaremos typescript en el frontend para mayor seguridad de tipos y mejor experiencia de desarrollo.
- recuerda que estamos usando GraphQL para la comunicacion entre frontend y backend, por ejemplo, para obtener los datos de los usuarios en el frontend, debes usar queries GraphQL.
- NO OLVIDES que versiones de cada tecnologia estas usando.



## Estructura del Proyecto

```
link-persons/
├── back-admin/     # Backend - Laravel 12
└── front-site/     # Frontend - React + Bootstrap
```

## Tecnologías

### Backend (`back-admin/`)
- **Laravel 12.38.1**
- **Filament PHP v4.0** - Panel de administración
- **GraphQL** (rebing/graphql-laravel)
- **Laravel Sanctum** - Autenticación SPA
- **Spatie Media Library** - Gestión de imágenes/videos
- **Spatie Permission + Filament Shield** - Roles y permisos
- **Monarobase Country List** - Listado de países (ES)
- **MySQL** - Base de datos: `link_persons_admin`
- PHP 8.x

### Frontend (`front-site/`)
- **Vite 5** (dev server + build)
- **React 18**
- **TypeScript 5** - Proyecto completamente migrado a TypeScript
  - **IMPORTANTE: Todas las páginas están en .tsx (21 archivos migrados)**
  - Tipos completos en `src/types/index.ts` para todos los modelos
  - Configuración estricta con tsconfig.json
  - IntelliSense completo y validación en tiempo de compilación
- **React Router v6** - Navegación y rutas amigables
- **Bootstrap 5**
- **React Bootstrap**
- **FilePond** - Upload de archivos
- **qrcode.react** - Generación de QR en el perfil
- **lightGallery 2.9** - Visor de imágenes con lazy loading

## Hitos del Proyecto

### ✅ Completados
- [x] Instalación de Laravel 12 en `back-admin/`
- [x] Configuración de GraphQL
- [x] Configuración de MySQL
- [x] Instalación de React en `front-site/`
- [x] Integración de Bootstrap CSS
- [x] Filament PHP v4 instalado
- [x] Spatie Media Library para gestión de imágenes/videos
- [x] Sistema de Roles y Permisos (Spatie Permission + Filament Shield)
- [x] FilePond para uploads en React
- [x] Modelo Post con gestión de medios
- [x] React Router con URLs amigables (@username)
- [x] Campo username en usuarios
- [x] Panel de Configuración del Sitio (SiteSettings)
- [x] Validación de username en tiempo real
- [x] Generador de contraseñas seguras
- [x] Filtro de medios por usuario
- [x] Upload de avatar de usuario con recorte automático
- [x] Sistema de etiquetas (Tags) con colores, iconos y peso
- [x] Asignación múltiple de tags a usuarios
- [x] Sistema de links personalizados por usuario
- [x] API GraphQL operativa (queries + mutations protegidas por sesión)
- [x] Integración completa frontend-backend (Vite + proxy GraphQL público + fetch en React)
- [x] Autenticación con Laravel Sanctum (SPA mode)
- [x] Sistema de Watermark para imágenes (configurable en SiteSettings, con fuente TTF)
- [x] Reprocesado de medios: acción masiva en Media y comando Artisan
- [x] Sistema de seguimiento (follow/unfollow) entre usuarios
- [x] Contador de vistas de perfil único por sesión
- [x] Sistema de páginas dinámicas (CMS básico)
- [x] Sistema de Contacto completo (formulario público + panel admin + emails) - ✅ v1.9.0
- [x] **Sistema de Tickets/Soporte**: Gestión completa de tickets con estados, prioridades, comentarios, panel admin y notificaciones - ✅ v1.10.0
- [x] **Sistema de Galerías v2.0.0**: Galerías de imágenes públicas/privadas/seguidores con gestión admin completa - ✅ v2.0.0
- [x] **Sistema de Galerías v2.1.0**: CRUD completo desde frontend, lightGallery viewer, FilePond uploads, drag-drop reordering, autorización por roles - ✅ v2.1.0
- [x] **Administración de perfil desde frontend v2.3.0**: Self-service para editar perfil, ubicación, descripción y enlaces personalizados - ✅ v2.3.0

## Requisitos

- PHP >= 8.1
- Composer
- Node.js >= 20 (recomendado 22 LTS)
- MySQL
- Laragon (recomendado para desarrollo local)

## Instalación

### Backend
```bash
cd back-admin
composer install
cp .env.example .env
php artisan key:generate
# Configurar APP_URL=http://127.0.0.1:8000 en .env
# Crear base de datos: link_users
php artisan migrate
php artisan shield:generate --all
php artisan storage:link
php artisan serve
```

**Crear usuario super admin:**
```bash
php artisan tinker --execute="User::create(['name' => 'Admin User', 'username' => 'admin', 'email' => 'scoollerx@hotmail.com', 'password' => Hash::make('password'), 'email_verified_at' => now()])->assignRole('super_admin')"
```

**Credenciales de desarrollo:**
- Email: `scoollerx@hotmail.com`
- Password: `password`
- Panel admin: `http://127.0.0.1:8000/admin`

### Frontend
```bash
cd front-site
npm install
npm run dev       # Vite en http://127.0.0.1:3000
# Build de producción
npm run build
# Vista previa del build
npm run preview
```

### Integración Frontend ↔ Backend

- Dev server: Vite en `http://127.0.0.1:3000` con proxy a Laravel `http://127.0.0.1:8000` (ver `front-site/vite.config.js`).
- Esquema público GraphQL: `http://127.0.0.1:8000/graphql/public` (accedido desde el front vía proxy, base `/graphql/public`).
- CORS habilitado para `http://localhost:3000` y `http://127.0.0.1:3000`.
- Helper GraphQL: `src/lib/graphql.js` (sin dependencias externas). Soporta env `VITE_API_BASE` (por defecto `/graphql/public`).
- `UserProfile.jsx` consume GraphQL por `username` y muestra `avatar`, `tags` y `links` reales.

Prueba rápida (con el front corriendo):
1. Crea o edita un usuario en el admin y agrega tags/links.
2. Visita `http://localhost:3000/@usuario`.
3. Deberías ver avatar, badges de tags e ítems de links con iconos.

Notas:
- El esquema `default` permanece protegido con `auth:web` para mutaciones y gestión.
- Cuando se implemente Sanctum, podremos autenticar también desde el front para mutaciones.

### Pusher / WebSockets

- El backend usa Pusher para broadcasting (configurado en `back-admin/.env`). Las variables principales son:
  - `PUSHER_APP_ID`, `PUSHER_APP_KEY`, `PUSHER_APP_SECRET`, `PUSHER_APP_CLUSTER`.
- El frontend lee solo valores públicos necesarios para conectarse a Pusher Cloud desde Vite (no expone secretos):
  - `front-site/.env.local` → `VITE_PUSHER_APP_KEY`, `VITE_PUSHER_APP_CLUSTER`.
  - Opcionalmente, para usar un servidor WebSocket local (p. ej. `beyondcode/laravel-websockets`) puede configurar:
    - `VITE_PUSHER_HOST=127.0.0.1`
    - `VITE_PUSHER_PORT=6001`
    - `VITE_PUSHER_FORCE_TLS=false`

- `front-site/src/lib/echo.ts` detecta si `VITE_PUSHER_HOST` está presente y entonces configurará `wsHost/wsPort` para una conexión local; si no, forzará TLS para Pusher Cloud.
- Nota de seguridad: el `PUSHER_APP_SECRET` **no** debe exponerse al frontend — manténgalo solo en `back-admin/.env`.

Configuración local recomendada para usar WebSockets locales:
1. Instalar y correr `laravel-websockets` (o tu servidor websocket). Asegúrate de que escucha en `6001`.
2. En `back-admin/.env` agrega:
   ```dotenv
   PUSHER_HOST=127.0.0.1
   PUSHER_PORT=6001
   PUSHER_SCHEME=http
   PUSHER_APP_CLUSTER=mt1   # o el cluster que elijas (es usado sólo por el backend)
   ```
3. En `front-site/.env.local` agrega:
   ```dotenv
   VITE_PUSHER_APP_KEY=<la misma que en back-admin>
   VITE_PUSHER_APP_CLUSTER=mt1
   VITE_PUSHER_HOST=127.0.0.1
   VITE_PUSHER_PORT=6001
   VITE_PUSHER_FORCE_TLS=false
   ```
4. Reinicia Vite y el servidor Laravel (y `laravel-websockets` si aplica) para que recojan las variables.

### Sistema de Captcha Anti-spam (ALTCHA)

El proyecto usa ALTCHA, un sistema de captcha de código abierto basado en proof-of-work que no requiere servicios externos de terceros.

**Características de ALTCHA:**
- ✅ Gratuito y de código abierto
- ✅ Sin seguimiento de usuarios ni servicios externos
- ✅ Verificación local (sin llamadas a APIs de terceros)
- ✅ Basado en proof-of-work (PoW) con desafíos criptográficos
- ✅ Compatible con GDPR por defecto
- ⚠️ Requiere HTTPS en producción (WebCrypto API del navegador)

#### Configuración Backend (`back-admin/.env`)

```dotenv
ALTCHA_ENABLED=true
ALTCHA_SECRET=tu_hmac_secret_aleatorio_de_32_chars_minimo
```

**Generar secret aleatorio:**
```bash
php -r "echo bin2hex(random_bytes(32));"
```

#### Configuración Frontend (`front-site/.env.local`)

No requiere variables adicionales, ALTCHA está habilitado por defecto.

#### Instalación de dependencias

```bash
# Backend
cd back-admin
composer require altcha-org/altcha

# Frontend (ya instalado)
cd front-site
npm install altcha
```

#### Flujo de funcionamiento

1. Frontend solicita challenge: `GET /api/altcha/challenge`
2. Backend genera challenge con `Altcha::createChallenge()`
3. Widget ALTCHA resuelve el desafío en el navegador (proof-of-work)
4. Al enviar formulario, payload se envía en campo `captcha`
5. Backend verifica localmente con `Altcha::verifySolution()`

#### Endpoints del backend

- `GET /api/altcha/challenge` - Genera nuevo desafío criptográfico
- Verification en `App\Support\Captcha::verify()` con verificación local

#### Integración en formularios

El widget ALTCHA se integra automáticamente en:
- Formulario de contacto (`/contacto`)
- Formulario de registro (`/registro`)

```tsx
<altcha-widget challengeurl="/altcha/challenge" name="captcha" />
```

#### Notas de seguridad

- `ALTCHA_SECRET` es usado solo para HMAC server-side, nunca se expone al frontend
- Validación obligatoria en: `CreateContactMessageMutation` y `AuthController@register`
- Si ALTCHA está deshabilitado (`ALTCHA_ENABLED=false`), la verificación se omite
- En desarrollo local sin HTTPS, el widget funcionará con limitaciones del navegador

## Configuración de Base de Datos

**Base de datos:** `link_users`
- Host: 127.0.0.1
- Puerto: 3306
- Usuario: root
- Password: (vacío)

**Usuario super admin (desarrollo):**
- Email: `scoollerx@hotmail.com`
- Password: `password`

## Comandos Útiles

### Backend
```bash
php artisan serve          # Iniciar servidor
php artisan migrate        # Ejecutar migraciones
php artisan make:migration # Crear migración
php artisan media:regenerate                 # Regenerar conversiones + aplicar watermark
php artisan media:regenerate --watermark-only # Solo reaplicar watermark
```

### Frontend
```bash
npm run dev               # Servidor de desarrollo (Vite)
npm run build             # Build de producción
npm run preview           # Servir build localmente
```

## Autor

Proyecto Link Persons - Noviembre 2025


## GraphQL API

La API GraphQL está disponible en `http://127.0.0.1:8000/graphql`.

- Esquema público de solo lectura: `http://127.0.0.1:8000/graphql/public` (usado por el frontend).
- Esquema por defecto (mutaciones protegidas): protegido con `auth:web` (sesión de Laravel).

## Autenticación con sesión (Laravel Sanctum SPA)

### Backend - API Endpoints

**Login**
```bash
POST /api/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password",
  "remember": false
}

# Respuesta exitosa (200)
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "user@example.com",
    "username": "johndoe",
    "avatar_url": "http://...",
    "roles": ["creator"]
  }
}
```

### Notas importantes sobre sesión en desarrollo (Vite)

- El guard de autenticación para GraphQL es `auth:web` y depende de la sesión de Laravel (cookie de sesión). Usamos Sanctum solo para gestionar el CSRF cookie (`/sanctum/csrf-cookie`).
- Se añadió middleware de sesión a las rutas GraphQL para que `auth:web` pueda leer la sesión:
  - `StartSession`, `ShareErrorsFromSession` en `config/graphql.php` (clave `route.middleware`).
- El proxy de Vite normaliza cookies de Laravel en desarrollo para que se guarden en `127.0.0.1:3000`:
  - Fuerza `Domain=127.0.0.1` y quita `; Secure` en `/api`, `/sanctum` y `/graphql`.
- El cliente GraphQL del front usa:
  - `/graphql/public` para esquema público y `/graphql` para esquema por defecto.
  - `credentials: 'include'` en todas las peticiones.
  - Encabezado `X-XSRF-TOKEN` tomado de la cookie `XSRF-TOKEN` cuando la request es autenticada.

### Checklist de resolución de 401 Unauthenticated (dev)

1. Backend sirviendo en `http://127.0.0.1:8000` (no mezclar `localhost`).
2. `.env` del backend:
   - `SESSION_DRIVER=database` (o `file`), `SESSION_DOMAIN=null`, `SESSION_SAME_SITE=lax`.
   - `SANCTUM_STATEFUL_DOMAINS=127.0.0.1:3000,localhost:3000`.
3. Vite proxy (front) activo y con normalización de cookies (ver `front-site/vite.config.js`).
4. Login desde el front:
   - Llama a `GET /sanctum/csrf-cookie` y luego `POST /api/login` con `credentials: 'include'`.
   - En Network, `POST /api/login` debe responder con `Set-Cookie` de sesión (HttpOnly).
5. Verificar sesión:
   - `GET /api/me` debe devolver el usuario (200). Si no, revisar cookies del sitio `127.0.0.1`.
6. Mutaciones GraphQL protegidas deben ir a `/graphql` (no `/graphql/public`).

### Cambios 2.2.0 (Actual)

**Migración a TypeScript + Optimizaciones de Performance**

Frontend (TypeScript + Optimizaciones):
- **Migración a TypeScript:**
  - Configuración completa: `tsconfig.json`, `tsconfig.node.json`
  - Vite configurado para TypeScript con soporte completo
  - Tipos completos definidos en `src/types/index.ts`:
    - Interfaces: `User`, `Gallery`, `GalleryMediaItem`, `Tag`, `Link`, `Media`
    - Contextos: `AuthContextType`, `GraphQLRequestOptions`, `GraphQLResponse`
    - Modelos: `SiteSettings`, `Page`, `ContactMessage`, `Ticket`, `TicketComment`
  - Componentes migrados a `.tsx`:
    - `MyGalleries.tsx` - Con tipos estrictos y validación
    - `GalleryDetail.tsx` - Tipos para lightGallery y props
    - `UsersGrid.tsx` - Interfaces para props y datos
  - Contextos migrados:
    - `AuthContext.tsx` - Tipado completo de autenticación
  - Utilidades migradas:
    - `graphql.ts` - Helper con tipos genéricos
  - Dependencias TypeScript instaladas:
    - `typescript`, `@types/react`, `@types/react-dom`, `@types/node`, `@types/react-router-dom`

- **Optimizaciones de Performance:**
  - **Lazy Loading de Imágenes:**
    - Atributo `loading="lazy"` en todas las imágenes de galerías
    - Atributo `decoding="async"` para decodificación asíncrona
    - UsersGrid optimizado con lazy loading de avatares
  - **Code Splitting de lightGallery:**
    - Importación dinámica de lightGallery y plugins solo cuando se necesitan
    - Reducción del bundle inicial ~50KB
    - Carga bajo demanda en GalleryDetail
  - **Limpieza de Código:**
    - Eliminados todos los `console.log` de debug en componentes de galerías
    - Mantenidos `console.error` y `console.warn` para debugging real
    - Código más limpio y profesional

Backend (Optimizaciones GraphQL):
- **Prevención N+1:**
  - `UsersQuery`: Eager loading de `tags`, `links`, `roles`
  - `GalleriesQuery`: Eager loading de `user.roles`, `media`
  - Reducción de queries a BD en listados complejos

Build & Desarrollo:
- **Build de producción optimizado:**
  - Bundle principal: ~477KB (151KB gzipped)
  - CSS optimizado: ~275KB (41KB gzipped)
  - lightGallery chunks separados para carga bajo demanda
  - Assets estáticos con cache-busting
- **TypeScript Compilation:**
  - Validación estricta habilitada
  - Sin errores de compilación
  - IntelliSense completo en VSCode

Notas de migración:
- Todos los componentes existentes en `.jsx` siguen funcionando
- Migración progresiva: nuevos componentes en `.tsx`
- Compatibilidad total con código JavaScript existente
Path aliases configurados: `@/` → `src/`

Próximos pasos: ver sección [Roadmap](#roadmap).

### Cambios 2.5.0

Personalización de Cards de Usuario


Frontend:
- Color de fondo configurable por usuario, visible solo en la página de perfil individual.
- Previsualización en tiempo real en EditProfile.
- Contraste automático del texto para asegurar legibilidad.

Backend:
- Nuevo campo `users.card_bg_color` (string, nullable) para almacenar el color HEX.
- `UpdateProfile` acepta y valida `card_bg_color` (normaliza a `#RRGGBB`).
- GraphQL `User` expone `card_bg_color` en esquemas público y autenticado.
- Filament: ColorPicker en Usuarios → Perfil público.

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

Notas técnicas:
- Validación HEX (#RGB o #RRGGBB); se almacena normalizado con `#`.
- El color personalizado solo se aplica en el perfil individual, no en el grid de exploración.
- Contraste automático (blanco/negro) según luminancia.
- Sin dependencias nuevas en frontend.

### Cambios 2.4.0

**Exploración de Usuarios Mejorada + Tema Personalizable**

Frontend:
- **Filtros avanzados en página Explorar (`/explorar`)**:
  - Filtro por etiqueta (tags) ordenadas por peso descendente
  - Buscador de texto en tiempo real por nombre de usuario o descripción
  - Filtros de rango de precio: mínimo y máximo (usuarios sin precio se toman como 0)
  - Filtros combinados con lógica AND: género + nacionalidad + tag + búsqueda + precio
  - UI responsive con inputs compactos y selectores múltiples
  - Mensajes informativos cuando no hay resultados

- **Tema personalizable (Dark/Light Mode)**:
  - Nuevo componente `ThemeSwitcher.jsx`: Botón flotante en esquina inferior derecha
  - Detección automática de preferencia del sistema (`prefers-color-scheme`)
  - Persistencia de preferencia en `localStorage`
  - Aplicación de tema vía atributo `data-bs-theme` (Bootstrap 5 nativo)
  - Iconos dinámicos: luna (modo claro) ↔ sol (modo oscuro)
  - Botón circular con shadow para mejor visibilidad
  - Accesibilidad: `aria-label` y `title` descriptivos

- **Logo en QR del Perfil**:
  - El QR del perfil ahora muestra el logo del sitio al centro
  - Renderizado con `QRCodeCanvas` y corrección de error nivel `H`
  - Embebido nativo vía `imageSettings` (sin overlays separados)
  - Carga del logo desde `siteSettings.logo_url`
  - Tamaño configurable desde `SiteSettings.qr_logo_size` (px, default 48)
  - Descarga directa como PNG con el logo embebido (imagen única)
  - Versión de descarga en alta resolución (800px) generada offscreen

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

Backend:
- **GraphQL**:
  - Query `users` ya incluye campo `tags` con `id`, `name`, `color`, `icon`, `weight`
  - Query `tags` retorna todas las etiquetas ordenadas por peso
  - Campo `price_from` disponible en `UserType` para filtros de precio

Experiencia de Usuario:
- Exploración más rápida con múltiples criterios simultáneos
- Filtros visuales con banderas de países y badges de género
- Búsqueda instantánea sin necesidad de enviar formulario
- Tema oscuro reduce fatiga visual en sesiones largas
- Preferencia de tema se mantiene entre sesiones

Notas técnicas:
- `ThemeSwitcher` se renderiza en `App.jsx` fuera del Router
- Compatible con todos los temas Bootstrap 5
- Sin dependencias externas adicionales
- Filtros client-side (100% en frontend) para respuesta inmediata
- Precio sin valor (`null`) se normaliza a `0` en filtro

### Cambios 2.3.9

Mejoras y correcciones enfocadas en galerías, perfil y UX de seguimiento.

Backend:
- Gestión de medios en galerías:
  - Al quitar una imagen de una galería, si el medio no queda referenciado por ninguna otra galería, se elimina del disco y de la base de datos.
  - Al eliminar una galería, se eliminan también los medios que queden huérfanos (no usados en otras galerías).
  - Nuevo comando Artisan: `media:clean-orphans` para detectar y limpiar medios huérfanos (opción `--dry-run`).
- Watermark:
  - Verificado que se aplica tanto a originales como a conversiones cuando está habilitado en SiteSettings. Limpieza de logs de depuración.
- GraphQL:
  - Fix de tipo en `deleteGallery`: el argumento `id` ahora se maneja como `Int!` en el frontend (evita "Variable $id of type ID! used in position expecting Int!").
- Galerías privadas (lista de permitidos):
  - Nueva relación de permisos por galería para seleccionar seguidores específicos con acceso.
  - Migración `gallery_allowed_users` (pivot) con claves foráneas y `unique` por par.
  - Campo `allowed_user_ids` expuesto en `GalleryType` (solo visible para el propietario).
  - Mutación `updateGalleryAllowedUsers` que sincroniza la lista (válida solo con seguidores del propietario).

Frontend:
- Perfil (`UserProfile.jsx`):
  - Visibilidad del tab "Galerías" basada en `galleries_count` del usuario del perfil.
  - Estadísticas (seguidores/siguiendo/vistas) y botón Seguir basados en los roles del usuario del perfil (no del visitante).
  - Botón Seguir visible para todos cuando el perfil es de un creador; requiere login para accionar. Tooltip: "Inicia sesión para seguir".
  - Mensajes de éxito/error en español para seguir/dejar de seguir.
- Editor de Galería (`EditGallery.jsx`):
  - Selector multiusuario para permitir acceso a seguidores cuando la galería es privada.
  - Carga de `allowed_user_ids` y listado de seguidores; actualización vía mutación.
  - Toggle "Permitir a todos mis seguidores" para seleccionar automáticamente a todos los seguidores y deshabilitar la selección manual (sin cambios adicionales en backend).

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

### Cambios 2.3.7

**Upload de Avatar desde Frontend**

Frontend:
- **FilePond en EditProfile**:
  - Componente de upload integrado con preview instantáneo
  - Validación: Máx 10MB, formatos JPG/PNG/WEBP
  - Drag & drop y selector de archivos
  - Eliminación automática si se cancela el upload (revert)

- **Flujo de upload**:
  1. Upload temporal a colección `avatar_temp` vía `/api/avatar/upload`
  2. Preview inmediato con thumbnail generado por Spatie
  3. Al guardar formulario, ejecuta mutación `updateAvatar`
  4. Avatar se mueve de colección temporal a definitiva

Backend:
- **UpdateAvatarMutation**:
  - Recibe `media_id` del archivo previamente subido
  - Valida que el media pertenezca al usuario autenticado
  - Elimina avatar anterior automáticamente (singleFile)
  - Mueve media de `avatar_temp` a `avatar`

- **AvatarUploadController**:
  - `POST /api/avatar/upload`: Sube a colección temporal, retorna media_id
  - `DELETE /api/avatar/revert`: Elimina upload temporal si se cancela
  - Autenticación requerida con middleware `auth:web`

- **User Model**:
  - Nueva colección `avatar_temp` para uploads no confirmados
  - `singleFile()` asegura solo un avatar por usuario
  - Thumbnails automáticos según configuración de SiteSettings

Integración:
- FilePond plugins: ImagePreview, FileValidateType, FileValidateSize
- Proxy Vite: `/api` ya configurado para desarrollo
- Mutations registradas en esquema GraphQL `default`

Actualización requerida:
```bash
cd back-admin
php artisan config:clear
```

### Cambios 2.3.6

**Banderas de países y filtros de exploración**

Frontend:
- **Utilidades de países (`countryUtils.ts`)**:
  - `getCountryFlag(code)`: Convierte códigos ISO 3166-1 alpha-2 a emojis de banderas Unicode
  - `getCountryName(code)`: Obtiene nombres de países en español
  - `getCountryDisplay(code)`: Retorna formato "🇨🇱 Chile"
  - Soporta 25+ países latinoamericanos y principales países

- **Componentes actualizados con banderas**:
  - `UsersGrid.tsx`: Muestra solo emoji de bandera en lugar de código de país
  - `UserProfile.jsx`: Muestra bandera + nombre completo del país
  - `EditProfile.jsx`: Selectores de país con banderas en las opciones
  - `Explore.jsx`: Filtros por género y nacionalidad con banderas

- **Filtros en página Explorar**:
  - Filtro por género: Todos/Hombre/Mujer/Trans/Otro
  - Filtro por nacionalidad: Lista completa con banderas emoji
  - Ambos filtros funcionan en conjunto
  - Diseño responsive con `gap-2` y `flex-wrap`

Backend:
- **Corrección de almacenamiento de países**:
  - `UserForm.php`: Eliminado `dehydrateStateUsing` que guardaba nombres completos
  - Ahora guarda códigos ISO estándar (CL, AR, CO, etc.) en campos `nationality` y `country`
  - `afterStateHydrated` mantiene compatibilidad con datos antiguos

- **Migración de datos**:
  - Comando `users:fix-country-codes`: Convierte nombres de países existentes a códigos ISO
  - Actualiza registros en batch procesando campos `nationality` y `country`
  - Usa `monarobase/country-list` para mapeo de nombres a códigos

Correcciones:
- Fix: Banderas no se renderizaban por string vacío - función `getCountryFlag` más tolerante
- Fix: Datos inconsistentes entre backend y frontend - migración completada
- Fix: Chile aparecía como Suiza - backend guardaba "Chile" (nombre) en vez de "CL" (código)

Actualización requerida:
```bash
cd back-admin
php artisan users:fix-country-codes
php artisan optimize:clear
```

### Cambios 2.1.0

**Sistema de Galerías - Frontend Completo**

Frontend (React + lightGallery + FilePond):
- **Páginas implementadas:**
  - `/mis-galerias` (`MyGalleries.jsx`): Lista de galerías propias con acciones (editar/eliminar)
  - `/mis-galerias/nueva` (`NewGallery.jsx`): Formulario para crear galería
  - `/mis-galerias/:id/editar` (`EditGallery.jsx`): Editor completo de galería con gestión de medios
  - `/galerias/:id` (`GalleryDetail.jsx`): Visualización pública con lightGallery viewer
  - `/u/:username/galleries` (`UserGalleries.jsx`): Galerías públicas de un usuario

- **Características del Editor (EditGallery):**
  - Upload de imágenes: FilePond con validación (jpeg/png/webp/gif, max 20MB)
  - Preview instantáneo con thumbnails de Spatie Media Library
  - Drag-and-drop reordering: Reordena imágenes visualmente y persiste en BD
  - Eliminar imágenes: Confirmación modal antes de eliminar
  - Adjuntar uploads: Cola de uploads pendientes → botón "Agregar a galería (N)"
  - Revert automático: Al cancelar upload, elimina imagen del servidor (evita basura)
  - Metadata editable: Título, descripción, visibilidad (público/privado/seguidores)

- **Viewer (GalleryDetail):**
  - lightGallery v2.9.0: Lightbox completo con zoom, fullscreen, thumbnails, share
  - Plugins: thumbnail, zoom, fullscreen (carga dinámica asíncrona)
  - Grid responsivo: CSS Grid con hover effects y aspect ratio 4:3
  - Badges: Visibilidad con íconos (globo/candado/personas)
  - Sin captions: Solo imágenes limpias sin nombres/descripciones visibles
  - Botón "Editar": Visible solo para propietarios autenticados

- **Integraciones:**
  - GraphQL mutations: `createGallery`, `updateGallery`, `deleteGallery`, `addMediaToGallery`, `removeMediaFromGallery`, `reorderGalleryMedia`
  - API upload: `POST /api/gallery-media/upload` (retorna {media_id, url, thumb_url})
  - API revert: `DELETE /api/gallery-media/revert` (elimina media no adjunto)
  - Vite proxy: `/gallery-media` proxied a Laravel backend
  - Autenticación: Todas las mutaciones usan `schema: 'default'` con `authenticated: true`

Backend (Correciones):
- **GalleryPolicy**: Agregado método `manageMedia(user, gallery)` → solo owner puede gestionar medios
- **CreateGalleryMutation**: Restricción por rol → solo `admin`, `super_admin`, `creator` pueden crear galerías
- **UserQuery**: Autorización de perfiles → solo perfiles con rol público (`admin`, `moderator`, `creator`) son accesibles; usuarios normales solo ven su propio perfil o si son admin/moderador
- **UserType**: Nuevo campo `has_public_profile` (boolean) → indica si el perfil es accesible públicamente

Restricciones de acceso:
- **Crear galerías**: Solo admin, super_admin, creator
- **Ver perfiles**: Público solo para admin/moderator/creator; resto privado (solo owner o admin/moderator pueden ver)
- **Gestionar medios de galería**: Solo el propietario de la galería
- **QR del perfil**: Solo visible si `has_public_profile === true`

UI/UX:
- Bootstrap 5: Cards, modals, badges, buttons, alerts
- FilePond: CSS personalizado con preview de imágenes
- lightGallery: Tema default con controles táctiles
- Feedback visual: Spinners, mensajes de éxito/error, confirmaciones
- Navegación: Breadcrumbs, botones contextuales (volver, editar, eliminar)
- Responsive: Grid adaptativo con breakpoints móvil/desktop

Configuración requerida:
- Frontend: `npm install filepond filepond-plugin-image-preview filepond-plugin-file-validate-type filepond-plugin-file-validate-size react-filepond lightgallery`
- Vite proxy: Configurado para `/gallery-media` en `vite.config.js`
- CORS: Habilitado para `127.0.0.1:3000` en backend

Depuración implementada:
- Console logs extensivos en upload/attach flow para troubleshooting
- Validación de serverId extraction desde FilePond response
- Error handling con try/catch en todas las mutaciones
- Logging de upload queue state updates

Próximos pasos: ver sección [Roadmap](#roadmap).

### Cambios 1.10.0

**Sistema de Tickets/Soporte completo**

Backend:
- Modelos: `Ticket` (creator, assigned_to, category, priority, status, subject, description, resolution, timestamps) y `TicketComment` (ticket_id, user_id, comment, is_internal).
- Migraciones: `2025_11_17_200001_create_tickets_table` y `create_ticket_comments_table`.
- Constantes de estado: `STATUS_OPEN`, `STATUS_IN_PROGRESS`, `STATUS_RESOLVED`, `STATUS_CLOSED`, `STATUS_REOPENED`.
- Prioridades: `baja`, `media`, `alta`, `urgente`.
- Categorías: `tecnico`, `facturacion`, `cuenta`, `contenido`, `otro`.

GraphQL (público y autenticado):
- **Esquema público**:
  - Query `tickets(user_id, status, priority, category)` con filtros.
  - Query `ticket(id)` para detalle.
  - Mutation `createTicket(user_id, subject, description, category, priority)` con validación y throttle (5/hora por IP).
- **Esquema default (auth:web)**:
  - Mutation `addTicketComment(ticket_id, comment, is_internal)` (usuarios autenticados pueden comentar en sus tickets o tickets asignados; admins en cualquiera).
  - Mutation `updateTicket(id, status, assigned_to, resolution)` (solo admins/moderadores).
- Tipos: `TicketType` y `TicketCommentType` con relaciones a `User`, campos de timestamps formateados, `commentsCount`.
- Validaciones: min/max length, enums estrictos, autorización por rol.

Frontend (React):
- Páginas:
  - `/tickets` (`Tickets.jsx`): Lista de tickets del usuario con filtros y badges de estado/prioridad.
  - `/tickets/nuevo` (`NewTicket.jsx`): Formulario para crear ticket (campos: subject, description, category, priority).
  - `/tickets/:id` (`TicketDetail.jsx`): Detalle del ticket con timeline de comentarios y formulario para agregar comentarios.
- Componentes:
  - `ProtectedRoute.jsx`: Guard de autenticación que redirige a `/login` si no autenticado.
- Navegación: Link "Mis Tickets" con icono de campana en menú principal (solo visible si autenticado).
- Integración GraphQL: Usa helper `graphqlRequest` con esquema `public` para crear/listar y esquema `default` para comentar.
- UI: Bootstrap 5 con badges de colores (estado: success/warning/danger, prioridad: info/warning/danger).

Filament Resource (Panel Admin):
- Recurso: `TicketResource` con nombre español "Tickets de Soporte" e icono de campana (`Heroicon::OutlinedBell`).
- Formulario (`TicketForm.php`):
  - Sección "Ticket": subject (deshabilitado), description (textarea deshabilitado), category/priority/status (selects editables), assigned_to (select de admins/moderadores), resolution (textarea).
  - Sección "Metadata": user_id (select deshabilitado), campos de timestamps (`created_at`, `first_response_at`, `resolved_at`, `closed_at`) editables manualmente (colapsable).
- Tabla (`TicketsTable.php`):
  - Columnas: ID, Asunto, Usuario, Estado (badge), Prioridad (badge), Categoría, Asignado a, Creado.
  - Badges con colores: estado (open=warning, in_progress=info, resolved=success, closed=secondary), prioridad (baja=info, media=warning, alta=danger, urgente=danger).
  - Filtros: status, priority, category (selects con opciones en español).
- Relation Manager (`CommentsRelationManager`):
  - Muestra comentarios del ticket en tabla: Fecha, Usuario, Comentario, Interno (badge).
  - Filtro interno de comentarios: solo admins/moderadores ven comentarios internos (vía query DB a `model_has_roles`).
  - CreateAction para agregar comentarios desde el panel (checkbox `is_internal` solo visible para admins).
- Badge de navegación: Muestra conteo de tickets abiertos en tiempo real.

Dashboard Widget:
- Widget: `TicketsOverview` en `/admin` (dashboard).
- Estadísticas: 4 tarjetas con conteo y tendencia (+N últimos 7 días):
  - Tickets Abiertos (rojo/danger).
  - En Progreso (azul/info).
  - Resueltos (verde/success).
  - Urgentes (naranja/warning).
- Cada tarjeta clickable: redirige a tabla de tickets con filtro preseleccionado (`tableFilters`).
- Registrado en `AdminPanelProvider.php` en array `->widgets()`.

Email Notifications:
- **TicketCreated**: Notifica a admins y moderadores cuando se crea un nuevo ticket.
  - Template: `resources/views/emails/ticket-created.blade.php`.
  - Contenido: Detalles del ticket (ID, asunto, descripción, categoría, prioridad) + link al admin panel.
  - Enviado: Al ejecutar mutación `createTicket`, se consulta `User::whereHas('roles', ...)` y se envía a todos los admins/moderadores.
  
- **TicketResponseReceived**: Notifica al usuario cuando un admin comenta en su ticket (solo si no es comentario interno).
  - Template: `resources/views/emails/ticket-response-received.blade.php`.
  - Contenido: Detalles del comentario (quién respondió, fecha, texto) + link al ticket en frontend (`/tickets/{id}`).
  - Enviado: Al ejecutar mutación `addTicketComment`, si el comentador es admin y el comentario no es interno.
  
- **TicketAssigned**: Notifica al admin asignado cuando se le asigna un ticket.
  - Template: `resources/views/emails/ticket-assigned.blade.php`.
  - Contenido: Detalles del ticket con highlighting de prioridad + link al admin panel.
  - Enviado: Al ejecutar mutación `updateTicket`, si cambia `assigned_to`.

- Configuración requerida en `.env`:
  ```bash
  MAIL_MAILER=smtp
  MAIL_HOST=smtp.mailtrap.io  # o tu SMTP real
  MAIL_PORT=2525
  MAIL_USERNAME=tu_usuario
  MAIL_PASSWORD=tu_password
  MAIL_ENCRYPTION=tls
  MAIL_FROM_ADDRESS=noreply@linkpersons.com
  MAIL_FROM_NAME="${APP_NAME}"
  ```

Observer de eventos:
- `TicketObserver`: Detecta automáticamente cambios en `assigned_to` y envía email al admin asignado.
- Registrado en `AppServiceProvider`: funciona tanto desde Filament como desde GraphQL sin duplicar código.

Actualización requerida:
- Comentarios: Solo propietario del ticket, asignado, o admins pueden comentar.
- Actualización de tickets: Solo admins/moderadores pueden cambiar status/assigned_to/resolution.
- Asignación de tickets: Solo usuarios con rol admin/moderador pueden ser asignados a tickets (validación en Filament y GraphQL).
- Filtro de comentarios internos: Implementado con query directa a `model_has_roles` (evita método `hasAnyRole` indefinido).
- Rate limiting: `createTicket` throttled a 5 tickets/hora por IP en esquema público.

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

Notas:
- Widget de estadísticas proporciona visibilidad inmediata del estado de tickets en el dashboard.
- Sistema de emails cierra el loop de comunicación: admins notificados de nuevos tickets, usuarios notificados de respuestas, admins asignados notificados de asignación.
- Frontend permite a usuarios crear tickets y dar seguimiento sin acceso al panel admin.
- Sistema completo listo para producción con validaciones, autorización y notificaciones.

### Cambios 1.9.0

**Sistema de Contacto completo**

Backend:
- Modelo `ContactMessage` con campos: name, email, subject, message, status (new/read/responded/closed), ip_address, user_agent, user_id (opcional si autenticado), admin_response.
- Migración: `2025_11_17_170001_create_contact_messages_table`.

GraphQL (público):
- Mutación `createContactMessage(name, email, subject, message, website)` en esquema `public`.
- Tipo `ContactMessage` con campos: id, name, email, subject, message, status, created_at.
- Validaciones: min/max length, email format.
- Honeypot: campo `website` debe estar vacío (anti-spam).
- Rate limiting: 5 mensajes por hora por IP.
- Tipo DateTime personalizado: `DateTimeType` scalar type para fechas formateadas.

Emails automáticos:
- `ContactMessageReceived`: Notifica a admin cuando llega nuevo mensaje.
- `ContactMessageAutoReply`: Auto-respuesta al usuario confirmando recepción.
- Configuración: `MAIL_ADMIN_CONTACT_EMAIL` en `.env` (fallback: `MAIL_FROM_ADDRESS`).
- Templates HTML en `resources/views/emails/contact-message-received.blade.php` y `contact-message-auto-reply.blade.php`.

Filament Resource:
- Panel admin en `/admin/mensajes-de-contacto`.
- Nombre en español: "Mensajes de Contacto".
- Icono: Sobre (Heroicon::OutlinedEnvelope).
- Sin botón "crear" (solo recepción desde formulario público).
- Filtros por estado con badges de color (Nuevo/Leído/Respondido/Cerrado).
- Formulario con secciones:
  - **Mensaje del usuario**: Campos read-only (nombre, email, asunto, mensaje, fecha recibido).
  - **Gestión**: Status editable + campo de respuesta/notas (textarea).
  - **Metadata**: IP, user agent, user_id (colapsable).
- Badge de navegación: cuenta mensajes nuevos en tiempo real.

Frontend:
- Página dedicada `/contacto-form` (`Contact.jsx`).
- Formulario con validación client-side (min/max caracteres).
- Honeypot oculto con `display:none`.
- Feedback visual: alerts de éxito/error con Bootstrap.
- Reset automático del form tras envío exitoso.
- Indicador visual de envío ("Enviando...").

Configuración requerida en `.env`:
```bash
MAIL_MAILER=smtp
MAIL_HOST=smtp.mailtrap.io  # o tu SMTP real
MAIL_PORT=2525
MAIL_USERNAME=tu_usuario
MAIL_PASSWORD=tu_password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@linkpersons.com
MAIL_FROM_NAME="${APP_NAME}"
MAIL_ADMIN_CONTACT_EMAIL=admin@linkpersons.com
```

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

### Cambios 1.8.1

- Fix: 401 en mutaciones de seguidores (follow/unfollow) por sesión no disponible en GraphQL.
  - Se añadió `StartSession`/`ShareErrorsFromSession` a GraphQL (`config/graphql.php`).
  - Se actualizó Vite proxy para normalizar `Set-Cookie` (dominio `127.0.0.1`, sin `Secure` en dev).
  - Cliente GraphQL: endpoints fijos (`/graphql` y `/graphql/public`) y envío de `X-XSRF-TOKEN` en autenticadas.
  - Mutaciones `FollowUser`/`UnfollowUser` migradas a `auth('web')`.

**Logout**
```bash
POST /api/logout
# Requiere autenticación (cookie)
```

**Usuario autenticado**
```bash
GET /api/me
# Requiere autenticación (cookie)

# Respuesta (200)
{
  "user": { ... }
}

# No autenticado (401)
{
  "message": "Unauthenticated."
}
```

### Frontend - React Integration

**1. Proveedor de Autenticación**

Envuelve tu app con `AuthProvider`:

```jsx
import { AuthProvider } from './contexts/AuthContext';

<AuthProvider>
  <App />
</AuthProvider>
```

**2. Hook useAuth()**

```jsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, login, logout, loading } = useAuth();

  if (loading) return <Spinner />;

  return (
    <div>
      {isAuthenticated ? (
        <>
          <p>Hola, {user.name}</p>
          <button onClick={logout}>Cerrar Sesión</button>
        </>
      ) : (
        <a href="/login">Iniciar Sesión</a>
      )}
    </div>
  );
}
```

**3. Login Programático**

```jsx
const { login } = useAuth();

try {
  const user = await login(email, password, remember);
  console.log('Login exitoso:', user);
} catch (error) {
  console.error(error.message);
}
```

**4. GraphQL con Autenticación**

```jsx
import { graphqlRequest } from '../lib/graphql';

// Mutación autenticada (schema: 'default')
const data = await graphqlRequest({
  query: `mutation { createLink(...) { id } }`,
  schema: 'default',  // Automáticamente incluye credentials: 'include'
  authenticated: true
});
```

### Configuración Importante

**Dominios Stateful** (`config/sanctum.php`):
```php
'stateful' => [
  'localhost',
  'localhost:3000',
  '127.0.0.1',
  '127.0.0.1:3000',
  '127.0.0.1:8000',
  '::1'
]
```

**Middleware Stateful API** (`bootstrap/app.php`):
```php
->withMiddleware(function (Middleware $middleware): void {
    $middleware->statefulApi();
})
```

**GraphQL con Sanctum** (`config/graphql.php`):
```php
'schemas' => [
    'default' => [
        'middleware' => ['auth:sanctum'],
        // mutations protegidas
    ],
    'public' => [
        'middleware' => null,
        // solo queries públicas
    ]
]
```

### Flujo de Autenticación

1. Frontend visita `/login`
2. React fetch a `/sanctum/csrf-cookie` (obtiene token CSRF)
3. POST `/api/login` con email/password
4. Laravel autentica y crea sesión
5. Backend responde con datos del usuario
6. React guarda usuario en `AuthContext` y `localStorage`
7. Navegación muestra estado autenticado
8. Al recargar (F5), el usuario se restaura desde `localStorage`
9. GraphQL mutations usan `credentials: 'include'` para enviar cookies

### Persistencia de Sesión

El sistema utiliza **localStorage** para mantener el estado del usuario entre recargas:

```jsx
// Al login exitoso
localStorage.setItem('user', JSON.stringify(userData));

// Al montar la app
const storedUser = localStorage.getItem('user');
if (storedUser) {
  setUser(JSON.parse(storedUser));
}

// Al logout
localStorage.removeItem('user');
```

**Ventajas:**
- ✅ Persiste entre recargas de página
- ✅ Funciona con proxy de desarrollo (Vite)
- ✅ No depende de cookies entre puertos diferentes
- ✅ Compatible con SPAs modernas

### Notas de Seguridad

- ✅ Cookies de sesión con `SameSite=Lax`
- ✅ CSRF token en cada request (excluido de `/api/*`)
- ✅ Dominios whitelist en Sanctum
- ✅ CORS habilitado solo para orígenes confiables
- ✅ Session invalidation en logout
- ✅ LocalStorage solo para datos no sensibles del usuario
- ✅ Middleware de sesión en rutas API: `auth:web`

### Esquema y Tipos
- Tipos: `User`, `Tag`, `Link`
- Consultas:
  - `users(limit, search)` → lista de usuarios con `tags` y `links`
  - `user(id|username)` → un usuario con `tags` y `links`
  - `tags(onlySelectable)` → lista de tags (si `onlySelectable=true`, excluye fijos)
- Mutaciones:
  - `createLink(user_id, name, url, icon?, order?)` → `Link`
  - `updateLink(id, name?, url?, icon?, order?)` → `Link`
  - `deleteLink(id)` → `Boolean`
  - `reorderLinks(user_id, ids:[ID!]!)` → `User` (con `links` reordenados)
  - `assignUserTags(user_id, tag_ids:[ID!]!)` → `User`

### Reglas de Autorización
- Las mutaciones requieren estar autenticado.
- Se permite si:
  - Tienes permiso Shield `Update:User` (rol admin/gestor), o
  - Eres el propietario del recurso (mismo `user_id`).
- `assignUserTags` (no admin):
  - No puede agregar ni quitar tags fijos (`is_fixed = true`).
  - Se preservan los tags fijos ya asignados.

### Ejemplos Rápidos

Ejecuta estas operaciones en una herramienta GraphQL (o navegador con sesión iniciada):

Consulta de usuarios
```
query {
  users(limit: 5) {
    id
    name
    username
    avatar_thumb
    tags { id name is_fixed }
    links { id name url icon order }
  }
}
```

Crear link
```
mutation {
  createLink(user_id: 1, name: "GitHub", url: "https://github.com", icon: "fab fa-github") {
    id
    name
    url
    icon
    order
  }
}
```

Actualizar link
```
mutation {
  updateLink(id: 5, name: "Sitio personal", icon: "fas fa-link") {
    id
    name
    icon
    order
  }
}
```

Eliminar link
```
mutation {
  deleteLink(id: 5)
}
```

Reordenar links (primer ID tendrá order=0)
```
mutation {
  reorderLinks(user_id: 1, ids: [10, 12, 9]) {
    id
    links { id name order }
  }
}
```

Asignar tags (reemplaza asignación completa)
```
mutation {
  assignUserTags(user_id: 1, tag_ids: [2, 3, 4]) {
    id
    tags { id name is_fixed }
  }
}
```

### Notas
- Método permitido: GET y POST (útil para pruebas rápidas en navegador).
- Para el frontend público se recomienda añadir Sanctum/Tokens si no se usan cookies de sesión del admin.



# Media Management System - Guía de Uso

## Backend (Laravel + Spatie Media Library + Filament)

### Modelo Post Creado
El modelo `Post` incluye:
- **Campos**: title, content, status, user_id, is_approved
- **Colecciones de medios**: 
  - `images` - Hasta 10 imágenes (5MB cada una)
  - `videos` - Hasta 3 videos (50MB cada uno)
- **Conversiones automáticas**:
  - `thumb` - 368x232px
  - `preview` - 800x600px

### Panel de Administración Filament
Accede a: `http://localhost:8000/admin/posts`

**Características:**
- ✅ Upload múltiple de imágenes con preview
- ✅ Upload de videos
- ✅ Editor de imágenes integrado
- ✅ Reordenar archivos drag & drop
- ✅ Filtros por estado y aprobación
- ✅ Moderación con toggle de aprobación
- ✅ Thumbnails en tabla
- ✅ Búsqueda por título y usuario

### API Endpoints

```bash
# Upload de archivos
POST /api/upload
Body: file, post_id?, collection

# Obtener medios de un post
GET /api/posts/{post}/media/{collection}

# Eliminar medio
DELETE /api/media
Body: media_id
```

## Frontend (React + FilePond + Bootstrap)

### Componentes Creados

#### 1. FileUploader (Base)
```jsx
import FileUploader from './components/FileUploader';

<FileUploader
  acceptedFileTypes={['image/*']}
  maxFileSize="5MB"
  allowMultiple={true}
  maxFiles={10}
  onUploadComplete={(file) => console.log(file)}
/>
```

#### 2. ImageUploader
```jsx
import ImageUploader from './components/ImageUploader';

<ImageUploader onUploadComplete={handleUpload} />
```

#### 3. VideoUploader
```jsx
import VideoUploader from './components/VideoUploader';

<VideoUploader onUploadComplete={handleUpload} />
```

### Características Frontend
- ✅ Drag & drop
- ✅ Preview instantáneo
- ✅ Validación de tipo y tamaño
- ✅ Progress bars
- ✅ Múltiples archivos
- ✅ Reordenar archivos

## Uso en tus Modelos

```php
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;

class YourModel extends Model implements HasMedia
{
    use InteractsWithMedia;

    public function registerMediaCollections(): void
    {
        $this->addMediaCollection('images')
            ->acceptsMimeTypes(['image/jpeg', 'image/png'])
            ->maxFilesize(5 * 1024 * 1024);
    }
}
```

## En Filament Resource

```php
use Filament\Forms\Components\SpatieMediaLibraryFileUpload;

SpatieMediaLibraryFileUpload::make('images')
    ->collection('images')
    ->multiple()
    ->image()
    ->imageEditor()
    ->maxFiles(10)
    ->reorderable()
```

## Configuración Necesaria

1. **Crear base de datos** `link_persons_admin` en MySQL
2. **Ejecutar migraciones**: `php artisan migrate`
3. **Crear usuario admin**: `php artisan make:filament-user`
4. **Configurar CORS** en `config/cors.php` para el frontend
5. **Storage link**: `php artisan storage:link`

## Watermark de Imágenes

El sistema aplica un watermark de texto sobre todas las imágenes de usuarios (avatar y medios) cuando está habilitado en configuración.

### Configuración (SiteSettings → Tab Medios)
- **Habilitar Watermark**: Toggle general.
- **Texto**: Contenido a estampar.
- **Posición**: Esquinas/centro.
- **Opacidad**: 0–100 (vía PNG con alpha).
- **Tamaño**: Tamaño del texto.
- **Fuente**: Seleccionable desde archivos `.ttf`.

### Fuentes TTF
- Ubicación: `back-admin/storage/app/fonts`
- Copia tus `.ttf` en esa carpeta; aparecerán automáticamente en el selector.

### Funcionamiento
- Se aplica al **original** al agregar media y a cada **conversión** al completarse (eventos de Spatie ML).
- Colecciones excluidas: `logo`, `favicon`, `default_avatar`.
- La vista de medios muestra preview; al hacer click abre la imagen en una nueva pestaña.

### Reprocesado Masivo
- En `Admin → Media`, selecciona imágenes y usa la acción:
  - `Regenerar Thumbnails y Watermark` (bulk action)
- Por consola:

```bash
cd back-admin
php artisan media:regenerate            # Regenera conversiones + reaplica watermark
php artisan media:regenerate --watermark-only  # Solo reaplica watermark, sin regenerar
```

### Nota sobre nombres de archivo
- Para evitar errores de Livewire en temporales, se valida que el **nombre original del archivo** no supere **50 caracteres** en el formulario de Usuario.

## Sistema de Páginas Dinámicas

El sistema permite gestionar páginas estáticas del sitio desde el panel de administración.

### Backend (Laravel + Filament)

Acceso: `http://localhost:8000/admin/pages`

**Modelo Page:**
- `title` - Título de la página
- `slug` - URL amigable (ej: terminos-y-condiciones)
- `content` - Contenido HTML (editor rico)
- `status` - Estado: draft (borrador) o published (publicado)
- `order` - Orden de aparición en menús
- `is_system` - Marca páginas del sistema (no eliminables)

**Características del Panel:**
- ✅ Editor rico con formato (negritas, listas, encabezados, enlaces, código)
- ✅ Generación automática de slug desde el título
- ✅ Páginas del sistema protegidas contra eliminación
- ✅ Filtros por estado (borrador/publicado) y tipo (sistema/personalizada)
- ✅ Ordenamiento personalizable
- ✅ Búsqueda por título y slug

**Páginas del Sistema (incluidas por defecto):**
1. Inicio (`/`)
2. Términos y Condiciones (`/terminos-y-condiciones`)
3. Política de Privacidad (`/politica-de-privacidad`)
4. Contacto (`/contacto`)
5. Preguntas Frecuentes (`/faqs`)

### GraphQL API

**Queries disponibles (esquema público):**

```graphql
# Obtener lista de páginas
query {
  pages(status: "published", is_system: true) {
    id
    title
    slug
    content
    status
    order
    is_system
    created_at
    updated_at
  }
}

# Obtener una página específica por slug
query {
  page(slug: "terminos-y-condiciones") {
    id
    title
    content
  }
}
```

### Frontend (React)

**Rutas configuradas:**
- `/` - Home (carga contenido desde página "inicio")
- `/explorar` - Listado de usuarios (antes estaba en Home)
- `/terminos-y-condiciones` - Términos y condiciones (ES)
- `/politica-de-privacidad` - Política de privacidad (ES)
- `/contacto` - Información de contacto (ES)
- `/preguntas-frecuentes` - Preguntas frecuentes (ES)
- `/terms-and-conditions` - Terms and Conditions (EN)
- `/privacy-policy` - Privacy Policy (EN)
- `/contact` - Contact (EN)
- `/faqs` - Frequently Asked Questions (EN)

**Componentes:**
- `Home.tsx` - Página de inicio con contenido dinámico
- `Explore.tsx` - Exploración de usuarios con filtros
- `Page.tsx` - Componente genérico para páginas estáticas
- `Navigation.tsx` - Menú con dropdown "Información"

**Uso en React:**
```jsx
import { graphqlRequest } from '../lib/graphql/graphqlRequest';

// Cargar página por slug
const response = await graphqlRequest({
  query: `
    query {
      page(slug: "contacto") {
        id
        title
        content
      }
    }
  `
});

// Renderizar contenido HTML
<div dangerouslySetInnerHTML={{ __html: response.page.content }} />
```

**Navegación:**
- Menú principal incluye link "Explorar"
- Dropdown "Información" con acceso a todas las páginas estáticas
- URLs limpias y amigables para SEO

**Notas de i18n de páginas:**
- `Page.tsx` resuelve el slug según el idioma activo (`i18n.language`) usando una tabla de equivalencias entre ES/EN.
- Si el slug preferido para el idioma no existe, se intenta el slug en español como fallback.
- Ejemplo: en idioma EN, visitar `/preguntas-frecuentes` cargará contenido de la página con slug `faqs`.

### Uso Avanzado

**Crear una página personalizada:**
1. Ir a `Admin → Páginas → Crear`
2. Ingresar título (el slug se genera automático)
3. Escribir contenido con el editor rico
4. Seleccionar estado "Publicado"
5. Definir orden (para menús futuros)
6. Guardar

**Agregar ruta en el frontend:**
```jsx
// En App.jsx
import Page from './pages/Page';

<Route path="/mi-pagina-nueva" element={<Page />} />
```

**Nota:** El componente `Page.jsx` extrae automáticamente el slug de la URL y carga el contenido correspondiente.

## Sugerencias y Mejores Prácticas de Implementación

### Arquitectura y Patrones

**Chat y Mensajería:**
- Empezar con mutaciones GraphQL + polling (cada 5-10 segundos) para MVP
- Evaluar WebSockets solo si polling genera problemas de carga
- GraphQL Subscriptions requieren cambios significativos de stack (considerar costo/beneficio)

**Impersonación de Usuarios:**
- Sin dependencias externas: agregar flag `impersonating_user_id` en sesión
- Implementar middleware que verifique este flag y cargue usuario correcto
- Permisos estrictos: solo super_admin con auditoría completa de acciones
- Registrar en tabla `audit_log`: quién, a quién, cuándo, qué hizo
- Si se requiere algo más robusto, evaluar paquete dedicado después del MVP

**Galerías Privadas:**
- Usar políticas de Laravel para controlar acceso (Policy `viewMedia`)
- Generar rutas firmadas temporales para recursos privados: `URL::temporarySignedRoute()`
- Evitar exponer URLs públicas directas en `storage/app/private`
- Considerar middleware de verificación en rutas de medios sensibles

**Seguimiento de Vistas:**
- Implementar middleware que capture visitas y persista en tabla `profile_views`
- Job/Queue para agregar conteos periódicamente (evitar writes constantes)
- Cache de rankings: actualizar top usuarios cada hora con comando scheduled
- Índices en BD: `user_id`, `visited_at` para queries eficientes

**Sistema de Seguimiento (Follow/Favorite):**
- ✅ Implementado en v1.7.2
- Tabla pivote `user_follower` con índices en ambas FK
- Contadores cacheados: `followers_count`, `following_count` en modelo User
- Usar eventos de Eloquent para actualizar contadores automáticamente
- Notificaciones opcionales: Queue job al recibir nuevo seguidor

**Sistema de Contacto:**
- ✅ Implementado en v1.9.0
- Frontend: Componente React con formulario (nombre, email, asunto, mensaje)
- Validación: client-side + server-side con Laravel
- GraphQL mutation: `createContactMessage` (esquema público, throttle: 5/hora)
- Backend: Tabla `contact_messages` (status: nuevo/leído/respondido/cerrado)
- Notificaciones: Laravel Mail para notificar admins + auto-respuesta al usuario
- Panel admin: Recurso Filament con filtros por estado, búsqueda, respuesta inline

### Sistema de Tickets/Soporte

**Arquitectura propuesta:**
- Modelo `Ticket` relacionado con `User` (creator) y `User` (assigned_to)
- Estados: `abierto`, `en_progreso`, `resuelto`, `cerrado`, `reabierto`
- Prioridades: `baja`, `media`, `alta`, `urgente`
- Categorías: `técnico`, `facturación`, `cuenta`, `contenido`, `otro`
- Modelo `TicketComment` para respuestas (many-to-one con Ticket)

**Features del panel admin:**
- Filtros avanzados: estado, prioridad, categoría, usuario, asignado a
- Acciones masivas: cambiar estado, asignar a admin, cambiar prioridad
- Vista detalle: timeline de comentarios con markdown support
- Notificaciones: email al usuario cuando hay nueva respuesta
- SLA tracking: tiempo de primera respuesta y resolución

**Campos recomendados para `tickets`:**
```
- id, user_id, assigned_to, category, priority, status
- subject, description, resolution
- first_response_at, resolved_at, closed_at
- timestamps
```

### Sistema de Galerías (v2.0.0) ✅

**Arquitectura implementada:**
- Modelo `Gallery` relacionado con `User` y `Media` (Spatie Media Library)
- Tabla pivot `gallery_media` con campos: `order`, `caption`
- Visibilidad multinivel: `public`, `private`, `followers`
- Autorización centralizada: método `isVisibleTo(?User $user)` en modelo

**Features del backend:**
- **Migraciones:**
  - `galleries`: user_id, title, description, visibility (enum), order, timestamps
  - `gallery_media`: gallery_id, media_id, order, caption, unique constraint
- **Modelos:**
  - `Gallery`: Constantes de visibilidad, relaciones con User/Media, lógica de permisos
  - `GalleryMedia`: Pivot model con campos adicionales
- **Políticas:**
  - `GalleryPolicy`: viewAny (público), view (delega a isVisibleTo), update/delete (owner o permisos)
- **GraphQL:**
  - Queries: `galleries(user_id, visibility)`, `gallery(id)` - ambas en schema público
  - Mutations: `createGallery`, `updateGallery`, `deleteGallery`, `addMediaToGallery`, `removeMediaFromGallery`, `reorderGalleryMedia`
  - Tipos: `GalleryType` (con can_view, media_count), `GalleryMediaItemType` (con URLs y pivot data)
- **Rutas protegidas:**
  - `/gallery-media/{media}`: Sirve imagen con validación de visibilidad
  - `/gallery-media/{media}/{conversion}`: Sirve conversiones (thumb, preview)
- **Panel Filament:**
  - Resource completo: GalleryResource con formulario español, tabla con badges de visibilidad
  - RelationManager: Gestión de medios con drag & drop, captions, vista previa
  - Filtros: Por visibilidad y usuario
  - Columnas: Vista previa, nombre, descripción, orden, tamaño, contador de imágenes

**Gestión de medios en galerías (RelationManager):**
- Upload de imágenes: FileUpload con disk correcto (media-library → 'public')
- Creación automática: User->addMedia()->toMediaCollection('gallery')
- Vinculación a galería: attach en pivot `gallery_media` con order incremental
- Watermark automático: Se aplica si está habilitado en SiteSettings (según colección 'gallery')
- Vista previa: ImageColumn clickeable para abrir en nueva pestaña
- Drag-and-drop reordering: ->reorderable('gallery_media.order') corrige error SQL de 'pivot.order'
- Logging completo: Trazas de upload, creación de media, attach a pivot
- Sorting: Columnas ordenables incluyendo pivot.order con sortQuery custom
- Acciones: Upload, Attach (media existente), Detach, Delete
- Paginación: Configurable (10/25/50/100 imágenes por página)

**Correcciones técnicas importantes:**
- **Disk alignment**: FileUpload debe usar mismo disk que media-library ('public')
- **String file paths**: Fallback resolution desde disk 'local' si upload retorna strings
- **SQL pivot ordering**: Usar 'gallery_media.order' en lugar de 'pivot.order' para evitar errores de columna
- **Watermark integration**: spatie/image v3 API con enums AlignPosition/Unit, named parameters
- **Error handling**: Try/catch separados para media creation y pivot attach

**Visibilidad y permisos:**
- **Public**: Visible para todos (autenticados y anónimos)
- **Private**: Solo el propietario
- **Followers**: Solo usuarios que siguen al propietario
- Autorización en múltiples capas: Policy → GraphQL → MediaController

**Campos de `galleries`:**
```sql
id, user_id, title, description, visibility (enum), order, created_at, updated_at
Indexes: (user_id, visibility), (order)
```

**Campos de `gallery_media` (pivot):**
```sql
gallery_id, media_id, order, caption, created_at, updated_at
Unique constraint: (gallery_id, media_id)
Index: (order)
```

**Lecciones aprendidas:**
- Filament FileUpload puede devolver strings en lugar de UploadedFile; manejar ambos casos
- Spatie Media Library requiere path absoluto del filesystem, no path relativo de storage
- Pivot reorderable en Filament debe referenciar nombre completo de tabla, no alias SQL
- Watermark aplicado por conversiones de Media Library se ejecuta antes del attach; no afecta pivot

**Próximos pasos:** ver sección [Roadmap](#roadmap).

### Editor de Imágenes con IA

**Opciones de implementación:**

**1. Procesamiento en Cliente (Recomendado para MVP):**
- **TensorFlow.js**: Modelos pre-entrenados para detección de rostros
  - `@tensorflow-models/face-landmarks-detection`
  - Pros: Privacidad, sin carga en servidor
  - Contras: Requiere descarga de modelos (~5-10MB)
  
- **face-api.js** o **@vladmandic/face-api**:
  - Detección de rostros con bounding boxes
  - Aplicar blur/pixelado usando Canvas API sobre áreas detectadas
  - Exportar resultado como blob y subir al backend

- **MediaPipe (Google)**:
  - Detección precisa de rostros y landmarks faciales
  - Soluciones para selfie segmentation (separar persona de fondo)
  - Más ligero que TensorFlow.js completo

**2. Procesamiento en Servidor (Opcional):**
- Backend con Python + OpenCV + dlib
- Endpoint REST/GraphQL que recibe imagen y devuelve procesada
- Requiere considerar antivirus del usuario (bloquea SSL)
- Usar cola (Queue) para no bloquear requests

**3. APIs Cloud (Alternativa):**
- **Cloudinary AI**: Transformaciones automáticas, detección de objetos
- **ImgBB**: Hosting + edición básica
- **Remove.bg**: Remoción de fondos
- Pros: Sin infraestructura propia
- Contras: Costo por uso, dependencia externa

**Funcionalidades específicas:**

- **Desenfoque de rostros (Privacy):**
  ```javascript
  // Pseudocódigo con face-api.js
  const detections = await faceapi.detectAllFaces(img);
  detections.forEach(face => {
    ctx.filter = 'blur(20px)';
    ctx.drawImage(img, face.box.x, face.box.y, face.box.width, face.box.height);
  });
  ```

- **Filtros faciales en tiempo real:**
  - **Jeeliz FaceFilter**: AR effects, máscaras, color grading
  - **FaceSwap.js**: Intercambio de rostros (considerar implicaciones éticas)

- **Mejora de calidad:**
  - Upscaling: waifu2x.js (anime) o Real-ESRGAN (fotos)
  - Noise reduction: algoritmos de convolución en Canvas
  - Auto-enhance: ajuste de brillo/contraste/saturación con histogramas

**Consideraciones importantes:**
- ⚠️ **IMPORTANTE**: Consultar con usuario sobre antivirus/SSL antes de integrar
- Procesar localmente cuando sea posible (privacidad)
- Solo subir resultado final al servidor, no imagen original + procesada innecesariamente
- Guardar metadatos de ediciones aplicadas para trazabilidad
- Permitir descargar versión original si el usuario lo requiere
- Implementar límites de tamaño de archivo para procesamiento (max 10MB)

**Almacenamiento:**
- Colección Spatie ML: `edited_images` separada de `images` originales
- Metadatos JSON: `{ filters: ['blur_faces', 'enhance'], processed_at: '...' }`
- Versionado: mantener original + últimas 3 versiones editadas

## Roadmap

Nota: Antes de agregar nuevas dependencias o servicios, consultarlo (ver Directivas).

### Backend
- [x] GraphQL mutations para uploads (con autenticación y validación) - ✅ v2.1.0
- [x] Rate limiting y cache selectiva para queries GraphQL - ✅ v2.2.0 (optimización N+1 con eager loading)
- [ ] Auditoría básica de acciones en admin (evaluar dependencia)
- [x] Notificaciones por email para eventos clave - ✅ v1.9.0 (contacto) + v1.10.0 (tickets)

### Media & Watermark
- [ ] Opción de watermark con imagen (PNG/SVG) además de texto
- [ ] Procesamiento en cola (queue) para conversiones y watermark
- [ ] Reglas: omitir watermark bajo cierto tamaño o en colecciones especiales

### Frontend
- [x] Migración progresiva a TypeScript - ✅ v2.2.0 (componentes de galerías, contexts, utils)
- [x] Estados de carga y manejo de errores - ✅ v2.1.0 (galerías)
- [x] Galería de medios pública y privada por usuario con paginación y permisos - ✅ v2.1.0
- [x] Lazy loading + placeholders (LQIP/blur) para imágenes - ✅ v2.2.0 (loading="lazy" en grids y galerías)
- [ ] ErrorBoundary global

### Admin/UX
- [ ] Moderación: bandeja de revisión y flujo de aprobación
- [ ] Acciones masivas en usuarios (asignar tags, activar/desactivar)
- [ ] Buscador global en Filament (usuarios, posts, medios)

</details>

### Seguridad
- [x] Revisión de permisos y roles - ✅ v2.1.0 (restricciones por rol para galerías y perfiles)
- [ ] Endurecimiento adicional con Shield
- [ ] 2FA para administradores (evaluar dependencia)

### Infra & Performance
- [ ] Almacenamiento externo/CDN (S3/Cloudinary) – consultar antes por antivirus/SSL
- [ ] Servir `storage` vía CDN con versiones cacheables
- [x] Optimización N+1 y métricas de rendimiento - ✅ v2.2.0 (eager loading en queries principales)

### Testing & DevOps
- [ ] Pruebas (PHPUnit) para resolvers GraphQL y políticas
- [ ] CI (GitHub Actions) con `phpunit` y build del frontend

### Internacionalización
- [ ] i18n en frontend y textos del backend

### SEO & Analítica
- [ ] Metadatos Open Graph por usuario y página
- [x] Métricas básicas de vistas de perfil - ✅ v1.7.1

### Mensajería y Emails Personalizados (tentativo)
- Mensajería directa entre usuarios (inbox): hilos/conversaciones, mensajes, estados (enviado/leído), archivos adjuntos básicos.
- GraphQL: queries `threads`, `messages(thread_id)`; mutaciones `sendMessage`, `markAsRead`, `createThread`.
- Notificaciones por email personalizadas por evento (nuevo mensaje, nuevo seguidor, galería privada compartida).
- Plantillas editables en Admin (Blade) con variables seguras (`{{ user.name }}`, `{{ profile_url }}`, etc.) y vista previa.
- Preferencias del usuario: opt-in/out por tipo (marketing, notificaciones, recordatorios) y frecuencia.
- Segmentación básica (roles, país, seguidores) y envíos programados con throttling.
- Registro de entregas y aperturas (webhooks opcionales: Mailgun/Sendgrid) con fallback simple.
- Internacionalización de plantillas (ES/EN) y textos comunes.
- Pruebas y sandbox de envío (modo testing / cola) para evitar correos reales en dev.

### Deseados (Solicitados)
- [x] Datos de usuario visibles según rol - ✅ v2.1.0 (perfiles públicos solo admin/moderator/creator)
- [ ] Conectarse como un usuario en el frontend (impersonación segura)
- [ ] Integración de Chat (mensajería básica entre usuarios)
- [x] Galería de imágenes públicas y privadas (controles de acceso) - ✅ v2.1.0
- [x] Estadísticas de usuarios: ranking de perfiles más visitados - ✅ v1.7.1
- [x] Botón "seguir/favorito" para tipos de usuario (follow/favorite) - ✅ v1.7.2
- [x] Administración del perfil desde el frontend (self-service) - ✅ v2.3.0
- [ ] Agregar logotipo al código QR generado en perfil de usuario
- [x] **Sistema de Contacto**: Formulario de contacto en frontend con envío de emails y almacenamiento de mensajes en BD - ✅ v1.9.0
- [x] **Sistema de Tickets/Soporte**: Gestión de tickets de soporte desde el panel admin con estados, prioridades y respuestas - ✅ v1.10.0
- [x] **Personalización de Cards de Usuario**: Permitir al usuario personalizar el color de fondo de su card en el grid de exploración
  - Campo `card_bg_color` en perfil de usuario (color picker)
  - Aplicación de color personalizado en UsersGrid y listados públicos
  - Preview en tiempo real en EditProfile
  - Gradientes opcionales además de colores sólidos
  - Validación de contraste automática (accesibilidad)
  - Paleta de colores sugeridos basada en el tema del sitio
- [ ] **Editor de Imágenes con IA**: Herramientas avanzadas en frontend para procesamiento de imágenes con inteligencia artificial
  - Detección y desenfoque automático de rostros (privacy protection)
  - Filtros y efectos específicos para caras (beautify, aging, expression change)
  - Detección de objetos y desenfoque selectivo de fondo
  - Mejora automática de calidad (upscaling, noise reduction)
  - Filtros artísticos y estilización con IA

### Sugerencias
- Empezar Chat con mutaciones + polling y luego evaluar WebSockets; GraphQL Subscriptions pueden requerir cambios de stack.
- Impersonación sin dependencias: flag en sesión con permisos estrictos y auditoría; si se aprueba, evaluar paquete dedicado.
- ✅ Galerías privadas: Implementadas con políticas + autorización por rol + visibilidad multinivel (v2.1.0).
- ✅ Sistema de Tickets: Implementado con modelo completo, notificaciones y panel admin (v1.10.0).
- **Editor de Imágenes con IA**: 
  - Frontend: Integrar librerías como TensorFlow.js o MediaPipe para detección de rostros en el navegador (procesamiento local)
  - Para desenfoque: usar face-api.js o @vladmandic/face-api para detectar caras y aplicar blur con Canvas API
  - Filtros faciales: considerar Jeeliz FaceFilter o FaceSwap.js para efectos en tiempo real
  - Backend opcional: API con Python + OpenCV + dlib para procesamiento pesado (si el cliente lo permite)
  - Alternativa cloud: integrar APIs de Cloudinary AI o ImgBB con transformaciones automáticas
  - Almacenamiento: guardar versiones original + procesada, metadatos de ediciones aplicadas
  - Privacy: procesar localmente cuando sea posible, solo subir resultado final
  - **IMPORTANTE**: Verificar con usuario sobre antivirus/SSL antes de agregar dependencias de IA que requieran descarga de modelos

### Hitos tentativos
- 1.8.0: Sistema de páginas dinámicas (CMS básico) - ✅ Completado
- 1.9.0: Sistema de contacto completo - ✅ Completado
- 1.10.0: Sistema de tickets de soporte - ✅ Completado
- 2.0.0: Panel admin de galerías con gestión de medios - ✅ Completado
- 2.1.0: Frontend completo de galerías (CRUD, viewer, uploads) + restricciones por rol - ✅ Completado
- 2.2.0: TypeScript + optimizaciones de performance (lazy loading, code splitting, N+1) - ✅ Completado
- 2.3.0: Administración de perfil desde frontend (self-service) - ✅ Completado
- 2.4.0: Filtros avanzados de exploración + tema dark/light personalizable - ✅ Completado
- 2.5.0: Upload de avatar desde frontend + Personalización de cards de usuario
- 2.6.0: Editor de imágenes con IA (detección/desenfoque de rostros, filtros faciales)
- 2.4.0: SEO OG, mejoras de UX y componentes adicionales en TypeScript
- 2.5.0: Infra/CDN, moderación completa y 2FA

## Sistema de Rutas (React Router v6)

### Estructura de URLs Amigables

El sistema utiliza el patrón `@username` para perfiles de usuarios:

```
/@username           → Perfil del usuario
/@username/posts     → Posts del usuario
/@username/media     → Galería de medios
/@username/about     → Información del usuario
```

**Ejemplos:**
- `http://localhost:3000/@maria` - Perfil de maria
- `http://localhost:3000/@juan/posts` - Posts de juan

### Componentes de Navegación

**Componentes creados:**
- `Navigation.jsx` - Navbar con links
- `Home.jsx` - Página principal
- `UserProfile.jsx` - Perfil de usuario con tabs
- `NotFound.jsx` - Página 404

### Navegación Programática

```jsx
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/@username');
```

### Obtener Parámetros de URL

```jsx
import { useParams } from 'react-router-dom';

const { username } = useParams();
```

## Roles de Usuario

El sistema incluye 6 roles predefinidos:

1. **super_admin** - Acceso total al sistema
2. **admin** - Administrador completo
3. **moderator** - Aprueba y modera contenido
4. **vip** - Usuario VIP con permisos extendidos (similar a creator con funcionalidades premium)
5. **creator** - Crea y gestiona sus posts y galerías
6. **user** - Usuario básico

**Nota sobre el rol VIP:**
- Diseñado para usuarios premium con privilegios adicionales
- Base similar al rol `creator` pero con permisos extendidos
- Los permisos específicos se configurarán según necesidades futuras
- Perfil público visible como creator
- Acceso a funcionalidades exclusivas (a definir)
- **IMPORTANTE: Un usuario puede tener múltiples roles simultáneamente** (ej: `creator` + `vip`)

### Asignar Roles

```php
// En código - Asignar rol único
$user->assignRole('creator');

// Asignar múltiples roles (ejemplo: creador VIP)
$user->assignRole(['creator', 'vip']);

// Verificar si tiene alguno de los roles
$user->hasAnyRole(['creator', 'vip']);

// Verificar si tiene todos los roles
$user->hasAllRoles(['creator', 'vip']);

// Desde el panel
http://localhost:8000/admin/shield/roles
```

// Desde el panel
http://localhost:8000/admin/shield/roles
```

**Regenerar permisos de Shield:**
```bash
cd back-admin
php artisan shield:generate --all
```

### Campo Username

Todos los usuarios ahora tienen un campo `username` único:
- Se genera automáticamente basado en el nombre
- Formato: `nombre` + número único
- Ejemplo: `maria1234`, `juan5678`

## Panel de Administración - Usuarios

### Validación de Username en Tiempo Real

Al crear un usuario en `admin/users/create`, el campo username incluye:
- ✅ Validación en vivo (debounce 500ms)
- ✅ Verifica disponibilidad automáticamente
- ✅ Solo permite: letras, números, guiones y guiones bajos
- ✅ Mínimo 3 caracteres, máximo 30
- ✅ Prefijo `@` visual

### Generador de Contraseñas Seguras

El campo password incluye:
- ✅ Botón "Generar" con icono de llave
- ✅ Genera contraseñas de 16 caracteres
- ✅ Cumple requisitos: mayúsculas, números, símbolos
- ✅ Validación: mínimo 12 caracteres con complejidad
- ✅ Campo revelable para ver la contraseña

### Upload de Avatar

Cada usuario puede tener una imagen de perfil:
- ✅ Upload con editor de imágenes integrado
- ✅ Recorte automático según configuración del sitio
- ✅ Dimensiones configurables en `/admin/site-settings` (Tab Medios → Avatar)
- ✅ Formatos: JPG, PNG, WebP (máx. 2MB)
- ✅ Conversión automática a thumbnail con las dimensiones configuradas
- ✅ Vista previa circular en la tabla de usuarios
- ✅ Colección `avatar` en modelo User
- ✅ **Avatar genérico**: Si el usuario no sube imagen, se muestra el avatar genérico configurado en `/admin/site-settings` (Tab Medios → Avatar Genérico)

**Uso:**
```php
// Obtener avatar del usuario
$user->getFirstMediaUrl('avatar', 'thumb');
```

### Etiquetas de Usuario

En el formulario de usuario (`/admin/users/{id}/edit`):
- ✅ **Selector múltiple de tags**: Asigna etiquetas para clasificar usuarios
- ✅ Búsqueda rápida de tags disponibles
- ✅ Relación muchos a muchos (user_tag)
- ✅ Sección colapsable para mejor organización

**Uso:**
```php
// Obtener tags del usuario
$user->tags;

// Asignar tags
$user->tags()->attach([1, 2, 3]);
```

### Links Personalizados

Cada usuario puede tener múltiples enlaces:
- ✅ **Repeater dinámico**: Agrega N cantidad de links
- ✅ **Campos por link**:
  - Nombre del link (ej: "Mi sitio web")
  - URL completa (validación de formato)
  - Icono (25+ opciones Font Awesome)
- ✅ **Reordenable**: Drag & drop para cambiar orden
- ✅ **Iconos disponibles**:
  - Enlaces: link, globe, envelope, phone
  - Redes sociales: Facebook, Twitter, Instagram, LinkedIn, YouTube, TikTok, GitHub, Discord, WhatsApp, Telegram, Pinterest, Reddit
  - Otros: briefcase, blog, store, heart, video, music, book, camera
- ✅ Sección colapsable
- ✅ Etiquetas con nombre del link para fácil identificación

**Uso:**
```php
// Obtener links del usuario (ordenados)
$user->links;

// Crear link
$user->links()->create([
    'name' => 'Mi GitHub',
    'url' => 'https://github.com/username',
    'icon' => 'fab-github',
    'order' => 1
]);
```

## Panel de Configuración del Sitio

Acceso: `http://localhost:8000/admin/site-settings`

### Estructura Organizada por Tabs

#### 1️⃣ Tab General
- **Título del Sitio**: Aparece en el navegador y SEO
- **Descripción**: Meta description para SEO (máx. 500 caracteres)

#### 2️⃣ Tab Medios
**Archivos del Sitio:**
- **Logo**: JPG, PNG, SVG, WebP (máx. 2MB)
  - Editor de imágenes integrado
  - Vista previa instantánea
- **Favicon**: ICO, PNG (32x32px recomendado, máx. 512KB)
- **Avatar Genérico**: JPG, PNG, WebP (máx. 2MB)
  - Imagen predeterminada para usuarios sin avatar propio
  - Editor de imágenes integrado
  - Se usa automáticamente cuando un usuario no sube su avatar

**Tamaños de Recorte Automático:**
- **Avatar**: Ancho/Alto en píxeles (default: 200x200)
- **Thumbnails Galería**: Ancho/Alto en píxeles (default: 368x232)
- Aplicado automáticamente al procesar imágenes

#### 3️⃣ Tab Diseño
**Esquema de Colores Bootstrap 5:**

Personaliza los 8 colores principales del tema:
- 🔵 **Primary** (default: #0d6efd)
- ⚪ **Secondary** (default: #6c757d)
- 🟢 **Success** (default: #198754)
- 🔴 **Danger** (default: #dc3545)
- 🟡 **Warning** (default: #ffc107)
- 🔵 **Info** (default: #0dcaf0)
- ⚪ **Light** (default: #f8f9fa)
- ⚫ **Dark** (default: #212529)

Cada color incluye:
- ✅ ColorPicker visual
- ✅ Código hexadecimal editable
- ✅ Se aplican automáticamente en el frontend

**CSS Personalizado:**
- Editor de texto para CSS custom
- Se inyecta después de Bootstrap en el frontend
- Ideal para sobrescribir estilos específicos

```css
/* Ejemplo de uso */
.btn-custom {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
}
```

#### 4️⃣ Tab Tipografía
**Google Fonts Integradas:**

- **Fuente para Títulos**: Se aplica a h1, h2, h3, h4, h5, h6
- **Fuente para Contenido**: Se aplica a body, p, div

**22 fuentes Google Fonts disponibles:**
- Roboto, Open Sans, Lato, Montserrat, Poppins
- Raleway, Inter, Nunito, Playfair Display, Merriweather
- PT Sans, Source Sans Pro, Ubuntu, Oswald, Work Sans
- Rubik, Quicksand, Josefin Sans, Fira Sans, Mulish
- Dancing Script, Pacifico

Búsqueda rápida integrada en el selector.

### Características del Panel
- ✅ **Singleton**: Solo existe un registro de configuración
- ✅ **Sin duplicados**: No permite crear/eliminar, solo editar
- ✅ **Permisos Shield**: Control granular por rol
- ✅ **Navegación**: Agrupado en "Configuración"
- ✅ **Icono**: Cog (engranaje)

### Filtro de Medios por Usuario

En el panel `admin/media`:
- ✅ Nuevo filtro "Usuario" con búsqueda
- ✅ Filtra medios adjuntos a Posts del usuario
- ✅ Filtra medios adjuntos directamente al User
- ✅ Combinable con filtro por colección
- ✅ Columna "Usuario" muestra el propietario del archivo
- ✅ Botón eliminar individual por archivo
- ✅ Modal de confirmación antes de eliminar
- ✅ Eliminación masiva con bulk actions
 - ✅ Reprocesado: acción masiva "Regenerar Thumbnails y Watermark"

## Sistema de Etiquetas (Tags)

Acceso: `http://localhost:8000/admin/tags`

Sistema completo de etiquetas para clasificación y organización:

### Características

- ✅ **Nombre único**: Identificador de la etiqueta
- ✅ **Color Bootstrap**: Selección de 8 colores del tema
  - Primary, Secondary, Success, Danger, Warning, Info, Light, Dark
- ✅ **Icono**: Selector con 40+ iconos predefinidos
  - Font Awesome Solid: tag, star, heart, fire, bolt, crown, gem, trophy, medal, flag, bookmark, etc.
  - Heroicons Outline: tag, star, heart, fire, bolt, sparkles, shield-check, etc.
  - Renderizado automático según tipo (FA o Heroicon)
- ✅ **Peso de Importancia**: Valor numérico 0-100
  - 80-100: Badge rojo (alta prioridad)
  - 50-79: Badge amarillo (media prioridad)
  - 20-49: Badge azul (baja prioridad)
  - 0-19: Badge gris (mínima prioridad)

### Tabla de Etiquetas

- ✅ Ordenamiento por defecto: peso descendente
- ✅ Vista de badges con colores configurados
- ✅ Visualización de iconos
- ✅ Búsqueda por nombre
- ✅ Edición y eliminación individual
- ✅ Eliminación masiva

### Ubicación en el Panel

Agrupado en **"Usuarios"** junto con:
1. Usuarios (orden 1)
2. Etiquetas (orden 2)

## Testing

### Backend
```bash
php artisan serve
# Acceder a: http://localhost:8000/admin
# Login: scoollerx@hotmail.com / password
```

### Frontend
```bash
cd front-site
npm run dev
# Acceder a: http://127.0.0.1:3000
# Probar: http://127.0.0.1:3000/@maria
```

## Cambios 1.8.0

- **Sistema de Páginas Dinámicas (CMS básico)**:
  - Nuevo modelo `Page` con campos: title, slug, content, status, order, is_system
  - Tabla `pages` en base de datos con índices optimizados
  - Recurso Filament con editor rico (RichEditor) para contenido HTML
  - Generación automática de slug desde el título
  - Protección de páginas del sistema (no eliminables)
  - 5 páginas del sistema incluidas por defecto: Inicio, Términos, Privacidad, Contacto, FAQs
  - GraphQL API pública: queries `pages()` y `page(slug)`
  - Tipo GraphQL `Page` con todos los campos expuestos
  - Frontend reorganizado:
    - Home (`/`) carga contenido dinámico desde página "inicio"
    - Nueva ruta `/explorar` con el listado de usuarios
    - Componente genérico `Page.jsx` para renderizar páginas por slug
    - Navegación actualizada con dropdown "Información"
    - Rutas para todas las páginas estáticas: `/terminos-y-condiciones`, `/politica-de-privacidad`, `/contacto`, `/faqs`
  - Filtros en admin por estado y tipo de página
  - Búsqueda por título y slug
  - Ordenamiento personalizable

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan db:seed --class=PageSeeder
php artisan optimize:clear
```

## Cambios 2.3.5
- **Iconos de banderas para países**:
  - Nuevo archivo `countryUtils.js` con utilidades para manejo de países:
    - `getCountryFlag()`: Convierte código ISO a emoji de bandera (🇨🇱, 🇨🇴, etc)
    - `getCountryName()`: Obtiene nombre del país en español
    - `getCountryDisplay()`: Retorna "🇨🇱 Chile" formateado
    - Mapa `COUNTRY_NAMES` con países latinoamericanos principales
  - `EditProfile.jsx`: Selectores de Nacionalidad y País muestran banderas
  - `UserProfile.jsx`: Datos de ubicación muestran banderas con nombres completos
  - Mejora visual en la presentación de datos de ubicación

- **Restricción de country_block solo para creadores**:
  - Checkbox "Bloquear perfil para visitantes de mi país" movido a sección de creadores
  - Solo usuarios con rol `creator` pueden ver y modificar esta opción

**Notas técnicas**:
- Las banderas usan emojis Unicode (Regional Indicator Symbols)
- Conversión: Código ISO → Unicode code points (🇦 = U+1F1E6)
- Compatible con todos los navegadores modernos
- Sin dependencias externas adicionales

## Cambios 2.3.4
- **Pre-llenado de datos en EditProfile**:
  - Backend:
    - Nuevo tipo `RoleType` en GraphQL con campos `id`, `name`, `guard_name`
    - Campo `roles` agregado a `UserType` (retorna lista de roles del usuario)
    - Tipo `Role` registrado en esquemas `default` y `public`
  - Frontend:
    - `EditProfile.jsx` ahora carga datos completos del usuario via GraphQL al montar
    - Query `UserProfile` carga todos los campos del usuario incluyendo links y roles
    - Pre-llenado automático de todos los campos del formulario
    - Indicador de carga mientras se obtienen los datos
    - Detección mejorada de rol `creator` (compatibilidad con formato array y objeto)
    - Las ciudades se cargan automáticamente si ya hay un país seleccionado

**Mejoras de UX**:
- El formulario muestra spinner de carga mientras obtiene los datos
- Todos los campos se rellenan con la información actual del usuario
- Los selectores de país y ciudad se inicializan correctamente
- Los enlaces personalizados se cargan en el orden correcto

**Notas técnicas**:
- Usar GraphQL para datos completos es más eficiente que REST
- El tipo Role permite queries más ricas sobre permisos de usuario
- Compatible con ambos formatos de roles: `['creator']` y `[{name: 'creator'}]`

## Cambios 2.3.3
- **Sistema completo de verificación de email**:
  - Backend:
    - Modelo `User` implementa `MustVerifyEmail`
    - Endpoint `/api/email/resend`: Reenvía email de verificación
    - Rutas web de verificación: `/email/verify/{id}/{hash}` con firma segura
    - `AuthController::register()`: Envía email de verificación automáticamente después del registro
    - `AuthController::resendVerificationEmail()`: Permite reenviar email de verificación
    - `AuthController::me()`: Incluye campo `email_verified_at` en respuesta
    - Configuración `frontend_url` en `config/app.php` para redirecciones
  - Frontend:
    - Nueva página `VerifyEmail.jsx`: Muestra mensaje de verificación pendiente con botón para reenviar email
    - Nueva página `EmailVerified.jsx`: Confirma verificación exitosa y redirige automáticamente
    - Rutas públicas: `/verify-email`, `/email-verified`
    - `Register.jsx`: Redirige a `/verify-email` después del registro exitoso
    - Integración con `refreshUser()` para actualizar estado después de verificar

**Notas**:
- Los emails de verificación se envían automáticamente al registrarse
- Los enlaces de verificación están firmados y tienen expiración
- El usuario puede reenviar el email si no lo recibió
- Después de verificar, el usuario es redirigido automáticamente al frontend
- Configurar `FRONTEND_URL` en `.env` para la URL correcta del frontend

**Configuración requerida en .env**:
```env
FRONTEND_URL=http://127.0.0.1:3000
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=tu-email@gmail.com
MAIL_PASSWORD=tu-app-password
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@linkpersons.com
MAIL_FROM_NAME="${APP_NAME}"
```

## Cambios 2.3.2
- **Restricción de tickets por verificación de email**:
  - Backend:
    - Validación de `email_verified_at` en `CreateTicketMutation`: Solo usuarios con email verificado pueden crear tickets
    - Validación de `email_verified_at` en `AddTicketCommentMutation`: Solo usuarios verificados pueden comentar (excepto admins/moderadores)
    - Mensajes de error descriptivos: "Debes verificar tu correo electrónico para..."
    - Campo `email_verified_at` agregado a `UserType` en GraphQL
  - Frontend:
    - Nuevo componente `VerifiedRoute`: Protege rutas requiriendo autenticación + email verificado
    - Rutas protegidas: `/tickets`, `/tickets/nuevo`, `/tickets/:id`
    - Mensaje informativo si usuario no verificado intenta acceder
    - Enlace "Mis Tickets" solo visible para usuarios con email verificado
    - TypeScript: Agregado campo `email_verified_at` a interface `User`

**Notas**:
- Los admins y moderadores pueden comentar tickets sin restricción de verificación
- El sistema usa el campo nativo de Laravel `email_verified_at`
- Usuarios no verificados ven un mensaje claro indicando que deben verificar su email

## Cambios 2.3.1
- **Sistema de registro de usuarios**:
  - Nuevo endpoint `/api/register` en AuthController
  - Validaciones completas: username (lowercase, alpha_dash, 3-30 chars), password (mín 12 chars), edad (18+), género requerido
  - Auto-login después de registro con sesión y cookies
  - Componente `Register.jsx` con formulario completo:
    - Validación frontend + backend
    - Hints informativos en cada campo
    - Manejo de errores en español
    - Redirección automática después del registro
  - AuthContext: Nueva función `register()` con soporte TypeScript
  - Ruta pública `/register` con enlace desde página de login

- **Restricción de galerías por rol**:
  - Frontend:
    - Enlace "Mis Galerías" solo visible para usuarios con rol `creator` o `admin`
    - Nuevo componente `CreatorRoute` para proteger rutas de gestión de galerías
    - Rutas protegidas: `/mis-galerias`, `/mis-galerias/nueva`, `/mis-galerias/:id/editar`
    - Redirección automática a home si usuario sin rol adecuado intenta acceder
  - Backend:
    - Validación de rol en todas las mutaciones de galerías:
      - `CreateGalleryMutation`: Ya tenía validación
      - `UpdateGalleryMutation`: Agregada validación de rol creator/admin
      - `DeleteGalleryMutation`: Agregada validación de rol creator/admin
      - `AddMediaToGalleryMutation`: Agregada validación de rol creator/admin
      - `RemoveMediaFromGalleryMutation`: Agregada validación de rol creator/admin
      - `ReorderGalleryMediaMutation`: Agregada validación de rol creator/admin
    - Verificación adicional de propiedad: solo el propietario o admins pueden modificar
    - Mensajes de error descriptivos en español

**Notas**:
- Usuarios regulares (sin rol creator/admin) no pueden crear ni gestionar galerías
- La validación es tanto en UI como en backend para máxima seguridad
- Los admins pueden gestionar galerías de cualquier usuario

## Cambios 2.3.0
- **Administración de perfil desde frontend** (Self-service):
  - Nueva ruta `/perfil/editar` protegida con autenticación
  - Componente `EditProfile.jsx` con formulario completo para editar perfil
  - Mutaciones GraphQL:
    - `updateProfile`: Actualiza datos básicos, ubicación, descripción, género, fecha de nacimiento
    - `updateLinks`: Gestión completa de enlaces personalizados (solo creadores)
  - Query `CountriesQuery`: Proporciona lista de países y ciudades desde el backend
  - UI features:
    - Formulario con validaciones (edad mínima 18 años, campos requeridos)
    - Selección dinámica de países y ciudades
    - Gestión de enlaces con iconos (agregar, editar, eliminar)
    - Solo creadores pueden editar precio y enlaces
    - Botón "Editar Perfil" en el propio perfil del usuario
    - Redirección automática al perfil después de guardar
  - Backend:
    - Validaciones en mutaciones: género, edad, rol de creador
    - Solo creadores pueden establecer `price_from` y gestionar links
    - Actualización parcial: solo campos proporcionados se actualizan
  - AuthContext mejorado: Nueva función `refreshUser()` para actualizar datos del usuario después de editar

- **Migración completa de iconos a Font Awesome 6**:
  - Reemplazados todos los iconos de Bootstrap Icons por Font Awesome
  - Iconos actualizados en todos los componentes:
    - Galerías: `fa-images`, `fa-globe`, `fa-lock`, `fa-users`
    - Navegación: `fa-images`, `fa-pencil-alt`, `fa-trash`, `fa-eye`
    - Formularios: `fa-plus-circle`, `fa-check-circle`, `fa-exclamation-triangle`
    - Enlaces: `fa-link`, `fa-facebook`, `fa-instagram`, `fa-twitter`, `fa-youtube`, `fa-tiktok`
    - Acciones: `fa-save`, `fa-grip-vertical`, `fa-info-circle`
  - Font Awesome 6.5.1 cargado desde CDN en index.html
  - Consistencia visual en toda la aplicación

**Notas**:
- Upload de avatar pendiente (próxima versión con FilePond integration)
- Los cambios se reflejan inmediatamente sin necesidad de recargar
- Compatible con usuarios regulares y creadores (UI adaptativa por rol)

## Cambios 2.2.1
- **Restricciones por rol de creador**:
  - Frontend: Estadísticas de seguidores, vistas y botón seguir solo para perfiles con rol `creator`
  - Usuarios no creadores solo muestran contador "Siguiendo"
  - Backend: Validación en mutaciones `followUser` y `unfollowUser` para verificar que el usuario objetivo tenga rol `creator`
  - Panel Admin: Secciones "Perfil público", "Estadísticas", "Etiquetas" y "Enlaces" solo visibles cuando el usuario tiene rol `creator`
  - Visibilidad reactiva: Las secciones se muestran/ocultan automáticamente al seleccionar/deseleccionar el rol
  - Mejora GraphQL: Query `UserQuery` ahora incluye eager loading de `roles` para evitar N+1

- **Cambios en UserProfile.jsx**:
  - Estadísticas condicionales por rol:
    - Creadores: Seguidores + Siguiendo + Vistas
    - No creadores: Solo Siguiendo
  - Botón Follow/Unfollow solo visible para perfiles de creadores
  
- **Cambios en UserForm.php (Filament)**:
  - Campo `roles` con `->live()` para reactividad
  - Secciones con `->visible()` que verifican existencia de rol creator mediante query a BD
  - Previene errores al crear nuevos usuarios sin roles asignados

- **Cambios en GraphQL Mutations**:
  - `FollowUserMutation`: Valida que `$userToFollow->hasRole('creator')`
  - `UnfollowUserMutation`: Valida que `$userToUnfollow->hasRole('creator')`
  - Mensajes de error claros: "Solo puedes seguir a usuarios con rol de creador"

**Notas técnicas**:
- La validación de roles usa IDs numéricos internamente pero consulta por nombre 'creator'
- Compatible con usuarios existentes sin rol creator
- No requiere migraciones, solo actualización de código

## Cambios 1.7.2
- **Sistema de seguimiento (Follow/Unfollow)**:
  - Nueva tabla pivote `user_follower` con relaciones many-to-many
  - Campos `followers_count` y `following_count` en usuarios (cache counters)
  - Mutaciones GraphQL: `followUser`, `unfollowUser` (esquema `default` con `auth:web`)
  - Queries GraphQL: `followers(user_id)`, `following(user_id)` (públicas)
  - Campo `is_following` en tipo `User` (context-aware, indica si el usuario autenticado sigue a este usuario)
  - UI Frontend: Botón Follow/Unfollow en perfil con estadísticas (solo visible cuando autenticado y no es tu propio perfil)
  - Actualización optimista con reconciliación de datos del servidor

- **Contador de vistas únicas**:
  - Sistema de tracking basado en cache de Laravel (driver: `file`)
  - Clave única: `profile_view_{user_id}_{session_id_o_ip+user_agent}`
  - Duración: 24 horas por visita única
  - Operación atómica con `Cache::add()` para prevenir race conditions
  - No cuenta visitas propias: verifica que el usuario autenticado no esté viendo su propio perfil
  - Evita doble incremento en requests simultáneos del frontend

- **Persistencia de autenticación mejorada**:
  - Uso de `localStorage` para mantener estado del usuario entre recargas (patrón FreeCodeCamp)
  - Restauración automática del usuario al montar la app desde `localStorage`
  - Compatible con proxy de Vite en desarrollo (no depende de cookies cross-port)
  - Middleware de sesión agregado a rutas API: `StartSession`, `ShareErrorsFromSession`
  - CSRF excluido de rutas `/api/*` (manejado por `XSRF-TOKEN` header)
  - Rutas API y GraphQL usan `auth:web` en lugar de `auth:sanctum`
  - Configuración de sesión: `SESSION_DRIVER=file`, `SESSION_DOMAIN=null`, `SESSION_LIFETIME=43200` (30 días)

- **Configuración de desarrollo**:
  - Proxy de Vite mejorado: handlers `proxyReq` y `proxyRes` para preservar cookies
  - CORS configurado con `supports_credentials: true`
  - Middleware `statefulApi()` en `bootstrap/app.php`

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

## Cambios 1.7.1
- **Performance optimizations**:
  - Lazy loading: Todas las imágenes públicas (avatares, thumbnails) ahora usan `loading="lazy"` y `decoding="async"` para mejorar el tiempo de carga inicial.
  - Aplicado en: `UserProfile.jsx`, `UsersGrid.jsx` (Home, Tags), `MediaTable.php` (admin).
- **GraphQL rate limiting**:
  - Esquema público throttled a 60 peticiones/minuto por IP para prevenir abuso.
  - Configurado en `config/graphql.php` con middleware `throttle:60,1`.
- **Profile views counter**:
  - Nueva columna `views` en tabla `users` para contar visitas al perfil.
  - Se incrementa automáticamente cuando se consulta un perfil vía GraphQL público (sin autenticar).
  - Expuesta en GraphQL: campo `views` en tipo `User`.
  - Nueva query `topViewedUsers(limit: Int)`: retorna usuarios ordenados por vistas descendente.
  - Comando disponible: migración `add_views_to_users_table`.

Actualización requerida:
```bash
cd back-admin
php artisan migrate
php artisan optimize:clear
```

## Cambios 1.7.0
- Watermark de imágenes configurable (texto, posición, opacidad, tamaño y fuente TTF desde `storage/app/fonts`).
- Aplicación automática del watermark al original y a las conversiones (eventos Spatie ML).
- Reprocesado de imágenes:
  - Acción masiva en Media: "Regenerar Thumbnails y Watermark".
  - Comando Artisan: `php artisan media:regenerate` y `--watermark-only`.
- Validación: límite de 90 caracteres para nombre original de archivo en formulario de Usuario (evita errores de Livewire al subir).
- UI de Media: preview clickeable abre imagen completa en nueva pestaña.

Actualización requerida:
```bash
cd back-admin
php artisan migrate --force
php artisan optimize:clear
```

## Cambios 1.6.1
- Perfil público (Backend): agregado campo `gender` (sexo) con opciones: `hombre`, `mujer`, `trans`, `otro`.
- Admin (Filament): nuevo selector requerido "Sexo" en la sección "Perfil público" del usuario.
- GraphQL: el tipo `User` ahora expone el campo `gender`.
- Frontend: se muestra el `Sexo` en el perfil público y en la grilla de usuarios (Home y Tag).
- Notas: Los valores se guardan en minúsculas y el frontend los capitaliza al mostrar.

Actualización requerida:
```bash
cd back-admin
php artisan migrate --force
php artisan config:cache
```

## Cambios 1.6.0
- Perfil Admin (Filament): campos de usuario ampliados y selects dependientes
  - `Nacionalidad` y `País` ahora usan un `Select` basado en Monarobase (ES).
  - `Ciudad` se habilita al elegir `País` y carga opciones locales desde `back-admin/resources/data/cities_by_country_es.json` (países: CL, CO, AR, VE por ahora).
  - Guardamos nombres legibles en BD y mapeamos código↔nombre al hidratar el formulario.
  - Validación mantenida: `birth_date` exige 18+ años.
- GraphQL y Modelo `User`:
  - Se exponen nuevos campos: `nationality`, `country`, `city`, `description`, `country_block`, `birth_date`, `price_from`, y `avatar_url`.
  - Query de usuarios admite filtro por `tag`/`tagId`.
- Frontend:
  - Página de etiqueta `/t/:tag` que lista usuarios por tag.
  - Perfil usa `avatar_url` (imagen grande) y corrige render de iconos (Font Awesome: `fas-fire` → `fas fa-fire`).
  - Se agregó un QR del perfil con `qrcode.react` en la pestaña de perfil.
- Notas de instalación:
  - Dependencia: `monarobase/country-list` (si tu antivirus bloquea SSL en composer/npm, desactívalo temporalmente o usa un mirror seguro).
 - Configuración de grid y tamaños (nuevo):
   - `SiteSettings` ahora incluye `avatar_width/height`, `thumbnail_width/height` y columnas del grid: `grid_cols_desktop` y `grid_cols_mobile`.
   - Nueva query GraphQL `siteSettings` (esquema público) expone esos valores.
   - El frontend usa automáticamente `avatar_width` como tamaño del avatar en listados y `grid_cols_desktop/mobile` para definir columnas por fila en Home y Tags.

## Cambios 1.5.0
- **Autenticación Sanctum completa**: Login/logout con sesión cookie desde React.
- **AuthContext**: Proveedor de autenticación global con `useAuth()` hook.
- **API Auth Endpoints**: `/api/login`, `/api/logout`, `/api/me`.
- **Navegación con autenticación**: Muestra usuario logueado o botón Login.
- **GraphQL protegido con Sanctum**: Esquema `default` usa `auth:sanctum` middleware.
- **Stateful API**: Configuración para SPA en `127.0.0.1:3000`.
- **Login Form**: Componente React con validación y manejo de errores.

## Cambios 2.3.8
- **Eliminación física de medios al quitar de galería**:
  - `RemoveMediaFromGalleryMutation` ahora elimina el registro de `media` y archivos físicos, no solo la relación pivot.
  - Verificación de uso compartido: Si un medio está en múltiples galerías, solo se elimina la relación pero el archivo se preserva.
  - Logging completo del proceso de eliminación para debugging.
- **Comando de limpieza de medios huérfanos**:
  - Nuevo comando Artisan: `php artisan media:clean-orphans`
  - Opción `--dry-run` para visualizar sin eliminar.
  - Identifica y elimina medios de la colección `gallery` que no están asociados a ninguna galería.
  - Muestra tabla con ID, nombre, tamaño y fecha de creación.
  - Confirmación interactiva antes de eliminar.

Actualización requerida:
```bash
cd back-admin
php artisan optimize:clear
```

## Cambios 1.4.0
- Frontend migrado a Vite 5 manteniendo React 18.
- Proxy de desarrollo configurado para `/graphql` y `/storage` hacia Laravel.
- Integración GraphQL pública vía `/graphql/public` y helper en `src/lib/graphql.js`.
- Requisitos actualizados a Node >= 20 (recomendado 22 LTS) y nuevos comandos `dev/build/preview`.

## Producción (Hostinger-recomendacion)

Guía específica para desplegar en Hostinger (Shared Hosting o VPS). Hostinger es económico pero limitado: no tiene Node.js instalado, ni Redis, ni Supervisor. Recomendaciones:

### Recomendaciones Generales para Hostinger
- **Plan**: Shared Hosting Premium para empezar; VPS si necesitas más control.
- **Build Frontend**: Hazlo localmente (`npm run build` en tu PC) y sube el `dist/` vía FTP.
- **Cache/Queues**: Usa `database` driver (no Redis disponible en shared).
- **Colas**: Sin Supervisor; usa `php artisan queue:work` manual o cron cada minuto.
- **SSL**: Hostinger lo maneja automáticamente (Let's Encrypt).
- **Subdominios**: Crea `admin.tu-dominio.com` apuntando al mismo directorio (usa .htaccess para routing).
- **Backups**: Automáticos diarios en Hostinger; exporta BD semanalmente.
- **Límites**: Shared tiene límites de CPU/memoria; optimiza queries y usa cache.

### 1. Preparación en Hostinger
- Compra dominio y hosting.
- Crea subdominio `admin` en panel Hostinger (apunta a `public_html/` o subdirectorio).
- Sube archivos manualmente vía FTP (FileZilla).
- PHP 8.1+ requerido; activa en panel si no está.
- MySQL: Crea BD por ejemplo `link_persons_prod` vía phpMyAdmin en panel.

### 2. Variables de Entorno Backend (`back-admin/.env`)
Sube `.env` vía FTP (no lo pongas en repo). Ejemplo para Hostinger:

```dotenv
APP_ENV=production
APP_DEBUG=false
APP_URL=https://admin.tu-dominio.com
FRONTEND_URL=https://tu-dominio.com
LOG_LEVEL=info

DB_CONNECTION=mysql
DB_HOST=localhost  # O IP de BD Hostinger
DB_PORT=3306
DB_DATABASE=link_persons_prod
DB_USERNAME=tu_usuario_bd
DB_PASSWORD=tu_password_bd

# URLs de Frontend y Dominios
# Asegúrate de que FRONTEND_URL sea la URL principal de tu sitio React
# SANCTUM_STATEFUL_DOMAINS debe incluir el dominio del frontend y el del backend (sin http://)
# CORS_ALLOWED_ORIGINS debe incluir la URL completa del frontend
FRONTEND_URL=https://tu-dominio.com
SANCTUM_STATEFUL_DOMAINS=tu-dominio.com,admin.tu-dominio.com
CORS_ALLOWED_ORIGINS=https://tu-dominio.com

CACHE_DRIVER=database  # No Redis en shared
QUEUE_CONNECTION=database
SESSION_DRIVER=database
SESSION_LIFETIME=120
SESSION_DOMAIN=.tu-dominio.com

FILESYSTEM_DISK=public

MAIL_MAILER=smtp
MAIL_HOST=smtp.hostinger.com  # O tu proveedor
MAIL_PORT=587
MAIL_USERNAME=tu-email@tu-dominio.com
MAIL_PASSWORD=tu_password_email
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@tu-dominio.com
MAIL_FROM_NAME="Link Persons"

BROADCAST_CONNECTION=pusher  # O null si no usas real-time
PUSHER_APP_ID=xxx
PUSHER_APP_KEY=xxx
PUSHER_APP_SECRET=xxx
PUSHER_APP_CLUSTER=us2

ALTCHA_ENABLED=true
ALTCHA_SECRET=pon_un_hmac_de_64_chars
```

#### Botón "Ver Sitio" en el panel (Filament)
- Define `FRONTEND_URL` en `back-admin/.env` con la URL pública del frontend, por ejemplo `https://tu-dominio.com`.
- El panel mostrará un botón "Ver Sitio" en la barra superior (antes del buscador global) que abre el frontend en una pestaña nueva.
- Implementación: `back-admin/app/Providers/Filament/AdminPanelProvider.php` usando el hook `GLOBAL_SEARCH_BEFORE`.
- Si deseas mover la posición del botón, se puede cambiar a otros hooks del topbar (p. ej., `TOPBAR_END`).

### 3. Despliegue Backend
Sube archivos vía FTP a `public_html/` (o subdirectorio para subdominio).

```bash
# Localmente, prepara el build:
cd back-admin
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan shield:generate --all
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache
php artisan optimize

# Sube todo a Hostinger vía FTP (FileZilla).
# En Hostinger, ejecuta comandos vía SSH (si disponible) o phpMyAdmin para migraciones.
```

Permisos: En panel Hostinger, ajusta permisos de `storage/` y `bootstrap/cache/` a 755/644.

### 4. Despliegue Frontend

**Configuración de URLs del Backend:**

1. **Crear archivo `.env` en `front-site/`:**
```dotenv
# URL del backend Laravel en producción
VITE_BACKEND_URL=https://admin.tu-dominio.com
```

2. **Actualizar `vite.config.ts` (línea 7):**
```typescript
// Cambiar de desarrollo a producción
const BACKEND_URL = 'https://admin.tu-dominio.com'
```

3. **Build localmente:**
```bash
cd front-site
npm ci
npm run build
```

**Nota:** El título, descripción y favicon se cargan dinámicamente desde `siteSettings` del backend, configurables desde el panel de administración Filament.

Variables `.env.production` (opcional - solo si necesitas override):
```dotenv
VITE_API_BASE=https://admin.tu-dominio.com/graphql/public
VITE_PUSHER_APP_KEY=xxx
VITE_PUSHER_APP_CLUSTER=us2
VITE_PUSHER_FORCE_TLS=true
```

Sube `dist/` a `public_html/` del dominio raíz vía FTP.

### 5. Configuración .htaccess (Hostinger)
Para routing SPA y subdominio:

En `public_html/.htaccess` (backend):
```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteRule ^(.*)$ public/index.php [L]
</IfModule>
```

Para frontend (si en subdirectorio, ajusta).

### 6. Cron y Colas (Hostinger)
- **Cron**: En panel Hostinger, agrega:
  ```
  * * * * * /usr/bin/php /home/USUARIO/domains/only-models.online/public_html/administrator/artisan schedule:run --no-ansi --no-interaction >> /home/USUARIO/logs/cron-schedule.log 2>&1
  ```
- **Colas**: Sin Supervisor; agrega otro cron:
  ```
  * * * * * /usr/bin/php /home/USUARIO/domains/only-models.online/public_html/administrator/artisan queue:work --stop-when-empty --tries=1 --no-ansi --no-interaction >> /home/USUARIO/logs/cron-queue.log 2>&1
  ```

### 7. Checklist Post-Deploy
1. Acceso panel: `https://admin.tu-dominio.com/admin`.
2. Frontend: `https://tu-dominio.com` carga y hace requests a backend.
3. GraphQL: `curl https://admin.tu-dominio.com/graphql/public`.
4. Emails: Prueba envío desde panel Hostinger.
5. Cron: Verifica logs en panel.
6. Service Worker: si el front no refleja cambios, en DevTools → Application: "Unregister" SW y "Clear site data"; recargar.
7. Tipografías: cambiar fuentes en Filament (Tipografía) y confirmar `:root --bs-body-font-family` aplicado; recargar si había caché.
8. Google Analytics: poner `google_analytics_id` en SiteSettings y verificar `<script src="https://www.googletagmanager.com/gtag/js?id=...">` cargado y `window.dataLayer` presente.

### 8. Actualizaciones
Sube nuevos archivos vía FTP. Ejecuta migraciones vía SSH o phpMyAdmin.

### 9. Troubleshooting Hostinger
- 500 error: Revisa permisos y `.env`.
- Build frontend: Siempre local; Hostinger no tiene Node.js.
- Memoria agotada: Optimiza queries; considera VPS si crece.
- Emails: Usa SMTP de Hostinger o externo (Gmail/Mailtrap).
- Si necesitas más control, migra a VPS de Hostinger.

---
Fin sección Producción Hostinger.
\n+### Optimización en Shared Hosting

Acciones recomendadas para mejorar rendimiento y estabilidad en un entorno compartido con recursos limitados:

1. Caching y Configuración
  - Ejecutar en cada deploy: `php artisan config:cache; php artisan route:cache; php artisan view:cache; php artisan event:cache; php artisan optimize`.
  - Usar `CACHE_DRIVER=database` y crear índice en tabla `cache` si crece (`key` UNIQUE ya ayuda).
  - Habilitar `OPCACHE` en panel (si disponible) y valores: `opcache.memory_consumption=256`, `opcache.max_accelerated_files=20000`.

2. Consultas y GraphQL
  - Implementar select específicos (evitar `*`) en resolvers pesados.
  - Eager loading consistente: `->with(['tags','links','roles'])` para prevenir N+1.
  - Añadir índices: usuarios (`username`, `views`, `price_from`, `gender`), galerías (`user_id`, `is_featured`, `status`, `visibility`).
  - Limitar `per_page` agresivamente (ej: usuarios máx 24, galerías máx 20) para reducir payload.

3. Imágenes y Media
  - Forzar conversión a WebP (si no afecta compatibilidad requerida) en Spatie Media Library para thumbnails.
  - Usar tamaños más pequeños: reducir `thumbnail_width/height` si el grid muestra miniaturas (ej 320x200).
  - Activar lazy loading en todos los `<img>` (`loading="lazy" decoding="async"`).
  - Externalizar archivos pesados a un bucket (cuando migres a VPS) usando `FILESYSTEM_DISK=s3`.

4. Colas y Tareas
  - Unir jobs pequeños en uno solo (ej: procesamiento de notificaciones + envío email).
  - Evitar jobs recursivos o de alta frecuencia; usar consolidación cada 5 minutos (cron) para tareas agregadas.
  - Limitar duración de `queue:work` con `--max-time=300` si el host mata procesos largos.

5. Código y Paquetes
  - Eliminar dependencias no usadas (auditar `composer.json` y `package.json`).
  - Evitar paquetes pesados de imagen si no se usan (ej: imagick vs gd) para reducir memoria.
  - En frontend, aplicar split dinámico ya implementado y revisar bundle con `vite build --analyze`.

6. Frontend Performance
  - Activar CDN (Cloudflare) para caché de `dist/assets` (inmutable, long max-age)..
  - Preload de fuentes críticas (`<link rel="preload" as="font">`) en `index.html` si aplicas Google Fonts self-host.
  - Reducir número de requests: agrupar iconos en sprite si crece lista (opcional).

7. Seguridad vs Recursos
  - Desactivar verbose logging (`LOG_LEVEL=info`). Evitar `debug`.
  - Rotar logs manualmente si Hostinger no lo hace (script cron mensual).

8. Base de Datos
  - Revisar crecimiento de tablas: `media`, `jobs`, `failed_jobs`, `notifications`.
  - Limpiar `failed_jobs` y `jobs` completados semanalmente (`artisan queue:prune-failed --hours=168`).
  - Agregar índice compuesto a `galleries (status, visibility, user_id)` y `media (model_id, collection_name)`.

9. Limitar Funcionalidades Costosas
  - Diferir features intensivas (IA de imágenes) hasta migrar a VPS.
  - Evitar watermark en tiempo real para cada upload grande; procesar en cola y mostrar placeholder.

10. Monitorización Ligera
  - Página de estado simple (GraphQL query mínima + versión) para uptime monitors.
  - Si no hay acceso a herramientas APM, agregar timestamps y duración a logs de jobs críticos manualmente.

11. Entorno
  - Mantener `.env` limpio; eliminar variables no usadas para evitar lecturas innecesarias.
  - Usar `APP_ENV=production` + `APP_DEBUG=false` (ya indicado) para activar rutas cache.

12. Reducción de Memoria PHP
  - Configurar `memory_limit=512M` (evitar >1G en shared para no gatillar throttling).
  - Asegurar `max_execution_time=60` y optimizar jobs que excedan eso.

13. GraphQL Rate Limiting
  - Aplicar `throttle:30,1` al esquema público si recibes abuso y habilitar caché a queries anónimas (tags, settings).

14. Sanitización y Limpieza
  - Script semanal (cron) para eliminar media huérfano con `media:clean-orphans --dry-run` primero, luego sin flag.

15. CDN para Imágenes (Opcional Futuro)
  - Subir `storage/app/public` a subdominio CDN (ej: `cdn.tu-dominio.com`) y reescribir URLs con `ASSET_URL`.

Checklist rápido post-ajustes:
```bash
php artisan optimize:clear
php artisan config:cache route:cache view:cache event:cache
php artisan media:clean-orphans --dry-run
php artisan queue:restart
```

Fin sección Optimización Shared Hosting.

