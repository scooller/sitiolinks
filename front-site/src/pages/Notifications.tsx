import { type ReactElement, useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn, defaultTransition, appleEase } from '../lib/animations';
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
      try {
        getEcho()?.leave(channelName);
      } catch {}
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

      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n))
      );
    } catch {
      // Ignorar errores de red en segundo plano
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await graphqlRequest({
        query: `mutation { markAllNotificationsAsRead }`,
        schema: 'default',
        authenticated: true,
      });

      const now = new Date().toISOString();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || now })));
    } catch {
      // Ignorar errores de red en segundo plano
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
        return 'fa-circle-xmark';
      case 'system':
        return 'fa-circle-info';
      case 'vip_user_message':
        return 'fa-crown';
      default:
        return 'fa-bell';
    }
  };

  const getTypeBadgeClass = (type: string): string => {
    switch (type) {
      case 'follow':
        return 'type-follow';
      case 'vip_user_message':
        return 'type-vip';
      case 'gallery_featured':
        return 'type-featured';
      case 'gallery_approved':
        return 'type-approved';
      case 'gallery_rejected':
        return 'type-rejected';
      case 'system':
        return 'type-system';
      default:
        return 'type-default';
    }
  };

  const parseNotificationData = (notification: Notification): Record<string, any> | null => {
    if (!notification.data) return null;
    try {
      return JSON.parse(notification.data);
    } catch {
      return null;
    }
  };

  const getSenderText = (notification: Notification): string | null => {
    if (notification.type !== 'vip_user_message') return null;
    const parsed = parseNotificationData(notification);
    const username = parsed?.sender_username;
    if (typeof username === 'string' && username.trim() !== '') {
      return `@${username}`;
    }
    return null;
  };

  const getReplyTarget = (notification: Notification): { id: number; username: string } | null => {
    if (notification.type !== 'vip_user_message') return null;
    const parsed = parseNotificationData(notification);
    const senderId = Number(parsed?.sender_id ?? 0);
    if (!Number.isInteger(senderId) || senderId <= 0) return null;
    if (user?.id && Number(user.id) === senderId) return null;
    const senderUsername = typeof parsed?.sender_username === 'string' ? parsed.sender_username : '';
    return { id: senderId, username: senderUsername };
  };

  const openReplyModal = (notification: Notification): void => {
    const target = getReplyTarget(notification);
    if (!target) return;
    setReplyRecipientId(target.id);
    setReplyRecipientUsername(target.username);
    setReplyMessage('');
    setReplyStatus(null);
    setShowReplyModal(true);
  };

  const handleReplySend = async (event: React.FormEvent): Promise<void> => {
    event.preventDefault();
    if (!replyRecipientId) {
      setReplyStatus({ variant: 'danger', text: 'No se encontró destinatario para la respuesta.' });
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

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="notifications-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          <Row className="justify-content-center">
            <Col lg={9} xl={8}>
              {/* Cabecera Editorial Apple */}
              <div className="notifications-hero">
                <span className="notif-kicker">
                  <i className="fas fa-bell" aria-hidden="true"></i> {t('notifications.kicker')}
                </span>

                <div className="notif-header-title-row">
                  <h1 className="notif-title">
                    <span>{t('notifications.title')}</span>
                    {unreadCount > 0 && (
                      <span className="notif-unread-badge">
                        {unreadCount}
                      </span>
                    )}
                  </h1>

                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className="notif-mark-all-btn"
                      onClick={handleMarkAllAsRead}
                      aria-label={t('notifications.mark_all_read')}
                    >
                      <i className="fas fa-check-double" aria-hidden="true"></i>
                      <span>{t('notifications.mark_all_read')}</span>
                    </button>
                  )}
                </div>

                <p className="notif-subtitle">{t('notifications.subtitle')}</p>
              </div>

              {/* Segmented Control (Apple HIG Tabs) */}
              <nav className="notif-segmented-nav" aria-label="Filtro de notificaciones">
                <button
                  type="button"
                  className={`notif-segment-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                  aria-pressed={filter === 'all'}
                >
                  <span>{t('notifications.filter_all')}</span>
                </button>

                <button
                  type="button"
                  className={`notif-segment-btn ${filter === 'unread' ? 'active' : ''}`}
                  onClick={() => setFilter('unread')}
                  aria-pressed={filter === 'unread'}
                >
                  <span>{t('notifications.filter_unread')}</span>
                  {unreadCount > 0 && (
                    <span className="notif-count-pill">{unreadCount}</span>
                  )}
                </button>

                <button
                  type="button"
                  className={`notif-segment-btn ${filter === 'vip' ? 'active' : ''}`}
                  onClick={() => setFilter('vip')}
                  aria-pressed={filter === 'vip'}
                >
                  <i className="fas fa-crown text-warning" aria-hidden="true"></i>
                  <span>{t('notifications.filter_vip')}</span>
                </button>
              </nav>

              {/* Estados de Carga y Error */}
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" variant="primary" role="status" />
                  <p className="mt-3 text-muted">{t('notifications.loading')}</p>
                </div>
              ) : error ? (
                <Alert variant="danger" className="rounded-xl shadow-sm">
                  <i className="fas fa-circle-exclamation me-2" aria-hidden="true"></i>
                  {error}
                </Alert>
              ) : notifications.length === 0 ? (
                /* Estado Vacío Apple HIG */
                <div className="notif-empty-card">
                  <div className="notif-empty-icon" aria-hidden="true">
                    {filter === 'unread' ? (
                      <i className="fas fa-check-double"></i>
                    ) : filter === 'vip' ? (
                      <i className="fas fa-crown"></i>
                    ) : (
                      <i className="fas fa-bell-slash"></i>
                    )}
                  </div>
                  <h2 className="notif-empty-title">
                    {filter === 'unread'
                      ? t('notifications.empty_unread')
                      : filter === 'vip'
                      ? t('notifications.empty_vip')
                      : t('notifications.empty_all')}
                  </h2>
                  <p className="notif-empty-desc">
                    {filter === 'unread'
                      ? t('notifications.empty_all')
                      : t('notifications.subtitle')}
                  </p>
                </div>
              ) : (
                /* Lista de Notificaciones Apple Liquid Glass */
                <div className="notifications-list" role="feed" aria-label="Lista de notificaciones">
                  {notifications.map((notif, idx) => {
                    const isUnread = !notif.read_at;
                    const sender = getSenderText(notif);
                    const canReply = isVipViewer && getReplyTarget(notif);
                    const badgeClass = getTypeBadgeClass(notif.type);
                    const iconClass = getTypeIcon(notif.type);

                    return (
                      <motion.article
                        key={notif.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.24,
                          delay: Math.min(idx * 0.03, 0.3),
                          ease: appleEase,
                        }}
                        className={`notif-apple-card ${isUnread ? 'unread' : ''} ${
                          notif.url ? 'clickable' : ''
                        }`}
                        onClick={() => {
                          if (isUnread) handleMarkAsRead(notif.id);
                          if (notif.url) navigate(notif.url);
                        }}
                      >
                        {/* Icono de Tipo en Halo Apple */}
                        <div className={`notif-type-badge ${badgeClass}`} aria-hidden="true">
                          <i className={`fas ${iconClass}`}></i>
                        </div>

                        {/* Cuerpo de la Notificación */}
                        <div className="notif-card-body">
                          <div className="notif-header-row">
                            <h2 className="notif-item-title">{notif.title}</h2>
                            {isUnread && (
                              <span className="notif-new-pill">
                                {t('notifications.new')}
                              </span>
                            )}
                          </div>

                          <p className="notif-item-message">{notif.message}</p>

                          {/* Metadatos y Acciones */}
                          <div className="notif-meta-row">
                            <div className="notif-meta-left">
                              {sender && (
                                <span className="notif-sender-pill">
                                  <i className="fas fa-crown text-warning" aria-hidden="true"></i>
                                  {sender}
                                </span>
                              )}

                              <span className="notif-time">
                                <i className="far fa-clock" aria-hidden="true"></i>
                                <time dateTime={notif.created_at}>
                                  {new Date(notif.created_at).toLocaleString(i18n.language, {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </time>
                              </span>
                            </div>

                            {/* Botón de Respuesta VIP (100% Sólido) */}
                            {canReply && (
                              <button
                                type="button"
                                className="notif-reply-btn"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  openReplyModal(notif);
                                }}
                                aria-label={`${t('notifications.reply')} ${sender || ''}`}
                              >
                                <i className="fas fa-reply" aria-hidden="true"></i>
                                <span>{t('notifications.reply')}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.article>
                    );
                  })}
                </div>
              )}
            </Col>
          </Row>
        </motion.div>
      </Container>

      {/* Modal de Respuesta VIP (Apple Liquid Glass) */}
      <AnimatePresence>
        {showReplyModal && (
          <motion.div
            key="reply-modal-backdrop"
            className="notif-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: appleEase }}
            onClick={() => setShowReplyModal(false)}
          >
            <motion.div
              key="reply-modal-card"
              className="notif-modal-card"
              role="dialog"
              aria-modal="true"
              aria-labelledby="reply-modal-title"
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ duration: 0.26, ease: appleEase }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="notif-modal-header">
                <h2 id="reply-modal-title" className="notif-modal-title">
                  <i className="fas fa-reply text-warning" aria-hidden="true"></i>
                  <span>
                    {replyRecipientUsername
                      ? `${t('notifications.reply')} @${replyRecipientUsername}`
                      : t('notifications.reply_title')}
                  </span>
                </h2>
                <button
                  type="button"
                  className="notif-modal-close"
                  onClick={() => setShowReplyModal(false)}
                  aria-label={t('notifications.reply_close')}
                >
                  <i className="fas fa-xmark" aria-hidden="true"></i>
                </button>
              </div>

              {replyStatus && (
                <Alert variant={replyStatus.variant} className="rounded-lg mb-3">
                  {replyStatus.text}
                </Alert>
              )}

              <form onSubmit={handleReplySend}>
                <textarea
                  className="notif-modal-textarea"
                  rows={4}
                  maxLength={500}
                  value={replyMessage}
                  onChange={(event) => setReplyMessage(event.target.value)}
                  placeholder={t('notifications.reply_placeholder')}
                  required
                  autoFocus
                />

                <div className="notif-modal-actions">
                  <button
                    type="button"
                    className="notif-btn-solid-neutral"
                    onClick={() => setShowReplyModal(false)}
                    disabled={replySending}
                  >
                    {t('notifications.reply_close')}
                  </button>

                  <button
                    type="submit"
                    className="notif-btn-solid-primary"
                    disabled={replySending || replyMessage.trim().length < 3}
                  >
                    {replySending ? (
                      <>
                        <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                        <span>{t('notifications.reply_sending')}</span>
                      </>
                    ) : (
                      <>
                        <i className="fas fa-paper-plane" aria-hidden="true"></i>
                        <span>{t('notifications.reply_send')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
