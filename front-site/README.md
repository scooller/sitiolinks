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
El tipo de transición se puede configurar desde el panel de administración (Filament) en la pestaña "Diseño" de SiteSettings. Las opciones disponibles son:
- **fade**: Desvanecimiento suave
- **slide**: Deslizamiento lateral
- **scale**: Efecto de escala

Los cambios se reflejan automáticamente en el frontend tras recargar la página.

Recomendaciones de rendimiento:
- Añadir `style={{ willChange: 'transform, opacity' }}` a elementos animados con transform/opacity.
- Mantener la duración corta (0.2–0.4s) para sensación fluida.
- Evitar animar propiedades pesadas (box-shadow grande, border-radius múltiple) en exceso.

---

## ALTCHA (captcha libre)

ALTCHA es la solución de captcha por defecto en este proyecto (recomendado). No requiere servicios externos; funciona mediante un desafío PoW resuelto en el navegador.

1) Instalar dependencias:

```bash
npm install
npm install altcha
```

2) Configuración (opcional):

---

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

Este paquete: `front-site` versión **0.2.0**.

---

## Imágenes de Cafés y Sucursales

El frontend consume `image_url` desde GraphQL para cafés y sucursales.

Reglas actuales:
- `image_url` llega desde backend como URL absoluta contra `APP_URL`.
- En desarrollo, la URL correcta de media debe ser `http://127.0.0.1:8000/...`, no `http://127.0.0.1:3000/...`.
- Esto evita que Vite resuelva accidentalmente la imagen contra el host del frontend cuando GraphQL pasa por proxy.

Endpoints esperados:
- `http://127.0.0.1:8000/cafe-media/{id}`
- `http://127.0.0.1:8000/branch-media/{id}`

Notas:
- El componente `CafesWithReviews` usa directamente `cafe.image_url` y `branch.image_url`.
- La selección de imagen en backend siempre toma la más nueva por `created_at desc` con `id desc` como desempate.


```
VITE_CAPTCHA_PROVIDER=altcha
VITE_ALTCHA_CHALLENGE_URL=/altcha/challenge
```

El widget se integra como `<altcha-widget challengeurl="/api/altcha/challenge" name="captcha" />` y el backend verifica las soluciones localmente.
```

La mutación de contacto y el registro enviarán el token automáticamente.

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
