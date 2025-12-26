import React, { useState, useEffect } from 'react';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWA: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const { t } = useTranslation();

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Escuchar evento beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Mostrar prompt después de 10 segundos si no se ha instalado
      setTimeout(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (!dismissed) {
          setShowInstallPrompt(true);
        }
      }, 10000);
    };

    // Detectar cuando se instala la app
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowInstallPrompt(false);
      setDeferredPrompt(null);
      localStorage.removeItem('pwa-install-dismissed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Mostrar prompt de instalación
    deferredPrompt.prompt();

    // Esperar respuesta del usuario
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
    } else {
    }

    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  const handleDismiss = () => {
    setShowInstallPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  if (isInstalled || !showInstallPrompt) return null;

  return (
    <ToastContainer position="bottom-start" className="p-3" style={{ zIndex: 1060 }}>
      <Toast 
        show={showInstallPrompt} 
        onClose={handleDismiss}
        autohide={false}
        style={{ minWidth: '300px' }}
      >
        <Toast.Header closeButton>
          <i className="fas fa-download me-2 text-primary"></i>
          <strong className="me-auto">{t('pwa.install_title')}</strong>
        </Toast.Header>
        <Toast.Body>
          <p className="mb-2">
            {t('pwa.install_body')}
          </p>
          <div className="d-flex gap-2">
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleInstallClick}
              className="flex-grow-1"
            >
              <i className="fas fa-download me-2"></i>
              {t('pwa.install_cta')}
            </Button>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleDismiss}
            >
              {t('pwa.not_now')}
            </Button>
          </div>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default InstallPWA;
