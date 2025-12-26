import React from 'react';

// Preload crítico para LCP
const PreloadCriticalAssets: React.FC = () => {
  React.useEffect(() => {
    console.log('📦 PreloadCriticalAssets: Iniciando carga de Font Awesome');
    
    // Preload font awesome crítico
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/webfonts/fa-solid-900.woff2';
    
    link.onload = () => {
      console.log('✅ Font Awesome preload completado');
    };
    
    link.onerror = (err) => {
      console.error('❌ Error al precargar Font Awesome:', err);
    };
    
    document.head.appendChild(link);
    console.log('📦 Link de preload de Font Awesome agregado al head');
  }, []);

  return null;
};

export default PreloadCriticalAssets;
