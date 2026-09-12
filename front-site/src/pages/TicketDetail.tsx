import React, { type ReactElement, useCallback, useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { mutations } from '../lib/graphql/mutations';
import type { Ticket } from '../types';
import { useTranslation } from 'react-i18next';

interface TicketDetailResponse {
  ticket: Ticket | null;
}

const statusLabel = (s: string, t: (k: string, o?: any) => string): string => {
  const labels: Record<string, string> = {
    abierto: t('tickets.status_labels.abierto'),
    en_progreso: t('tickets.status_labels.en_progreso'),
    resuelto: t('tickets.status_labels.resuelto'),
    cerrado: t('tickets.status_labels.cerrado'),
    reabierto: t('tickets.status_labels.reabierto'),
  };
  return labels[s] || s;
};

const statusClass = (s: string): string => {
  const map: Record<string, string> = {
    abierto: 'status-abierto',
    en_progreso: 'status-en_progreso',
    resuelto: 'status-resuelto',
    cerrado: 'status-cerrado',
    reabierto: 'status-reabierto',
  };
  return map[s] || 'status-cerrado';
};

const priorityLabel = (p: string, t: (k: string, o?: any) => string): string => {
  const labels: Record<string, string> = {
    baja: t('tickets.priority_labels.baja'),
    media: t('tickets.priority_labels.media'),
    alta: t('tickets.priority_labels.alta'),
    urgente: t('tickets.priority_labels.urgente'),
  };
  return labels[p] || p;
};

const priorityClass = (p: string): string => {
  const map: Record<string, string> = {
    baja: 'priority-baja',
    media: 'priority-media',
    alta: 'priority-alta',
    urgente: 'priority-urgente',
  };
  return map[p] || 'priority-media';
};

export default function TicketDetail(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [posting, setPosting] = useState<boolean>(false);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    graphqlRequest<TicketDetailResponse>({
      query: queries.ticketDetail,
      variables: { id },
      schema: 'public',
    })
      .then((data) => setTicket(data?.ticket || null))
      .catch((e: any) =>
        setError(e?.message || t('errors.loading', { entity: t('entities.ticket') }))
      )
      .finally(() => setLoading(false));
  }, [id, t]);

  useEffect(() => {
    load();
  }, [load]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !id) return;
    setPosting(true);
    setError('');
    try {
      const ticketId = Number.parseInt(id, 10);
      await graphqlRequest({
        query: mutations.addTicketComment,
        variables: { ticket_id: ticketId, comment: comment.trim() },
        schema: 'default',
        authenticated: true,
      });
      setComment('');
      load();
    } catch (err: any) {
      setError(err?.message || 'Error al agregar comentario');
    } finally {
      setPosting(false);
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
          {/* Botón Volver */}
          <Link to="/tickets" className="ticket-back-btn">
            <i className="fas fa-arrow-left" aria-hidden="true"></i>
            <span>{t('tickets.back_to_tickets')}</span>
          </Link>

          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" role="status" />
              <p className="mt-3 text-muted">{t('common.loading')}</p>
            </div>
          ) : error ? (
            <Alert variant="danger" className="rounded-xl shadow-sm">
              <i className="fas fa-circle-exclamation me-2" aria-hidden="true"></i>
              {error}
            </Alert>
          ) : !ticket ? (
            <Alert variant="warning" className="rounded-xl shadow-sm">
              <i className="fas fa-triangle-exclamation me-2" aria-hidden="true"></i>
              {t('tickets.not_found')}
            </Alert>
          ) : (
            <Row className="g-4">
              {/* Columna Principal: Detalle y Conversación */}
              <Col lg={8}>
                {/* Cabecera del Ticket */}
                <div className="ticket-detail-header-card">
                  <h1 className="ticket-detail-title">{ticket.subject}</h1>

                  <div className="d-flex align-items-center flex-wrap gap-2 mb-3">
                    <span className={`ticket-status-pill ${statusClass(ticket.status)}`}>
                      {statusLabel(ticket.status, t)}
                    </span>

                    <span className={`ticket-priority-pill ${priorityClass(ticket.priority)}`}>
                      <i className="fas fa-flag" aria-hidden="true"></i>
                      {priorityLabel(ticket.priority, t)}
                    </span>

                    {ticket.category && (
                      <span className="ticket-category-tag">
                        <i className="fas fa-folder" aria-hidden="true"></i>
                        {t(`tickets.categories.${ticket.category}`) || ticket.category}
                      </span>
                    )}
                  </div>

                  <p className="ticket-detail-description">{ticket.description}</p>
                </div>

                {/* Hilo de Comentarios / Discusión */}
                <div className="ticket-thread-card">
                  <h2 className="ticket-thread-title">
                    <i className="fas fa-comments text-primary" aria-hidden="true"></i>
                    <span>{t('tickets.comments')}</span>
                  </h2>

                  {ticket.comments && ticket.comments.length > 0 ? (
                    <div className="ticket-comments-list mb-4">
                      {ticket.comments.map((c) => (
                        <div key={String(c.id)} className="ticket-comment-item">
                          <div className="ticket-comment-header">
                            <span className="ticket-comment-author">
                              <i className="fas fa-user-circle me-1" aria-hidden="true"></i>
                              {c.user?.name || c.user?.username || t('tickets.created_by')}
                            </span>
                            {c.created_at && (
                              <span className="ticket-comment-time">
                                <i className="far fa-clock me-1" aria-hidden="true"></i>
                                {new Date(c.created_at).toLocaleString(i18n.language, {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}
                          </div>
                          <div className="ticket-comment-body">{c.comment}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted mb-4">{t('tickets.no_comments')}</p>
                  )}

                  {/* Formulario para Agregar Comentario */}
                  <form onSubmit={submitComment}>
                    <div className="ticket-form-group">
                      <label htmlFor="ticket-comment-input" className="ticket-form-label">
                        {t('tickets.add_comment')}
                      </label>
                      <textarea
                        id="ticket-comment-input"
                        rows={3}
                        className="ticket-form-textarea"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder={t('tickets.comment_placeholder')}
                        required
                        minLength={2}
                        maxLength={3000}
                      />
                    </div>

                    <div className="d-flex justify-content-end">
                      <button
                        type="submit"
                        className="ticket-submit-btn"
                        disabled={posting || !comment.trim()}
                      >
                        {posting ? (
                          <>
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                            <span>{t('tickets.sending')}</span>
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane" aria-hidden="true"></i>
                            <span>{t('tickets.send')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </Col>

              {/* Barra Lateral de Metadatos Apple Liquid Glass */}
              <Col lg={4}>
                <aside className="ticket-sidebar-card" aria-label="Información del ticket">
                  <h2 className="ticket-sidebar-title">
                    <i className="fas fa-circle-info me-2" aria-hidden="true"></i>
                    {t('tickets.info')}
                  </h2>

                  <div className="ticket-info-row">
                    <span className="ticket-info-label">{t('tickets.status')}</span>
                    <span className={`ticket-status-pill ${statusClass(ticket.status)}`}>
                      {statusLabel(ticket.status, t)}
                    </span>
                  </div>

                  <div className="ticket-info-row">
                    <span className="ticket-info-label">{t('tickets.priority')}</span>
                    <span className={`ticket-priority-pill ${priorityClass(ticket.priority)}`}>
                      {priorityLabel(ticket.priority, t)}
                    </span>
                  </div>

                  <div className="ticket-info-row">
                    <span className="ticket-info-label">{t('tickets.category')}</span>
                    <span className="ticket-info-val">
                      {t(`tickets.categories.${ticket.category}`) || ticket.category}
                    </span>
                  </div>

                  <div className="ticket-info-row">
                    <span className="ticket-info-label">{t('tickets.created_by')}</span>
                    <span className="ticket-info-val">
                      {ticket.user?.name || ticket.user?.username || '-'}
                    </span>
                  </div>

                  {ticket.created_at && (
                    <div className="ticket-info-row border-0">
                      <span className="ticket-info-label">{t('tickets.created')}</span>
                      <span className="ticket-info-val">
                        {new Date(ticket.created_at).toLocaleDateString(i18n.language, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                </aside>
              </Col>
            </Row>
          )}
        </motion.div>
      </Container>
    </div>
  );
}
