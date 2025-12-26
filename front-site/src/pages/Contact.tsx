import React, { useRef, useState, useEffect } from 'react';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useTranslation } from 'react-i18next';

const CREATE_CONTACT_MESSAGE = `
  mutation CreateContactMessage($name: String!, $email: String!, $subject: String!, $message: String!, $website: String, $captcha: String!) {
    createContactMessage(name: $name, email: $email, subject: $subject, message: $message, website: $website, captcha: $captcha) {
      id
      name
      email
      subject
      status
      created_at
    }
  }
`;

type FormData = {
  name: string;
  email: string;
  subject: string;
  message: string;
  website: string; // honeypot
};

type Errors = Partial<Record<keyof FormData, string>>;

type Status = { type: '' | 'success' | 'danger'; message: string };

const Contact: React.FC = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ type: '', message: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const altchaRef = useRef<HTMLDivElement | null>(null);

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

  const validate = (): boolean => {
    const newErrors: Errors = {};
    if (!formData.name || formData.name.trim().length < 2) newErrors.name = t('contact.validation.name_min');
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('contact.validation.email_invalid');
    if (!formData.subject || formData.subject.trim().length < 3) newErrors.subject = t('contact.validation.subject_min');
    if (!formData.message || formData.message.trim().length < 10) newErrors.message = t('contact.validation.message_min');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData(prev => ({ ...prev, [name]: value }));
    if ((errors as any)[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (!validate()) return;
    setLoading(true);
    try {
      let captchaToken = '';
      const altInput = document.querySelector('input[name="captcha"]') as HTMLInputElement | null;
      captchaToken = altInput?.value || altchaPayload || '';
      
      await graphqlRequest({
        query: CREATE_CONTACT_MESSAGE,
        variables: { ...formData, name: formData.name.trim(), email: formData.email.trim(), subject: formData.subject.trim(), message: formData.message.trim(), captcha: captchaToken },
        schema: 'public',
      });
      setStatus({ type: 'success', message: t('contact.success') });
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (error: any) {
      setStatus({ type: 'danger', message: error.message || t('contact.error') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="my-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <h1 className="mb-4 text-center">{t('contact.title')}</h1>
          <p className="text-muted text-center mb-4">{t('contact.intro')}</p>
          {status.message && (<Alert variant={status.type} dismissible onClose={() => setStatus({ type: '', message: '' })}>{status.message}</Alert>)}
          <Form onSubmit={handleSubmit}>
            <div ref={altchaRef} className="mb-3">
              {/* @ts-ignore */}
              <altcha-widget challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'} name="captcha" />
            </div>
            <Form.Group className="mb-3" controlId="formName">
              <Form.Label>{t('contact.name')} *</Form.Label>
              <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} isInvalid={!!errors.name} disabled={loading} placeholder={t('contact.name_placeholder')} maxLength={120} />
              <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>{t('contact.email')} *</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} isInvalid={!!errors.email} disabled={loading} placeholder={t('contact.email_placeholder')} maxLength={190} />
              <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formSubject">
              <Form.Label>{t('contact.subject')} *</Form.Label>
              <Form.Control type="text" name="subject" value={formData.subject} onChange={handleChange} isInvalid={!!errors.subject} disabled={loading} placeholder={t('contact.subject_placeholder')} maxLength={190} />
              <Form.Control.Feedback type="invalid">{errors.subject}</Form.Control.Feedback>
            </Form.Group>
            <Form.Group className="mb-3" controlId="formMessage">
              <Form.Label>{t('contact.message')} *</Form.Label>
              <Form.Control as="textarea" rows={6} name="message" value={formData.message} onChange={handleChange} isInvalid={!!errors.message} disabled={loading} placeholder={t('contact.message_placeholder')} maxLength={5000} />
              <Form.Control.Feedback type="invalid">{errors.message}</Form.Control.Feedback>
              <Form.Text className="text-muted">{t('contact.message_counter', { count: formData.message.length, max: 5000 })}</Form.Text>
            </Form.Group>
            <Form.Control type="text" name="website" value={formData.website} onChange={handleChange} style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />
            <div className="d-grid gap-2">
              <Button variant="primary" type="submit" size="lg" disabled={loading}>{loading ? t('contact.sending') : t('contact.send')}</Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
};

export default Contact;
