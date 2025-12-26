import React from 'react';
import { Alert } from 'react-bootstrap';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';

const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();
  const { t } = useTranslation();

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
          }}
        >
          <Alert variant="warning" className="mb-0 text-center rounded-0 py-2">
            <i className="fas fa-wifi-slash me-2"></i>
            {t('offline.banner')}
          </Alert>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OfflineIndicator;
