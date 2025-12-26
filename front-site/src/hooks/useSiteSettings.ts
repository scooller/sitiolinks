import { useState, useEffect } from 'react';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import type { SiteSettings } from '../types';

/**
 * Hook para cargar y cachear la configuración del sitio.
 * Carga los settings una sola vez por sesión y los cachea en memoria.
 */
export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Si ya tenemos settings cacheados, no recargar
    if (settingsCache) {
      setSettings(settingsCache);
      setLoading(false);
      return;
    }

    const fetchSettings = async () => {
      try {
        const response = await graphqlRequest<{ siteSettings: SiteSettings }>({
          query: queries.siteSettings,
          schema: 'public'
        });
        
        if (response.siteSettings) {
          settingsCache = response.siteSettings; // Cachear para futuros usos
          setSettings(response.siteSettings);
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al cargar configuración';
        setError(message);
        console.error('Error loading site settings:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading, error };
}

// Cache en memoria para evitar recargas innecesarias
let settingsCache: SiteSettings | null = null;

/**
 * Limpia el cache de settings (útil para testing o recargas forzadas)
 */
export function clearSettingsCache(): void {
  settingsCache = null;
}
