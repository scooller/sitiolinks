import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import './App.css';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import Navigation from './components/Navigation.tsx';
import ThemeSwitcher from './components/ThemeSwitcher.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import CreatorRoute from './components/CreatorRoute.tsx';
import VerifiedRoute from './components/VerifiedRoute.tsx';
// Lazy load ALL pages including Home for optimal initial bundle
const Home = React.lazy(() => import('./pages/Home.tsx'));
const Explore = React.lazy(() => import('./pages/Explore.tsx'));
const Ranking = React.lazy(() => import('./pages/Ranking.tsx'));
const Contact = React.lazy(() => import('./pages/Contact.tsx'));
const Page = React.lazy(() => import('./pages/Page.tsx'));
const TagPage = React.lazy(() => import('./pages/Tag.tsx'));
const UserProfile = React.lazy(() => import('./pages/UserProfile.tsx'));
const Login = React.lazy(() => import('./pages/Login.tsx'));
const Register = React.lazy(() => import('./pages/Register.tsx'));
const VerifyEmail = React.lazy(() => import('./pages/VerifyEmail.tsx'));
const EmailVerified = React.lazy(() => import('./pages/EmailVerified.tsx'));
const Notifications = React.lazy(() => import('./pages/Notifications.tsx'));
const Tickets = React.lazy(() => import('./pages/Tickets.tsx'));
const NewTicket = React.lazy(() => import('./pages/NewTicket.tsx'));
const TicketDetail = React.lazy(() => import('./pages/TicketDetail.tsx'));
const UserGalleries = React.lazy(() => import('./pages/UserGalleries.tsx'));
const GalleryDetail = React.lazy(() => import('./pages/GalleryDetail.tsx'));
const MyGalleries = React.lazy(() => import('./pages/MyGalleries.tsx'));
const NewGallery = React.lazy(() => import('./pages/NewGallery.tsx'));
const EditGallery = React.lazy(() => import('./pages/EditGallery.tsx'));
const EditProfile = React.lazy(() => import('./pages/EditProfile.tsx'));
const NotFound = React.lazy(() => import('./pages/NotFound.tsx'));
import AnimatedPage from './components/AnimatedPage.tsx';
import { graphqlRequest } from './lib/graphql/graphqlRequest';
import { queries } from './lib/graphql/queries';
import InstallPWA from './components/InstallPWA.tsx';
import OfflineIndicator from './components/OfflineIndicator.tsx';
import LoadingFallback from './components/LoadingFallback.tsx';
import PreloadCriticalAssets from './components/PreloadCriticalAssets.tsx';
import WarningModal from './components/WarningModal.tsx';

