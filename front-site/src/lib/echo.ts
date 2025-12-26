import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { BACKEND_URL } from '../config/constants';

// Exponer Pusher global (requerido por Echo)
// @ts-ignore
window.Pusher = Pusher;

let echoInstance: Echo<any> | null = null;

/**
 * Inicializa instancia única de Laravel Echo usando variables Vite:
 * VITE_PUSHER_APP_KEY, VITE_PUSHER_APP_CLUSTER, VITE_PUSHER_HOST (opcional), VITE_PUSHER_PORT (opcional)
 */
export function initEcho(authTokenGetter?: () => string | null): Echo<any> {
  if (echoInstance) return echoInstance;

  const key = import.meta.env.VITE_PUSHER_APP_KEY || '';
  const cluster = import.meta.env.VITE_PUSHER_APP_CLUSTER || 'mt1';
  const wsHost = import.meta.env.VITE_PUSHER_HOST;
  const wsPort = import.meta.env.VITE_PUSHER_PORT ? Number(import.meta.env.VITE_PUSHER_PORT) : undefined;
  const forceTLS = import.meta.env.VITE_PUSHER_FORCE_TLS === 'true';

  const isDev = import.meta.env.DEV;
  const base = (import.meta.env.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
  const config: any = {
    broadcaster: 'pusher',
    key,
    cluster,
    forceTLS: wsHost ? forceTLS : true, // Si no hay host personalizado, usar TLS (Pusher Cloud)
    disableStats: true,
    authEndpoint: isDev ? '/api/broadcasting/auth' : `${base}/api/broadcasting/auth`,
    auth: {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        ...(authTokenGetter ? { Authorization: `Bearer ${authTokenGetter()}` } : {}),
      },
    },
    // Custom authorizer to ensure credentials (cookies) are sent in cross-domain requests
    authorizer: (channel: any, _options: any) => {
      return {
        authorize: (socketId: string, callback: (error: any, data?: any) => void) => {
          const authEndpoint = config.authEndpoint;
          fetch(authEndpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...config.auth.headers,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
            credentials: 'include', // Crucial for Sanctum SPA (cookies)
          })
            .then((response) => {
              if (!response.ok) throw new Error('Auth failed');
              return response.json();
            })
            .then((data) => {
              callback(false, data);
            })
            .catch((error) => {
              callback(true, error);
            });
        },
      };
    },
  };

  // Solo agregar wsHost/wsPort si están configurados (para desarrollo local)
  if (wsHost) {
    config.wsHost = wsHost;
    config.wsPort = wsPort || 6001;
    config.enabledTransports = ['ws', 'wss'];
  }

  echoInstance = new Echo(config);

  return echoInstance;
}

export function getEcho(): Echo<any> | null {
  return echoInstance;
}

export function disconnectEcho(): void {
  if (echoInstance) {
    try { echoInstance.disconnect(); } catch {}
    echoInstance = null;
  }
}

export default initEcho;
