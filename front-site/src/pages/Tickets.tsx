import React, { type ReactElement } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Table, Badge, Button, Spinner } from 'react-bootstrap';
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

const priorityLabel = (p: string, t: (k: string, o?: any) => string): string => {
  const labels: Record<string, string> = {
    baja: t('tickets.priority_labels.baja'),
    media: t('tickets.priority_labels.media'),
    alta: t('tickets.priority_labels.alta'),
    urgente: t('tickets.priority_labels.urgente'),
  };
  return labels[p] || p;
};

const priorityColor = (p: string): string => {
  const colors: Record<string, string> = {
    baja: 'secondary',
    media: 'info',
    alta: 'warning',
    urgente: 'danger',
  };
  return colors[p] || 'secondary';
};

export default function Tickets(): ReactElement {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [tickets, setTickets] = React.useState<Ticket[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string>('');

  React.useEffect(() => {
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
      .catch((e: any) => setError(e?.message || t('errors.loading', { entity: t('entities.tickets') })) )
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col>
          <h2>
            <i className="fas fa-bell me-2" />
            {t('tickets.my_tickets')}
          </h2>
        </Col>
        <Col className="text-end">
          <Button as={Link as any} to="/tickets/nuevo" variant="primary">
            <i className="fas fa-plus me-1" />
            {t('tickets.new')}
          </Button>
        </Col>
      </Row>

      {loading ? (
        <div className="text-center py-5">
          <Spinner />
        </div>
      ) : error ? (
        <div className="alert alert-danger">{error}</div>
      ) : tickets.length === 0 ? (
        <div className="alert alert-info">{t('tickets.no_tickets')} {t('tickets.create_one')}</div>
      ) : (
        <Table striped hover responsive>
          <thead>
            <tr>
              <th>{t('tickets.subject')}</th>
              <th>{t('tickets.status')}</th>
              <th>{t('tickets.priority')}</th>
              <th>{t('tickets.category')}</th>
              <th>{t('tickets.created')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={String(ticket.id)}>
                <td>{ticket.subject}</td>
                <td>
                  <Badge bg={statusColor(ticket.status)}>{statusLabel(ticket.status, t)}</Badge>
                </td>
                <td>
                  <Badge bg={priorityColor(ticket.priority)}>{priorityLabel(ticket.priority, t)}</Badge>
                </td>
                <td>{ticket.category}</td>
                <td>{ticket.created_at}</td>
                <td className="text-end">
                  <Button as={Link as any} to={`/tickets/${ticket.id}`} size="sm" variant="outline-secondary">
                    {t('tickets.view')}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Container>
  );
}
