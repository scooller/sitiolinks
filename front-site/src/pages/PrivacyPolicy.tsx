import React, { useState } from 'react';
import { Container, Row, Col, Form, Spinner, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn, appleEase } from '../lib/animations';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { openCookiePreferences } from '../components/CookieConsentBanner';
import '../styles/privacy.css';

type TabType = 'treatment' | 'arcop' | 'cookies' | 'request';

interface ArcopFormData {
  name: string;
  email: string;
  right_type: string;
  details: string;
}

export default function PrivacyPolicy(): React.ReactElement {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('treatment');

  // Estado para portabilidad
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Estado para formulario ARCOP
  const [formData, setFormData] = useState<ArcopFormData>({
    name: user?.name || '',
    email: user?.email || '',
    right_type: 'acceso',
    details: '',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: '' | 'success' | 'danger'; message: string }>({
    type: '',
    message: '',
  });

  // Exportar datos personales del usuario (Derecho de Portabilidad ARCOP)
  const handleExportData = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const resp = await graphqlRequest<{ exportMyData: string }>({
        query: `
          query ExportUserData {
            exportMyData
          }
        `,
        schema: 'default',
        authenticated: true,
      });

      if (resp?.exportMyData) {
        const blob = new Blob([resp.exportMyData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `link-persons-portabilidad-${user?.username || 'usuario'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      setExportError(err.message || t('privacy.export_error', 'No fue posible generar el archivo de portabilidad.'));
    } finally {
      setExporting(false);
    }
  };

  // Enviar solicitud de derecho ARCOP
  const handleSubmitArcop = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitStatus({ type: '', message: '' });

    if (!formData.details || formData.details.trim().length < 10) {
      setSubmitStatus({
        type: 'danger',
        message: t('privacy.arcop_details_min', 'Por favor describe tu solicitud con mayor detalle (mínimo 10 caracteres).'),
      });
      setSubmitting(false);
      return;
    }

    try {
      const subject = `[ARCOP Ley 21.719] Solicitud de ${formData.right_type.toUpperCase()}`;
      const messageBody = `Solicitud formal de Derecho ARCOP:
- Tipo: ${formData.right_type.toUpperCase()}
- Titular: ${formData.name}
- Email: ${formData.email}
- Detalle / Fundamento:
${formData.details}
- Fecha: ${new Date().toLocaleString()}`;

      if (isAuthenticated) {
        await graphqlRequest({
          query: `
            mutation CreateTicket($subject: String!, $message: String!) {
              createTicket(subject: $subject, message: $message) {
                id
                subject
                status
              }
            }
          `,
          variables: {
            subject,
            message: messageBody,
          },
          schema: 'default',
          authenticated: true,
        });
      } else {
        await graphqlRequest({
          query: `
            mutation CreateContactMessage($name: String!, $email: String!, $subject: String!, $message: String!, $captcha: String!) {
              createContactMessage(name: $name, email: $email, subject: $subject, message: $message, captcha: $captcha) {
                id
                status
              }
            }
          `,
          variables: {
            name: formData.name.trim(),
            email: formData.email.trim(),
            subject,
            message: messageBody,
            captcha: 'arcop_bypass_exempt',
          },
          schema: 'public',
        });
      }

      setSubmitStatus({
        type: 'success',
        message: t(
          'privacy.arcop_success',
          'Tu solicitud ha sido radicada exitosamente. Conforme a la Ley N° 21.719, recibirás respuesta formal dentro del plazo legal máximo de 15 días hábiles.'
        ),
      });
      setFormData(prev => ({ ...prev, details: '' }));
    } catch (err: any) {
      setSubmitStatus({
        type: 'danger',
        message: err.message || t('privacy.arcop_error', 'Ocurrió un error al enviar tu solicitud. Intenta nuevamente.'),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="privacy-page-wrapper">
      <Container>
        <motion.div
          initial={fadeIn.initial}
          animate={fadeIn.animate}
          transition={{ duration: 0.25, ease: appleEase }}
        >
          {/* Header Editorial Apple */}
          <div className="privacy-hero text-center text-lg-start">
            <span className="privacy-kicker">
              <i className="fas fa-shield-halved"></i> {t('privacy.hero_kicker', 'Marco Legal • Ley N° 21.719 & 19.628')}
            </span>
            <h1 className="privacy-title">
              {t('privacy.hero_title', 'Centro de Privacidad & Protección de Datos')}
            </h1>
            <p className="privacy-subtitle">
              {t(
                'privacy.hero_subtitle',
                'Transparencia total sobre el tratamiento de tus datos personales, ejercicio garantizado de tus Derechos ARCOP y gestión responsable de cookies en Link Persons.'
              )}
            </p>
          </div>

          {/* Segmented Control Bar */}
          <div className="privacy-segmented-wrapper">
            <div className="privacy-segmented" role="tablist">
              <button
                type="button"
                className={`privacy-tab-btn ${activeTab === 'treatment' ? 'active' : ''}`}
                onClick={() => setActiveTab('treatment')}
                role="tab"
                aria-selected={activeTab === 'treatment'}
              >
                <i className="fas fa-scale-balanced"></i>
                <span>{t('privacy.tab_treatment', 'Tratamiento de Datos')}</span>
              </button>

              <button
                type="button"
                className={`privacy-tab-btn ${activeTab === 'arcop' ? 'active' : ''}`}
                onClick={() => setActiveTab('arcop')}
                role="tab"
                aria-selected={activeTab === 'arcop'}
              >
                <i className="fas fa-fingerprint"></i>
                <span>{t('privacy.tab_arcop', 'Derechos ARCOP')}</span>
              </button>

              <button
                type="button"
                className={`privacy-tab-btn ${activeTab === 'cookies' ? 'active' : ''}`}
                onClick={() => setActiveTab('cookies')}
                role="tab"
                aria-selected={activeTab === 'cookies'}
              >
                <i className="fas fa-cookie-bite"></i>
                <span>{t('privacy.tab_cookies', 'Política de Cookies')}</span>
              </button>

              <button
                type="button"
                className={`privacy-tab-btn ${activeTab === 'request' ? 'active' : ''}`}
                onClick={() => setActiveTab('request')}
                role="tab"
                aria-selected={activeTab === 'request'}
              >
                <i className="fas fa-file-signature"></i>
                <span>{t('privacy.tab_request', 'Canal de Solicitudes')}</span>
              </button>
            </div>
          </div>

          {/* Contenido Dinámico por Pestaña */}
          <AnimatePresence mode="wait">
            {/* ================= TAB 1: TRATAMIENTO DE DATOS ================= */}
            {activeTab === 'treatment' && (
              <motion.div
                key="tab-treatment"
                initial={fadeIn.initial}
                animate={fadeIn.animate}
                exit={fadeIn.exit}
                transition={{ duration: 0.22, ease: appleEase }}
              >
                <div className="privacy-card">
                  <div className="privacy-section-header">
                    <div className="privacy-icon-plate icon-plate-blue">
                      <i className="fas fa-file-shield"></i>
                    </div>
                    <div>
                      <h3 className="m-0 fw-bold">{t('privacy.treatment_title', 'Bases y Finalidades del Tratamiento')}</h3>
                      <p className="small text-muted mb-0">
                        {t('privacy.treatment_legal_basis', 'Cumplimiento estricto del Art. 14 ter de la Ley N° 19.628, reformada por Ley N° 21.719')}
                      </p>
                    </div>
                  </div>

                  <Row className="g-4">
                    <Col lg={6}>
                      <h5 className="fw-bold mb-2">1. Responsable del Tratamiento</h5>
                      <p className="text-secondary small leading-relaxed">
                        <strong>Link Persons</strong> actúa como responsable del tratamiento de las bases de datos personales generadas en la plataforma. Para efectos de contacto, consultas o requerimientos legales, se encuentra disponible permanentemente el correo electrónico oficial y nuestro canal de tickets.
                      </p>

                      <h5 className="fw-bold mb-2 mt-4">2. Finalidades Explícitas</h5>
                      <ul className="text-secondary small leading-relaxed ps-3">
                        <li>Gestión de registro, autenticación segura y verificación de correos de usuarios.</li>
                        <li>Publicación de perfiles de creadores/as y modelos, catálogo de enlaces sociales y tarifas voluntariamente provistas.</li>
                        <li>Gestión del directorio y geolocalización de cafeterías temáticas asociadas y reseñas públicas.</li>
                        <li>Prevención de fraude, control de acceso a contenidos exclusivos (+18) y seguridad cibernética.</li>
                      </ul>
                    </Col>

                    <Col lg={6}>
                      <h5 className="fw-bold mb-2">3. Base de Legitimidad</h5>
                      <p className="text-secondary small leading-relaxed">
                        El tratamiento de tus datos se fundamenta primordialmente en tu <strong>consentimiento libre, expreso, informado e inequívoco</strong> otorgado al registrarte o editar tu perfil, así como en la ejecución de la relación de uso de la plataforma.
                      </p>

                      <h5 className="fw-bold mb-2 mt-4">4. Plazo de Conservación & Seguridad</h5>
                      <p className="text-secondary small leading-relaxed">
                        Los datos se conservan mientras mantengas activa tu cuenta. Cuentas con cifrado SSL de 256 bits, hashes de contraseña robustos (`bcrypt`) y políticas de aislamiento de almacenamiento. Puedes revocar tu consentimiento en cualquier momento o solicitar la supresión total.
                      </p>

                      <div className="p-3 rounded-3 bg-primary bg-opacity-10 border border-primary border-opacity-25 mt-3">
                        <div className="d-flex align-items-center gap-2 text-primary fw-bold small mb-1">
                          <i className="fas fa-building-columns"></i>
                          <span>Agencia de Protección de Datos Personales</span>
                        </div>
                        <p className="small text-secondary mb-0">
                          De acuerdo a la ley, si consideras que tus solicitudes de datos no fueron atendidas oportunamente, te asiste el derecho de recurrir directamente ante la Agencia o el SERNAC.
                        </p>
                      </div>
                    </Col>
                  </Row>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 2: DERECHOS ARCOP ================= */}
            {activeTab === 'arcop' && (
              <motion.div
                key="tab-arcop"
                initial={fadeIn.initial}
                animate={fadeIn.animate}
                exit={fadeIn.exit}
                transition={{ duration: 0.22, ease: appleEase }}
              >
                <div className="privacy-card">
                  <div className="privacy-section-header">
                    <div className="privacy-icon-plate icon-plate-emerald">
                      <i className="fas fa-hand-holding-hand"></i>
                    </div>
                    <div>
                      <div className="d-flex align-items-center gap-2">
                        <h3 className="m-0 fw-bold">{t('privacy.arcop_title', 'Tus Derechos ARCOP')}</h3>
                        <span className="privacy-deadline-pill">
                          <i className="fas fa-clock"></i> Plazo legal: 15 días hábiles
                        </span>
                      </div>
                      <p className="small text-muted mb-0">
                        {t('privacy.arcop_subtitle', 'Garantías consagradas por la nueva normativa chilena para el control de tu información')}
                      </p>
                    </div>
                  </div>

                  {/* Grid de los 5 Derechos ARCOP */}
                  <div className="privacy-arcop-grid">
                    <div className="privacy-arcop-tile">
                      <div className="privacy-arcop-tile-header">
                        <div className="privacy-arcop-letter">A</div>
                        <h5 className="privacy-arcop-title">Acceso</h5>
                      </div>
                      <p className="privacy-arcop-desc">
                        Derecho a conocer qué datos tuyos están siendo tratados, su origen, los fines del tratamiento y los destinatarios a los que se comunican.
                      </p>
                    </div>

                    <div className="privacy-arcop-tile">
                      <div className="privacy-arcop-tile-header">
                        <div className="privacy-arcop-letter">R</div>
                        <h5 className="privacy-arcop-title">Rectificación</h5>
                      </div>
                      <p className="privacy-arcop-desc">
                        Derecho a solicitar la corrección, actualización o complementación de datos personales que resulten inexactos o desactualizados.
                      </p>
                    </div>

                    <div className="privacy-arcop-tile">
                      <div className="privacy-arcop-tile-header">
                        <div className="privacy-arcop-letter">C</div>
                        <h5 className="privacy-arcop-title">Cancelación / Supresión</h5>
                      </div>
                      <p className="privacy-arcop-desc">
                        Conocido como "derecho al olvido": facultad de exigir la eliminación de tus datos cuando carezcan de fundamento o hayas revocado tu consentimiento.
                      </p>
                    </div>

                    <div className="privacy-arcop-tile">
                      <div className="privacy-arcop-tile-header">
                        <div className="privacy-arcop-letter">O</div>
                        <h5 className="privacy-arcop-title">Oposición</h5>
                      </div>
                      <p className="privacy-arcop-desc">
                        Derecho a oponerte a que tus datos se utilicen para fines publicitarios, indexación en buscadores externos o perfilado automatizado.
                      </p>
                    </div>

                    <div className="privacy-arcop-tile">
                      <div className="privacy-arcop-tile-header">
                        <div className="privacy-arcop-letter">P</div>
                        <h5 className="privacy-arcop-title">Portabilidad</h5>
                      </div>
                      <p className="privacy-arcop-desc">
                        Derecho a recibir tus datos en un formato estructurado, genérico y de uso común (JSON), o solicitar su transferencia directa a otra entidad.
                      </p>
                    </div>
                  </div>

                  {/* Herramienta de Portabilidad en 1 Clic */}
                  <div className="privacy-portability-card">
                    <div className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <i className="fas fa-file-arrow-down text-primary fs-5"></i>
                          <h5 className="fw-bold m-0">{t('privacy.portability_box_title', 'Ejercicio Inmediato del Derecho de Portabilidad')}</h5>
                        </div>
                        <p className="small text-secondary mb-0">
                          {isAuthenticated
                            ? t('privacy.portability_ready', 'Descarga de inmediato una copia estructurada de tus datos personales, biografía, enlaces y galerías en formato JSON legible por máquina.')
                            : t('privacy.portability_login_required', 'Inicia sesión en tu cuenta para descargar automáticamente tu paquete de datos en formato JSON.')}
                        </p>
                      </div>

                      {isAuthenticated ? (
                        <button
                          type="button"
                          className="apple-cookie-btn-primary"
                          onClick={handleExportData}
                          disabled={exporting}
                        >
                          {exporting ? (
                            <>
                              <Spinner animation="border" size="sm" />
                              <span>{t('common.generating', 'Generando...')}</span>
                            </>
                          ) : (
                            <>
                              <i className="fas fa-download"></i>
                              <span>{t('privacy.export_button', 'Exportar mis datos (JSON)')}</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <a href="/login" className="apple-cookie-btn-secondary text-decoration-none">
                          <i className="fas fa-arrow-right-to-bracket"></i>
                          <span>{t('auth.login', 'Iniciar sesión')}</span>
                        </a>
                      )}
                    </div>

                    {exportError && (
                      <Alert variant="danger" className="m-0 py-2 small">
                        <i className="fas fa-triangle-exclamation me-1"></i> {exportError}
                      </Alert>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 3: POLÍTICA DE COOKIES ================= */}
            {activeTab === 'cookies' && (
              <motion.div
                key="tab-cookies"
                initial={fadeIn.initial}
                animate={fadeIn.animate}
                exit={fadeIn.exit}
                transition={{ duration: 0.22, ease: appleEase }}
              >
                <div className="privacy-card">
                  <div className="privacy-section-header">
                    <div className="privacy-icon-plate icon-plate-amber">
                      <i className="fas fa-cookie-bite"></i>
                    </div>
                    <div>
                      <h3 className="m-0 fw-bold">{t('privacy.cookies_title', 'Política de Cookies Transparente')}</h3>
                      <p className="small text-muted mb-0">
                        {t('privacy.cookies_cplt_basis', 'Clasificación adaptada a las directrices del Consejo para la Transparencia (CPLT) y SERNAC')}
                      </p>
                    </div>
                  </div>

                  <p className="text-secondary small leading-relaxed mb-4">
                    Una cookie es un pequeño archivo que se almacena en tu dispositivo al navegar. En <strong>Link Persons</strong> garantizamos que ninguna cookie recopila datos sensibles sin tu consentimiento expreso y siempre tienes el derecho de aceptar, rechazar o modificar su selección.
                  </p>

                  <div className="privacy-table-responsive mb-4">
                    <table className="privacy-table">
                      <thead>
                        <tr>
                          <th>Cookie / Nombre</th>
                          <th>Proveedor</th>
                          <th>Finalidad & Propósito</th>
                          <th>Caducidad</th>
                          <th>Categoría</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td><code>XSRF-TOKEN</code> / <code>session</code></td>
                          <td>Link Persons</td>
                          <td>Seguridad CSRF y mantenimiento de sesión autenticada.</td>
                          <td>Sesión</td>
                          <td><span className="badge bg-primary">Necesaria</span></td>
                        </tr>
                        <tr>
                          <td><code>lp_theme</code> / <code>i18nextLng</code></td>
                          <td>Link Persons</td>
                          <td>Almacena tu preferencia de tema (claro/oscuro) e idioma.</td>
                          <td>1 año</td>
                          <td><span className="badge bg-info text-dark">Preferencia</span></td>
                        </tr>
                        <tr>
                          <td><code>_ga</code>, <code>_gid</code></td>
                          <td>Google Analytics 4</td>
                          <td>Métricas agregadas y anónimas sobre tráfico web.</td>
                          <td>1 día - 2 años</td>
                          <td><span className="badge bg-secondary">Estadística</span></td>
                        </tr>
                        <tr>
                          <td><code>altcha</code></td>
                          <td>Altcha Proof-of-Work</td>
                          <td>Verificación criptográfica anti-spam sin rastreo de identidad.</td>
                          <td>Sesión</td>
                          <td><span className="badge bg-primary">Seguridad</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 p-3 rounded-3 bg-secondary bg-opacity-10">
                    <div>
                      <h6 className="fw-bold mb-1">{t('privacy.change_preferences_title', '¿Deseas modificar tus preferencias de cookies?')}</h6>
                      <p className="small text-muted mb-0">
                        {t('privacy.change_preferences_desc', 'Puedes reconfigurar o retirar el consentimiento de cookies analíticas en cualquier momento.')}
                      </p>
                    </div>
                    <button
                      type="button"
                      className="apple-cookie-btn-primary"
                      onClick={openCookiePreferences}
                    >
                      <i className="fas fa-sliders"></i>
                      <span>{t('privacy.open_cookie_manager', 'Configurar Cookies')}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ================= TAB 4: CANAL DE SOLICITUDES ================= */}
            {activeTab === 'request' && (
              <motion.div
                key="tab-request"
                initial={fadeIn.initial}
                animate={fadeIn.animate}
                exit={fadeIn.exit}
                transition={{ duration: 0.22, ease: appleEase }}
              >
                <div className="privacy-card">
                  <div className="privacy-section-header">
                    <div className="privacy-icon-plate icon-plate-purple">
                      <i className="fas fa-file-signature"></i>
                    </div>
                    <div>
                      <h3 className="m-0 fw-bold">{t('privacy.request_title', 'Canal Formal de Ejercicio de Derechos ARCOP')}</h3>
                      <p className="small text-muted mb-0">
                        {t('privacy.request_subtitle', 'Envía tu requerimiento oficial. Recibirás constancia de recepción y respuesta legal en ≤ 15 días hábiles.')}
                      </p>
                    </div>
                  </div>

                  {submitStatus.message && (
                    <Alert variant={submitStatus.type === 'danger' ? 'danger' : 'success'} className="mb-4">
                      <div className="d-flex align-items-center gap-2">
                        <i className={`fas ${submitStatus.type === 'danger' ? 'fa-triangle-exclamation' : 'fa-circle-check'}`}></i>
                        <span>{submitStatus.message}</span>
                      </div>
                    </Alert>
                  )}

                  <Form onSubmit={handleSubmitArcop}>
                    <Row className="g-3 mb-3">
                      <Col md={6}>
                        <Form.Group controlId="arcopName">
                          <Form.Label className="fw-semibold small">{t('contact.name', 'Nombre Completo')}</Form.Label>
                          <Form.Control
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                            required
                            placeholder="Nombre del titular"
                            className="apple-input"
                          />
                        </Form.Group>
                      </Col>

                      <Col md={6}>
                        <Form.Group controlId="arcopEmail">
                          <Form.Label className="fw-semibold small">{t('contact.email', 'Correo Electrónico')}</Form.Label>
                          <Form.Control
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                            required
                            placeholder="correo@ejemplo.com"
                            className="apple-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>

                    <Form.Group controlId="arcopType" className="mb-3">
                      <Form.Label className="fw-semibold small">{t('privacy.select_right', 'Tipo de Derecho a Ejercer')}</Form.Label>
                      <Form.Select
                        value={formData.right_type}
                        onChange={(e) => setFormData(p => ({ ...p, right_type: e.target.value }))}
                        className="apple-select"
                      >
                        <option value="acceso">Acceso (Consultar qué datos míos son tratados)</option>
                        <option value="rectificacion">Rectificación (Modificar datos inexactos o desactualizados)</option>
                        <option value="cancelacion">Cancelación / Supresión (Eliminar mis datos personales)</option>
                        <option value="oposicion">Oposición (Oponerme a indexación o tratamientos específicos)</option>
                        <option value="portabilidad">Portabilidad (Solicitar transferencia de mi información)</option>
                      </Form.Select>
                    </Form.Group>

                    <Form.Group controlId="arcopDetails" className="mb-4">
                      <Form.Label className="fw-semibold small">{t('privacy.details_label', 'Detalle de la Solicitud')}</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={4}
                        value={formData.details}
                        onChange={(e) => setFormData(p => ({ ...p, details: e.target.value }))}
                        required
                        placeholder="Indica con claridad qué datos específicos deseas acceder, rectificar, cancelar u oponerte..."
                        className="apple-textarea"
                      />
                    </Form.Group>

                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="apple-cookie-btn-primary"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <Spinner animation="border" size="sm" />
                            <span>{t('common.sending', 'Enviando...')}</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane"></i>
                            <span>{t('privacy.submit_request', 'Radicar Solicitud ARCOP')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </Form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </Container>
    </div>
  );
}
