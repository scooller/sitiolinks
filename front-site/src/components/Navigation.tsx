import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Button, Badge, Dropdown, Offcanvas, Toast, ToastContainer } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedHover from './AnimatedHover';
import { fadeIn } from '../lib/animations';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { initEcho, getEcho } from '../lib/echo';
import { BACKEND_URL } from '../config/constants';
import LanguageSwitcher from './LanguageSwitcher';

const Navigation: React.FC = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const adminUrl = React.useMemo(() => {
    const envUrl = (import.meta as any).env?.VITE_ADMIN_URL as string | undefined;
    if (envUrl && String(envUrl).trim().length > 0) return String(envUrl).trim();

    const apiBase = (import.meta as any).env?.VITE_API_BASE as string | undefined;
    if (apiBase && String(apiBase).trim().length > 0) {
      let base = String(apiBase).trim();
      if (base.endsWith('/api')) base = base.slice(0, -4);
      base = base.replace(/\/$/, '');
      return `${base}/admin`;
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : BACKEND_URL;
    return `${origin.replace(/\/$/, '')}/admin`;
  }, []);
  const [siteTitle, setSiteTitle] = React.useState<string>('...');
  const [logoUrl, setLogoUrl] = React.useState<string>('');
  const [unreadCount, setUnreadCount] = React.useState<number>(0);
  const [vipUnreadCount, setVipUnreadCount] = React.useState<number>(0);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [showUserMenu, setShowUserMenu] = React.useState<boolean>(false);
  const [showToast, setShowToast] = React.useState<boolean>(false);
  const [toastNotification, setToastNotification] = React.useState<any>(null);

  // Actualizar título de la pestaña con contador de notificaciones
  React.useEffect(() => {
    if (unreadCount > 0) {
      document.title = `(${unreadCount}) ${siteTitle}`;
    } else {
      document.title = siteTitle;
    }
  }, [unreadCount, siteTitle]);

  // Cargar settings iniciales
  React.useEffect(() => {
    graphqlRequest({ query: queries.siteSettings })
      .then((data) => {
        const title = data?.siteSettings?.site_title as string | undefined;
        const logo = data?.siteSettings?.logo_url as string | undefined;
        const favicon = data?.siteSettings?.favicon_url as string | undefined;
        if (title) {
          setSiteTitle(title);
        }
        if (logo) setLogoUrl(logo);
        if (favicon) {
          const link = (document.querySelector("link[rel*='icon']") as HTMLLinkElement) || document.createElement('link');
          link.type = 'image/x-icon';
          link.rel = 'icon';
          link.href = favicon;
          document.getElementsByTagName('head')[0].appendChild(link);
        }
      })
      .catch(() => { });
  }, []);

  // Cargar notificaciones si está autenticado
  const fetchNotifications = React.useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const [countData, vipCountData, notifData] = await Promise.all([
        graphqlRequest({
          query: 'query { unreadNotificationsCount }',
          schema: 'default',
          authenticated: true,
        }),
        graphqlRequest({
          query: queries.vipUnreadNotificationsCount,
          schema: 'default',
          authenticated: true,
        }),
        graphqlRequest({
          query: 'query { notifications(limit: 5, unread_only: true) { id type title message url created_at read_at } }',
          schema: 'default',
          authenticated: true,
        }),
      ]);

      setUnreadCount(countData?.unreadNotificationsCount ?? 0);
      setVipUnreadCount(vipCountData?.vipUnreadNotificationsCount ?? 0);
      setNotifications(notifData?.notifications ?? []);
    } catch (err) {
    }
  }, [isAuthenticated]);

  // Inicializar Echo y suscribirse al canal privado
  React.useEffect(() => {
    if (!isAuthenticated || !user?.id) return;

    fetchNotifications();

    const echo = initEcho();
    const channelName = `notifications.${user.id}`;
    const channel = echo.private(channelName);

    channel.listen('.notification.created', (payload: any) => {
      // Insertar la nueva notificación al inicio y actualizar contador
      setNotifications((prev) => [
        {
          id: payload.id,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          url: payload.url,
          data: payload.data ? JSON.stringify(payload.data) : null,
          read_at: null,
          created_at: payload.created_at,
        },
        ...prev,
      ].slice(0, 5));
      setUnreadCount((prev) => prev + 1);

      // Mostrar Toast
      setToastNotification({
        title: payload.title,
        message: payload.message,
        url: payload.url,
      });
      setShowToast(true);
    });

    // Polling fallback cada 60s (menos agresivo)
    const interval = setInterval(fetchNotifications, 60000);
    return () => {
      clearInterval(interval);
      try { getEcho()?.leave(channelName); } catch { }
    };
  }, [isAuthenticated, user?.id, fetchNotifications]);

  const handleMarkAsRead = async (id: string | number) => {
    try {
      await graphqlRequest({
        query: `mutation { markNotificationAsRead(id: ${id}) { id read_at } }`,
        schema: 'default',
        authenticated: true,
      });
      fetchNotifications();
    } catch (err) {
    }
  };

  const handleDismissNotification = async (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation(); // Evita que se active el click del item

    // Actualizar estado local inmediatamente (optimistic update)
    setNotifications(prev => prev.filter(n => n.id !== id));
    setUnreadCount(prev => Math.max(0, prev - 1));

    try {
      await graphqlRequest({
        query: `mutation { markNotificationAsRead(id: ${id}) { id read_at } }`,
        schema: 'default',
        authenticated: true,
      });
    } catch (err) {
      // Si falla, recargar para mostrar el estado real
      fetchNotifications();
    }
  };

  const truncateText = (text: string, maxLength: number = 60): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const hasRole = (role: string): boolean => {
    const roles = user?.roles || [];
    if (!Array.isArray(roles)) return false;
    // roles may be array of objects or strings; normalize
    return roles.some((r: any) => (typeof r === 'string' ? r === role : r?.name === role));
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" style={{
      boxShadow: `0px 1px 1px rgba(120, 120, 120, 0.08),
      0px 5px 4px rgba(120, 120, 120, 0.08),
      0px 12px 9px rgba(120, 120, 120, 0.08),
      0px 20px 15px rgba(120, 120, 120, 0.08),
      0px 32px 24px rgba(120, 120, 120, 0.08)`
    }}>
      <Container>
        <Navbar.Brand as={Link} to="/">
          <AnimatedHover>
            {logoUrl ? (
              <img src={logoUrl} alt={siteTitle} height={80} className="me-2" />
            ) : (
              siteTitle
            )}
          </AnimatedHover>
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/explorar">
              <AnimatedHover>
                <i className="fa-solid fa-person-dress"></i>
                {t('nav.explore')}
              </AnimatedHover>
            </Nav.Link>
            <Nav.Link as={Link} to="/cafes">
              <AnimatedHover>
                <i className="fas fa-mug-hot me-1"></i>
                {t('nav.cafes')}
              </AnimatedHover>
            </Nav.Link>
            <Nav.Link as={Link} to="/ranking">
              <AnimatedHover>
                <i className="fas fa-trophy me-1"></i>{t('nav.ranking')}
              </AnimatedHover>
            </Nav.Link>
            <NavDropdown title={<><i className="fas fa-info-circle me-1"></i><br></br> {t('nav.info')}</>} id="info-dropdown">
              <NavDropdown.Item as={Link} to="/contacto">{t('nav.contact')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/preguntas-frecuentes">{t('nav.faqs')}</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/terminos-y-condiciones">{t('nav.terms')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/politica-de-privacidad">{t('nav.privacy')}</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav className="align-items-center w-100">
            {isAuthenticated ? (
              <>
                {user?.username && (
                  <Nav.Link
                    onClick={() => setShowUserMenu(true)}
                    role="button"
                    className="me-3 ms-auto d-none d-lg-block"
                  >
                    <AnimatedHover>
                      <i className="fas fa-user me-2"></i>
                      {user?.name || user?.username}
                    </AnimatedHover>
                  </Nav.Link>
                )}
                {user?.username && (
                  <Nav.Link
                    onClick={() => setShowUserMenu(true)}
                    role="button"
                    className="mx-auto d-block d-lg-none"
                  >
                    <i className="fas fa-user me-2"></i>
                    {user?.name || user?.username}
                  </Nav.Link>
                )}

                {/* Offcanvas del usuario: contiene los demás botones, excepto notificaciones */}
                <Offcanvas show={showUserMenu} onHide={() => setShowUserMenu(false)} placement="end" backdrop data-bs-theme="dark">
                  <Offcanvas.Header closeButton>
                    <Offcanvas.Title>
                      <i className="fas fa-user me-2"></i>
                      {user?.name || user?.username}
                    </Offcanvas.Title>
                  </Offcanvas.Header>
                  <Offcanvas.Body>
                    <AnimatePresence mode="wait">
                      {showUserMenu && (
                        <motion.div
                          key="user-menu"
                          initial={fadeIn.initial}
                          animate={fadeIn.animate}
                          exit={fadeIn.exit}
                          transition={{ duration: 0.25 }}
                        >
                          <Nav className="flex-column">
                            <Nav.Link as={Link} to={`/u/${user?.username}`} onClick={() => setShowUserMenu(false)}>
                              <AnimatedHover>
                                <i className="fas fa-id-card me-2"></i>{t('nav.my_profile')}
                              </AnimatedHover>
                            </Nav.Link>
                            {(hasRole('creator') || hasRole('admin')) && (
                              <Nav.Link as={Link} to="/mis-galerias" onClick={() => setShowUserMenu(false)}>
                                <AnimatedHover>
                                  <i className="fas fa-images me-2"></i>{t('nav.my_galleries')}
                                </AnimatedHover>
                              </Nav.Link>
                            )}
                            {(hasRole('admin') || hasRole('super_admin') || hasRole('moderator')) ? (
                              <Nav.Link href={adminUrl} target="_blank" rel="noopener noreferrer" onClick={() => setShowUserMenu(false)}>
                                <AnimatedHover>
                                  <i className="fas fa-cog me-2"></i>{t('nav.admin_panel')}
                                </AnimatedHover>
                              </Nav.Link>
                            ) : (
                              user?.email_verified_at && (
                                <Nav.Link as={Link} to="/tickets" onClick={() => setShowUserMenu(false)}>
                                  <AnimatedHover>
                                    <i className="fas fa-ticket me-2"></i>{t('nav.tickets')}
                                  </AnimatedHover>
                                </Nav.Link>
                              )
                            )}
                          </Nav>
                          <LanguageSwitcher />
                          <div className="mt-3">
                            <Button variant="outline-danger" className="w-100" onClick={() => { setShowUserMenu(false); handleLogout(); }}>
                              <AnimatedHover>
                                <i className="fa-solid fa-person-hiking"></i> {t('nav.logout')}
                              </AnimatedHover>
                            </Button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Offcanvas.Body>
                </Offcanvas>

                {/* Campana al extremo derecho (se mantiene fuera del offcanvas) */}
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="text-white position-relative p-0 border-0" style={{ background: 'none' }}>
                    <AnimatedHover>
                      <i className="fas fa-bell fa-lg"></i>
                    </AnimatedHover>
                    {unreadCount > 0 && (
                      <Badge
                        pill
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.7rem' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    {vipUnreadCount > 0 && (
                      <Badge
                        pill
                        bg="warning"
                        text="dark"
                        className="position-absolute top-100 start-100 translate-middle"
                        style={{ fontSize: '0.65rem' }}
                      >
                        VIP {vipUnreadCount > 99 ? '99+' : vipUnreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
                    <Dropdown.Header><i className="fa-solid fa-inbox"></i> {t('nav.notifications')}</Dropdown.Header>
                    {notifications.length === 0 ? (
                      <Dropdown.Item disabled className="text-muted">
                        <i className="fa-solid fa-heart-crack"></i> {t('nav.no_notifications')}
                      </Dropdown.Item>
                    ) : (
                      <>
                        {notifications.map((notif) => (
                          <motion.div
                            key={notif.id}
                            className={`dropdown-item ${!notif.read_at ? 'bg-light' : ''} py-2 position-relative`}
                            style={{
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              paddingRight: '35px',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.08 }}
                          >
                            <div
                              className="d-flex align-items-start"
                              onClick={() => {
                                if (!notif.read_at) handleMarkAsRead(notif.id);
                                if (notif.url) navigate(notif.url);
                              }}
                            >
                              <div className="flex-grow-1">
                                <strong className="d-block" style={{ fontSize: '0.9rem' }}>
                                  {notif.type === 'vip_user_message' && (
                                    <i className="fas fa-crown text-warning me-1"></i>
                                  )}
                                  {truncateText(notif.title, 50)}
                                </strong>
                                <small className="text-muted d-block" style={{ fontSize: '0.8rem' }}>
                                  {truncateText(notif.message, 45)}
                                </small>
                              </div>
                              {!notif.read_at && (
                                <Badge bg="primary" pill className="ms-2" style={{ fontSize: '0.65rem' }}>
                                  {t('notifications.new')}
                                </Badge>
                              )}

                            </div>
                            <button
                              onClick={(e) => handleDismissNotification(e, notif.id)}
                              className="position-absolute top-50 end-0 translate-middle-y btn btn-link text-muted p-0 me-2"
                              style={{
                                fontSize: '1.1rem',
                                width: '24px',
                                height: '24px',
                                lineHeight: '1',
                                zIndex: 10
                              }}
                              title={t('notifications.mark_read')}
                              type="button"
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </motion.div>
                        ))}
                        <Dropdown.Divider />
                        <Dropdown.Item as={Link} to="/notificaciones" className="text-center text-primary">
                          {t('nav.view_all_notifications')}
                        </Dropdown.Item>
                      </>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </>
            ) : (
              <>
                <Nav.Link className='ms-auto' as={Link} to="/login">{t('nav.login')}</Nav.Link>
                <Nav.Link href="/register">{t('nav.register')}</Nav.Link>
                <LanguageSwitcher />
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>

      {/* Toast Notification */}
      <ToastContainer position="top-end" className="p-3" style={{ zIndex: 9999, position: 'fixed' }}>
        <Toast onClose={() => setShowToast(false)} show={showToast} delay={5000} autohide bg="light">
          <Toast.Header>
            <strong className="me-auto"><i className="fas fa-bell text-primary me-2"></i>{toastNotification?.title || t('notifications.new_notification')}</strong>
            <small>{t('notifications.now')}</small>
          </Toast.Header>
          <Toast.Body
            style={{ cursor: toastNotification?.url ? 'pointer' : 'default' }}
            onClick={() => {
              if (toastNotification?.url) {
                navigate(toastNotification.url);
                setShowToast(false);
              }
            }}
          >
            {toastNotification?.message}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </Navbar>
  );
};

export default Navigation;
