/**
 * Configuración global de la aplicación
 * Cambiar BACKEND_URL según el entorno (desarrollo/producción)
 */

// URL del backend Laravel - cambiar según entorno
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

// Exportar para compatibilidad con código existente
export default {
  BACKEND_URL,
};
