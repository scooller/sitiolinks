import { type ReactElement, useEffect, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Alert, Spinner, ButtonGroup, Modal, Form } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useAuth } from '../contexts/AuthContext';
import { initEcho, getEcho } from '../lib/echo';
import { useTranslation } from 'react-i18next';
import { queries } from '../lib/graphql/queries';
import { mutations } from '../lib/graphql/mutations';

interface Notification {
  id: string | number;
  type: string;
  title: string;
  message: string;
  data?: string | null;
  url?: string | null;
  read_at?: string | null;
  created_at: string;
}

const isValidFilter = (value: string | null): value is 'all' | 'unread' | 'vip' => {
  return value === 'all' || value === 'unread' || value === 'vip';
};

export default function Notifications(): ReactElement {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'vip'>('all');
  const [showReplyModal, setShowReplyModal] = useState<boolean>(false);
  const [replyRecipientId, setReplyRecipientId] = useState<number | null>(null);
  const [replyRecipientUsername, setReplyRecipientUsername] = useState<string>('');
  const [replyMessage, setReplyMessage] = useState<string>('');
  const [replySending, setReplySending] = useState<boolean>(false);
  const [replyStatus, setReplyStatus] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);
  const { t, i18n } = useTranslation();
  const viewerRoles: string[] = Array.isArray((user as any)?.roles)
    ? (user as any).roles.map((role: any) => (typeof role === 'string' ? role : role?.name)).filter(Boolean)
    : [];
  const isVipViewer = viewerRoles.includes('vip');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchNotifications();
  }, [isAuthenticated, filter, navigate]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const filterParam = params.get('filter');

    if (!isValidFilter(filterParam)) {
      return;
    }

    setFilter((previous) => (previous === filterParam ? previous : filterParam));
  }, [location.search]);

  useEffect(() => {
    if (!isAuthenticated || !isVipViewer) {
      return;
    }

    const params = new URLSearchParams(location.search);
    const replyToRaw = params.get('reply_to');

    if (!replyToRaw) {
      return;
    }

    const replyTo = Number(replyToRaw);

    if (!Number.isInteger(replyTo) || replyTo <= 0) {
      return;
    }

    if (user?.id && Number(user.id) === replyTo) {
      return;
    }

    setReplyRecipientId(replyTo);
    setReplyRecipientUsername(params.get('reply_username') || '');
    setReplyMessage('');
    setReplyStatus(null);
    setShowReplyModal(true);
  }, [isAuthenticated, isVipViewer, location.search, user?.id]);

  // Suscripción en tiempo real al canal privado de notificaciones
  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    const echo = initEcho();
    const channelName = `notifications.${user.id}`;
    const channel = echo.private(channelName);

    channel.listen('.notification.created', (payload: any) => {
      setNotifications((prev) => [
        {
          id: payload.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data ? JSON.stringify(payload.data) : null,
          url: payload.url,
          read_at: null,
          created_at: payload.created_at,
        },
        ...prev,
      ].slice(0, 50));
    });

    return () => {
      try { getEcho()?.leave(channelName); } catch {}
    };
  }, [isAuthenticated, user?.id]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      if (filter === 'vip') {
        const data = await graphqlRequest<{ vipNotifications: Notification[] }>({
          query: queries.vipNotifications,
          variables: {
            limit: 50,
            unreadOnly: false,
          },
          schema: 'default',
          authenticated: true,
        });

        setNotifications(data.vipNotifications || []);
      } else {
        const data = await graphqlRequest<{ notifications: Notification[] }>({
          query: `
            query {
              notifications(limit: 50, unread_only: ${filter === 'unread'}) {
                id
                type
                title
                message
                data
                url
                read_at
                created_at
              }
            }
          `,
          schema: 'default',
          authenticated: true,
        });

        setNotifications(data.notifications || []);
      }
    } catch (err: any) {
      setError(err.message || t('errors.loading', { entity: t('entities.notifications') }));
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await graphqlRequest({
        query: `mutation MarkAsRead($id: String!) {
          markNotificationAsRead(id: $id)
        }`,
        variables: { id: String(id) },
        schema: 'default',
        authenticated: true,
      });

      // Actualizar el estado local sin refetch
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n)
      );
    } catch (err: any) {
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await graphqlRequest({
        query: `mutation { markAllNotificationsAsRead }`,
        schema: 'default',
        authenticated: true,
      });

      // Actualizar el estado local sin refetch
      const now = new Date().toISOString();
      setNotifications(prev =>
        prev.map(n => ({ ...n, read_at: n.read_at || now }))
      );
    } catch (err: any) {
    }
  };

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'follow':
        return 'fa-user-plus';
      case 'gallery_featured':
        return 'fa-star';
      case 'gallery_approved':
        return 'fa-check-circle';
      case 'gallery_rejected':
        return 'fa-times-circle';
      case 'system':
        return 'fa-info-circle';
      case 'vip_user_message':
        return 'fa-crown';
      default:
        return 'fa-bell';
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'follow':
        return 'primary';
      case 'gallery_featured':
        return 'warning';
      case 'gallery_approved':
        return 'success';
      case 'gallery_rejected':
        return 'danger';
      case 'system':
        return 'info';
      case 'vip_user_message':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const parseNotificationData = (notification: Notification): Record<string, any> | null => {
    if (!notification.data) {
      return null;
    }

    try {
      return JSON.parse(notification.data);
    } catch {
      return null;
    }
  };

  const getSenderText = (notification: Notification): string | null => {
    if (notification.type !== 'vip_user_message') {
      return null;
    }

    const parsed = parseNotificationData(notification);
    const username = parsed?.sender_username;

    if (typeof username === 'string' && username.trim() !== '') {
      return `@${username}`;
    }

    return null;
  };

  const getReplyTarget = (notification: Notification): { id: number; username: string } | null => {
    if (notification.type !== 'vip_user_message') {
      return null;
    }

    const parsed = parseNotificationData(notification);
    const senderId = Number(parsed?.sender_id ?? 0);

    if (!Number.isInteger(senderId) || senderId <= 0) {
      return null;
    }

    if (user?.id && Number(user.id) === senderId) {
      return null;
    }

    const senderUsername = typeof parsed?.sender_username === 'string' ? parsed.sender_username : '';

    return { id: senderId, username: senderUsername };
  };

  const openReplyModal = (notification: Notification): void => {
    const target = getReplyTarget(notification);

    if (!target) {
      return;
    }

    setReplyRecipientId(target.id);
    setReplyRecipientUsername(target.username);
    setReplyMessage('');
    setReplyStatus(null);
    setShowReplyModal(true);
  };

  const handleReplySend = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();

    if (!replyRecipientId) {
      setReplyStatus({ variant: 'danger', text: 'No se encontro destinatario para la respuesta.' });

      return;
    }

    const cleanedMessage = replyMessage.trim();

    if (cleanedMessage.length < 3) {
      setReplyStatus({ variant: 'danger', text: 'El mensaje debe tener al menos 3 caracteres.' });

      return;
    }

    setReplySending(true);
    setReplyStatus(null);

    try {
      await graphqlRequest({
        query: mutations.sendVipNotification,
        variables: {
          recipientId: replyRecipientId,
          message: cleanedMessage,
          title: 'Respuesta de creador VIP',
          url: '/notificaciones',
        },
        schema: 'default',
        authenticated: true,
      });

      setReplyStatus({ variant: 'success', text: 'Respuesta enviada correctamente.' });
      setReplyMessage('');
      setShowReplyModal(false);
    } catch (err: any) {
      setReplyStatus({ variant: 'danger', text: err?.message || 'No se pudo enviar la respuesta.' });
    } finally {
      setReplySending(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">{t('notifications.loading')}</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <Container className="mt-5 mb-5">
      <Row className="justify-content-center">
        <Col lg={8}>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1>
              <i className="fas fa-bell me-2"></i>
              {t('notifications.title')}
              {unreadCount > 0 && (
                <Badge bg="danger" className="ms-2">
                  {t('notifications.unread_count', { count: unreadCount })}
                </Badge>
              )}
            </h1>
            {unreadCount > 0 && (
              <Button variant="outline-primary" size="sm" onClick={handleMarkAllAsRead}>
                <i className="fas fa-check-double me-1"></i>
                {t('notifications.mark_all_read')}
              </Button>
            )}
          </div>

          <ButtonGroup className="mb-3 w-100">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('all')}
            >
              {t('notifications.filter_all')}
            </Button>
            <Button
              variant={filter === 'unread' ? 'primary' : 'outline-primary'}
              onClick={() => setFilter('unread')}
            >
              {t('notifications.filter_unread')} ({unreadCount})
            </Button>
            <Button
              variant={filter === 'vip' ? 'warning' : 'outline-warning'}
              onClick={() => setFilter('vip')}
            >
              VIP
            </Button>
          </ButtonGroup>

          {notifications.length === 0 ? (
            <Alert variant="info" className="text-center">
              {filter === 'unread'
                ? t('notifications.empty_unread')
                : t('notifications.empty_all')}
            </Alert>
          ) : (
            <div className="notifications-list">
              {notifications.map((notif) => (
                <Card
                  key={notif.id}
                  className={`mb-3 ${!notif.read_at ? 'border-primary border-2' : ''}`}
                  style={{ cursor: notif.url ? 'pointer' : 'default' }}
                  onClick={() => {
                    if (!notif.read_at) handleMarkAsRead(notif.id);
                    if (notif.url) navigate(notif.url);
                  }}
                >
                  <Card.Body>
                    <div className="d-flex align-items-start">
                      <div
                        className={`rounded-circle bg-${getTypeColor(notif.type)} bg-opacity-10 p-3 me-3`}
                        style={{ minWidth: '56px', height: '56px' }}
                      >
                        <i className={`fas ${getTypeIcon(notif.type)} fa-lg text-${getTypeColor(notif.type)}`}></i>
                      </div>
                      <div className="grow text-start">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h5 className="mb-0">{notif.title}</h5>
                          {!notif.read_at && (
                            <Badge bg="primary" pill>
                              {t('notifications.new')}
                            </Badge>
                          )}
                        </div>
                        <p className="mb-2">{notif.message}</p>
                        {getSenderText(notif) && (
                          <small className="text-muted d-block mb-2">
                            <i className="fas fa-user me-1"></i>
                            {getSenderText(notif)}
                          </small>
                        )}
                        <small className="text-muted">
                          <i className="fas fa-clock me-1"></i>
                          {new Date(notif.created_at).toLocaleString(i18n.language, {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </small>
                        {isVipViewer && getReplyTarget(notif) && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              variant="outline-warning"
                              onClick={(event) => {
                                event.stopPropagation();
                                openReplyModal(notif);
                              }}
                            >
                              <i className="fas fa-reply me-1"></i>
                              Responder
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </Card.Body>
                </Card>
              ))}
            </div>
          )}
        </Col>
      </Row>

      <Modal show={showReplyModal} onHide={() => setShowReplyModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-reply me-2"></i>
            Responder {replyRecipientUsername ? `a @${replyRecipientUsername}` : 'mensaje VIP'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {replyStatus && (
            <Alert variant={replyStatus.variant}>{replyStatus.text}</Alert>
          )}
          <Form onSubmit={handleReplySend}>
            <Form.Group className="mb-3">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                maxLength={500}
                value={replyMessage}
                onChange={(event) => setReplyMessage(event.target.value)}
                placeholder="Escribe tu respuesta"
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="outline-secondary" onClick={() => setShowReplyModal(false)} disabled={replySending}>
                Cerrar
              </Button>
              <Button type="submit" variant="warning" disabled={replySending}>
                {replySending ? 'Enviando...' : 'Enviar respuesta'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