// Encapsula las rutas con animaciones de montaje/desmontaje.
const AnimatedRoutes: React.FC<{ transitionType?: string }> = ({ transitionType }) => {
  const location = useLocation();
  React.useEffect(() => {
    const path = location.pathname;
    const seg = path.replace(/^\//, '').split('/')[0];
    const map: Record<string, string> = {
      '': 'home',
      'faqs': 'faqs',
      'terminos-y-condiciones': 'terminos',
      'politica-de-privacidad': 'privacidad',
      'terms-and-conditions': 'terminos',
      'privacy-policy': 'privacidad',
      'explorar': 'explorar',
      'ranking': 'ranking',
      'login': 'login',
      'register': 'register',
      'verify-email': 'verify-email',
      'email-verified': 'email-verified',
      'contacto': 'contacto',
      'contact': 'contacto',
      't': 'tag',
      'u': 'perfil',
      'galleries': 'gallery',
    };
    const clsRaw = map[seg] ?? (seg || 'home');
    const prev = document.body.getAttribute('data-route-class');
    if (prev && prev !== clsRaw) document.body.classList.remove(prev);
    if (!document.body.classList.contains(clsRaw)) document.body.classList.add(clsRaw);
    document.body.setAttribute('data-route-class', clsRaw);
  }, [location]);
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<AnimatedPage id="home" transitionType={transitionType}><Home /></AnimatedPage>} />
        <Route path="/explorar" element={<AnimatedPage id="explorar" transitionType={transitionType}><Explore /></AnimatedPage>} />
        <Route path="/ranking" element={<AnimatedPage id="ranking" transitionType={transitionType}><Ranking /></AnimatedPage>} />
        <Route path="/login" element={<AnimatedPage id="login" transitionType={transitionType}><Login /></AnimatedPage>} />
        <Route path="/register" element={<AnimatedPage id="register" transitionType={transitionType}><Register /></AnimatedPage>} />
        <Route path="/verify-email" element={<ProtectedRoute><AnimatedPage id="verify-email" transitionType={transitionType}><VerifyEmail /></AnimatedPage></ProtectedRoute>} />
        <Route path="/email-verified" element={<AnimatedPage id="email-verified" transitionType={transitionType}><EmailVerified /></AnimatedPage>} />
        <Route path="/terminos-y-condiciones" element={<AnimatedPage id="terminos" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/politica-de-privacidad" element={<AnimatedPage id="privacidad" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/contacto" element={<AnimatedPage id="contacto" transitionType={transitionType}><Contact /></AnimatedPage>} />
        <Route path="/terms-and-conditions" element={<AnimatedPage id="terminos" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/privacy-policy" element={<AnimatedPage id="privacidad" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/contact" element={<AnimatedPage id="contacto" transitionType={transitionType}><Contact /></AnimatedPage>} />
        <Route path="/preguntas-frecuentes" element={<AnimatedPage id="preguntas-frecuentes" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/faqs" element={<AnimatedPage id="faqs" transitionType={transitionType}><Page /></AnimatedPage>} />
        <Route path="/t/:tag" element={<AnimatedPage id="tag" transitionType={transitionType}><TagPage /></AnimatedPage>} />
        <Route path="/u/:username" element={<AnimatedPage id="perfil" transitionType={transitionType}><UserProfile /></AnimatedPage>} />
        <Route path="/u/:username/galleries" element={<AnimatedPage id="perfil-galerias" transitionType={transitionType}><UserGalleries /></AnimatedPage>} />
        <Route path="/galleries/:id" element={<AnimatedPage id="gallery" transitionType={transitionType}><GalleryDetail /></AnimatedPage>} />
        <Route path="/perfil/editar" element={<ProtectedRoute><AnimatedPage id="editar-perfil" transitionType={transitionType}><EditProfile /></AnimatedPage></ProtectedRoute>} />
        <Route path="/notificaciones" element={<ProtectedRoute><AnimatedPage id="notificaciones" transitionType={transitionType}><Notifications /></AnimatedPage></ProtectedRoute>} />
        <Route path="/mis-galerias" element={<CreatorRoute><AnimatedPage id="mis-galerias" transitionType={transitionType}><MyGalleries /></AnimatedPage></CreatorRoute>} />
        <Route path="/mis-galerias/nueva" element={<CreatorRoute><AnimatedPage id="nueva-galeria" transitionType={transitionType}><NewGallery /></AnimatedPage></CreatorRoute>} />
        <Route path="/mis-galerias/:id/editar" element={<CreatorRoute><AnimatedPage id="editar-galeria" transitionType={transitionType}><EditGallery /></AnimatedPage></CreatorRoute>} />
        <Route path="/tickets" element={<VerifiedRoute><AnimatedPage id="tickets" transitionType={transitionType}><Tickets /></AnimatedPage></VerifiedRoute>} />
        <Route path="/tickets/nuevo" element={<VerifiedRoute><AnimatedPage id="nuevo-ticket" transitionType={transitionType}><NewTicket /></AnimatedPage></VerifiedRoute>} />
        <Route path="/tickets/:id" element={<VerifiedRoute><AnimatedPage id="detalle-ticket" transitionType={transitionType}><TicketDetail /></AnimatedPage></VerifiedRoute>} />
        <Route path="*" element={<AnimatedPage id="not-found" transitionType={transitionType}><NotFound /></AnimatedPage>} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  const [transitionType, setTransitionType] = React.useState<string>('fade');
  const settingsLoaded = React.useRef<boolean>(false);

  // Cargar siteSettings (título, favicon, analytics, etc.) al montar
  React.useEffect(() => {
    // Evitar múltiples cargas (React Strict Mode en dev ejecuta 2 veces)
    // Pero permitir recarga en navegación normal
    const shouldLoad = !settingsLoaded.current || performance.navigation.type === 1;
    
    if (settingsLoaded.current && performance.navigation.type !== 1) {
      console.log('⏭️ SiteSettings ya cargados, saltando...');
      return;
    }
    
    settingsLoaded.current = true;
    console.log('🚀 Iniciando carga de SiteSettings...');
    
    graphqlRequest({ query: queries.siteSettings })
      .then((data) => {
        const settings = data?.siteSettings;
        if (!settings) {
          console.warn('⚠️ No se pudieron cargar siteSettings');
          return;
        }
        
        console.log('⚙️ SiteSettings cargados:', {
          full: settings,
          fonts: {
            heading_font: settings.heading_font,
            body_font: settings.body_font
          },
          theme: {
            theme_primary: settings.theme_primary,
            theme_secondary: settings.theme_secondary
          },
          analytics: {
            google_analytics_id: settings.google_analytics_id
          }
        });

        // Configurar tipo de transición
        const type = settings.transition_type as string | undefined;
        if (type) setTransitionType(type);

        // Actualizar título del sitio
        if (settings.site_title) {
          document.title = settings.site_title as string;
        }

        // Actualizar meta descripción
        if (settings.site_description) {
          let metaDesc = document.querySelector('meta[name="description"]');
          if (!metaDesc) {
            metaDesc = document.createElement('meta');
            metaDesc.setAttribute('name', 'description');
            document.head.appendChild(metaDesc);
          }
          metaDesc.setAttribute('content', settings.site_description);
        }

        // Actualizar favicon si está configurado
        if (settings.favicon_url) {
          const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
          if (favicon) {
            favicon.href = settings.favicon_url as string;
          }
        }

        // Inyectar Google Analytics si está configurado
        const gaId = settings.google_analytics_id as string | undefined;
        if (gaId && gaId.trim()) {
          // Google Analytics 4 (gtag.js)
          const script1 = document.createElement('script');
          script1.async = true;
          script1.src = `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
          document.head.appendChild(script1);

          const script2 = document.createElement('script');
          script2.innerHTML = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${gaId}');
          `;
          document.head.appendChild(script2);
        }

        const hf = settings.heading_font as string | undefined;
        const bf = settings.body_font as string | undefined;
                
        console.log('🔤 Configuración de fuentes:', {
          heading_font: hf,
          body_font: bf,
          has_heading: !!(hf && hf.trim()),
          has_body: !!(bf && bf.trim())
        });
                
        if ((hf && hf.trim()) || (bf && bf.trim())) {
          const encode = (n: string) => n.trim().replace(/\s+/g, '+');
          
          // Función para detectar si es fuente variable o estática
          const getFontParams = (fontName: string): string => {
            // Fuentes variables comunes de Google (agregar más según necesites)
            const variableFonts = [
              'Inter', 'Roboto Flex', 'Outfit', 'Manrope', 'Plus Jakarta Sans',
              'Work Sans', 'DM Sans', 'Space Grotesk', 'Sora', 'Epilogue'
            ];
            
            const isVariable = variableFonts.some(vf => 
              fontName.toLowerCase().includes(vf.toLowerCase())
            );
            
            if (isVariable) {
              // Para fuentes variables: wght@100..900
              return `family=${encode(fontName)}:wght@100..900`;
            } else {
              // Para fuentes estáticas: múltiples pesos
              return `family=${encode(fontName)}:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900`;
            }
          };
          
          const families: string[] = [];
          if (bf && bf.trim()) families.push(getFontParams(bf));
          if (hf && hf.trim() && hf !== bf) families.push(getFontParams(hf));
          
          const href = `https://fonts.googleapis.com/css2?${families.join('&')}&display=swap`;
          
          console.log('🔤 URL de Google Fonts generada:', href);
          
          // PASO 1: Crear/actualizar el <link> PRIMERO
          let link = document.getElementById('site-fonts') as HTMLLinkElement | null;
          if (!link) {
            link = document.createElement('link');
            link.id = 'site-fonts';
            link.rel = 'stylesheet';
            link.href = href;
            document.head.appendChild(link);
            console.log('🔤 <link> de Google Fonts creado');
          } else {
            link.href = href;
            console.log('🔤 <link> de Google Fonts actualizado');
          }
          
          // PASO 2: Esperar a que las fuentes carguen, LUEGO aplicar CSS
          const applyFontStyles = () => {
            let style = document.getElementById('site-fonts-style') as HTMLStyleElement | null;
            if (!style) {
              style = document.createElement('style');
              style.id = 'site-fonts-style';
              document.head.appendChild(style);
              console.log('🔤 <style> de fuentes creado');
            }
            
            const bodyFamily = bf && bf.trim() ? `'${bf}', sans-serif` : '';
            const headingFamily = hf && hf.trim() ? `'${hf}', sans-serif` : '';
            const parts: string[] = [];
            
            if (bodyFamily) {
              parts.push(`:root { --bs-body-font-family: ${bodyFamily}; }`);
              parts.push(`body { font-family: ${bodyFamily} !important; }`);
            }
            
            if (headingFamily) {
              parts.push(`h1, h2, h3, h4, h5, h6, .nav-link { font-family: ${headingFamily} !important; }`);
            }
            
            style.textContent = parts.join('\n');
            console.log('✅ CSS de fuentes aplicado:', style.textContent);
          };
          
          // PASO 3: Usar Font Face Observer para aplicar estilos cuando estén listas
          if (document.fonts && document.fonts.ready) {
            // Opción A: Esperar a que TODAS las fuentes carguen
            document.fonts.ready.then(() => {
              console.log('✅ Todas las fuentes cargadas vía fonts.ready');
              applyFontStyles();
              
              // Forzar repaint
              document.body.style.opacity = '0.99999';
              requestAnimationFrame(() => {
                document.body.style.opacity = '1';
              });
            }).catch(err => {
              console.warn('⚠️ Error en fonts.ready, aplicando estilos de todos modos:', err);
              applyFontStyles();
            });
            
            // Opción B: Timeout de seguridad (máximo 3 segundos)
            setTimeout(() => {
              if (!document.getElementById('site-fonts-style')?.textContent) {
                console.warn('⏱️ Timeout: aplicando estilos después de 3s');
                applyFontStyles();
              }
            }, 3000);
            
          } else {
            // Fallback para navegadores antiguos: aplicar inmediatamente
            console.warn('⚠️ document.fonts.ready no disponible, aplicando estilos inmediatamente');
            applyFontStyles();
          }
          
          // PASO 4: Verificación después de 1 segundo
          setTimeout(() => {
            const computedBody = window.getComputedStyle(document.body);
            const h1 = document.querySelector('h1');
            const computedH1 = h1 ? window.getComputedStyle(h1) : null;
            
            console.log('🔍 Verificación de fuentes aplicadas:', {
              bodyFontFamily: computedBody.fontFamily,
              h1FontFamily: computedH1?.fontFamily,
              linkExists: !!document.getElementById('site-fonts'),
              styleExists: !!document.getElementById('site-fonts-style'),
              linkHref: (document.getElementById('site-fonts') as HTMLLinkElement)?.href,
              styleContent: document.getElementById('site-fonts-style')?.textContent
            });
          }, 1000);
          
        } else {
          console.log('⚠️ No hay fuentes configuradas en siteSettings');
        }


        const css = settings.custom_css as string | undefined;
        if (css && css.trim()) {
          console.log('🎨 Aplicando CSS personalizado:', {
            length: css.length,
            preview: css.substring(0, 100) + '...'
          });
          
          let custom = document.getElementById('site-custom-css') as HTMLStyleElement | null;
          if (!custom) {
            custom = document.createElement('style');
            custom.id = 'site-custom-css';
            custom.setAttribute('type', 'text/css');
            document.head.appendChild(custom);
            console.log('🎨 Elemento <style> de CSS personalizado creado');
          }
          custom.textContent = css;
          
          // Verificar que se aplicó
          setTimeout(() => {
            const appliedStyle = document.getElementById('site-custom-css');
            console.log('🔍 Verificación de CSS personalizado:', {
              exists: !!appliedStyle,
              hasContent: !!(appliedStyle?.textContent),
              contentLength: appliedStyle?.textContent?.length || 0
            });
          }, 500);
        } else {
          console.log('⚠️ No hay CSS personalizado configurado');
        }

        const applyThemeColors = (colors: Partial<Record<'primary'|'secondary'|'success'|'danger'|'warning'|'info'|'light'|'dark', string | undefined>>): void => {
          const entries = Object.entries(colors).filter(([, v]) => typeof v === 'string' && String(v).trim());
          if (!entries.length) return;
          let theme = document.getElementById('site-theme') as HTMLStyleElement | null;
          if (!theme) {
            theme = document.createElement('style');
            theme.id = 'site-theme';
            document.head.appendChild(theme);
          }
          const toRgb = (hex: string): string => {
            const h = hex.replace('#', '').trim();
            if (h.length !== 6) return '';
            const r = parseInt(h.slice(0, 2), 16);
            const g = parseInt(h.slice(2, 4), 16);
            const b = parseInt(h.slice(4, 6), 16);
            return `${r}, ${g}, ${b}`;
          };
          const clamp = (n: number): number => Math.max(0, Math.min(255, Math.round(n)));
          const darken = (hex: string, pct: number): string => {
            const h = hex.replace('#', '');
            const r = clamp(parseInt(h.slice(0, 2), 16) * (1 - pct / 100));
            const g = clamp(parseInt(h.slice(2, 4), 16) * (1 - pct / 100));
            const b = clamp(parseInt(h.slice(4, 6), 16) * (1 - pct / 100));
            const toHex = (v: number) => v.toString(16).padStart(2, '0');
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
          };
          const getTextColor = (hex: string): string => {
            const h = hex.replace('#', '');
            const r = parseInt(h.slice(0, 2), 16);
            const g = parseInt(h.slice(2, 4), 16);
            const b = parseInt(h.slice(4, 6), 16);
            const brightness = Math.sqrt(0.299 * (r * r) + 0.587 * (g * g) + 0.114 * (b * b));
            return brightness > 160 ? '#000' : '#fff';
          };
          const buildBtnCss = (variant: string, baseHex: string): string => {
            const text = getTextColor(baseHex);
            const hoverBg = darken(baseHex, 8);
            const hoverBorder = darken(baseHex, 10);
            const activeBg = darken(baseHex, 12);
            const activeBorder = darken(baseHex, 14);
            const focusRgbVar = `var(--bs-${variant}-rgb)`;
            return `.btn-${variant}{--bs-btn-color:${text};--bs-btn-bg:${baseHex};--bs-btn-border-color:${baseHex};--bs-btn-hover-color:${text};--bs-btn-hover-bg:${hoverBg};--bs-btn-hover-border-color:${hoverBorder};--bs-btn-active-color:${text};--bs-btn-active-bg:${activeBg};--bs-btn-active-border-color:${activeBorder};--bs-btn-focus-shadow-rgb:${focusRgbVar};--bs-btn-disabled-color:${text};--bs-btn-disabled-bg:${baseHex};--bs-btn-disabled-border-color:${baseHex};}`;
          };
          const buildBtnOutlineCss = (variant: string, baseHex: string): string => {
            const textContrast = getTextColor(baseHex);
            const focusRgbVar = `var(--bs-${variant}-rgb)`;
            return `.btn-outline-${variant}{--bs-btn-color:${baseHex};--bs-btn-bg:transparent;--bs-btn-border-color:${baseHex};--bs-btn-hover-color:${textContrast};--bs-btn-hover-bg:${baseHex};--bs-btn-hover-border-color:${baseHex};--bs-btn-active-color:${textContrast};--bs-btn-active-bg:${baseHex};--bs-btn-active-border-color:${baseHex};--bs-btn-focus-shadow-rgb:${focusRgbVar};--bs-btn-disabled-color:${baseHex};--bs-btn-disabled-bg:transparent;--bs-btn-disabled-border-color:${baseHex};}`;
          };
          const vars = entries
            .map(([k, v]) => {
              const val = String(v);
              const rgb = toRgb(val);
              const parts = [`--bs-${k}:${val};`];
              if (rgb) parts.push(`--bs-${k}-rgb:${rgb};`);
              return parts.join('');
            })
            .join('');
          const linkBase = colors.primary && String(colors.primary);
          const extras = linkBase ? `--bs-link-color:${linkBase};--bs-link-hover-color:${darken(linkBase, 8)};` : '';
          const btnCss = entries
            .map(([variant, hex]) => buildBtnCss(variant, String(hex)))
            .join('');
          const btnOutlineCss = entries
            .map(([variant, hex]) => buildBtnOutlineCss(variant, String(hex)))
            .join('');
          const btnLinkCss = `.btn-link{--bs-btn-color:var(--bs-link-color);--bs-btn-hover-color:var(--bs-link-hover-color);--bs-btn-bg:transparent;--bs-btn-border-color:transparent;--bs-btn-hover-bg:transparent;--bs-btn-hover-border-color:transparent;--bs-btn-active-bg:transparent;--bs-btn-active-border-color:transparent;}`;
          theme.textContent = `:root, [data-bs-theme="light"]{${vars}${extras}}${btnCss}${btnOutlineCss}${btnLinkCss}`;
        };

        const initialColors = {
          primary: (settings as any).primary_color,
          secondary: (settings as any).secondary_color,
          success: (settings as any).success_color,
          danger: (settings as any).danger_color,
          warning: (settings as any).warning_color,
          info: (settings as any).info_color,
          light: (settings as any).light_color,
          dark: (settings as any).dark_color,
        };
        applyThemeColors(initialColors);

        graphqlRequest({ query: queries.siteSettingsThemeColors })
          .then((data2) => {
            const s = data2?.siteSettings || {};
            const colors = {
              primary: (s as any).primary_color,
              secondary: (s as any).secondary_color,
              success: (s as any).success_color,
              danger: (s as any).danger_color,
              warning: (s as any).warning_color,
              info: (s as any).info_color,
              light: (s as any).light_color,
              dark: (s as any).dark_color,
            };
            applyThemeColors(colors);
          })
          .catch(() => {});
      })
      .catch(() => {});
  }, []);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <PreloadCriticalAssets />
            <OfflineIndicator />
            <WarningModal />
            <Navigation />
            <ThemeSwitcher />
            <InstallPWA />
            <React.Suspense fallback={<LoadingFallback />}>
              <AnimatedRoutes transitionType={transitionType} />
            </React.Suspense>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
