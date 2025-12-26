import { type ReactElement, useState } from 'react';
import { Container, Alert, Button, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { BACKEND_URL } from '../config/constants';
import { useTranslation } from 'react-i18next';

export default function VerifyEmail(): ReactElement {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [sending, setSending] = useState<boolean>(false);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleResend = async () => {
    setSending(true);
    setMessage('');
    setError('');

    try {
      const response = await fetch(`${BACKEND_URL}/api/email/resend`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(t('verification.resend_sent'));
      } else {
        setError(data.message || t('verification.resend_error'));
      }
    } catch (err) {
      setError(t('verification.connection_error'));
    } finally {
      setSending(false);
    }
  };

  if (!user) {
    return (
      <Container className="mt-5">
        <Alert variant="info">{t('common.loading')}</Alert>
      </Container>
    );
  }

  if ((user as any).email_verified_at) {
    return (
      <Container className="mt-5">
        <Alert variant="success">
          <Alert.Heading>
            <i className="fas fa-check-circle me-2"></i>
            {t('verification.already_verified_title')}
          </Alert.Heading>
          <p className="mb-0">{t('verification.already_verified_msg')}</p>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5">
      <Alert variant="warning">
        <Alert.Heading>
          <i className="fas fa-envelope me-2"></i>
          {t('verification.verify_title')}
        </Alert.Heading>
        <p>
          {t('verification.verify_msg1', { email: user.email })}
        </p>
        <p>{t('verification.verify_msg2')}</p>
        <hr />
        <p className="mb-0">
          {t('verification.not_received')} {' '}
          <Button variant="link" className="p-0" onClick={handleResend} disabled={sending}>
            {sending ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                {t('verification.resending')}
              </>
            ) : (
              t('verification.resend_email')
            )}
          </Button>
        </p>
      </Alert>

      {message && (
        <Alert variant="success" className="mt-3">
          {message}
        </Alert>
      )}
      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
    </Container>
  );
}
