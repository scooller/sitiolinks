import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

interface RouteGuardProps {
  children: React.ReactNode;
  requiresCreator?: boolean;
  requiresVerified?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({
  children,
  requiresCreator = false,
  requiresVerified = false,
}) => {
  const { isAuthenticated, user, loading } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (requiresCreator) {
    const roles = user?.roles || [];
    const isCreatorOrAdmin = Array.isArray(roles)
      ? (roles as any[]).some((r: any) => (typeof r === 'string' ? r : r?.name) === 'creator') ||
        (roles as any[]).some((r: any) => (typeof r === 'string' ? r : r?.name) === 'admin')
      : false;

    if (!isCreatorOrAdmin) {
      return <Navigate to="/" replace />;
    }
  }

  if (requiresVerified && !user?.email_verified_at) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {t('verification.email_unverified_title')}
          </Alert.Heading>
          <p>{t('verification.email_unverified_msg1')}</p>
          <p className="mb-0">{t('verification.email_unverified_msg2')}</p>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

export default RouteGuard;
