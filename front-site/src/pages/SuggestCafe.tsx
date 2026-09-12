import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
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

const EMPTY: SuggestFormData = {
  name: '',
  city: '',
  address: '',
  website: '',
  google_maps_url: '',
  notes: '',
};

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
      const captchaToken =
        (e.currentTarget.querySelector('input[name="captcha"]') as HTMLInputElement | null)?.value ?? '';

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

  // Pantalla para usuarios no autenticados (Apple Auth Gate)
  if (!user) {
    return (
      <div className="suggest-page-wrapper">
        <Container>
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeIn}
            transition={defaultTransition}
          >
            <div className="suggest-hero">
              <span className="suggest-kicker">
                <i className="fas fa-mug-saucer" aria-hidden="true"></i> {t('suggest.kicker')}
              </span>
              <h1 className="suggest-title">{t('suggest.title')}</h1>
              <p className="suggest-subtitle">{t('suggest.subtitle')}</p>
            </div>

            <Row className="justify-content-center">
              <Col md={8} lg={6}>
                <div className="suggest-apple-card suggest-state-card">
                  <div className="suggest-state-icon-wrapper auth">
                    <i className="fas fa-lock" aria-hidden="true"></i>
                  </div>
                  <h2 className="suggest-state-title">{t('suggest.login_required_title')}</h2>
                  <p className="suggest-state-desc">{t('suggest.login_required_desc')}</p>
                  <div className="suggest-state-actions">
                    <Link to="/login" className="suggest-btn-solid-primary">
                      <i className="fas fa-arrow-right-to-bracket" aria-hidden="true"></i>
                      <span>{t('nav.login')}</span>
                    </Link>
                    <Link to="/register" className="suggest-btn-solid-secondary">
                      <i className="fas fa-user-plus" aria-hidden="true"></i>
                      <span>{t('nav.register')}</span>
                    </Link>
                  </div>
                </div>
              </Col>
            </Row>
          </motion.div>
        </Container>
      </div>
    );
  }

  return (
    <div className="suggest-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          {/* Cabecera Editorial Apple */}
          <div className="suggest-hero">
            <span className="suggest-kicker">
              <i className="fas fa-mug-saucer" aria-hidden="true"></i> {t('suggest.kicker')}
            </span>
            <h1 className="suggest-title">{t('suggest.title')}</h1>
            <p className="suggest-subtitle">{t('suggest.subtitle')}</p>
          </div>

          <Row className="justify-content-center">
            <Col md={10} lg={8} xl={7}>
              <div className="suggest-apple-card">
                {success ? (
                  /* Estado de Confirmación / Éxito */
                  <div className="suggest-state-card">
                    <div className="suggest-state-icon-wrapper success">
                      <i className="fas fa-circle-check" aria-hidden="true"></i>
                    </div>
                    <h2 className="suggest-state-title">{t('suggest.success_title')}</h2>
                    <p className="suggest-state-desc">{t('suggest.success')}</p>
                    <div className="suggest-state-actions">
                      <button
                        type="button"
                        className="suggest-btn-solid-primary"
                        onClick={() => setSuccess(false)}
                      >
                        <i className="fas fa-plus" aria-hidden="true"></i>
                        <span>{t('suggest.submit_another')}</span>
                      </button>
                      <Link to="/cafes" className="suggest-btn-solid-secondary">
                        <i className="fas fa-mug-hot" aria-hidden="true"></i>
                        <span>{t('suggest.view_cafes')}</span>
                      </Link>
                    </div>
                  </div>
                ) : (
                  /* Formulario de Sugerencia Apple HIG */
                  <>
                    {error && (
                      <div className="suggest-error-alert" role="alert">
                        <i className="fas fa-circle-exclamation" aria-hidden="true"></i>
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="suggest-notice-callout">
                      <i className="fas fa-circle-info suggest-notice-icon" aria-hidden="true"></i>
                      <p className="suggest-notice-text">{t('suggest.notice')}</p>
                    </div>

                    <form onSubmit={handleSubmit} noValidate>
                      {/* Nombre del Café */}
                      <div className="suggest-form-group">
                        <label htmlFor="cafe-name" className="suggest-form-label">
                          {t('suggest.name')}
                          <span className="suggest-required-star" aria-label="obligatorio">*</span>
                        </label>
                        <div className="suggest-input-wrapper">
                          <i className="fas fa-store suggest-input-icon" aria-hidden="true"></i>
                          <input
                            id="cafe-name"
                            type="text"
                            name="name"
                            className="suggest-form-control"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder={t('suggest.name_placeholder')}
                            required
                            maxLength={190}
                          />
                        </div>
                      </div>

                      {/* Ciudad y Dirección en 2 Columnas */}
                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="suggest-form-group">
                            <label htmlFor="cafe-city" className="suggest-form-label">
                              {t('suggest.city')}
                            </label>
                            <div className="suggest-input-wrapper">
                              <i className="fas fa-city suggest-input-icon" aria-hidden="true"></i>
                              <input
                                id="cafe-city"
                                type="text"
                                name="city"
                                className="suggest-form-control"
                                value={formData.city}
                                onChange={handleChange}
                                placeholder={t('suggest.city_placeholder')}
                                maxLength={120}
                              />
                            </div>
                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="suggest-form-group">
                            <label htmlFor="cafe-address" className="suggest-form-label">
                              {t('suggest.address')}
                            </label>
                            <div className="suggest-input-wrapper">
                              <i className="fas fa-map-pin suggest-input-icon" aria-hidden="true"></i>
                              <input
                                id="cafe-address"
                                type="text"
                                name="address"
                                className="suggest-form-control"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder={t('suggest.address_placeholder')}
                                maxLength={255}
                              />
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Sitio Web y Google Maps en 2 Columnas */}
                      <Row className="g-3">
                        <Col sm={6}>
                          <div className="suggest-form-group">
                            <label htmlFor="cafe-website" className="suggest-form-label">
                              {t('suggest.website')}
                            </label>
                            <div className="suggest-input-wrapper">
                              <i className="fas fa-globe suggest-input-icon" aria-hidden="true"></i>
                              <input
                                id="cafe-website"
                                type="url"
                                name="website"
                                className="suggest-form-control"
                                value={formData.website}
                                onChange={handleChange}
                                placeholder={t('suggest.website_placeholder')}
                                maxLength={255}
                              />
                            </div>
                          </div>
                        </Col>

                        <Col sm={6}>
                          <div className="suggest-form-group">
                            <label htmlFor="cafe-maps" className="suggest-form-label">
                              {t('suggest.google_maps')}
                            </label>
                            <div className="suggest-input-wrapper">
                              <i className="fas fa-map-location-dot suggest-input-icon" aria-hidden="true"></i>
                              <input
                                id="cafe-maps"
                                type="url"
                                name="google_maps_url"
                                className="suggest-form-control"
                                value={formData.google_maps_url}
                                onChange={handleChange}
                                placeholder={t('suggest.maps_placeholder')}
                                maxLength={500}
                              />
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Notas Adicionales */}
                      <div className="suggest-form-group">
                        <label htmlFor="cafe-notes" className="suggest-form-label">
                          {t('suggest.notes')}
                        </label>
                        <div className="suggest-input-wrapper suggest-textarea-wrapper">
                          <i className="fas fa-comment-dots suggest-input-icon" aria-hidden="true"></i>
                          <textarea
                            id="cafe-notes"
                            name="notes"
                            rows={4}
                            className="suggest-form-textarea"
                            value={formData.notes}
                            onChange={handleChange}
                            placeholder={t('suggest.notes_placeholder')}
                            maxLength={3000}
                          />
                        </div>
                      </div>

                      {/* Widget Altcha Anti-Spam */}
                      <div className="suggest-altcha-wrapper">
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

                      {/* Botón de Envío 100% Sólido */}
                      <button
                        type="submit"
                        className="suggest-submit-btn"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                            />
                            <span>{t('common.saving')}</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane" aria-hidden="true"></i>
                            <span>{t('suggest.submit')}</span>
                          </>
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
}
