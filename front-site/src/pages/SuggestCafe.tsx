import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useTranslation } from 'react-i18next';

interface SuggestFormData {
  name: string;
  city: string;
  address: string;
  website: string;
  google_maps_url: string;
  notes: string;
}

const EMPTY: SuggestFormData = { name: '', city: '', address: '', website: '', google_maps_url: '', notes: '' };

export default function SuggestCafe(): React.ReactElement {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState<SuggestFormData>(EMPTY);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    import('altcha');
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      const captchaToken = (e.currentTarget.querySelector('input[name="captcha"]') as HTMLInputElement | null)?.value ?? '';

      await graphqlRequest<boolean>({
        query: `
          mutation CreateCafeSuggestion(
            $name: String!,
            $city: String,
            $address: String,
            $website: String,
            $google_maps_url: String,
            $notes: String,
            $captcha: String!
          ) {
            createCafeSuggestion(
              name: $name,
              city: $city,
              address: $address,
              website: $website,
              google_maps_url: $google_maps_url,
              notes: $notes,
              captcha: $captcha
            )
          }
        `,
        variables: {
          name: formData.name.trim(),
          city: formData.city.trim() || null,
          address: formData.address.trim() || null,
          website: formData.website.trim() || null,
          google_maps_url: formData.google_maps_url.trim() || null,
          notes: formData.notes.trim() || null,
          captcha: captchaToken,
        },
        schema: 'default',
        authenticated: true,
      });
      setSuccess(true);
      setFormData(EMPTY);
    } catch (err: any) {
      setError(err?.response?.[0]?.message || err?.message || t('suggest.error'));
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">
          {t('suggest.login_required')}{' '}
          <Link to="/login">{t('nav.login')}</Link>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Card>
            <Card.Header>
              <h4>{t('suggest.title')}</h4>
            </Card.Header>
            <Card.Body>
              {success && <Alert variant="success">{t('suggest.success')}</Alert>}
              {error && <Alert variant="danger">{error}</Alert>}
              <Alert variant="info" className="small">{t('suggest.notice')}</Alert>

              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    {t('suggest.name')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required maxLength={190} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('suggest.city')}</Form.Label>
                  <Form.Control type="text" name="city" value={formData.city} onChange={handleChange} maxLength={120} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('suggest.address')}</Form.Label>
                  <Form.Control type="text" name="address" value={formData.address} onChange={handleChange} maxLength={255} />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('suggest.website')}</Form.Label>
                  <Form.Control type="url" name="website" value={formData.website} onChange={handleChange} maxLength={255} placeholder="https://" />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('suggest.google_maps')}</Form.Label>
                  <Form.Control type="url" name="google_maps_url" value={formData.google_maps_url} onChange={handleChange} maxLength={500} placeholder="https://maps.google.com/..." />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>{t('suggest.notes')}</Form.Label>
                  <Form.Control as="textarea" rows={3} name="notes" value={formData.notes} onChange={handleChange} maxLength={3000} />
                </Form.Group>

                {/* @ts-ignore */}
                <altcha-widget challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'} name="captcha" />

                <Button type="submit" variant="primary" disabled={loading}>
                  {loading ? t('common.saving') : t('suggest.submit')}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
