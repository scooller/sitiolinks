import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { appleEase } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useTranslation } from 'react-i18next';

interface ModalConfig {
  content: string;
  title: string;
  titleIcon?: string;
  btnText: string;
  btnIcon?: string;
  btnVariant: string;
  showCloseIcon: boolean;
  cancelBtnEnabled: boolean;
  cancelBtnText: string;
  cancelBtnIcon?: string;
  cancelBtnVariant: string;
  cancelBtnUrl?: string;
}

const STORAGE_KEY = 'warning_modal_dismissed';
const CACHE_CONFIG_KEY = 'warning_modal_cached_config';

export default function WarningModal(): React.ReactElement | null {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { t } = useTranslation();
  const didFetchRef = useRef(false);

  // Comprobación sincrónica inmediata: si ya fue descartado, no bloquear ni mostrar nada
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Carga inmediata de configuración cacheada para evitar cualquier flash de contenido
  const [config, setConfig] = useState<ModalConfig | null>(() => {
    try {
      if (localStorage.getItem(STORAGE_KEY) === 'true') return null;
      const cached = localStorage.getItem(CACHE_CONFIG_KEY);
      if (cached) return JSON.parse(cached);
    } catch {
      // Ignorar errores de localStorage
    }
    return null;
  });

  // Si el usuario autenticado ya lo tenía descartado en backend
  useEffect(() => {
    if (isAuthenticated && user && (user as any).warning_modal_dismissed) {
      setDismissed(true);
      try {
        localStorage.setItem(STORAGE_KEY, 'true');
      } catch {}
    }
  }, [isAuthenticated, user]);

  // Manejo de bloqueo de scroll en el body
  useEffect(() => {
    if (!dismissed) {
      document.body.classList.add('warning-modal-open');
    } else {
      document.body.classList.remove('warning-modal-open');
    }
    return () => {
      document.body.classList.remove('warning-modal-open');
    };
  }, [dismissed]);

  // Obtener la configuración del sitio desde el backend
  useEffect(() => {
    if (dismissed || didFetchRef.current) return;
    didFetchRef.current = true;

    const checkWarning = async () => {
      try {
        const data = await graphqlRequest<{ siteSettings: any }>({
          query: queries.siteSettings,
        });
        const s = data?.siteSettings;

        // Si el modal está deshabilitado o no tiene contenido, liberar inmediatamente
        if (!s?.warning_modal_enabled || !s?.warning_modal_content) {
          setDismissed(true);
          try {
            localStorage.setItem(STORAGE_KEY, 'true');
          } catch {}
          return;
        }

        // Si el usuario logueado ya lo descartó en el servidor
        if (isAuthenticated && user && (user as any).warning_modal_dismissed) {
          setDismissed(true);
          try {
            localStorage.setItem(STORAGE_KEY, 'true');
          } catch {}
          return;
        }

        const freshConfig: ModalConfig = {
          content: s.warning_modal_content,
          title: s.warning_modal_title || t('modal.warning_title'),
          titleIcon: s.warning_modal_title_icon || '',
          btnText: s.warning_modal_btn_text || t('modal.ok'),
          btnIcon: s.warning_modal_btn_icon || '',
          btnVariant: s.warning_modal_btn_variant || 'danger',
          showCloseIcon:
            s.warning_modal_show_close_icon !== undefined
              ? Boolean(s.warning_modal_show_close_icon)
              : true,
          cancelBtnEnabled: Boolean(s.warning_modal_cancel_btn_enabled),
          cancelBtnText: s.warning_modal_cancel_btn_text || t('modal.cancel'),
          cancelBtnIcon: s.warning_modal_cancel_btn_icon || '',
          cancelBtnVariant: s.warning_modal_cancel_btn_variant || 'secondary',
          cancelBtnUrl: s.warning_modal_cancel_btn_url || '',
        };

        setConfig(freshConfig);
        try {
          localStorage.setItem(CACHE_CONFIG_KEY, JSON.stringify(freshConfig));
        } catch {}
      } catch (err) {
        // Si falló la red y no teníamos caché, descartar para no congelar la navegación
        if (!config) {
          setDismissed(true);
        }
      }
    };

    checkWarning();
  }, [dismissed, isAuthenticated, user, t, config]);

  const handleClose = async () => {
    setDismissed(true);
    document.body.classList.remove('warning-modal-open');
    try {
      localStorage.setItem(STORAGE_KEY, 'true');
    } catch {}

    if (isAuthenticated) {
      try {
        await graphqlRequest({
          query: `mutation { dismissWarning }`,
          authenticated: true,
          schema: 'default',
        });
        await refreshUser();
      } catch {
        // No bloquear la interfaz si falla la mutación
      }
    }
  };

  const handleCancel = () => {
    if (config?.cancelBtnUrl) {
      window.location.href = config.cancelBtnUrl;
    } else {
      window.location.href = 'https://google.com';
    }
  };

  const normalizeFA = (icon?: string | null): string => {
    if (!icon) return '';
    if (icon.includes(' ')) return icon;
    return icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="warning-backdrop"
        className="warning-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: appleEase }}
      >
        <motion.div
          key="warning-card"
          className="warning-modal-card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="warning-modal-title"
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ duration: 0.28, ease: appleEase }}
        >
          {/* Botón opcional de cierre superior */}
          {config?.showCloseIcon && (
            <button
              type="button"
              className="warning-modal-close-btn"
              onClick={handleClose}
              aria-label="Cerrar modal"
            >
              <i className="fas fa-xmark" aria-hidden="true"></i>
            </button>
          )}

          {/* Insignia / Escudo de Edad +18 */}
          <div className="warning-modal-badge">
            {config?.titleIcon ? (
              <i
                className={`${normalizeFA(config.titleIcon)} warning-modal-badge-icon`}
                aria-hidden="true"
              ></i>
            ) : (
              <span className="warning-modal-badge-number">+18</span>
            )}
          </div>

          {/* Kicker Editorial */}
          <span className="warning-modal-kicker">
            <i className="fas fa-shield-halved me-1" aria-hidden="true"></i>
            {t('modal.warning_kicker')}
          </span>

          {/* Título Principal */}
          <h2 id="warning-modal-title" className="warning-modal-title">
            {config?.title || t('modal.warning_title')}
          </h2>

          {/* Contenido / Texto del Modal */}
          {config ? (
            <>
              <p className="warning-modal-content">{config.content}</p>

              {/* Leyenda de Verificación y Responsabilidad */}
              <div className="warning-modal-disclaimer">
                <i
                  className="fas fa-circle-exclamation warning-modal-disclaimer-icon"
                  aria-hidden="true"
                ></i>
                <span>{t('modal.disclaimer')}</span>
              </div>

              {/* Botones de Acción (100% Sólidos) */}
              <div className="warning-modal-actions">
                <button
                  type="button"
                  className="warning-modal-accept-btn"
                  onClick={handleClose}
                  autoFocus
                >
                  {config.btnIcon && (
                    <i
                      className={`${normalizeFA(config.btnIcon)} me-1`}
                      aria-hidden="true"
                    ></i>
                  )}
                  <span>{config.btnText || t('modal.ok')}</span>
                </button>

                {config.cancelBtnEnabled && (
                  <button
                    type="button"
                    className="warning-modal-cancel-btn"
                    onClick={handleCancel}
                  >
                    {config.cancelBtnIcon && (
                      <i
                        className={`${normalizeFA(config.cancelBtnIcon)} me-1`}
                        aria-hidden="true"
                      ></i>
                    )}
                    <span>{config.cancelBtnText || t('modal.cancel')}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            /* Estado de carga inicial con el escudo de frosted glass activo */
            <div className="warning-modal-loading py-4">
              <div
                className="warning-modal-loading-spinner"
                aria-hidden="true"
              ></div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
