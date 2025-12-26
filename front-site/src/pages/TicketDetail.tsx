import React, { type ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Badge, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { mutations } from '../lib/graphql/mutations';
import type { Ticket } from '../types';
import { useTranslation } from 'react-i18next';

interface TicketDetailResponse {
  ticket: Ticket | null;
}

const statusLabel = (s: string): string => {
  const labels: Record<string, string> = {
    abierto: 'Abierto',
    en_progreso: 'En Progreso',
    resuelto: 'Resuelto',
    cerrado: 'Cerrado',
    reabierto: 'Reabierto',
  };
  return labels[s] || s;
};

const statusColor = (s: string): string => {
  const colors: Record<string, string> = {
    abierto: 'danger',
    en_progreso: 'warning',
    resuelto: 'success',
    cerrado: 'secondary',
    reabierto: 'info',
  };
  return colors[s] || 'secondary';
};

export default function TicketDetail(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');
  const [comment, setComment] = React.useState<string>('');
  const [posting, setPosting] = React.useState<boolean>(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError('');
    graphqlRequest<TicketDetailResponse>({ query: queries.ticketDetail, variables: { id }, schema: 'public' })
      .then((data) => setTicket(data?.ticket || null))
      .catch((e: any) => setError(e?.message || t('errors.loading', { entity: t('entities.ticket') })) )
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    load();
  }, [load]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !id) return;
    setPosting(true);
    setError('');
    try {
      const ticketId = Number.parseInt(id, 10);
      await graphqlRequest({ query: mutations.addTicketComment, variables: { ticket_id: ticketId, comment }, schema: 'default', authenticated: true });
      setComment('');
      load();
    } catch (err: any) {
      setError(err?.message || 'Error al agregar comentario');
    } finally {
      setPosting(false);
    }
  };

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col>
          <h2>
            <Link to="/tickets" className="text-decoration-none me-2">
              ⟵
            </Link>
            {t('tickets.detail')}
          </h2>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner />
        </div>
      ) : error ? (
        <Alert variant="danger">{error}</Alert>
      ) : !ticket ? (
        <Alert variant="warning">{t('tickets.not_found')}</Alert>
      ) : (
        <Row>
          <Col md={8}>
            <Card className="mb-3">
              <Card.Body>
                <Card.Title className="mb-2">{ticket.subject}</Card.Title>
                <div className="mb-2">
                  <Badge bg={statusColor(ticket.status)} className="me-2">
                    {statusLabel(ticket.status)}
                  </Badge>
                  <Badge bg="secondary" className="me-2">
                    {ticket.priority}
                  </Badge>
                  <Badge bg="secondary">{ticket.category}</Badge>
                </div>
                <Card.Text style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</Card.Text>
              </Card.Body>
            </Card>

            <Card className="mb-3">
              <Card.Header>{t('tickets.comments')}</Card.Header>
              <Card.Body>
                {ticket.comments && ticket.comments.length > 0 ? (
                  ticket.comments.map((c) => (
                    <div key={String(c.id)} className="mb-3 p-2 border rounded">
                      <div className="small text-muted mb-1">
                        {c.user?.name || c.user?.username} • {c.created_at}
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{c.comment}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted">{t('tickets.no_comments')}</div>
                )}
                <Form onSubmit={submitComment} className="mt-3">
                  <Form.Group className="mb-2">
                    <Form.Label>{t('tickets.add_comment')}</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      required
                      minLength={2}
                      maxLength={3000}
                    />
                  </Form.Group>
                  <Button type="submit" disabled={posting}>
                    {posting ? t('tickets.sending') : t('tickets.send')}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
          </Col>
          <Col md={4}>
            <Card>
              <Card.Header>{t('tickets.info')}</Card.Header>
              <Card.Body>
                <div className="mb-2">
                  <strong>{t('tickets.status')}:</strong> {statusLabel(ticket.status)}
                </div>
                <div className="mb-2">
                  <strong>{t('tickets.priority')}:</strong> {ticket.priority}
                </div>
                <div className="mb-2">
                  <strong>{t('tickets.category')}:</strong> {ticket.category}
                </div>
                <div className="mb-2">
                  <strong>{t('tickets.created_by')}:</strong> {ticket.user?.name || ticket.user?.username}
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
}
