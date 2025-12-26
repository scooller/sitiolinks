import { type ReactElement, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Container, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export default function EmailVerified(): ReactElement {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [verifying, setVerifying] = useState<boolean>(true);
  const success = searchParams.get('success') === 'true';
  const { t } = useTranslation();

  useEffect(() => {
    if (success) {
      refreshUser().then(() => {
        setVerifying(false);
        setTimeout(() => {
          navigate('/');
        }, 3000);
      });
    } else {
      setVerifying(false);
    }
  }, [success, refreshUser, navigate]);

  if (verifying) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">{t('verification.verifying_msg')}</p>
      </Container>
    );
  }

  if (!success) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">
          <Alert.Heading>
            <i className="fas fa-times-circle me-2"></i>
            {t('verification.error_title')}
          </Alert.Heading>
          <p className="mb-0">{t('verification.error_invalid_link_msg')}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Alert variant="success">
        <Alert.Heading>
          <i className="fas fa-check-circle me-2"></i>
          {t('verification.verified_success_title')}
        </Alert.Heading>
        <p>{t('verification.verified_success_msg')}</p>
        <p className="mb-0">{t('verification.redirecting_msg')}</p>
      </Alert>
    </Container>
  );
}
