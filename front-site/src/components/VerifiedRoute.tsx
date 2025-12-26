import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Alert } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';

type Props = { children: React.ReactNode };

const VerifiedRoute: React.FC<Props> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { t } = useTranslation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!user?.email_verified_at) {
    return (
      <Container className="mt-5">
        <Alert variant="warning">
          <Alert.Heading>
            <i className="fas fa-exclamation-triangle me-2"></i>
            {t('verification.email_unverified_title')}
          </Alert.Heading>
          <p>
            {t('verification.email_unverified_msg1')}
          </p>
          <p className="mb-0">
            {t('verification.email_unverified_msg2')}
          </p>
        </Alert>
      </Container>
    );
  }

  return <>{children}</>;
};

export default VerifiedRoute;
