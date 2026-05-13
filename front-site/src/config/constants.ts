/**
 * Configuración global de la aplicación
 * Cambiar BACKEND_URL según el entorno (desarrollo/producción)
 */

// URL del backend Laravel - cambiar según entorno
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';
export const APP_CURRENCY = import.meta.env.VITE_APP_CURRENCY || 'CLP';
export const APP_CURRENCY_FRACTION_DIGITS = Number.parseInt(
  import.meta.env.VITE_APP_CURRENCY_FRACTION_DIGITS || '0',
  10,
);

// Exportar para compatibilidad con código existente
export default {
  BACKEND_URL,
  APP_CURRENCY,
  APP_CURRENCY_FRACTION_DIGITS,
};
