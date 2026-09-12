import React, { useState } from 'react';
import { Container, Row, Col, Form, Button } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, remember);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
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
              <i className="fas fa-shield-halved" aria-hidden="true"></i> {t('auth.login_kicker')}
            </span>
            <h1 className="auth-title">{t('auth.login_title')}</h1>
            <p className="auth-subtitle">{t('auth.login_subtitle')}</p>
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
                  {/* Campo Email */}
                  <Form.Group className="auth-input-group" controlId="loginEmail">
                    <div className="auth-label-row">
                      <Form.Label className="auth-label">{t('auth.email')}</Form.Label>
                    </div>
                    <div className="auth-input-wrapper">
                      <i className="fas fa-envelope auth-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="email"
                        placeholder={t('auth.email_placeholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="auth-input"
                        autoComplete="email"
                      />
                    </div>
                  </Form.Group>

                  {/* Campo Contraseña */}
                  <Form.Group className="auth-input-group" controlId="loginPassword">
                    <div className="auth-label-row">
                      <Form.Label className="auth-label">{t('auth.password')}</Form.Label>
                    </div>
                    <div className="auth-input-wrapper">
                      <i className="fas fa-lock auth-field-icon" aria-hidden="true"></i>
                      <Form.Control
                        type="password"
                        placeholder={t('auth.password_placeholder')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="auth-input"
                        autoComplete="current-password"
                      />
                    </div>
                  </Form.Group>

                  {/* Checkbox Recordarme */}
                  <div className="auth-terms-box">
                    <Form.Check
                      type="checkbox"
                      id="rememberMe"
                      label={t('auth.remember')}
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      disabled={loading}
                    />
                  </div>

                  {/* Botón 100% Sólido */}
                  <div className="mt-4">
                    <Button
                      type="submit"
                      disabled={loading}
                      className="auth-submit-btn"
                    >
                      {loading ? (
                        <>
                          <i className="fas fa-circle-notch fa-spin" aria-hidden="true"></i>
                          <span>{t('auth.logging_in')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-arrow-right-to-bracket" aria-hidden="true"></i>
                          <span>{t('auth.login')}</span>
                        </>
                      )}
                    </Button>
                  </div>

                  {/* Enlace alternar a Registro */}
                  <div className="auth-switch-link">
                    <p className="mb-0">
                      {t('auth.no_account')}{' '}
                      <Link to="/register">{t('auth.register_here')}</Link>
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
};

export default Login;
