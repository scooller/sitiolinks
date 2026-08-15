import React, { type ReactElement, useEffect, useState } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useTranslation } from 'react-i18next';

export default function Go(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const [verified, setVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Evitar que el crawler indexe el interstitial ni siga el destino
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => { document.head.removeChild(meta); };
  }, []);

  useEffect(() => {
    import('altcha');
  }, []);

  useEffect(() => {
    const widget = document.querySelector('altcha-widget');
    const onVerified = (ev: any) => {
      setAltchaPayload(ev?.detail?.payload ?? '');
      setVerified(true);
    };
    widget?.addEventListener('verified', onVerified as EventListener);
    return () => { widget?.removeEventListener('verified', onVerified as EventListener); };
  }, []);

  const handleContinue = async () => {
    if (!id || !verified) return;
    setLoading(true);
    setError(null);
    try {
      const altInput = document.querySelector('input[name="captcha"]') as HTMLInputElement | null;
      const token = altInput?.value || altchaPayload || '';
      const data = await graphqlRequest<{ resolveAdultLink: string | null }>({
        query: `query ResolveAdultLink($id: ID!, $altchaToken: String!) {
          resolveAdultLink(id: $id, altchaToken: $altchaToken)
        }`,
        variables: { id, altchaToken: token },
        schema: 'public',
      });
      if (!data.resolveAdultLink) throw new Error(t('go.error'));
      window.location.replace(data.resolveAdultLink);
    } catch (err: any) {
      setError(err.message || t('go.error'));
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header className="text-center"><h3 className="mb-0">🔞 {t('go.title')}</h3></Card.Header>
            <Card.Body className="text-center">
              {error && <Alert variant="danger">{error}</Alert>}
              <p>{t('go.warning')}</p>
              <p className="text-muted small">{t('go.meta_notice')}</p>
              <div className="d-flex justify-content-center mb-3">
                {/* @ts-ignore */}
                <altcha-widget challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'} name="captcha" />
              </div>
              <Button variant="danger" size="lg" onClick={handleContinue} disabled={!verified || loading}>
                {loading ? (<><Spinner animation="border" size="sm" className="me-2" />{t('go.loading')}</>) : t('go.continue')}
              </Button>
              <div className="mt-3">
                <RouterLink to=".." onClick={(e) => { e.preventDefault(); navigate(-1); }} className="text-muted">{t('go.back')}</RouterLink>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
