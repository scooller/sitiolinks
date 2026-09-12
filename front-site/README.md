# Front Site

## Motion (animaciones)

Este proyecto usa [Motion](https://motion.dev) para animaciones ligeras y performantes en React.

Instalación:
```bash
npm install motion --save-exact
```

Uso básico en React:
```tsx
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn } from './src/lib/animations';

<AnimatePresence mode="wait">
	<motion.div
		variants={fadeIn}
		initial="initial"
		animate="animate"
		exit="exit"
	>Contenido</motion.div>
</AnimatePresence>
```

Helpers definidos en `src/lib/animations.ts` (fadeIn, slideLeft, scaleIn). Para transiciones de página envolver vistas con `AnimatedPage` (`src/components/AnimatedPage.tsx`).

El enrutador (`App.tsx`) ya está configurado con `AnimatePresence` y cada ruta envuelta en `AnimatedPage`, por lo que las transiciones funcionan automáticamente al cambiar de página.

**Configuración dinámica desde el backend:**
El tipo de transición (`transition_type`) se configura en el panel de administración (Filament) en SiteSettings → pestaña "Diseño" → sección "Animaciones". Las opciones del selector (con su etiqueta exacta en el admin) son:
- **fade** — "Fade (Fade-out)": Desvanecimiento suave (valor por defecto)
- **slide** — "Slide (Sliding)": Deslizamiento lateral
- **scale** — "Scale (Scaling)": Efecto de escala

El campo es obligatorio y su valor por defecto es `fade`. Los cambios se reflejan automáticamente en el frontend tras recargar la página.

Detalle técnico: en `src/lib/animations.ts` la transición por defecto (`defaultTransition`) dura 0.25s con easing `easeOut`, y `getVariantByName()` hace fallback a `fadeIn` cuando el valor configurado no coincide con ninguna variante.

Recomendaciones de rendimiento:
- Añadir `style={{ willChange: 'transform, opacity' }}` a elementos animados con transform/opacity.
- Mantener la duración corta (0.2–0.4s) para sensación fluida.
- Evitar animar propiedades pesadas (box-shadow grande, border-radius múltiple) en exceso.

---

## ALTCHA (captcha libre)

ALTCHA es la solución de captcha por defecto (paquete npm `altcha`). No requiere servicios externos; funciona mediante un desafío PoW resuelto en el navegador.

El widget se monta dinámicamente (`import('altcha')`) en **Registro** y **Contacto**:

```tsx
<altcha-widget
  challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'}
  name="captcha"
/>
```

- En desarrollo (Vite) el challenge se resuelve vía proxy (`/api` → backend), sin configuración extra.
- En producción, define `VITE_BACKEND_URL` (p. ej. `https://admin.only-models.online`) para que el widget apunte al backend correcto.
- No hay variables `VITE_CAPTCHA_PROVIDER` ni `VITE_ALTCHA_CHALLENGE_URL`; la URL se construye como arriba.
- El payload resuelto se envía automáticamente como `captcha` en la mutación de contacto y en el registro.

## Orden de Usuarios desde Backend

El orden en que se listan los usuarios en el frontend se controla desde el panel de administración en `/admin/site-settings` → pestaña "Diseño Grid" → campo "Orden de Usuarios".

Opciones soportadas:
- Más nuevos primero (`newest`)
- Más antiguos primero (`oldest`)
- Más visitas (`most_views`)
- Menos visitas (`least_views`)
- Por nombre (A–Z) (`name`)
- Por username (A–Z) (`username`)
- Al azar (`random`) — el backend desactiva el cache en la primera página para evitar resultados repetidos.

Notas:
- Las páginas que usan la query `users` reflejan automáticamente el orden sin parámetros adicionales.
- El setting también se expone en GraphQL como `siteSettings.grid_users_sort` por si se desea mostrar un badge informativo en UI.

---

## Versión

Este paquete: `front-site` versión **0.25.0**.

---

## Archivos de Indexación y LLM SEO (Generative Engine Optimization)

Los archivos de indexación residen en `public/` y se procesan durante el build:
- `/llms.txt`: Resumen ejecutivo y arquitectura en Markdown para modelos de IA (ChatGPT, Claude, Perplexity).
- `/llms-full.txt`: Documentación exhaustiva con especificación de entidades (Creadores, Cafés con Piernas, Ley N° 21.719 ARCOP).
- `/robots.txt`: Directivas explícitas para rastreadores de IA generativa (`GPTBot`, `ClaudeBot`, `PerplexityBot`, etc.).
- `/sitemap.xml`: Mapa de URLs canónicas con actualización dinámica.

## Scripts (Vite)

El proyecto es una SPA con **Vite** (ver `vite.config.ts`), no Create React App.

- `npm run dev` — servidor de desarrollo en `http://127.0.0.1:3000` con proxy a `http://127.0.0.1:8000` (`/graphql`, `/api`, `/storage`, `/gallery-media`, `/sanctum`).
- `npm run build` — ejecuta `node scripts/generate-sitemap.mjs && vite build`. Lee `VITE_FRONTEND_URL` de `.env.production` y genera el build de producción en `dist/` con URLs canónicas actualizadas.
- `npm run sitemap` — ejecuta solo el generador de sitemap y robots.
- `npm run preview` — previsualiza el build en `http://127.0.0.1:4173` con el mismo proxy.

Requiere Node >= 20 (ver `engines` en `package.json`).

## Referencias

- Documentación de [Vite](https://vite.dev/).
- Documentación de [React](https://react.dev/).

