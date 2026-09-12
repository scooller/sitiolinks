import React, { type ReactElement, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { mutations } from '../lib/graphql/mutations';
import { useTranslation } from 'react-i18next';

interface CreateTicketResponse {
  createTicket: {
    id: string | number;
  };
}

export default function NewTicket(): ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({
    subject: '',
    description: '',
    category: 'tecnico',
    priority: 'media',
  });
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const variables = { user_id: Number(user?.id) || undefined, ...form };
      const data = await graphqlRequest<CreateTicketResponse>({
        query: mutations.createTicket,
        variables,
        schema: 'public',
      });
      const id = data?.createTicket?.id;
      navigate(id ? `/tickets/${id}` : '/tickets');
    } catch (err: any) {
      setError(err?.message || t('tickets.error_creating'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tickets-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>
              {/* Enlace Volver */}
              <Link to="/tickets" className="ticket-back-btn">
                <i className="fas fa-arrow-left" aria-hidden="true"></i>
                <span>{t('tickets.back_to_tickets')}</span>
              </Link>

              {/* Cabecera Editorial Apple */}
              <div className="tickets-hero">
                <span className="tickets-kicker">
                  <i className="fas fa-plus" aria-hidden="true"></i> {t('tickets.kicker')}
                </span>
                <h1 className="tickets-title">{t('tickets.new')}</h1>
                <p className="tickets-subtitle">{t('tickets.new_subtitle')}</p>
              </div>

              {/* Tarjeta de Formulario Apple Liquid Glass */}
              <div className="ticket-form-card">
                {error && (
                  <Alert variant="danger" className="rounded-xl mb-4">
                    <i className="fas fa-circle-exclamation me-2" aria-hidden="true"></i>
                    {error}
                  </Alert>
                )}

                <form onSubmit={onSubmit}>
                  {/* Asunto */}
                  <div className="ticket-form-group">
                    <label htmlFor="ticket-subject" className="ticket-form-label">
                      {t('tickets.subject')} *
                    </label>
                    <div className="ticket-input-wrapper">
                      <i className="fas fa-heading ticket-input-icon" aria-hidden="true"></i>
                      <input
                        id="ticket-subject"
                        type="text"
                        name="subject"
                        className="ticket-form-control"
                        value={form.subject}
                        onChange={onChange}
                        placeholder={t('tickets.subject_placeholder')}
                        required
                        minLength={5}
                        maxLength={150}
                      />
                    </div>
                  </div>

                  {/* Categoría y Prioridad en 2 Columnas */}
                  <Row className="g-3">
                    <Col sm={6}>
                      <div className="ticket-form-group">
                        <label htmlFor="ticket-category" className="ticket-form-label">
                          {t('tickets.category')}
                        </label>
                        <div className="ticket-input-wrapper">
                          <i className="fas fa-folder ticket-input-icon" aria-hidden="true"></i>
                          <select
                            id="ticket-category"
                            name="category"
                            className="ticket-form-select"
                            value={form.category}
                            onChange={onChange}
                          >
                            <option value="tecnico">{t('tickets.categories.tecnico')}</option>
                            <option value="facturacion">{t('tickets.categories.facturacion')}</option>
                            <option value="cuenta">{t('tickets.categories.cuenta')}</option>
                            <option value="contenido">{t('tickets.categories.contenido')}</option>
                            <option value="otro">{t('tickets.categories.otro')}</option>
                          </select>
                        </div>
                      </div>
                    </Col>

                    <Col sm={6}>
                      <div className="ticket-form-group">
                        <label htmlFor="ticket-priority" className="ticket-form-label">
                          {t('tickets.priority')}
                        </label>
                        <div className="ticket-input-wrapper">
                          <i className="fas fa-flag ticket-input-icon" aria-hidden="true"></i>
                          <select
                            id="ticket-priority"
                            name="priority"
                            className="ticket-form-select"
                            value={form.priority}
                            onChange={onChange}
                          >
                            <option value="baja">{t('tickets.priority_labels.baja')}</option>
                            <option value="media">{t('tickets.priority_labels.media')}</option>
                            <option value="alta">{t('tickets.priority_labels.alta')}</option>
                            <option value="urgente">{t('tickets.priority_labels.urgente')}</option>
                          </select>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {/* Descripción */}
                  <div className="ticket-form-group">
                    <label htmlFor="ticket-description" className="ticket-form-label">
                      {t('tickets.description')} *
                    </label>
                    <div className="ticket-input-wrapper textarea-wrapper">
                      <i className="fas fa-comment-dots ticket-input-icon" aria-hidden="true"></i>
                      <textarea
                        id="ticket-description"
                        name="description"
                        rows={6}
                        className="ticket-form-textarea"
                        value={form.description}
                        onChange={onChange}
                        placeholder={t('tickets.description_placeholder')}
                        required
                        minLength={10}
                        maxLength={5000}
                      />
                    </div>
                  </div>

                  {/* Fila de Botones 100% Sólidos */}
                  <div className="ticket-btn-row">
                    <button
                      type="submit"
                      className="ticket-submit-btn"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          <span>{t('common.creating')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-paper-plane" aria-hidden="true"></i>
                          <span>{t('tickets.create')}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="ticket-cancel-btn"
                      onClick={() => navigate('/tickets')}
                      disabled={submitting}
                    >
                      <span>{t('common.cancel')}</span>
                    </button>
                  </div>
                </form>
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
}
