import React, { useRef, useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useTranslation } from 'react-i18next';
import type { Page } from '../types';

/**
 * Parsea el contenido HTML de la página de contacto para extraer título y subtítulo limpios.
 */
function parseContactContent(
  rawTitle: string | undefined,
  rawContent: string | undefined,
  defaultTitle: string,
  defaultSubtitle: string
): { title: string; subtitle: string } {
  let finalTitle = rawTitle?.trim() || '';
  let finalSubtitle = '';

  if (rawContent && rawContent.trim()) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(rawContent, 'text/html');

      const h1 = doc.body.querySelector('h1');
      if (!finalTitle && h1?.textContent?.trim()) {
        finalTitle = h1.textContent.trim();
      }

      doc.body.querySelectorAll('h1, h2, h3').forEach(el => el.remove());

      const paragraphs = Array.from(doc.body.querySelectorAll('p'))
        .map(p => p.textContent?.trim())
        .filter(Boolean);

      if (paragraphs.length > 0) {
        finalSubtitle = paragraphs.join(' ');
      } else {
        finalSubtitle = doc.body.textContent?.trim() || '';
      }
    } catch {
      finalSubtitle = rawContent.replace(/<[^>]*>?/gm, '').trim();
    }
  }

  return {
    title: finalTitle || defaultTitle,
    subtitle: finalSubtitle || defaultSubtitle,
  };
}

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
  const location = useLocation();
  const { t, i18n, ready } = useTranslation();
  const [pageInfo, setPageInfo] = useState<{ title: string; subtitle: string }>({
    title: t('contact.title'),
    subtitle: t('contact.intro'),
  });
  const [formData, setFormData] = useState<FormData>({ name: '', email: '', subject: '', message: '', website: '' });
  const [errors, setErrors] = useState<Errors>({});
  const [status, setStatus] = useState<Status>({ type: '', message: '' });
  const [loading, setLoading] = useState<boolean>(false);
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const altchaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ready) return;

    let isMounted = true;
    const fetchPage = async () => {
      const raw = location.pathname.slice(1).toLowerCase();
      const lang = (i18n.language || 'es').split('-')[0];
      const isEnglish = lang === 'en' || raw === 'contact';
      const preferredSlug = isEnglish ? 'contact' : 'contacto';
      const fallbackSlug = isEnglish ? 'contacto' : 'contact';

      try {
        let pageResult: Page | null = null;
        try {
          const resp = await graphqlRequest<{ page: Page | null }>({
            query: queries.pageBySlug,
            variables: { slug: preferredSlug },
            schema: 'public',
          });
          if (resp?.page) {
            pageResult = resp.page;
          }
        } catch {
          // fallback
        }

        if (!pageResult) {
          const respFallback = await graphqlRequest<{ page: Page | null }>({
            query: queries.pageBySlug,
            variables: { slug: fallbackSlug },
            schema: 'public',
          });
          pageResult = respFallback?.page ?? null;
        }

        if (!isMounted) return;

        if (pageResult) {
          setPageInfo(parseContactContent(pageResult.title, pageResult.content, t('contact.title'), t('contact.intro')));
        } else {
          setPageInfo({
            title: t('contact.title'),
            subtitle: t('contact.intro'),
          });
        }
      } catch {
        if (!isMounted) return;
        setPageInfo({
          title: t('contact.title'),
          subtitle: t('contact.intro'),
        });
      }
    };

    fetchPage();

    return () => {
      isMounted = false;
    };
  }, [location.pathname, i18n.language, ready, t]);

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
        variables: {
          ...formData,
          name: formData.name.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
          captcha: captchaToken,
        },
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
    <div className="contact-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          {/* Cabecera Editorial Apple */}
          <div className="contact-hero text-center text-lg-start">
            <span className="contact-kicker">
              <i className="fas fa-sparkles"></i> {t('contact.kicker')}
            </span>
            <h1 className="contact-title">{pageInfo.title}</h1>
            <p className="contact-subtitle">{pageInfo.subtitle}</p>
          </div>

          <Row className="g-4 align-items-stretch">
            {/* Formulario Principal en Tarjeta Liquid Glass */}
            <Col lg={7}>
              <div className="contact-apple-card">
                {status.message && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`contact-status-alert alert-${status.type === 'danger' ? 'danger' : 'success'}`}
                    role="alert"
                  >
                    <div className="contact-status-icon">
                      <i className={`fas ${status.type === 'danger' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                    </div>
                    <div className="contact-status-content">{status.message}</div>
                    <button
                      type="button"
                      className="contact-status-close"
                      onClick={() => setStatus({ type: '', message: '' })}
                      aria-label="Cerrar alerta"
                    >
                      <i className="fas fa-xmark"></i>
                    </button>
                  </motion.div>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  {/* Campo Nombre */}
                  <Form.Group className="contact-input-group" controlId="formName">
                    <div className="contact-label-row">
                      <Form.Label className="contact-label">
                        {t('contact.name')}<span className="contact-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="contact-input-wrapper">
                      <i className="fas fa-user contact-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        isInvalid={!!errors.name}
                        disabled={loading}
                        placeholder={t('contact.name_placeholder')}
                        maxLength={120}
                        className="contact-input"
                        autoComplete="name"
                      />
                    </div>
                    {errors.name && (
                      <span className="contact-feedback-error">
                        <i className="fas fa-triangle-exclamation me-1"></i>{errors.name}
                      </span>
                    )}
                  </Form.Group>

                  {/* Campo Email */}
                  <Form.Group className="contact-input-group" controlId="formEmail">
                    <div className="contact-label-row">
                      <Form.Label className="contact-label">
                        {t('contact.email')}<span className="contact-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="contact-input-wrapper">
                      <i className="fas fa-envelope contact-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        isInvalid={!!errors.email}
                        disabled={loading}
                        placeholder={t('contact.email_placeholder')}
                        maxLength={190}
                        className="contact-input"
                        autoComplete="email"
                      />
                    </div>
                    {errors.email && (
                      <span className="contact-feedback-error">
                        <i className="fas fa-triangle-exclamation me-1"></i>{errors.email}
                      </span>
                    )}
                  </Form.Group>

                  {/* Campo Asunto */}
                  <Form.Group className="contact-input-group" controlId="formSubject">
                    <div className="contact-label-row">
                      <Form.Label className="contact-label">
                        {t('contact.subject')}<span className="contact-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="contact-input-wrapper">
                      <i className="fas fa-heading contact-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        isInvalid={!!errors.subject}
                        disabled={loading}
                        placeholder={t('contact.subject_placeholder')}
                        maxLength={190}
                        className="contact-input"
                      />
                    </div>
                    {errors.subject && (
                      <span className="contact-feedback-error">
                        <i className="fas fa-triangle-exclamation me-1"></i>{errors.subject}
                      </span>
                    )}
                  </Form.Group>

                  {/* Campo Mensaje */}
                  <Form.Group className="contact-input-group" controlId="formMessage">
                    <div className="contact-label-row">
                      <Form.Label className="contact-label">
                        {t('contact.message')}<span className="contact-label-required">*</span>
                      </Form.Label>
                      <span className="contact-char-pill">
                        {t('contact.message_counter', { count: formData.message.length, max: 5000 })}
                      </span>
                    </div>
                    <div className="contact-input-wrapper textarea-wrapper">
                      <i className="fas fa-message contact-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        isInvalid={!!errors.message}
                        disabled={loading}
                        placeholder={t('contact.message_placeholder')}
                        maxLength={5000}
                        className="contact-input contact-textarea"
                      />
                    </div>
                    {errors.message && (
                      <span className="contact-feedback-error">
                        <i className="fas fa-triangle-exclamation me-1"></i>{errors.message}
                      </span>
                    )}
                  </Form.Group>

                  {/* Honeypot invisible */}
                  <Form.Control
                    type="text"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    style={{ display: 'none' }}
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden="true"
                  />

                  {/* Widget Altcha con diseño Glass */}
                  <div ref={altchaRef} className="contact-altcha-container">
                    {/* @ts-ignore */}
                    <altcha-widget
                      challengeurl={(import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')) + '/api/altcha/challenge'}
                      name="captcha"
                    />
                  </div>

                  {/* Botón de Envío 100% Sólido */}
                  <div className="mt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="contact-submit-btn"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin"></i>
                          <span>{t('contact.sending')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane"></i>
                          <span>{t('contact.send')}</span>
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </div>
            </Col>

            {/* Tarjeta Lateral de Soporte & Información */}
            <Col lg={5}>
              <div className="contact-info-card">
                <div>
                  <div className="contact-info-header">
                    <h3 className="contact-info-title">{t('contact.info_title')}</h3>
                    <p className="contact-info-desc">{t('contact.info_desc')}</p>
                  </div>

                  <div className="contact-info-list">
                    <div className="contact-info-item">
                      <div className="contact-info-icon-box">
                        <i className="fas fa-bolt"></i>
                      </div>
                      <div className="contact-info-content">
                        <h4>{t('contact.response_title')}</h4>
                        <p>{t('contact.response_desc')}</p>
                      </div>
                    </div>

                    <div className="contact-info-item">
                      <div className="contact-info-icon-box">
                        <i className="fas fa-user-shield"></i>
                      </div>
                      <div className="contact-info-content">
                        <h4>{t('contact.direct_title')}</h4>
                        <p>{t('contact.direct_desc')}</p>
                      </div>
                    </div>

                    <div className="contact-info-item">
                      <div className="contact-info-icon-box">
                        <i className="fas fa-envelope-open-text"></i>
                      </div>
                      <div className="contact-info-content">
                        <h4>{t('contact.email')}</h4>
                        <p>contacto@sitio.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insignia de Seguridad SSL */}
                <div className="contact-security-badge">
                  <i className="fas fa-shield-halved contact-security-icon" aria-hidden="true"></i>
                  <p className="contact-security-text">
                    <strong>{t('contact.security_title')}:</strong> {t('contact.security_desc')}
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default Contact;
