import React from 'react';
import { useTranslation } from 'react-i18next';

const LoadingFallback: React.FC = () => {
  const { t } = useTranslation();
  return (
    <div 
      className="d-flex justify-content-center align-items-center" 
      style={{ minHeight: '60vh' }}
    >
      <div 
        className="spinner-border text-primary" 
        role="status"
        style={{ width: '3rem', height: '3rem' }}
      >
        <span className="visually-hidden">{t('common.loading')}</span>
      </div>
    </div>
  );
};

export default LoadingFallback;
