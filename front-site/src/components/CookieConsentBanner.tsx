import React, { useState, useEffect } from 'react';
import { Modal, Form } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import '../styles/cookie-banner.css';

export interface CookiePreferences {
  necessary: boolean;
  preferences: boolean;
  analytics: boolean;
  timestamp: string;
}

const STORAGE_KEY = 'lp_cookie_preferences_v1';
const OPEN_EVENT = 'lp_open_cookie_preferences';
const UPDATE_EVENT = 'lp_cookie_preferences_updated';

export function getCookieConsent(): CookiePreferences | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function openCookiePreferences(): void {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT));
}

export const CookieConsentBanner: React.FC = () => {
  const { t } = useTranslation();
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(true);
  const [preferencesConsent, setPreferencesConsent] = useState<boolean>(true);

  useEffect(() => {
    const saved = getCookieConsent();
    if (!saved) {
      // Mostrar banner si no hay consentimiento previo guardado
      const timer = setTimeout(() => setShowBanner(true), 800);
      return () => clearTimeout(timer);
    } else {
      setAnalyticsConsent(saved.analytics ?? true);
      setPreferencesConsent(saved.preferences ?? true);
    }
  }, []);

  useEffect(() => {
    const handleOpen = () => {
      const saved = getCookieConsent();
      if (saved) {
        setAnalyticsConsent(saved.analytics ?? true);
        setPreferencesConsent(saved.preferences ?? true);
      }
      setShowModal(true);
    };

    window.addEventListener(OPEN_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_EVENT, handleOpen);
  }, []);

  const savePreferences = (prefs: { necessary: boolean; preferences: boolean; analytics: boolean }) => {
    const payload: CookiePreferences = {
      ...prefs,
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: payload }));
    } catch {
      // Ignorar errores de almacenamiento
    }
    setShowBanner(false);
    setShowModal(false);
  };

  const handleAcceptAll = () => {
    savePreferences({
      necessary: true,
      preferences: true,
      analytics: true,
    });
  };

  const handleRejectNonEssential = () => {
    savePreferences({
      necessary: true,
      preferences: false,
      analytics: false,
    });
  };

  const handleSaveCustom = () => {
    savePreferences({
      necessary: true,
      preferences: preferencesConsent,
      analytics: analyticsConsent,
    });
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <div className="apple-cookie-banner-wrapper">
            <motion.div
              initial={{ y: 80, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 80, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="apple-cookie-banner"
              role="region"
              aria-label={t('privacy.cookie_banner_title', 'Privacidad y Cookies')}
            >
              <div className="apple-cookie-header">
                <div className="apple-cookie-icon-plate">
                  <i className="fas fa-cookie-bite"></i>
                </div>
                <div className="apple-cookie-text-col">
                  <h3 className="apple-cookie-title">
                    {t('privacy.cookie_banner_title', 'Tu Privacidad y Cookies en Link Persons')}
                  </h3>
                  <p className="apple-cookie-desc">
                    {t(
                      'privacy.cookie_banner_desc',
                      'Utilizamos cookies técnicas necesarias y de análisis para garantizar el funcionamiento seguro y medir el uso del sitio, conforme a la Ley N° 21.719 y directrices del Consejo para la Transparencia.'
                    )}{' '}
                    <Link to="/privacidad-datos" className="text-decoration-underline fw-semibold">
                      {t('privacy.cookie_learn_more', 'Ver política y derechos ARCOP')}
                    </Link>.
                  </p>
                </div>
              </div>

              <div className="apple-cookie-actions">
                <button
                  type="button"
                  className="apple-cookie-btn-text"
                  onClick={() => setShowModal(true)}
                >
                  <i className="fas fa-sliders me-1"></i>
                  {t('privacy.cookie_customize', 'Configurar')}
                </button>
                <button
                  type="button"
                  className="apple-cookie-btn-secondary"
                  onClick={handleRejectNonEssential}
                >
                  {t('privacy.cookie_only_necessary', 'Solo necesarias')}
                </button>
                <button
                  type="button"
                  className="apple-cookie-btn-primary"
                  onClick={handleAcceptAll}
                >
                  <i className="fas fa-check me-1"></i>
                  {t('privacy.cookie_accept_all', 'Aceptar todas')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Configuración Detallada de Cookies */}
      <Modal
        show={showModal}
        onHide={() => setShowModal(false)}
        centered
        className="apple-cookie-modal"
        backdrop="static"
      >
        <div className="apple-cookie-modal-header">
          <div className="d-flex align-items-center gap-2">
            <i className="fas fa-shield-halved text-primary fs-5"></i>
            <h5 className="m-0 fw-bold">{t('privacy.cookie_modal_title', 'Preferencias de Privacidad & Cookies')}</h5>
          </div>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowModal(false)}
            aria-label="Cerrar"
          ></button>
        </div>

        <Modal.Body className="p-0">
          <div className="apple-cookie-group">
            <div>
              <h6 className="apple-cookie-group-title">
                {t('privacy.cookie_necessary_title', 'Cookies Técnicas & Esenciales')}
                <span className="apple-cookie-badge-always">{t('privacy.cookie_always_active', 'Siempre Activas')}</span>
              </h6>
              <p className="apple-cookie-group-desc">
                {t(
                  'privacy.cookie_necessary_desc',
                  'Imprescindibles para la autenticación segura, control de sesión, protección CSRF y prevención de spam con Altcha. No pueden desactivarse.'
                )}
              </p>
            </div>
            <Form.Check type="switch" checked disabled className="fs-5" />
          </div>

          <div className="apple-cookie-group">
            <div>
              <h6 className="apple-cookie-group-title">
                {t('privacy.cookie_preferences_title', 'Cookies de Preferencias')}
              </h6>
              <p className="apple-cookie-group-desc">
                {t(
                  'privacy.cookie_preferences_desc',
                  'Permiten recordar tus selecciones de tema visual (claro/oscuro) e idioma para futuras visitas.'
                )}
              </p>
            </div>
            <Form.Check
              type="switch"
              id="switch-preferences"
              checked={preferencesConsent}
              onChange={(e) => setPreferencesConsent(e.target.checked)}
              className="fs-5"
            />
          </div>

          <div className="apple-cookie-group">
            <div>
              <h6 className="apple-cookie-group-title">
                {t('privacy.cookie_analytics_title', 'Cookies Analíticas & Estadísticas')}
              </h6>
              <p className="apple-cookie-group-desc">
                {t(
                  'privacy.cookie_analytics_desc',
                  'Recopilan métricas de navegación agregadas y anónimas mediante Google Analytics 4 para mejorar el rendimiento y experiencia de la plataforma.'
                )}
              </p>
            </div>
            <Form.Check
              type="switch"
              id="switch-analytics"
              checked={analyticsConsent}
              onChange={(e) => setAnalyticsConsent(e.target.checked)}
              className="fs-5"
            />
          </div>
        </Modal.Body>

        <div className="apple-cookie-modal-footer">
          <button
            type="button"
            className="apple-cookie-btn-secondary"
            onClick={() => setShowModal(false)}
          >
            {t('common.cancel', 'Cancelar')}
          </button>
          <button
            type="button"
            className="apple-cookie-btn-primary"
            onClick={handleSaveCustom}
          >
            <i className="fas fa-check me-1"></i>
            {t('privacy.cookie_save_preferences', 'Guardar preferencias')}
          </button>
        </div>
      </Modal>
    </>
  );
};
