import React from 'react';
import { Navbar, Nav, Container, NavDropdown, Badge, Dropdown, Offcanvas, Toast, ToastContainer } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import AnimatedHover from './AnimatedHover';
import { fadeIn, appleEase } from '../lib/animations';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { initEcho, getEcho } from '../lib/echo';
import LanguageSwitcher from './LanguageSwitcher';
import ThemeSwitcher from './ThemeSwitcher';

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
    <Navbar expand="lg" className="apple-liquid-glass-nav py-2">
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
          <Nav className="me-auto align-items-center">
            <Nav.Link as={Link} to="/explorar" className="apple-tab-link">
              <AnimatedHover className="apple-tab-content">
                <i className="fa-solid fa-person-dress apple-tab-icon"></i>
                <span className="apple-tab-label">{t('nav.explore')}</span>
              </AnimatedHover>
            </Nav.Link>
            <NavDropdown
              className="apple-tab-dropdown"
              title={
                <AnimatedHover className="apple-tab-content">
                  <i className="fas fa-mug-hot apple-tab-icon"></i>
                  <span className="apple-tab-label">
                    {t('nav.cafes')}
                    <i className="fas fa-chevron-down apple-tab-caret ms-1"></i>
                  </span>
                </AnimatedHover>
              }
              id="cafes-dropdown"
            >
              <NavDropdown.Item as={Link} to="/cafes">{t('nav.cafes')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/sugerir-cafe">{t('nav.suggest_cafe')}</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link as={Link} to="/ranking" className="apple-tab-link">
              <AnimatedHover className="apple-tab-content">
                <i className="fas fa-trophy apple-tab-icon"></i>
                <span className="apple-tab-label">{t('nav.ranking')}</span>
              </AnimatedHover>
            </Nav.Link>
            <NavDropdown
              className="apple-tab-dropdown"
              title={
                <AnimatedHover className="apple-tab-content">
                  <i className="fas fa-info-circle apple-tab-icon"></i>
                  <span className="apple-tab-label">
                    {t('nav.info')}
                    <i className="fas fa-chevron-down apple-tab-caret ms-1"></i>
                  </span>
                </AnimatedHover>
              }
              id="info-dropdown"
            >
              <NavDropdown.Item as={Link} to="/contacto">{t('nav.contact')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/preguntas-frecuentes">{t('nav.faqs')}</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item as={Link} to="/terminos-y-condiciones">{t('nav.terms')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/politica-de-privacidad">{t('nav.privacy')}</NavDropdown.Item>
              <NavDropdown.Item as={Link} to="/privacidad-datos">{t('nav.arcop_rights', 'Derechos ARCOP & Datos')}</NavDropdown.Item>
            </NavDropdown>
          </Nav>
          <Nav className="align-items-center w-100">
            {isAuthenticated ? (
              <>
                {user?.username && (
                  <div
                    onClick={() => setShowUserMenu(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowUserMenu(true); }}
                    className="apple-nav-user-pill me-3 ms-auto d-none d-lg-inline-flex"
                    aria-label={t('nav.my_profile')}
                  >
                    {user?.avatar_thumb || user?.avatar_url ? (
                      <img
                        src={user.avatar_thumb || user.avatar_url}
                        alt={user.name || user.username}
                        className="apple-nav-user-mini-avatar"
                      />
                    ) : (
                      <div className="apple-nav-user-mini-avatar">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    <span>{user?.name || user?.username}</span>
                    <i className="fas fa-chevron-down ms-1" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
                  </div>
                )}
                {user?.username && (
                  <div
                    onClick={() => setShowUserMenu(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setShowUserMenu(true); }}
                    className="apple-nav-user-pill mx-auto my-2 d-inline-flex d-lg-none"
                    aria-label={t('nav.my_profile')}
                  >
                    {user?.avatar_thumb || user?.avatar_url ? (
                      <img
                        src={user.avatar_thumb || user.avatar_url}
                        alt={user.name || user.username}
                        className="apple-nav-user-mini-avatar"
                      />
                    ) : (
                      <div className="apple-nav-user-mini-avatar">
                        <i className="fas fa-user"></i>
                      </div>
                    )}
                    <span>{user?.name || user?.username}</span>
                    <i className="fas fa-chevron-down ms-1" style={{ fontSize: '0.7rem', opacity: 0.6 }}></i>
                  </div>
                )}

                {/* Offcanvas del usuario: Rediseño Apple HIG 2026 */}
                <Offcanvas
                  show={showUserMenu}
                  onHide={() => setShowUserMenu(false)}
                  placement="end"
                  backdrop
                  className="apple-liquid-glass-offcanvas"
                >
                  <Offcanvas.Header className="apple-offcanvas-header">
                    <span className="apple-offcanvas-kicker">
                      <i className="fas fa-fingerprint"></i>
                      {t('nav.account_section')}
                    </span>
                    <button
                      type="button"
                      className="apple-offcanvas-close-btn"
                      onClick={() => setShowUserMenu(false)}
                      aria-label="Cerrar"
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </Offcanvas.Header>
                  <Offcanvas.Body className="apple-offcanvas-body">
                    <AnimatePresence mode="wait">
                      {showUserMenu && (
                        <motion.div
                          key="user-menu-content"
                          initial={fadeIn.initial}
                          animate={fadeIn.animate}
                          exit={fadeIn.exit}
                          transition={{ duration: 0.22, ease: appleEase }}
                          className="d-flex flex-column gap-3"
                        >
                          {/* Tarjeta Hero de Identidad de Usuario */}
                          <Link
                            to={`/u/${user?.username}`}
                            onClick={() => setShowUserMenu(false)}
                            className="apple-offcanvas-user-card"
                            title={t('nav.view_profile')}
                          >
                            <div className="apple-offcanvas-avatar-wrapper">
                              {user?.avatar_thumb || user?.avatar_url ? (
                                <img
                                  src={user.avatar_thumb || user.avatar_url}
                                  alt={user.name || user.username}
                                  className="apple-offcanvas-avatar"
                                />
                              ) : (
                                <div className="apple-offcanvas-avatar">
                                  <i className="fas fa-user"></i>
                                </div>
                              )}
                              {user?.is_verified && (
                                <div className="apple-offcanvas-verified-badge" title="Verificado">
                                  <i className="fas fa-check"></i>
                                </div>
                              )}
                            </div>
                            <div className="apple-offcanvas-user-info">
                              <div className="apple-offcanvas-user-name">
                                {user?.name || user?.username}
                              </div>
                              <div className="apple-offcanvas-user-handle">
                                @{user?.username}
                              </div>
                              <div className="apple-offcanvas-badges-row">
                                {(hasRole('admin') || hasRole('super_admin')) && (
                                  <span className="apple-offcanvas-role-pill role-admin">
                                    <i className="fas fa-shield-halved"></i>
                                    {t('nav.role_admin')}
                                  </span>
                                )}
                                {hasRole('creator') && (
                                  <span className="apple-offcanvas-role-pill role-creator">
                                    <i className="fas fa-wand-magic-sparkles"></i>
                                    {t('nav.role_creator')}
                                  </span>
                                )}
                                {hasRole('vip') && (
                                  <span className="apple-offcanvas-role-pill role-vip">
                                    <i className="fas fa-crown"></i>
                                    {t('nav.role_vip')}
                                  </span>
                                )}
                              </div>
                            </div>
                            <i className="fas fa-chevron-right apple-offcanvas-view-profile-arrow"></i>
                          </Link>

                          {/* Sección 1: Mi Cuenta */}
                          <div className="apple-offcanvas-section">
                            <span className="apple-offcanvas-section-title">
                              {t('nav.account_section')}
                            </span>
                            <div className="apple-offcanvas-inset-group">
                              <Link
                                to={`/u/${user?.username}`}
                                className="apple-offcanvas-row"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-blue">
                                    <i className="fas fa-id-card"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.my_profile')}
                                  </span>
                                </div>
                                <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                              </Link>

                              <Link
                                to="/perfil/editar"
                                className="apple-offcanvas-row"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-teal">
                                    <i className="fas fa-user-pen"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.edit_profile')}
                                  </span>
                                </div>
                                <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                              </Link>

                              {(hasRole('creator') || hasRole('admin')) && (
                                <>
                                  <Link
                                    to="/mis-galerias"
                                    className="apple-offcanvas-row"
                                    onClick={() => setShowUserMenu(false)}
                                  >
                                    <div className="apple-offcanvas-row-left">
                                      <div className="apple-offcanvas-icon-plate icon-plate-purple">
                                        <i className="fas fa-images"></i>
                                      </div>
                                      <span className="apple-offcanvas-row-label">
                                        {t('nav.my_galleries')}
                                      </span>
                                    </div>
                                    <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                                  </Link>

                                  <Link
                                    to="/mis-galerias/nueva"
                                    className="apple-offcanvas-row"
                                    onClick={() => setShowUserMenu(false)}
                                  >
                                    <div className="apple-offcanvas-row-left">
                                      <div className="apple-offcanvas-icon-plate icon-plate-rose">
                                        <i className="fas fa-plus"></i>
                                      </div>
                                      <span className="apple-offcanvas-row-label">
                                        {t('nav.new_gallery')}
                                      </span>
                                    </div>
                                    <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                                  </Link>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Sección 2: Gestión & Soporte */}
                          <div className="apple-offcanvas-section">
                            <span className="apple-offcanvas-section-title">
                              {t('nav.management_section')}
                            </span>
                            <div className="apple-offcanvas-inset-group">
                              <Link
                                to="/notificaciones"
                                className="apple-offcanvas-row"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-orange">
                                    <i className="fas fa-bell"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.notifications')}
                                  </span>
                                </div>
                                <div className="apple-offcanvas-row-right">
                                  {unreadCount > 0 && (
                                    <Badge bg="danger" pill style={{ fontSize: '0.72rem' }}>
                                      {unreadCount > 99 ? '99+' : unreadCount}
                                    </Badge>
                                  )}
                                  <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                                </div>
                              </Link>

                              {(hasRole('admin') || hasRole('super_admin') || hasRole('moderator')) ? (
                                <a
                                  href={adminUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="apple-offcanvas-row"
                                  onClick={() => setShowUserMenu(false)}
                                >
                                  <div className="apple-offcanvas-row-left">
                                    <div className="apple-offcanvas-icon-plate icon-plate-slate">
                                      <i className="fas fa-shield-halved"></i>
                                    </div>
                                    <span className="apple-offcanvas-row-label">
                                      {t('nav.admin_panel')}
                                    </span>
                                  </div>
                                  <i className="fas fa-arrow-up-right-from-square apple-offcanvas-chevron"></i>
                                </a>
                              ) : (
                                user?.email_verified_at && (
                                  <Link
                                    to="/tickets"
                                    className="apple-offcanvas-row"
                                    onClick={() => setShowUserMenu(false)}
                                  >
                                    <div className="apple-offcanvas-row-left">
                                      <div className="apple-offcanvas-icon-plate icon-plate-emerald">
                                        <i className="fas fa-ticket"></i>
                                      </div>
                                      <span className="apple-offcanvas-row-label">
                                        {t('nav.tickets')}
                                      </span>
                                    </div>
                                    <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                                  </Link>
                                )
                              )}

                              <Link
                                to="/privacidad-datos"
                                className="apple-offcanvas-row"
                                onClick={() => setShowUserMenu(false)}
                              >
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-indigo">
                                    <i className="fas fa-shield-halved"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.arcop_rights', 'Privacidad & ARCOP')}
                                  </span>
                                </div>
                                <i className="fas fa-chevron-right apple-offcanvas-chevron"></i>
                              </Link>
                            </div>
                          </div>

                          {/* Sección 3: Preferencias */}
                          <div className="apple-offcanvas-section">
                            <span className="apple-offcanvas-section-title">
                              {t('nav.preferences_section')}
                            </span>
                            <div className="apple-offcanvas-inset-group">
                              <div className="apple-offcanvas-pref-row position-relative">
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-indigo">
                                    <i className="fas fa-globe"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.language')}
                                  </span>
                                </div>
                                <LanguageSwitcher />
                              </div>
                              <div className="apple-offcanvas-pref-row position-relative">
                                <div className="apple-offcanvas-row-left">
                                  <div className="apple-offcanvas-icon-plate icon-plate-teal">
                                    <i className="fas fa-circle-half-stroke"></i>
                                  </div>
                                  <span className="apple-offcanvas-row-label">
                                    {t('nav.appearance')}
                                  </span>
                                </div>
                                <ThemeSwitcher inline showLabel={false} />
                              </div>
                            </div>
                          </div>

                          {/* Botón de Cierre de Sesión Tactil Sólido */}
                          <div className="pt-2">
                            <button
                              type="button"
                              className="apple-offcanvas-logout-btn"
                              onClick={() => {
                                setShowUserMenu(false);
                                handleLogout();
                              }}
                            >
                              <i className="fa-solid fa-arrow-right-from-bracket"></i>
                              <span>{t('nav.logout')}</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Offcanvas.Body>
                </Offcanvas>

                <ThemeSwitcher inline className="me-2" />

                {/* Campana al extremo derecho (se mantiene fuera del offcanvas) */}
                <Dropdown align="end">
                  <Dropdown.Toggle variant="link" className="text-reset position-relative p-0 border-0 d-inline-flex align-items-center justify-content-center" style={{ background: 'none', width: '44px', height: '44px' }} aria-label={t('nav.notifications')}>
                    <AnimatedHover>
                      <i className="fas fa-bell fa-lg"></i>
                    </AnimatedHover>
                    {unreadCount > 0 && (
                      <Badge
                        pill
                        bg="danger"
                        className="position-absolute top-0 start-100 translate-middle"
                        style={{ fontSize: '0.75rem' }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                    {vipUnreadCount > 0 && (
                      <Badge
                        pill
                        bg="warning"
                        text="dark"
                        className="position-absolute top-100 start-100 translate-middle fw-bold"
                        style={{ fontSize: '0.75rem' }}
                      >
                        VIP {vipUnreadCount > 99 ? '99+' : vipUnreadCount}
                      </Badge>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="apple-liquid-glass-dropdown" style={{ minWidth: '320px', maxHeight: '400px', overflowY: 'auto' }}>
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
                            className={`dropdown-item ${!notif.read_at ? 'bg-primary-subtle' : ''} py-2 position-relative`}
                            style={{
                              whiteSpace: 'normal',
                              wordWrap: 'break-word',
                              paddingRight: '48px',
                              cursor: 'pointer'
                            }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ duration: 0.16, ease: appleEase }}
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
                                <Badge bg="primary" pill className="ms-2" style={{ fontSize: '0.75rem' }}>
                                  {t('notifications.new')}
                                </Badge>
                              )}

                            </div>
                            <button
                              onClick={(e) => handleDismissNotification(e, notif.id)}
                              className="position-absolute top-50 end-0 translate-middle-y btn btn-link text-muted d-flex align-items-center justify-content-center p-0 me-1"
                              style={{
                                fontSize: '1.1rem',
                                width: '44px',
                                height: '44px',
                                zIndex: 10
                              }}
                              title={t('notifications.mark_read')}
                              aria-label={t('notifications.mark_read')}
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
                <ThemeSwitcher inline className="ms-2" />
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
