import React from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface VerifiedBadgeProps {
  className?: string;
}

const VerifiedBadge: React.FC<VerifiedBadgeProps> = ({ className = '' }) => {
  const { t } = useTranslation();
  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip id="verified-tooltip">{t('profile.verified')}</Tooltip>}
    >
      <span
        className={`d-inline-flex align-items-center justify-content-center ${className}`}
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#0d6efd',
          color: 'white',
          fontSize: '11px',
          marginLeft: '4px',
          flexShrink: 0,
          cursor: 'help',
        }}
      >
        <i className="fas fa-check" style={{ lineHeight: 1 }}></i>
      </span>
    </OverlayTrigger>
  );
};

export default VerifiedBadge;
