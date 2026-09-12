import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Badge, Button, Spinner, Alert, OverlayTrigger, Tooltip, ListGroup, Modal, Form, InputGroup, Pagination } from 'react-bootstrap';
import { motion } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { useTranslation } from 'react-i18next';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { mutations } from '../lib/graphql/mutations';
import { useAuth } from '../contexts/AuthContext';
import { getCountryDisplay } from '../lib/countryUtils.ts';
import type { User, SiteSettings, Tag, Link as UserLink } from '../types';
import { createRoot } from 'react-dom/client';
import OptimizedImage from '../components/OptimizedImage';
import VerifiedBadge from '../components/VerifiedBadge';
import LikeButton from '../components/LikeButton';
import { BACKEND_URL } from '../config/constants';

interface FollowNotice {
  variant: 'success' | 'danger' | 'info';
  text: string;
}

interface SettingsWithQR extends SiteSettings {
  qr_logo_size?: number;
  logo?: string;
}

export default function UserProfile({ section = 'profile' as 'profile' | 'galleries' }) {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'galleries'>(section);

  const [user, setUser] = useState<User | null>(null);
  const [defaultAvatar, setDefaultAvatar] = useState<string>('');
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [qrLogoSize, setQrLogoSize] = useState<number>(48);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [following, setFollowing] = useState<boolean>(false);
  const [followLoading, setFollowLoading] = useState<boolean>(false);
  const [followNotice, setFollowNotice] = useState<FollowNotice | null>(null);
  const [vipBadgeLabel, setVipBadgeLabel] = useState<string | null>(null);
  const [vipBadgeIcon, setVipBadgeIcon] = useState<string | null>(null);
  const [showFollowingModal, setShowFollowingModal] = useState<boolean>(false);
  const [showVipMessageModal, setShowVipMessageModal] = useState<boolean>(false);
  const [vipMessage, setVipMessage] = useState<string>('');
  const [vipMessageSending, setVipMessageSending] = useState<boolean>(false);
  const [vipMessageStatus, setVipMessageStatus] = useState<{ variant: 'success' | 'danger'; text: string } | null>(null);
  const [followingUsers, setFollowingUsers] = useState<User[]>([]);
  const [loadingFollowing, setLoadingFollowing] = useState<boolean>(false);
  const [followingPage, setFollowingPage] = useState<number>(1);
  const [followingTotalPages, setFollowingTotalPages] = useState<number>(1);
  const [followingTotal, setFollowingTotal] = useState<number>(0);
  const [followingSearch, setFollowingSearch] = useState<string>('');
  const [followingSearchInput, setFollowingSearchInput] = useState<string>('');
  const [followingSelectedTag, setFollowingSelectedTag] = useState<string>('');
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const QR_DISPLAY_SIZE = 200;
  const DOWNLOAD_QR_SIZE = 800;

  const { i18n } = useTranslation();
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    Promise.all([
      graphqlRequest<{ user: User | null }>({ query: queries.userByUsername, variables: { username } }),
      graphqlRequest<{ siteSettings: SettingsWithQR }>({ query: queries.siteSettings }),
      graphqlRequest<{ tags: Tag[] }>({
        query: `
          query {
            tags {
              id
              name
              name_en
              color
              icon
              weight
            }
          }
        `,
        schema: 'public',
      }),
    ])
      .then(([data, settings, tagsData]) => {
        if (!isMounted) return;
        if (!data.user) {
          setError(t('profile.user_not_found'));
          setUser(null);
        } else {
          setUser(data.user);
          setFollowing(Boolean((data.user as any).is_following));
        }

        // Cargar tags disponibles
        if (tagsData?.tags) {
          setAvailableTags(tagsData.tags);
        }

        const defA = settings?.siteSettings?.default_avatar_url;
        if (defA) setDefaultAvatar(defA);
        const logoRaw = settings?.siteSettings?.logo_url || (settings?.siteSettings as any)?.logo;
        if (logoRaw) {
          try {
            const backendBase = String((import.meta as any).env?.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
            const u = new URL(String(logoRaw), backendBase);
            const absolute = `${backendBase}${u.pathname}${u.search}`;
            setSiteLogo(absolute);
          } catch {
            setSiteLogo(String(logoRaw));
          }
        }
        const qls = (settings?.siteSettings as SettingsWithQR)?.qr_logo_size;
        if (typeof qls === 'number' && qls > 0) {
          const clamped = Math.max(24, Math.min(96, qls));
          setQrLogoSize(clamped);
        }
        setVipBadgeLabel((settings?.siteSettings as any)?.vip_badge_label ?? null);
        setVipBadgeIcon((settings?.siteSettings as any)?.vip_badge_icon ?? null);
      })
      .catch((e: any) => {
        if (!isMounted) return;
        setError(e?.message || t('profile.error_loading'));
      })
      .finally(() => {
        if (!isMounted) return;
        setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [username]);

  // Nota: QRCodeCanvas ya soporta imageSettings; no dibujamos manualmente sobre el canvas
  useEffect(() => {
    return;
  }, [siteLogo, qrLogoSize, (user as any)?.has_public_profile, (user as any)?.username]);

  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      if (!siteLogo) {
        setLogoDataUrl(null);
        return;
      }
      try {
        const res = await fetch(siteLogo);
        if (!res.ok) throw new Error('logo fetch failed');
        const blob = await res.blob();
        const reader = new FileReader();
        const dataUrl: string = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(String(reader.result || ''));
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        if (!cancelled) setLogoDataUrl(dataUrl);
      } catch {
        if (!cancelled) setLogoDataUrl(null);
      }
    };
    loadLogo();
    return () => { cancelled = true; };
  }, [siteLogo]);

  const handleDownloadQr = async () => {
    if (!user) return;
    const profileUrl = `${window.location.origin}/u/${user.username}`;
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    document.body.appendChild(container);
    const root = createRoot(container);
    const frac = qrLogoSize / QR_DISPLAY_SIZE;
    const logoDlSize = Math.max(24, Math.round(DOWNLOAD_QR_SIZE * frac));
    root.render(
      <QRCodeCanvas
        value={profileUrl}
        size={DOWNLOAD_QR_SIZE}
        level="H"
        includeMargin={false}
      />
    );
    let downloaded = false;
    for (let i = 0; i < 6 && !downloaded; i++) {
      await new Promise((r) => setTimeout(r, 80));
      try {
        const offCanvas = container.querySelector('canvas') as HTMLCanvasElement | null;
        if (!offCanvas) continue;
        if (logoDataUrl || siteLogo) {
          try {
            const ctx = offCanvas.getContext('2d');
            if (ctx) {
              const img = new Image();
              if (!logoDataUrl) img.crossOrigin = 'anonymous';
              img.src = logoDataUrl || siteLogo!;
              await new Promise((resolve, reject) => { img.onload = resolve as any; img.onerror = reject; });
              const x = Math.round((offCanvas.width - logoDlSize) / 2);
              const y = Math.round((offCanvas.height - logoDlSize) / 2);
              ctx.drawImage(img, x, y, logoDlSize, logoDlSize);
            }
          } catch {}
        }
        const a = document.createElement('a');
        a.href = offCanvas.toDataURL('image/png');
        a.download = `qr-${user.username}@${DOWNLOAD_QR_SIZE}.png`;
        a.click();
        downloaded = true;
      } catch {
        downloaded = false;
      }
    }
    if (!downloaded) {
      const visible = qrCanvasRef.current;
      if (visible) {
        try {
          if (logoDataUrl || siteLogo) {
            try {
              const ctxV = visible.getContext('2d');
              if (ctxV) {
                const imgV = new Image();
                if (!logoDataUrl) imgV.crossOrigin = 'anonymous';
                imgV.src = logoDataUrl || siteLogo!;
                await new Promise((resolve, reject) => { imgV.onload = resolve as any; imgV.onerror = reject; });
                const fracV = qrLogoSize / QR_DISPLAY_SIZE;
                const sizeV = Math.max(24, Math.round(visible.width * fracV));
                const xV = Math.round((visible.width - sizeV) / 2);
                const yV = Math.round((visible.height - sizeV) / 2);
                ctxV.drawImage(imgV, xV, yV, sizeV, sizeV);
              }
            } catch {}
          }
          const a = document.createElement('a');
          a.href = visible.toDataURL('image/png');
          a.download = `qr-${user.username}.png`;
          a.click();
        } catch { }
      }
    }
    try {
      root.unmount();
    } catch { }
    document.body.removeChild(container);
  };

  const normalizeFA = (icon?: string | null): string | null => {
    return icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  };

  const handleFollow = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!user) return;
    setFollowLoading(true);
    try {
      const mutation = following
        ? `
        mutation {
          unfollowUser(user_id: ${user.id}) {
            id
            followers_count
          }
        }
      `
        : `
        mutation {
          followUser(user_id: ${user.id}) {
            id
            followers_count
          }
        }
      `;

      const data = await graphqlRequest<any>({
        query: mutation,
        schema: 'default',
        authenticated: true,
      });

      setFollowing(!following);

      const mutationKey = following ? 'unfollowUser' : 'followUser';
      if (data && data[mutationKey]) {
        setUser((prev) =>
          prev
            ? {
              ...prev,
              followers_count: data[mutationKey].followers_count,
            }
            : prev
        );
      } else {
        setUser((prev) =>
          prev
            ? {
              ...prev,
              followers_count: following
                ? Math.max(0, (prev.followers_count || 0) - 1)
                : (prev.followers_count || 0) + 1,
            }
            : prev
        );
      }

      setFollowNotice({
        variant: 'success',
        text: !following ? `${t('profile.follow_now')} @${user.username}.` : `${t('profile.unfollow_now')} @${user.username}.`,
      });
      setTimeout(() => setFollowNotice(null), 3000);
    } catch (error: any) {
      setFollowNotice({ variant: 'danger', text: error?.message || t('profile.error_follow') });
      setTimeout(() => setFollowNotice(null), 4000);
      setFollowing(following);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleTabChange = (tab: 'profile' | 'galleries') => {
    setActiveTab(tab);
    navigate(`/u/${username}${tab !== 'profile' ? `/${tab}` : ''}`);
  };

  const handleSendVipMessage = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!isAuthenticated || !currentUser || !user) {
      setVipMessageStatus({ variant: 'danger', text: 'Debes iniciar sesion para enviar mensajes VIP.' });

      return;
    }

    const cleanedMessage = vipMessage.trim();
    if (cleanedMessage.length < 3) {
      setVipMessageStatus({ variant: 'danger', text: 'El mensaje debe tener al menos 3 caracteres.' });

      return;
    }

    setVipMessageSending(true);
    setVipMessageStatus(null);

    try {
      await graphqlRequest({
        query: mutations.sendVipNotification,
        variables: {
          recipientId: user.id,
          message: cleanedMessage,
          title: `Mensaje VIP de @${currentUser.username}`,
          url: `/u/${currentUser.username}`,
        },
        schema: 'default',
        authenticated: true,
      });

      setVipMessageStatus({ variant: 'success', text: 'Mensaje VIP enviado correctamente.' });
      setVipMessage('');
    } catch (error: any) {
      setVipMessageStatus({ variant: 'danger', text: error?.message || 'No se pudo enviar el mensaje VIP.' });
    } finally {
      setVipMessageSending(false);
    }
  };

  const loadFollowing = async (page: number = 1, search: string = '', tag: string = '') => {
    if (!user) return;
    setLoadingFollowing(true);

    try {
      const data = await graphqlRequest<{
        following: {
          data: User[],
          paginatorInfo: {
            currentPage: number,
            lastPage: number,
            total: number
          }
        }
      }>({
        query: queries.following,
        variables: {
          user_id: user.id,
          page,
          per_page: 20,
          search: search || undefined,
          tag: tag || undefined
        },
        schema: 'default',
        authenticated: true,
      });

      setFollowingUsers(data.following?.data || []);
      setFollowingPage(data.following?.paginatorInfo?.currentPage || 1);
      setFollowingTotalPages(data.following?.paginatorInfo?.lastPage || 1);
      setFollowingTotal(data.following?.paginatorInfo?.total || 0);
    } catch (error: any) {
      setFollowingUsers([]);
      setFollowingTotalPages(1);
      setFollowingTotal(0);
    } finally {
      setLoadingFollowing(false);
    }
  };

  const handleShowFollowing = async () => {
    setShowFollowingModal(true);
    setFollowingPage(1);
    setFollowingSearch('');
    setFollowingSearchInput('');
    setFollowingSelectedTag('');
    await loadFollowing(1, '', '');
  };

  const handleFollowingPageChange = (page: number) => {
    setFollowingPage(page);
    loadFollowing(page, followingSearch, followingSelectedTag);
  };

  const handleFollowingSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFollowingSearch(followingSearchInput);
    setFollowingPage(1);
    loadFollowing(1, followingSearchInput, followingSelectedTag);
  };

  const handleFollowingTagChange = (tagName: string) => {
    setFollowingSelectedTag(tagName);
    setFollowingPage(1);
    loadFollowing(1, followingSearch, tagName);
  };

  if (loading) {
    return (
      <Container className="profile-page-container py-4" aria-busy="true" aria-live="polite">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} xl={7}>
            {/* Segmented Control Skeleton */}
            <div className="profile-segmented-control mb-4">
              <div className="profile-segment-btn apple-skeleton" style={{ height: '44px' }} />
              <div className="profile-segment-btn apple-skeleton" style={{ height: '44px' }} />
            </div>

            {/* Profile Inset Card Skeleton */}
            <div className="apple-skeleton-card text-center p-4 p-md-5">
              {/* Avatar 150px */}
              <div
                className="apple-skeleton rounded-circle mx-auto mb-3"
                style={{ width: '150px', height: '150px', border: '3px solid rgba(255,255,255,0.2)' }}
              />

              {/* Name & Handle */}
              <div className="apple-skeleton apple-skeleton-text mx-auto mb-2" style={{ width: '180px', height: '26px' }} />
              <div className="apple-skeleton apple-skeleton-text mx-auto mb-3" style={{ width: '100px', height: '16px' }} />

              {/* Bio */}
              <div className="d-flex flex-column align-items-center gap-1 mb-4">
                <div className="apple-skeleton apple-skeleton-text w-75" style={{ height: '14px' }} />
                <div className="apple-skeleton apple-skeleton-text w-50" style={{ height: '14px' }} />
              </div>

              {/* Actions row */}
              <div className="d-flex justify-content-center gap-2 mb-4">
                <div className="apple-skeleton rounded-pill" style={{ width: '120px', height: '44px' }} />
                <div className="apple-skeleton rounded-pill" style={{ width: '44px', height: '44px' }} />
                <div className="apple-skeleton rounded-pill" style={{ width: '44px', height: '44px' }} />
              </div>

              {/* Counters row */}
              <div className="d-flex justify-content-center gap-4 py-3 mb-4 border-top border-bottom">
                <div className="apple-skeleton rounded-pill" style={{ width: '90px', height: '24px' }} />
                <div className="apple-skeleton rounded-pill" style={{ width: '90px', height: '24px' }} />
                <div className="apple-skeleton rounded-pill" style={{ width: '90px', height: '24px' }} />
              </div>

              {/* Links list skeletons */}
              <div className="d-flex flex-column gap-2">
                <div className="apple-skeleton rounded-xl" style={{ width: '100%', height: '52px' }} />
                <div className="apple-skeleton rounded-xl" style={{ width: '100%', height: '52px' }} />
                <div className="apple-skeleton rounded-xl" style={{ width: '100%', height: '52px' }} />
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-4">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">{t('profile.user_not_found')}</Alert>
      </Container>
    );
  }

  // URLs para el avatar - usar conversión 'avatar' completa (500x500) en el perfil
  const avatarWebp = (user as any).avatar_webp || (user as any).avatar_thumb_webp;
  const smallWebp = (user as any).avatar_small_webp;
  const mediumWebp = (user as any).avatar_medium_webp;
  const avatarFallback = user.avatar_url || (user as any).avatar_thumb || defaultAvatar;
  const profileUrl = `${window.location.origin}/u/${user.username}`;
  const price = typeof user.price_from === 'number' ? user.price_from : (user.price_from ? Number(user.price_from) : null);
  const priceStr = price != null && !Number.isNaN(price) ? `$${price.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : null;
  const birthDateStr = user.birth_date ? new Date(user.birth_date).toLocaleDateString('es-CL') : null;
  const ageYears = (() => {
    if (!user.birth_date) return null;
    const bd = new Date(user.birth_date);
    if (Number.isNaN(bd.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
    return a;
  })();
  const genderFull = user.gender ? (user.gender.charAt(0).toUpperCase() + user.gender.slice(1)) : null;
  const genderIcon = (() => {
    const g = (user.gender || '').toLowerCase();
    if (g === 'hombre') return 'fas fa-mars';
    if (g === 'mujer') return 'fas fa-venus';
    if (g === 'trans') return 'fas fa-transgender';
    if (g === 'otro') return 'fas fa-genderless';
    return null;
  })();

  const profileRoles: string[] = Array.isArray((user as any)?.roles)
    ? (user as any).roles.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];
  const isProfileCreator = profileRoles.includes('creator');
  const isProfileCreatorOrAdmin = isProfileCreator || profileRoles.includes('admin');
  const viewerRoles: string[] = Array.isArray((currentUser as any)?.roles)
    ? (currentUser as any).roles.map((r: any) => (typeof r === 'string' ? r : r?.name)).filter(Boolean)
    : [];
  const isAdminOrModeratorViewer = viewerRoles.includes('admin') || viewerRoles.includes('super_admin') || viewerRoles.includes('moderator');
  const isOwnProfile = Boolean(currentUser && user && (currentUser as any).id === (user as any).id);

  const parseHex = (hex?: string | null): string | null => {
    if (!hex) return null;
    const h = hex.trim().replace(/^#/, '');
    if (!/^([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(h)) return null;
    const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
    return `#${full.toLowerCase()}`;
  };
  const hexToRgb = (hex: string): [number, number, number] | null => {
    const h = hex.replace('#', '');
    if (h.length !== 6) return null;
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    return [r, g, b];
  };
  const getContrastingText = (bgHex: string): string => {
    const h = bgHex.replace('#', '');
    const r = parseInt(h.substring(0, 2), 16);
    const g = parseInt(h.substring(2, 4), 16);
    const b = parseInt(h.substring(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#111111' : '#ffffff';
  };

  const cardBg = parseHex((user as any).card_bg_color);
  const cardRgbArr = cardBg ? hexToRgb(cardBg) : null;
  const cardOpacity = typeof (user as any).card_bg_opacity === 'number' ? (user as any).card_bg_opacity : 1;
  const cardTextColor = cardBg ? getContrastingText(cardBg) : undefined;

  // Variantes de animación
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 }
  };

  return (
    <>
      <Modal show={showFollowingModal} onHide={() => setShowFollowingModal(false)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{t('profile.following_modal_title')} ({followingTotal > 0 ? followingTotal : (user as any)?.following_count || 0})</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          {/* Buscador y filtro de tags */}
          <Form onSubmit={handleFollowingSearch} className="mb-3">
            <Row className="g-2">
              <Col md={8}>
                <InputGroup>
                  <Form.Control
                    type="text"
                    placeholder={t('profile.search_following')}
                    value={followingSearchInput}
                    onChange={(e) => setFollowingSearchInput(e.target.value)}
                  />
                  <Button variant="primary" type="submit" disabled={loadingFollowing}>
                    <i className="fas fa-search"></i>
                  </Button>
                  {followingSearch && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFollowingSearchInput('');
                        setFollowingSearch('');
                        setFollowingPage(1);
                        loadFollowing(1, '', followingSelectedTag);
                      }}
                      disabled={loadingFollowing}
                    >
                      <i className="fas fa-times"></i>
                    </Button>
                  )}
                </InputGroup>
              </Col>
              <Col md={4}>
                <Form.Select
                  value={followingSelectedTag}
                  onChange={(e) => handleFollowingTagChange(e.target.value)}
                  disabled={loadingFollowing}
                >
                  <option value="">{t('profile.all_tags')}</option>
                  {availableTags
                    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
                    .map((tag) => (
                      <option key={tag.id} value={tag.name}>
                        {i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name}
                      </option>
                    ))}
                </Form.Select>
              </Col>
            </Row>
          </Form>

          {loadingFollowing ? (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          ) : followingUsers.length === 0 ? (
            <Alert variant="info">
              {followingSearch
                ? `${t('profile.no_results_for')} "${followingSearch}"`
                : t('profile.no_following')}
            </Alert>
          ) : (
            <>
              <ListGroup variant="flush">
                {followingUsers.map((followedUser) => {
                  const avatarWebp = (followedUser as any).avatar_thumb_webp;
                  const smallWebp = (followedUser as any).avatar_small_webp;
                  const mediumWebp = (followedUser as any).avatar_medium_webp;
                  const avatarFallback = (followedUser as any).avatar_thumb || followedUser.avatar_url || defaultAvatar;

                  return (
                    <ListGroup.Item
                      key={followedUser.id}
                      className="d-flex align-items-center gap-3"
                      as={Link}
                      to={`/u/${followedUser.username}`}
                      onClick={() => setShowFollowingModal(false)}
                      style={{ cursor: 'pointer', textDecoration: 'none', color: 'inherit' }}
                    >
                      <OptimizedImage
                        webpUrl={avatarWebp}
                        smallWebpUrl={smallWebp}
                        mediumWebpUrl={mediumWebp}
                        fallbackUrl={avatarFallback}
                        alt={followedUser.username}
                        className="rounded-circle"
                        size={50}
                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1">
                        <div className="fw-bold d-flex align-items-center">
                          @{followedUser.username}
                          {followedUser.is_verified && <VerifiedBadge />}
                        </div>
                        {followedUser.description && (
                          <div className="text-muted small text-truncate" style={{ maxWidth: '300px' }}>
                            {followedUser.description}
                          </div>
                        )}
                        {(followedUser as any).tags?.length > 0 && (
                          <div className="mt-1">
                            {(followedUser as any).tags.slice(0, 3).map((t: Tag) => (
                              <Badge key={t.id} bg={t.color || 'secondary'} className="me-1" style={{ fontSize: '0.7rem' }}>
                                {t.name}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {followedUser.roles?.some((role: any) => role.name === 'vip') && (
                        <Badge bg="warning" text="dark">
                          <i className="fas fa-crown me-1"></i>
                          VIP
                        </Badge>
                      )}
                    </ListGroup.Item>
                  );
                })}
              </ListGroup>

              {/* Paginador */}
              {followingTotalPages > 1 && (
                <div className="d-flex justify-content-center mt-3">
                  <Pagination size="sm">
                    <Pagination.First
                      onClick={() => handleFollowingPageChange(1)}
                      disabled={followingPage === 1 || loadingFollowing}
                    />
                    <Pagination.Prev
                      onClick={() => handleFollowingPageChange(followingPage - 1)}
                      disabled={followingPage === 1 || loadingFollowing}
                    />

                    {/* Páginas visibles */}
                    {Array.from({ length: Math.min(5, followingTotalPages) }, (_, i) => {
                      let pageNum: number;
                      if (followingTotalPages <= 5) {
                        pageNum = i + 1;
                      } else if (followingPage <= 3) {
                        pageNum = i + 1;
                      } else if (followingPage >= followingTotalPages - 2) {
                        pageNum = followingTotalPages - 4 + i;
                      } else {
                        pageNum = followingPage - 2 + i;
                      }

                      return (
                        <Pagination.Item
                          key={pageNum}
                          active={pageNum === followingPage}
                          onClick={() => handleFollowingPageChange(pageNum)}
                          disabled={loadingFollowing}
                        >
                          {pageNum}
                        </Pagination.Item>
                      );
                    })}

                    <Pagination.Next
                      onClick={() => handleFollowingPageChange(followingPage + 1)}
                      disabled={followingPage === followingTotalPages || loadingFollowing}
                    />
                    <Pagination.Last
                      onClick={() => handleFollowingPageChange(followingTotalPages)}
                      disabled={followingPage === followingTotalPages || loadingFollowing}
                    />
                  </Pagination>
                </div>
              )}

              {/* Info de resultados */}
              {followingUsers.length > 0 && (
                <div className="text-center text-muted small mt-2">
                  {t('profile.showing_results')} {((followingPage - 1) * 20) + 1} - {Math.min(followingPage * 20, followingTotal > 0 ? followingTotal : (user as any)?.following_count || 0)} {t('profile.of')} {followingTotal > 0 ? followingTotal : (user as any)?.following_count || 0}
                </div>
              )}
            </>
          )}
        </Modal.Body>
      </Modal>

      <Modal show={showVipMessageModal} onHide={() => setShowVipMessageModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-crown text-warning me-2"></i>
            Mensaje para @{user.username}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {vipMessageStatus && (
            <Alert variant={vipMessageStatus.variant}>{vipMessageStatus.text}</Alert>
          )}
          <Form onSubmit={handleSendVipMessage}>
            <Form.Group className="mb-3">
              <Form.Label>Mensaje</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                maxLength={500}
                value={vipMessage}
                onChange={(event) => setVipMessage(event.target.value)}
                placeholder="Escribe un mensaje breve para este creador VIP"
                required
              />
            </Form.Group>
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" className="rounded-pill px-3" onClick={() => setShowVipMessageModal(false)} disabled={vipMessageSending}>
                Cerrar
              </Button>
              <Button type="submit" variant="warning" className="rounded-pill px-4 fw-semibold" disabled={vipMessageSending}>
                {vipMessageSending ? 'Enviando...' : 'Enviar mensaje VIP'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      <Container
        className="mt-4"
        as={motion.div}
        initial={containerVariants.hidden}
        animate={containerVariants.visible}
      >
        <Row>
          <Col
            md={4}
            as={motion.div}
            initial={itemVariants.hidden}
            animate={itemVariants.visible}
          >
            <div
              className="profile-apple-card text-center"
              style={cardBg && cardRgbArr ? { backgroundColor: `rgba(${cardRgbArr[0]},${cardRgbArr[1]},${cardRgbArr[2]},${cardOpacity})`, color: cardTextColor } : undefined}
            >
              {user.roles?.some((role: any) => role.name === 'vip') && (
                <span className="profile-vip-pill">
                  <i className={`${normalizeFA(vipBadgeIcon) || 'fas fa-crown'} text-white`} aria-hidden="true"></i>
                  <span>{(vipBadgeLabel && vipBadgeLabel.trim()) || 'VIP'}</span>
                </span>
              )}

              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.25, ease: 'easeOut', delay: 0.2 }}
                className="profile-avatar-container"
              >
                <OptimizedImage
                  webpUrl={avatarWebp}
                  smallWebpUrl={smallWebp}
                  mediumWebpUrl={mediumWebp}
                  fallbackUrl={avatarFallback}
                  alt={user.username}
                  className="profile-avatar-img w-100"
                  style={{ objectFit: 'contain', maxHeight: '320px' }}
                  size={300}
                  priority={true}
                  placeholderFallback={true}
                />
              </motion.div>

              <div>
                {followNotice && (
                  <Alert variant={followNotice.variant} dismissible onClose={() => setFollowNotice(null)} className="py-2 rounded-3 mb-3">
                    {followNotice.text}
                  </Alert>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="d-flex align-items-center justify-content-center gap-2 mb-1">
                    <h2 className="profile-username-title mb-0">
                      @{user.username}
                      {user.is_verified && <VerifiedBadge />}
                    </h2>
                  </div>
                  {genderFull && (
                    <div>
                      <span className="profile-gender-pill">
                        {genderIcon && <i className={`${genderIcon} me-1`} aria-hidden="true"></i>}
                        {genderFull}
                      </span>
                    </div>
                  )}
                </motion.div>

                {/* Barra de Estadísticas Tipo Métrica Apple */}
                <motion.div
                  className="profile-stats-bar"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  {isProfileCreatorOrAdmin ? (
                    <>
                      <div className="profile-stat-item">
                        <strong>{(user as any).followers_count || 0}</strong>
                        <span>{t('profile.followers')}</span>
                      </div>
                      <div className="profile-stat-divider"></div>
                      {currentUser?.username === user.username ? (
                        <div
                          onClick={handleShowFollowing}
                          className="profile-stat-item interactive"
                        >
                          <strong>{(user as any).following_count || 0}</strong>
                          <span>{t('profile.following')}</span>
                        </div>
                      ) : (
                        <div className="profile-stat-item">
                          <strong>{(user as any).following_count || 0}</strong>
                          <span>{t('profile.following')}</span>
                        </div>
                      )}
                      <div className="profile-stat-divider"></div>
                      <div className="profile-stat-item">
                        <strong>{(user as any).views || 0}</strong>
                        <span>{t('profile.views')}</span>
                      </div>
                    </>
                  ) : (
                    currentUser?.username === user.username ? (
                      <div
                        onClick={handleShowFollowing}
                        className="profile-stat-item interactive"
                      >
                        <strong>{(user as any).following_count || 0}</strong>
                        <span>{t('profile.following')}</span>
                      </div>
                    ) : (
                      <div className="profile-stat-item">
                        <strong>{(user as any).following_count || 0}</strong>
                        <span>{t('profile.following')}</span>
                      </div>
                    )
                  )}
                </motion.div>

                {/* Acciones de Perfil 100% Sólidas */}
                <motion.div
                  className="profile-actions-row"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                >
                  <LikeButton
                    profileUserId={Number((user as any).id)}
                    initialLikesCount={Number((user as any).likes_count || 0)}
                    initialLiked={Boolean((user as any).liked_by_user)}
                    className="mb-0"
                  />

                  {currentUser?.username !== user.username && isProfileCreator && (
                    !isAuthenticated ? (
                      <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-follow-login">{t('profile.login_to_follow')}</Tooltip>}>
                        <Button
                          variant={following ? 'secondary' : 'primary'}
                          className={`profile-btn-solid ${following ? 'profile-btn-secondary' : 'profile-btn-primary'}`}
                          onClick={() => navigate('/login')}
                          disabled={followLoading}
                        >
                          {followLoading ? (
                            <Spinner animation="border" size="sm" />
                          ) : (
                            <>
                              <i className="fas fa-user-plus me-1" aria-hidden="true"></i>
                              {t('profile.follow')}
                            </>
                          )}
                        </Button>
                      </OverlayTrigger>
                    ) : (
                      <Button
                        variant={following ? 'secondary' : 'primary'}
                        className={`profile-btn-solid ${following ? 'profile-btn-secondary' : 'profile-btn-primary'}`}
                        onClick={handleFollow}
                        disabled={followLoading}
                      >
                        {followLoading ? (
                          <Spinner animation="border" size="sm" />
                        ) : following ? (
                          <>
                            <i className="fas fa-user-check me-1" aria-hidden="true"></i>
                            {t('profile.following_btn')}
                          </>
                        ) : (
                          <>
                            <i className="fas fa-user-plus me-1" aria-hidden="true"></i>
                            {t('profile.follow')}
                          </>
                        )}
                      </Button>
                    )
                  )}

                  {currentUser?.username !== user.username && isAuthenticated && user.roles?.some((role: any) => role.name === 'vip') && (
                    <Button
                      variant="warning"
                      className="profile-btn-solid profile-btn-warning"
                      onClick={() => {
                        setVipMessageStatus(null);
                        setShowVipMessageModal(true);
                      }}
                    >
                      <i className="fas fa-paper-plane me-1" aria-hidden="true"></i>
                      <span>Enviar mensaje VIP</span>
                    </Button>
                  )}
                </motion.div>

                {/* Editar perfil (Sólido oscuro) */}
                {isAuthenticated && currentUser?.username === user.username && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-3"
                  >
                    <Button
                      variant="dark"
                      className="profile-btn-solid profile-btn-dark w-100"
                      onClick={() => navigate('/perfil/editar')}
                    >
                      <i className="fas fa-edit me-2" aria-hidden="true"></i>
                      {t('profile.edit_profile')}
                    </Button>
                  </motion.div>
                )}

                {/* Tags de perfil */}
                {(user as any).tags?.length > 0 && (
                  <motion.div
                    className="profile-tags-container"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    {(user as any).tags
                      .slice()
                      .sort((a: Tag, b: Tag) => (Number(b.weight) || 0) - (Number(a.weight) || 0))
                      .map((t: Tag) => {
                        const iconClass = t.icon ? t.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                        const slug = String(t.name).trim().toLowerCase().replace(/\s+/g, '-');
                        const label = i18n.language === 'en' && t.name_en ? t.name_en : t.name;
                        return (
                          <Link key={String(t.id)} to={`/t/${slug}`} className="profile-tag-pill">
                            {iconClass && <i className={`${iconClass}`} aria-hidden="true"></i>}
                            <span>{label}</span>
                          </Link>
                        );
                      })}
                  </motion.div>
                )}

                {/* Enlaces Sociales / Externos */}
                {(user as any).links?.length > 0 && (
                  <motion.div
                    className="profile-links-container"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                  >
                    <div className="profile-links-title">{t('profile.links')}</div>
                    <div>
                      {(user as any).links
                        .slice()
                        .sort((a: UserLink, b: UserLink) => (a.order ?? 0) - (b.order ?? 0))
                        .map((l: UserLink) => {
                          const iconClass = l.icon ? l.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                          const isAdult = !!l.is_adult;
                          return (
                            <a
                              href={isAdult ? `/go/${l.id}` : l.url}
                              {...(isAdult ? {} : { target: '_blank' })}
                              rel={isAdult ? 'nofollow noopener noreferrer' : 'noreferrer'}
                              key={`${l.name}-${l.url}`}
                              className="profile-link-item"
                            >
                              {iconClass ? (
                                <i className={`${iconClass} me-2`} aria-hidden="true"></i>
                              ) : (
                                <i className="fas fa-link me-2 text-muted" aria-hidden="true"></i>
                              )}
                              <span className="flex-grow-1">{l.name || l.url}</span>
                              {isAdult && <span className="profile-link-badge-18">+18</span>}
                              <i className="fas fa-arrow-up-right-from-square text-muted ms-2" aria-hidden="true" style={{ fontSize: '0.75rem' }}></i>
                            </a>
                          );
                        })}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </Col>

          <Col
            md={8}
            as={motion.div}
            initial={itemVariants.hidden}
            animate={itemVariants.visible}
          >
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="profile-segmented-control">
                <button
                  type="button"
                  className={`profile-segment-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabChange('profile')}
                >
                  <i className="fas fa-id-card me-1" aria-hidden="true"></i>
                  <span>{t('profile.tab_profile')}</span>
                </button>
                {(user as any)?.galleries_count > 0 && (
                  <button
                    type="button"
                    className={`profile-segment-btn ${activeTab === 'galleries' ? 'active' : ''}`}
                    onClick={() => handleTabChange('galleries')}
                  >
                    <i className="fas fa-images me-1" aria-hidden="true"></i>
                    <span>{t('profile.tab_galleries')} ({(user as any).galleries_count})</span>
                  </button>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={cardVariants.hidden}
              animate={cardVariants.visible}
              transition={{ delay: 0.4 }}
            >
              <div
                className="profile-info-card"
                style={cardBg && cardRgbArr ? { backgroundColor: `rgba(${cardRgbArr[0]},${cardRgbArr[1]},${cardRgbArr[2]},${cardOpacity})`, color: cardTextColor } : undefined}
              >
                {activeTab === 'profile' && (
                  <>
                    <div className="text-start mb-4">
                      <h3 className="profile-info-heading">
                        {t('profile.info_of')} <b>{username}</b>
                      </h3>
                      {user.description && <p className="profile-bio-text">{user.description}</p>}

                      {/* Lista Inset Apple con Líneas Hairline */}
                      <div className="profile-details-list">
                        {genderFull && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              {genderIcon && <i className={`${genderIcon} me-1`} aria-hidden="true"></i>}
                              {t('profile.gender')}
                            </span>
                            <span className="profile-detail-value">{genderFull}</span>
                          </div>
                        )}
                        {user.nationality && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-globe me-1 text-primary" aria-hidden="true"></i>
                              {t('profile.nationality')}
                            </span>
                            <span className="profile-detail-value">{getCountryDisplay(user.nationality)}</span>
                          </div>
                        )}
                        {ageYears != null && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-cake-candles me-1 text-primary" aria-hidden="true"></i>
                              {t('profile.age')}
                            </span>
                            <span className="profile-detail-value">{ageYears} {t('profile.years')}</span>
                          </div>
                        )}
                        {user.country && (isOwnProfile || isAdminOrModeratorViewer) && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-map-pin me-1 text-primary" aria-hidden="true"></i>
                              {t('profile.country')}
                            </span>
                            <span className="profile-detail-value">{getCountryDisplay(user.country)}</span>
                          </div>
                        )}
                        {user.city && (isOwnProfile || isAdminOrModeratorViewer) && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-city me-1 text-primary" aria-hidden="true"></i>
                              {t('profile.city')}
                            </span>
                            <span className="profile-detail-value">{user.city}</span>
                          </div>
                        )}
                        {birthDateStr && (isOwnProfile || isAdminOrModeratorViewer) && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-calendar-day me-1 text-primary" aria-hidden="true"></i>
                              {t('profile.birth_date')}
                            </span>
                            <span className="profile-detail-value">{birthDateStr}</span>
                          </div>
                        )}
                        {priceStr && (
                          <div className="profile-detail-row">
                            <span className="profile-detail-label">
                              <i className="fas fa-tag me-1 text-success" aria-hidden="true"></i>
                              {t('profile.price_from_label')}
                            </span>
                            <span className="profile-detail-value text-success fw-bold">{priceStr}</span>
                          </div>
                        )}
                      </div>

                      {(user as any).country_block && (isOwnProfile || isAdminOrModeratorViewer) && (
                        <div className="mt-3">
                          <Badge bg="dark" className="rounded-pill px-3 py-2">{t('profile.country_block_active')}</Badge>
                        </div>
                      )}
                    </div>

                    {(user as any).has_public_profile && (
                      <div className="profile-qr-wrapper">
                        <h4 className="profile-info-heading">{t('profile.qr_code_title')}</h4>
                        <div className="profile-qr-canvas-container">
                          <QRCodeCanvas
                            ref={qrCanvasRef}
                            value={profileUrl}
                            size={QR_DISPLAY_SIZE}
                            level="H"
                            includeMargin={false}
                            imageSettings={siteLogo ? { src: siteLogo, width: qrLogoSize, height: qrLogoSize, excavate: true } : undefined}
                          />
                        </div>
                        <div className="mb-3">
                          <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-qr">{t('profile.download_qr_tooltip')}</Tooltip>}>
                            <Button
                              variant="secondary"
                              className="profile-btn-solid profile-btn-secondary"
                              onClick={handleDownloadQr}
                            >
                              <i className="fas fa-download me-2" aria-hidden="true"></i>
                              {t('profile.download_qr')}
                            </Button>
                          </OverlayTrigger>
                        </div>
                        <p className="small mb-0">
                          <a href={profileUrl} className="profile-qr-link" target="_blank" rel="noreferrer">
                            {profileUrl}
                          </a>
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
