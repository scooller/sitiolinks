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
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [justRegistered, setJustRegistered] = useState<boolean>(false);
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
  const [requestCreator, setRequestCreator] = useState<boolean>(false);
  const [requestManager, setRequestManager] = useState<boolean>(false);
  const altchaRef = useRef<HTMLDivElement | null>(null);

  const handleToggleCreator = (checked: boolean) => {
    setRequestCreator(checked);
    if (checked) {
      setRequestManager(false);
    }
  };

  const handleToggleManager = (checked: boolean) => {
    setRequestManager(checked);
    if (checked) {
      setRequestCreator(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && !justRegistered) {
      navigate('/');
    }
  }, [isAuthenticated, navigate, justRegistered]);

  useEffect(() => {
    import('altcha');
  }, []);

  useEffect(() => {
    const widget = document.querySelector('altcha-widget');
    const onVerified = (ev: any) => {
      setAltchaPayload(ev?.detail?.payload ?? '');
      if (fieldErrors.captcha) {
        setFieldErrors(prev => {
          const next = { ...prev };
          delete next.captcha;
          return next;
        });
      }
    };

    widget?.addEventListener('verified', onVerified as EventListener);
    return () => {
      widget?.removeEventListener('verified', onVerified as EventListener);
    };
  }, [fieldErrors.captcha]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.currentTarget;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  // Calcular fecha máxima permitida (18 años atrás)
  const maxBirthDate = new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneralError(null);

    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = t('auth.name_required', 'El nombre completo es obligatorio.');
    }

    if (!formData.email.trim()) {
      errors.email = t('auth.email_required', 'El correo electrónico es obligatorio.');
    }

    if (!formData.username.trim()) {
      errors.username = t('auth.username_required', 'El nombre de usuario es obligatorio.');
    } else if (formData.username.length < 3) {
      errors.username = t('auth.username_help', 'Solo letras minúsculas, números, guiones y guiones bajos. Mínimo 3 caracteres.');
    } else if (!/^[a-z0-9_-]+$/.test(formData.username)) {
      errors.username = t('auth.username_invalid', 'Solo letras minúsculas, números, guiones y guiones bajos.');
    }

    if (!formData.gender) {
      errors.gender = t('auth.gender_required', 'Debes seleccionar un género.');
    }

    if (!formData.birth_date) {
      errors.birth_date = t('auth.birth_date_required', 'La fecha de nacimiento es obligatoria.');
    } else if (new Date(formData.birth_date) > new Date(maxBirthDate)) {
      errors.birth_date = t('profile.must_be_adult', 'Debes ser mayor de 18 años.');
    }

    if (!formData.password) {
      errors.password = t('auth.password_required', 'La contraseña es obligatoria.');
    } else if (formData.password.length < 12) {
      errors.password = t('auth.password_too_short', 'La contraseña debe tener al menos 12 caracteres.');
    }

    if (!formData.password_confirmation) {
      errors.password_confirmation = t('auth.password_confirm_placeholder', 'Repite tu contraseña.');
    } else if (formData.password !== formData.password_confirmation) {
      errors.password_confirmation = t('auth.password_mismatch', 'Las contraseñas no coinciden.');
    }

    if (!acceptedTerms) {
      errors.terms = t('auth.terms_required', 'Debes aceptar los términos y condiciones para registrarte.');
    }

    if (!acceptedPrivacy) {
      errors.privacy = t('auth.privacy_required', 'Debes aceptar la política de tratamiento de datos personales y Derechos ARCOP (Ley N° 21.719).');
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError(Object.values(errors)[0]);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    try {
      let captchaToken = '';
      const altInput = document.querySelector('input[name="captcha"]') as HTMLInputElement | null;
      captchaToken = altInput?.value || altchaPayload || '';

      setJustRegistered(true);

      await register(
        formData.name,
        formData.email,
        formData.username,
        formData.password,
        formData.password_confirmation,
        formData.birth_date,
        formData.gender,
        captchaToken as any,
        requestCreator,
        requestManager
      );

      navigate('/', {
        replace: true,
        state: {
          registrationSuccess: true,
          title: t('auth.register_success_title', '¡Bienvenido(a) a la plataforma!'),
          message: t(
            'auth.register_success_message',
            '¡Tu registro se completó con éxito! Te hemos enviado un correo para verificar tu cuenta.'
          ),
        },
      });
    } catch (err: any) {
      setJustRegistered(false);
      const newErrors: Record<string, string> = {};
      let firstMsg = err?.message || t('auth.error_register', 'Error al registrar usuario');

      if (err?.errors && typeof err.errors === 'object') {
        Object.entries(err.errors).forEach(([key, val]) => {
          const text = Array.isArray(val) ? val[0] : String(val);
          newErrors[key] = text;
        });
        setFieldErrors(newErrors);
        const firstKey = Object.keys(newErrors)[0];
        if (firstKey) {
          firstMsg = newErrors[firstKey];
        }
      }

      setGeneralError(firstMsg);
      window.scrollTo({ top: 0, behavior: 'smooth' });

      try {
        const widget = document.querySelector('altcha-widget') as any;
        if (widget && typeof widget.reset === 'function') {
          widget.reset();
        }
      } catch {
        // no-op
      }
    } finally {
      setLoading(false);
    }
  };

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
                {generalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="auth-status-alert alert-danger"
                    role="alert"
                  >
                    <i className="fas fa-circle-exclamation me-2 flex-shrink-0" aria-hidden="true"></i>
                    <div>{generalError}</div>
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
                  {fieldErrors.captcha && (
                    <div className="auth-input-feedback mb-3">
                      <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                      <span>{fieldErrors.captcha}</span>
                    </div>
                  )}

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
                        isInvalid={!!fieldErrors.name}
                        placeholder={t('auth.full_name_placeholder')}
                        className="auth-input"
                        autoComplete="name"
                      />
                    </div>
                    {fieldErrors.name && (
                      <div className="auth-input-feedback">
                        <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                        <span>{fieldErrors.name}</span>
                      </div>
                    )}
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
                        isInvalid={!!fieldErrors.email}
                        placeholder={t('auth.email_placeholder')}
                        className="auth-input"
                        autoComplete="email"
                      />
                    </div>
                    {fieldErrors.email && (
                      <div className="auth-input-feedback">
                        <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                        <span>{fieldErrors.email}</span>
                      </div>
                    )}
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
                        isInvalid={!!fieldErrors.username}
                        placeholder={t('auth.username_placeholder')}
                        className="auth-input"
                        autoComplete="username"
                      />
                    </div>
                    {fieldErrors.username && (
                      <div className="auth-input-feedback">
                        <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                        <span>{fieldErrors.username}</span>
                      </div>
                    )}
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
                            isInvalid={!!fieldErrors.gender}
                            className="auth-select"
                          >
                            <option value="">{t('common.select')}</option>
                            <option value="hombre">{t('auth.gender_male')}</option>
                            <option value="mujer">{t('auth.gender_female')}</option>
                            <option value="trans">{t('auth.gender_trans')}</option>
                            <option value="otro">{t('auth.gender_other')}</option>
                          </Form.Select>
                        </div>
                        {fieldErrors.gender && (
                          <div className="auth-input-feedback">
                            <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                            <span>{fieldErrors.gender}</span>
                          </div>
                        )}
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
                            isInvalid={!!fieldErrors.birth_date}
                            className="auth-input"
                          />
                        </div>
                        {fieldErrors.birth_date && (
                          <div className="auth-input-feedback">
                            <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                            <span>{fieldErrors.birth_date}</span>
                          </div>
                        )}
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
                            isInvalid={!!fieldErrors.password}
                            placeholder={t('auth.password_min_placeholder')}
                            className="auth-input"
                            autoComplete="new-password"
                          />
                        </div>
                        {fieldErrors.password && (
                          <div className="auth-input-feedback">
                            <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                            <span>{fieldErrors.password}</span>
                          </div>
                        )}
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
                            isInvalid={!!fieldErrors.password_confirmation}
                            placeholder={t('auth.password_confirm_placeholder')}
                            className="auth-input"
                            autoComplete="new-password"
                          />
                        </div>
                        {fieldErrors.password_confirmation && (
                          <div className="auth-input-feedback">
                            <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                            <span>{fieldErrors.password_confirmation}</span>
                          </div>
                        )}
                      </Form.Group>
                    </Col>
                  </Row>

                  <span className="auth-help-text mb-3">{t('auth.password_help')}</span>

                  {/* Switch Solicitar Perfil de Creador */}
                  <div
                    className="apple-switch-wrapper mb-3 p-3"
                    style={{
                      borderRadius: '14px',
                      background: 'rgba(120, 120, 128, 0.08)',
                      border: '1px solid var(--apple-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center text-white flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                          boxShadow: '0 3px 10px rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        <i className="fas fa-wand-magic-sparkles"></i>
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.92rem', color: 'var(--color-text)' }}>
                          {t('auth.request_creator_title', 'Quiero ser Creador(a) de Contenido')}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                          {t('auth.request_creator_help', 'Genera una solicitud para publicar galerías y enlaces. El administrador la revisará para dar el visto bueno.')}
                        </div>
                      </div>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="request_creator_switch"
                        checked={requestCreator}
                        onChange={(e) => handleToggleCreator(e.target.checked)}
                        style={{ width: '2.5rem', height: '1.4rem', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Switch Solicitar Perfil de Manager */}
                  <div
                    className="apple-switch-wrapper mb-3 p-3"
                    style={{
                      borderRadius: '14px',
                      background: 'rgba(120, 120, 128, 0.08)',
                      border: '1px solid var(--apple-glass-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="d-flex align-items-center justify-content-center text-white flex-shrink-0"
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '11px',
                          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                          boxShadow: '0 3px 10px rgba(37, 99, 235, 0.3)',
                        }}
                      >
                        <i className="fas fa-briefcase"></i>
                      </div>
                      <div>
                        <div className="fw-bold" style={{ fontSize: '0.92rem', color: 'var(--color-text)' }}>
                          {t('auth.request_manager_title', 'Quiero ser Manager de Creadores')}
                        </div>
                        <div className="text-muted small" style={{ fontSize: '0.78rem' }}>
                          {t('auth.request_manager_help', 'Solicita acceso para gestionar creadores a tu cargo, documentación +18 o asociar tu café físico.')}
                        </div>
                      </div>
                    </div>
                    <div className="form-check form-switch m-0">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        role="switch"
                        id="request_manager_switch"
                        checked={requestManager}
                        onChange={(e) => handleToggleManager(e.target.checked)}
                        style={{ width: '2.5rem', height: '1.4rem', cursor: 'pointer' }}
                      />
                    </div>
                  </div>

                  {/* Checkbox Términos y Condiciones y Privacidad ARCOP (Ley N° 21.719) */}
                  <div className="auth-terms-box d-flex flex-column gap-2">
                    <div>
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
                        onChange={e => {
                          setAcceptedTerms(e.target.checked);
                          if (fieldErrors.terms) {
                            setFieldErrors(prev => {
                              const next = { ...prev };
                              delete next.terms;
                              return next;
                            });
                          }
                        }}
                        isInvalid={!!fieldErrors.terms}
                        required
                        disabled={loading}
                      />
                      {fieldErrors.terms && (
                        <div className="auth-input-feedback">
                          <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                          <span>{fieldErrors.terms}</span>
                        </div>
                      )}
                    </div>

                    <div>
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
                        onChange={e => {
                          setAcceptedPrivacy(e.target.checked);
                          if (fieldErrors.privacy) {
                            setFieldErrors(prev => {
                              const next = { ...prev };
                              delete next.privacy;
                              return next;
                            });
                          }
                        }}
                        isInvalid={!!fieldErrors.privacy}
                        required
                        disabled={loading}
                      />
                      {fieldErrors.privacy && (
                        <div className="auth-input-feedback">
                          <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                          <span>{fieldErrors.privacy}</span>
                        </div>
                      )}
                    </div>
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
