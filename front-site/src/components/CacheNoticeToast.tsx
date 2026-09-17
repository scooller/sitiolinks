import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

export const CacheNoticeToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation();

  const handleServedFromCache = useCallback(() => {
    setVisible(true);
  }, []);

  useEffect(() => {
    window.addEventListener('graphql:served-from-cache', handleServedFromCache);
    return () => {
      window.removeEventListener('graphql:served-from-cache', handleServedFromCache);
    };
  }, [handleServedFromCache]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
    }, 5000);
    return () => clearTimeout(timer);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'fixed',
            bottom: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 99999,
            maxWidth: '92vw',
            width: 'auto',
            pointerEvents: 'auto',
          }}
          role="status"
          aria-live="polite"
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px 10px 14px',
              background: 'rgba(18, 20, 26, 0.88)',
              backdropFilter: 'blur(24px) saturate(140%)',
              WebkitBackdropFilter: 'blur(24px) saturate(140%)',
              border: '1px solid rgba(255, 193, 7, 0.35)',
              borderRadius: '9999px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45), 0 0 16px rgba(255, 193, 7, 0.15)',
              color: '#ffffff',
              fontSize: '13.5px',
              fontWeight: 500,
              letterSpacing: '-0.01em',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 193, 7, 0.2)',
                color: '#ffc107',
                fontSize: '13px',
                flexShrink: 0,
              }}
            >
              ⚡
            </span>
            <span style={{ color: 'rgba(255, 255, 255, 0.95)' }}>
              {t('cache.served_from_cache_msg', 'Mostrando datos guardados en caché')}
            </span>
            <button
              onClick={() => setVisible(false)}
              aria-label={t('common.close', 'Cerrar')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'rgba(255, 255, 255, 0.6)',
                fontSize: '16px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: '44px',
                minHeight: '44px',
                padding: '0 4px',
                margin: '-8px -8px -8px 0',
                borderRadius: '50%',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(255, 255, 255, 0.6)')}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CacheNoticeToast;
