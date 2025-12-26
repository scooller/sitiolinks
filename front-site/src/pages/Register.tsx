import React, { type ReactElement, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

type FormData = {
  name: string;
  email: string;
  username: string;
  password: string;
  password_confirmation: string;
  birth_date: string;
  gender: string;
};

export default function Register(): ReactElement {
  const navigate = useNavigate();
  const { register, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', username: '', password: '', password_confirmation: '', birth_date: '', gender: '' });
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const altchaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { if (isAuthenticated) navigate('/'); }, [isAuthenticated, navigate]);

  useEffect(() => {
    import('altcha');
  }, []);

  useEffect(() => {
    const widget = document.querySelector('altcha-widget');
    const onVerified = (ev: any) => {
      setAltchaPayload(ev?.detail?.payload ?? '');
    };

    widget?.addEventListener('verified', onVerified as EventListener);
    return () => { widget?.removeEventListener('verified', onVerified as EventListener); };
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (formData.password !== formData.password_confirmation) { setError(t('auth.password_mismatch')); setLoading(false); return; }
    if (formData.password.length < 12) { setError(t('auth.password_too_short')); setLoading(false); return; }
    try {
      let captchaToken = '';
      const altInput = document.querySelector('input[name="captcha"]') as HTMLInputElement | null;
      captchaToken = altInput?.value || altchaPayload || '';
      
      await register(formData.name, formData.email, formData.username, formData.password, formData.password_confirmation, formData.birth_date, formData.gender, captchaToken as any);
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || t('auth.error_register'));
    } finally { setLoading(false); }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={6}>
          <Card>
            <Card.Header><h3 className="mb-0">{t('auth.register_title')}</h3></Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <div className="mb-3" ref={altchaRef}>
                  {/* @ts-ignore */}
                  <altcha-widget challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'} name="captcha" />
                </div>
                <Form.Group className="mb-3"><Form.Label>{t('auth.full_name')} *</Form.Label><Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required placeholder={t('auth.full_name_placeholder')} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>{t('auth.email')} *</Form.Label><Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required placeholder={t('auth.email_placeholder')} /></Form.Group>
                <Form.Group className="mb-3"><Form.Label>{t('auth.username')} *</Form.Label><Form.Control type="text" name="username" value={formData.username} onChange={handleChange} required minLength={3} maxLength={30} pattern="[a-z0-9_-]+" placeholder={t('auth.username_placeholder')} /><Form.Text className="text-muted">{t('auth.username_help')}</Form.Text></Form.Group>
                <Row>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>{t('auth.gender')} *</Form.Label><Form.Select name="gender" value={formData.gender} onChange={handleChange} required><option value="">{t('common.select')}</option><option value="hombre">{t('auth.gender_male')}</option><option value="mujer">{t('auth.gender_female')}</option><option value="trans">{t('auth.gender_trans')}</option><option value="otro">{t('auth.gender_other')}</option></Form.Select></Form.Group></Col>
                  <Col md={6}><Form.Group className="mb-3"><Form.Label>{t('auth.birth_date')} *</Form.Label><Form.Control type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} required max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]} /><Form.Text className="text-muted">{t('profile.must_be_adult')}</Form.Text></Form.Group></Col>
                </Row>
                <Form.Group className="mb-3"><Form.Label>{t('auth.password')} *</Form.Label><Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required minLength={12} placeholder={t('auth.password_min_placeholder')} /><Form.Text className="text-muted">{t('auth.password_help')}</Form.Text></Form.Group>
                <Form.Group className="mb-3"><Form.Label>{t('auth.password_confirm')} *</Form.Label><Form.Control type="password" name="password_confirmation" value={formData.password_confirmation} onChange={handleChange} required minLength={12} placeholder={t('auth.password_confirm_placeholder')} /></Form.Group>
                <Button type="submit" variant="primary" className="w-100 mb-3" disabled={loading}>{loading ? (<><Spinner animation="border" size="sm" className="me-2" />{t('auth.registering')}</>) : (t('auth.register'))}</Button>
                <div className="text-center"><p className="mb-0">{t('auth.have_account')} <Link to="/login">{t('auth.login_here')}</Link></p></div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
