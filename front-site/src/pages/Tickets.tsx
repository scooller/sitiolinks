import React, { type ReactElement, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition, appleEase } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import type { Ticket } from '../types';
import { useTranslation } from 'react-i18next';

interface TicketsResponse {
  tickets: Ticket[];
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

export default function Tickets(): ReactElement {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    graphqlRequest<TicketsResponse>({
      query: queries.ticketsList,
      variables: { user_id: Number(user?.id) || undefined, limit: 50 },
      schema: 'public',
    })
      .then((data) => {
        if (!mounted) return;
        setTickets(data?.tickets || []);
      })
      .catch((e: any) => {
        if (mounted) {
          setError(e?.message || t('errors.loading', { entity: t('entities.tickets') }));
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id, t]);

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
            <Col lg={10} xl={9}>
              {/* Cabecera Editorial Apple */}
              <div className="tickets-hero">
                <span className="tickets-kicker">
                  <i className="fas fa-headset" aria-hidden="true"></i> {t('tickets.kicker')}
                </span>

                <div className="tickets-header-row">
                  <h1 className="tickets-title">{t('tickets.my_tickets')}</h1>

                  <Link to="/tickets/nuevo" className="tickets-new-btn">
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    <span>{t('tickets.new')}</span>
                  </Link>
                </div>

                <p className="tickets-subtitle">{t('tickets.subtitle')}</p>
              </div>

              {/* Estado de Carga */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" role="status" />
                  <p className="mt-3 text-muted">{t('common.loading')}</p>
                </div>
              ) : error ? (
                /* Estado de Error */
                <Alert variant="danger" className="rounded-xl shadow-sm">
                  <i className="fas fa-circle-exclamation me-2" aria-hidden="true"></i>
                  {error}
                </Alert>
              ) : tickets.length === 0 ? (
                /* Estado Vacío Apple HIG */
                <div className="tickets-empty-card">
                  <div className="tickets-empty-icon" aria-hidden="true">
                    <i className="fas fa-headset"></i>
                  </div>
                  <h2 className="tickets-empty-title">{t('tickets.empty_title')}</h2>
                  <p className="tickets-empty-desc">
                    {t('tickets.no_tickets')} {t('tickets.create_one')}
                  </p>
                  <Link to="/tickets/nuevo" className="tickets-new-btn">
                    <i className="fas fa-plus" aria-hidden="true"></i>
                    <span>{t('tickets.new')}</span>
                  </Link>
                </div>
              ) : (
                /* Lista de Tickets en Tarjetas Liquid Glass */
                <div className="tickets-list">
                  {tickets.map((ticket, idx) => (
                    <motion.div
                      key={String(ticket.id)}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.24,
                        delay: Math.min(idx * 0.04, 0.3),
                        ease: appleEase,
                      }}
                    >
                      <Link
                        to={`/tickets/${ticket.id}`}
                        className="ticket-apple-card clickable"
                        aria-label={`Ver ticket: ${ticket.subject}`}
                      >
                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-2">
                          <h2 className="fs-5 fw-bold mb-0 text-truncate" style={{ maxWidth: '75%' }}>
                            {ticket.subject}
                          </h2>
                          <span className={`ticket-status-pill ${statusClass(ticket.status)}`}>
                            {statusLabel(ticket.status, t)}
                          </span>
                        </div>

                        <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mt-3">
                          <div className="d-flex align-items-center flex-wrap gap-2">
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

                            <span className="small text-muted d-inline-flex align-items-center gap-1">
                              <i className="far fa-clock" aria-hidden="true"></i>
                              {ticket.created_at ? (
                                <time dateTime={ticket.created_at}>
                                  {new Date(ticket.created_at).toLocaleDateString(i18n.language, {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                  })}
                                </time>
                              ) : null}
                            </span>
                          </div>

                          <span className="ticket-view-btn">
                            <span>{t('tickets.view')}</span>
                            <i className="fas fa-arrow-right" aria-hidden="true"></i>
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              )}
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
}
