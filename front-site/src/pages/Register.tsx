import React, { type ReactElement, useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
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
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    username: '',
    password: '',
    password_confirmation: '',
    birth_date: '',
    gender: '',
  });
  const [altchaPayload, setAltchaPayload] = useState<string>('');
  const [acceptedTerms, setAcceptedTerms] = useState<boolean>(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState<boolean>(false);
  const altchaRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isAuthenticated) navigate('/');
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    import('altcha');
  }, []);

  useEffect(() => {
    const widget = document.querySelector('altcha-widget');
    const onVerified = (ev: any) => {
      setAltchaPayload(ev?.detail?.payload ?? '');
    };

    widget?.addEventListener('verified', onVerified as EventListener);
    return () => {
      widget?.removeEventListener('verified', onVerified as EventListener);
    };
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

    if (formData.password !== formData.password_confirmation) {
      setError(t('auth.password_mismatch'));
      setLoading(false);
      return;
    }
    if (formData.password.length < 12) {
      setError(t('auth.password_too_short'));
      setLoading(false);
      return;
    }
    if (!acceptedTerms) {
      setError(t('auth.terms_required'));
      setLoading(false);
      return;
    }
    if (!acceptedPrivacy) {
      setError(t('auth.privacy_required', 'Debes aceptar la política de tratamiento de datos personales y Derechos ARCOP (Ley N° 21.719).'));
      setLoading(false);
      return;
    }

    try {
      let captchaToken = '';
      const altInput = document.querySelector('input[name="captcha"]') as HTMLInputElement | null;
      captchaToken = altInput?.value || altchaPayload || '';

      await register(
        formData.name,
        formData.email,
        formData.username,
        formData.password,
        formData.password_confirmation,
        formData.birth_date,
        formData.gender,
        captchaToken as any
      );
      navigate('/verify-email');
    } catch (err: any) {
      setError(err.message || t('auth.error_register'));
    } finally {
      setLoading(false);
    }
  };

  // Calcular fecha máxima permitida (18 años atrás)
  const maxBirthDate = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return (
    <div className="auth-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          {/* Cabecera Editorial Apple */}
          <div className="auth-hero">
            <span className="auth-kicker">
              <i className="fas fa-sparkles" aria-hidden="true"></i> {t('auth.register_kicker')}
            </span>
            <h1 className="auth-title">{t('auth.register_title')}</h1>
            <p className="auth-subtitle">{t('auth.register_subtitle')}</p>
          </div>

          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              {/* Tarjeta Liquid Glass Apple */}
              <div className="auth-apple-card">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-status-alert alert-danger"
                    role="alert"
                  >
                    <i className="fas fa-circle-exclamation me-2 flex-shrink-0" aria-hidden="true"></i>
                    <div>{error}</div>
                  </motion.div>
                )}

                <Form onSubmit={handleSubmit} noValidate>
                  {/* Widget Altcha con diseño Glass */}
                  <div className="auth-altcha-container" ref={altchaRef}>
                    {/* @ts-ignore */}
                    <altcha-widget
                      challengeurl={
                        (import.meta.env.DEV
                          ? ''
                          : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(
                              /\/$/,
                              ''
                            )) + '/api/altcha/challenge'
                      }
                      name="captcha"
                    />
                  </div>

                  {/* Campo Nombre Completo */}
                  <Form.Group className="auth-input-group" controlId="registerName">
                    <div className="auth-label-row">
                      <Form.Label className="auth-label">
                        {t('auth.full_name')}<span className="auth-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="auth-input-wrapper">
                      <i className="fas fa-user auth-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder={t('auth.full_name_placeholder')}
                        className="auth-input"
                        autoComplete="name"
                      />
                    </div>
                  </Form.Group>

                  {/* Campo Email */}
                  <Form.Group className="auth-input-group" controlId="registerEmail">
                    <div className="auth-label-row">
                      <Form.Label className="auth-label">
                        {t('auth.email')}<span className="auth-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="auth-input-wrapper">
                      <i className="fas fa-envelope auth-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder={t('auth.email_placeholder')}
                        className="auth-input"
                        autoComplete="email"
                      />
                    </div>
                  </Form.Group>

                  {/* Campo Nombre de Usuario */}
                  <Form.Group className="auth-input-group" controlId="registerUsername">
                    <div className="auth-label-row">
                      <Form.Label className="auth-label">
                        {t('auth.username')}<span className="auth-label-required">*</span>
                      </Form.Label>
                    </div>
                    <div className="auth-input-wrapper">
                      <i className="fas fa-at auth-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength={3}
                        maxLength={30}
                        pattern="[a-z0-9_-]+"
                        placeholder={t('auth.username_placeholder')}
                        className="auth-input"
                        autoComplete="username"
                      />
                    </div>
                    <span className="auth-help-text">{t('auth.username_help')}</span>
                  </Form.Group>

                  {/* Fila Género y Fecha de Nacimiento */}
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="auth-input-group" controlId="registerGender">
                        <div className="auth-label-row">
                          <Form.Label className="auth-label">
                            {t('auth.gender')}<span className="auth-label-required">*</span>
                          </Form.Label>
                        </div>
                        <div className="auth-input-wrapper">
                          <i className="fas fa-venus-mars auth-field-icon" aria-hidden="true"></i>
                          <Form.Select
                            name="gender"
                            value={formData.gender}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="auth-select"
                          >
                            <option value="">{t('common.select')}</option>
                            <option value="hombre">{t('auth.gender_male')}</option>
                            <option value="mujer">{t('auth.gender_female')}</option>
                            <option value="trans">{t('auth.gender_trans')}</option>
                            <option value="otro">{t('auth.gender_other')}</option>
                          </Form.Select>
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="auth-input-group" controlId="registerBirthDate">
                        <div className="auth-label-row">
                          <Form.Label className="auth-label">
                            {t('auth.birth_date')}<span className="auth-label-required">*</span>
                          </Form.Label>
                        </div>
                        <div className="auth-input-wrapper">
                          <i className="fas fa-calendar-days auth-field-icon" aria-hidden="true"></i>
                          <Form.Control
                            type="date"
                            name="birth_date"
                            value={formData.birth_date}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            max={maxBirthDate}
                            className="auth-input"
                          />
                        </div>
                        <span className="auth-help-text">{t('profile.must_be_adult')}</span>
                      </Form.Group>
                    </Col>
                  </Row>

                  {/* Fila Contraseña y Confirmación */}
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Group className="auth-input-group" controlId="registerPassword">
                        <div className="auth-label-row">
                          <Form.Label className="auth-label">
                            {t('auth.password')}<span className="auth-label-required">*</span>
                          </Form.Label>
                        </div>
                        <div className="auth-input-wrapper">
                          <i className="fas fa-lock auth-field-icon" aria-hidden="true"></i>
                          <Form.Control
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength={12}
                            placeholder={t('auth.password_min_placeholder')}
                            className="auth-input"
                            autoComplete="new-password"
                          />
                        </div>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="auth-input-group" controlId="registerPasswordConfirm">
                        <div className="auth-label-row">
                          <Form.Label className="auth-label">
                            {t('auth.password_confirm')}<span className="auth-label-required">*</span>
                          </Form.Label>
                        </div>
                        <div className="auth-input-wrapper">
                          <i className="fas fa-shield-check auth-field-icon" aria-hidden="true"></i>
                          <Form.Control
                            type="password"
                            name="password_confirmation"
                            value={formData.password_confirmation}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            minLength={12}
                            placeholder={t('auth.password_confirm_placeholder')}
                            className="auth-input"
                            autoComplete="new-password"
                          />
                        </div>
                      </Form.Group>
                    </Col>
                  </Row>

                  <span className="auth-help-text mb-3">{t('auth.password_help')}</span>

                  {/* Checkbox Términos y Condiciones y Privacidad ARCOP (Ley N° 21.719) */}
                  <div className="auth-terms-box d-flex flex-column gap-2">
                    <Form.Check
                      type="checkbox"
                      id="accept-terms"
                      label={
                        <>
                          {t('auth.terms_accept')}{' '}
                          <Link to="/terminos-y-condiciones" target="_blank">
                            {t('auth.terms_link')}
                          </Link>
                        </>
                      }
                      checked={acceptedTerms}
                      onChange={e => setAcceptedTerms(e.target.checked)}
                      required
                      disabled={loading}
                    />

                    <Form.Check
                      type="checkbox"
                      id="accept-privacy"
                      label={
                        <>
                          {t('auth.privacy_accept', 'Acepto el tratamiento de mis datos personales y los')}{' '}
                          <Link to="/privacidad-datos" target="_blank">
                            {t('auth.privacy_link', 'Derechos ARCOP (Ley N° 21.719)')}
                          </Link>
                        </>
                      }
                      checked={acceptedPrivacy}
                      onChange={e => setAcceptedPrivacy(e.target.checked)}
                      required
                      disabled={loading}
                    />
                  </div>

                  {/* Botón de Registro 100% Sólido */}
                  <div className="mt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="auth-submit-btn"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                          <span>{t('auth.registering')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus" aria-hidden="true"></i>
                          <span>{t('auth.register')}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Enlace alternar a Login */}
                  <div className="auth-switch-link">
                    <p className="mb-0">
                      {t('auth.have_account')}{' '}
                      <Link to="/login">{t('auth.login_here')}</Link>
                    </p>
                  </div>

                  {/* Insignia de Seguridad SSL */}
                  <div className="auth-trust-badge">
                    <i className="fas fa-shield-halved" aria-hidden="true"></i>
                    <span>{t('auth.security_ssl')}</span>
                  </div>
                </Form>
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
}
