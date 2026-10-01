import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Nav, Badge, Button, Spinner, Alert, OverlayTrigger, Tooltip, ListGroup, Modal, Form, InputGroup, Pagination, Dropdown, ButtonGroup } from 'react-bootstrap';
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
import UsersGrid from '../components/UsersGrid';
import { BACKEND_URL } from '../config/constants';
import { updatePageMeta, resetPageMeta } from '../lib/seo';
import ProfileCompletenessCard from '../components/ProfileCompletenessCard';
import { calculateProfileCompleteness } from '../lib/profileCompleteness';

interface FollowNotice {
  variant: 'success' | 'danger' | 'info';
  text: string;
}

interface SettingsWithQR extends SiteSettings {
  qr_logo_size?: number;
  logo?: string;
}

export default function UserProfile({ section = 'profile' as 'profile' | 'galleries' | 'similar' }) {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'similar' ? 'similar' : section;
  const { user: currentUser, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'galleries' | 'similar'>(initialTab);

  const [user, setUser] = useState<User | null>(null);
  const [defaultAvatar, setDefaultAvatar] = useState<string>('');
  const [siteLogo, setSiteLogo] = useState<string>('');
  const [siteTitle, setSiteTitle] = useState<string>('');
  const [qrLogoSize, setQrLogoSize] = useState<number>(48);
  const [downloadingQr, setDownloadingQr] = useState<boolean>(false);
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
  const [similarUsers, setSimilarUsers] = useState<User[]>([]);
  const [loadingSimilar, setLoadingSimilar] = useState<boolean>(false);
  const [similarLoaded, setSimilarLoaded] = useState<boolean>(false);
  const [similarPage, setSimilarPage] = useState<number>(1);
  const [similarTotalPages, setSimilarTotalPages] = useState<number>(1);
  const [similarTotal, setSimilarTotal] = useState<number>(0);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [showQrDropdown, setShowQrDropdown] = useState<boolean>(false);
  const [showReportModal, setShowReportModal] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDetails, setReportDetails] = useState<string>('');
  const [reportSending, setReportSending] = useState<boolean>(false);
  const [reportStatus, setReportStatus] = useState<{ variant: 'success' | 'danger'; text: string; ticketId?: number } | null>(null);
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
        const titleRaw = settings?.siteSettings?.site_title;
        if (titleRaw && !titleRaw.toLowerCase().includes('link persons')) {
          setSiteTitle(titleRaw);
        }
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

  // Actualización dinámica de SEO, título y Open Graph para compartir perfil
  useEffect(() => {
    if (!user) return;

    const resolvedSiteName = siteTitle || (typeof document !== 'undefined' && document.title && !document.title.toLowerCase().includes('link persons') ? document.title.split(' - ').pop()?.trim() : '') || 'Only Models';
    const displayName = user.name ? `${user.name} (@${user.username})` : `@${user.username}`;
    const locationInfo = [user.city, user.country].filter(Boolean).join(', ');
    const priceInfo = user.price_from ? `Tarifa aprox: $${Number(user.price_from).toLocaleString()}${user.price_currency ? ' ' + user.price_currency : ''}/hr` : '';
    const pageTitle = `${displayName}${locationInfo ? ` en ${locationInfo}` : ''} | Creador Adulto (+18) & Escort - ${resolvedSiteName}`;
    const pageDesc = user.description
      ? `${user.description.slice(0, 130)}${priceInfo ? ` | ${priceInfo}` : ''} - Perfil verificado (+18) con redes y fotos en ${resolvedSiteName}.`
      : `Perfil verificado (+18) de ${displayName}${locationInfo ? ` en ${locationInfo}` : ''}. ${priceInfo ? priceInfo + '. ' : ''}Descubre sus redes oficiales, OnlyFans, Arsmate, galerías y tarifas en ${resolvedSiteName}.`;

    // Resolver avatar absoluto para previsualizaciones sociales y meta tags (avatar de usuario -> logo del sitio -> defaultAvatar -> logo500)
    let avatarUrl = user.avatar_url || (user as any).avatar_webp || (user as any).avatar_thumb;
    if (!avatarUrl && siteLogo) {
      avatarUrl = siteLogo;
    }
    if (!avatarUrl && defaultAvatar) {
      avatarUrl = defaultAvatar;
    }
    if (!avatarUrl) {
      avatarUrl = `${window.location.origin}/logo500.png`;
    }

    if (avatarUrl && !avatarUrl.startsWith('http')) {
      const backendBase = String((import.meta as any).env?.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
      avatarUrl = `${backendBase}${avatarUrl.startsWith('/') ? '' : '/'}${avatarUrl}`;
    }

    const canonicalUrl = `${window.location.origin}/u/${user.username}`;

    updatePageMeta({
      title: pageTitle,
      description: pageDesc,
      image: avatarUrl || undefined,
      url: canonicalUrl,
      type: 'profile',
      siteName: resolvedSiteName,
      keywords: `${user.username}, ${user.name || ''}, creador adulto, onlyfans chile, onlyfans colombia, arsmate, escorts, scort, damas de compañia, acompañantes, casas de citas, fotos exclusivas, ${locationInfo ? locationInfo + ', ' : ''}precio por hora, tarifas escorts, chile, colombia, latam, only models`,
    });

    return () => {
      resetPageMeta();
    };
  }, [user, defaultAvatar, siteLogo, siteTitle]);

  // Nota: QRCodeCanvas ya soporta imageSettings; no dibujamos manualmente sobre el canvas
  useEffect(() => {
    return;
  }, [siteLogo, qrLogoSize, (user as any)?.has_public_profile, (user as any)?.username]);

  useEffect(() => {
    let cancelled = false;
    const loadLogo = async () => {
      if (!siteLogo) {
        setLogoDataUrl(null);
        setLogoDimensions(null);
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
        if (!cancelled) {
          setLogoDataUrl(dataUrl);
          const img = new Image();
          img.onload = () => {
            if (!cancelled) {
              const nw = img.naturalWidth || img.width;
              const nh = img.naturalHeight || img.height;
              if (nw && nh) {
                const aspect = nw / nh;
                if (aspect >= 1) {
                  setLogoDimensions({ width: qrLogoSize, height: Math.max(16, Math.round(qrLogoSize / aspect)) });
                } else {
                  setLogoDimensions({ width: Math.max(16, Math.round(qrLogoSize * aspect)), height: qrLogoSize });
                }
              }
            }
          };
          img.src = dataUrl;
        }
      } catch {
        if (!cancelled) {
          setLogoDataUrl(null);
          setLogoDimensions(null);
        }
      }
    };
    loadLogo();
    return () => { cancelled = true; };
  }, [siteLogo, qrLogoSize]);

  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    w: number,
    h: number,
    r: number,
    fill?: string,
    stroke?: string,
    strokeW?: number
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    if (fill) {
      ctx.fillStyle = fill;
      ctx.fill();
    }
    if (stroke && strokeW) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = strokeW;
      ctx.stroke();
    }
    ctx.restore();
  };

  const drawImageCover = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) {
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }

    const destAspect = dw / dh;
    const srcAspect = imgW / imgH;

    let sx = 0;
    let sy = 0;
    let sw = imgW;
    let sh = imgH;

    if (srcAspect > destAspect) {
      sw = imgH * destAspect;
      sx = (imgW - sw) / 2;
    } else {
      sh = imgW / destAspect;
      sy = (imgH - sh) / 2;
    }

    ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  };

  const drawImageContain = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    dx: number,
    dy: number,
    dw: number,
    dh: number
  ) => {
    const imgW = img.naturalWidth || img.width;
    const imgH = img.naturalHeight || img.height;
    if (!imgW || !imgH) {
      ctx.drawImage(img, dx, dy, dw, dh);
      return;
    }

    const destAspect = dw / dh;
    const srcAspect = imgW / imgH;

    let renderW = dw;
    let renderH = dh;
    let renderX = dx;
    let renderY = dy;

    if (srcAspect > destAspect) {
      renderH = dw / srcAspect;
      renderY = dy + (dh - renderH) / 2;
    } else {
      renderW = dh * srcAspect;
      renderX = dx + (dw - renderW) / 2;
    }

    ctx.drawImage(img, 0, 0, imgW, imgH, renderX, renderY, renderW, renderH);
  };

  const drawCircularAvatar = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    cx: number,
    cy: number,
    r: number,
    borderCol: string = '#0d6efd',
    borderW: number = 4
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.clip();
    drawImageCover(ctx, img, cx - r, cy - r, r * 2, r * 2);
    ctx.restore();

    if (borderW > 0) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2, true);
      ctx.strokeStyle = borderCol;
      ctx.lineWidth = borderW;
      ctx.stroke();
      ctx.restore();
    }
  };

  const handleDownloadQr = async (format: 'classic' | 'story' | 'feed' = 'story') => {
    if (!user) return;
    setDownloadingQr(true);

    try {
      const profileUrl = `${window.location.origin}/u/${user.username}`;
      const resolvedSiteName = siteTitle || (typeof document !== 'undefined' && document.title && !document.title.toLowerCase().includes('link persons') ? document.title.split(' - ').pop()?.trim() : '') || 'Only Models';
      const displayName = user.name ? `${user.name}` : `@${user.username}`;
      const location = [user.city, user.country].filter(Boolean).join(', ');
      const priceStr = user.price_from ? `Tarifa aprox: $${Number(user.price_from).toLocaleString()}${user.price_currency ? ' ' + user.price_currency : ''}/hr` : '';

      let W = 1024;
      let H = 1024;
      let qrInnerSize = 600;

      if (format === 'story') {
        W = 1080;
        H = 1920;
        qrInnerSize = 600;
      } else if (format === 'feed') {
        W = 1080;
        H = 1080;
        qrInnerSize = 520;
      } else {
        W = 1024;
        H = 1024;
        qrInnerSize = 912;
      }

      const frac = qrLogoSize / QR_DISPLAY_SIZE;
      const logoDlSize = Math.max(36, Math.round(qrInnerSize * frac));
      const logoSrc = logoDataUrl || siteLogo;

      // 1. Preload Logo
      let loadedLogoImg: HTMLImageElement | null = null;
      if (logoSrc) {
        try {
          const img = new Image();
          if (!logoSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
          img.src = logoSrc;
          await new Promise<void>((resolve, reject) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => reject();
          });
          loadedLogoImg = img;
        } catch {}
      }

      // 2. Preload Avatar
      let loadedAvatarImg: HTMLImageElement | null = null;
      let avatarSrc = user.avatar_url || (user as any).avatar_webp || (user as any).avatar_thumb || defaultAvatar;
      if (avatarSrc) {
        if (!avatarSrc.startsWith('http') && !avatarSrc.startsWith('data:')) {
          const backendBase = String((import.meta as any).env?.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
          avatarSrc = `${backendBase}${avatarSrc.startsWith('/') ? '' : '/'}${avatarSrc}`;
        }
        try {
          const img = new Image();
          if (!avatarSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
          img.src = avatarSrc;
          await new Promise<void>((resolve, reject) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => reject();
          });
          loadedAvatarImg = img;
        } catch {}
      }

      // 3. Render offscreen QR Code
      let logoW = logoDlSize;
      let logoH = logoDlSize;
      if (loadedLogoImg) {
        const nw = loadedLogoImg.naturalWidth || loadedLogoImg.width;
        const nh = loadedLogoImg.naturalHeight || loadedLogoImg.height;
        if (nw && nh) {
          const aspect = nw / nh;
          if (aspect >= 1) {
            logoW = logoDlSize;
            logoH = Math.max(16, Math.round(logoDlSize / aspect));
          } else {
            logoW = Math.max(16, Math.round(logoDlSize * aspect));
            logoH = logoDlSize;
          }
        }
      }

      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      document.body.appendChild(container);
      const root = createRoot(container);

      root.render(
        <QRCodeCanvas
          value={profileUrl}
          size={qrInnerSize}
          level="H"
          includeMargin={false}
          imageSettings={
            logoSrc
              ? {
                  src: logoSrc,
                  width: logoW,
                  height: logoH,
                  excavate: true,
                }
              : undefined
          }
        />
      );

      let offCanvas: HTMLCanvasElement | null = null;
      for (let i = 0; i < 8 && !offCanvas; i++) {
        await new Promise((r) => setTimeout(r, 60));
        offCanvas = container.querySelector('canvas') as HTMLCanvasElement | null;
      }
      if (!offCanvas) {
        offCanvas = qrCanvasRef.current;
      }

      // 4. Composite final Canvas
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = W;
      exportCanvas.height = H;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('No canvas context');

      if (format === 'classic') {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, W, H);
        const margin = 56;
        if (offCanvas) {
          ctx.drawImage(offCanvas, margin, margin, qrInnerSize, qrInnerSize);
        }
        if (loadedLogoImg) {
          const lx = Math.round((W - logoW) / 2);
          const ly = Math.round((H - logoH) / 2);
          drawImageContain(ctx, loadedLogoImg, lx, ly, logoW, logoH);
        }
      } else if (format === 'story') {
        // Story 9:16 (1080 x 1920)
        // Background Avatar Blur
        if (loadedAvatarImg) {
          ctx.save();
          if ('filter' in ctx) {
            ctx.filter = 'blur(45px) brightness(0.65)';
            drawImageCover(ctx, loadedAvatarImg, -50, -50, W + 100, H + 100);
            ctx.filter = 'none';
          } else {
            drawImageCover(ctx, loadedAvatarImg, 0, 0, W, H);
          }
          ctx.restore();
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, '#1e1b4b');
          grad.addColorStop(1, '#0f172a');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // Top Branding Pill
        const pillW = 420;
        const pillH = 50;
        const pillX = (W - pillW) / 2;
        const pillY = 120;
        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 25, 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.3)', 1.5);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${resolvedSiteName.toUpperCase()} · (+18)`, W / 2, pillY + pillH / 2);

        // Central White Card
        const cardW = 900;
        const cardH = 1420;
        const cardX = (W - cardW) / 2;
        const cardY = 220;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 48, '#FFFFFF');

        // Card Avatar
        const avatarR = 80;
        const avatarCY = cardY + 120;
        if (loadedAvatarImg) {
          drawCircularAvatar(ctx, loadedAvatarImg, W / 2, avatarCY, avatarR, '#0d6efd', 6);
        }

        // Display Name & @username
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, W / 2, avatarCY + 115);

        ctx.fillStyle = '#6b7280';
        ctx.font = '600 30px system-ui, -apple-system, sans-serif';
        ctx.fillText(`@${user.username}`, W / 2, avatarCY + 160);

        if (location || priceStr) {
          const detailTxt = [location, priceStr].filter(Boolean).join(' · ');
          ctx.fillStyle = '#0d6efd';
          ctx.font = 'bold 24px system-ui, -apple-system, sans-serif';
          ctx.fillText(detailTxt, W / 2, avatarCY + 205);
        }

        // QR Code
        const qrX = (W - qrInnerSize) / 2;
        const qrY = cardY + 390;
        if (offCanvas) {
          ctx.drawImage(offCanvas, qrX, qrY, qrInnerSize, qrInnerSize);
        }
        if (loadedLogoImg) {
          const lx = Math.round((W - logoW) / 2);
          const ly = Math.round(qrY + (qrInnerSize - logoH) / 2);
          drawImageContain(ctx, loadedLogoImg, lx, ly, logoW, logoH);
        }

        // Footer Text
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 30px system-ui, -apple-system, sans-serif';
        ctx.fillText('Escanea para ver redes, fotos y tarifas', W / 2, cardY + 1120);

        ctx.fillStyle = '#0d6efd';
        ctx.font = '600 26px system-ui, -apple-system, sans-serif';
        ctx.fillText(profileUrl.replace(/^https?:\/\//, ''), W / 2, cardY + 1170);

        const badgePillW = 380;
        const badgePillH = 46;
        const badgePillX = (W - badgePillW) / 2;
        const badgePillY = cardY + 1225;
        drawRoundedRect(ctx, badgePillX, badgePillY, badgePillW, badgePillH, 23, '#f3f4f6');
        ctx.fillStyle = '#4b5563';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText('🔞 MAYORES DE 18 AÑOS', W / 2, badgePillY + badgePillH / 2);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '500 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Encuéntrame en ${resolvedSiteName}`, W / 2, 1720);

      } else if (format === 'feed') {
        // Feed 1:1 (1080 x 1080)
        if (loadedAvatarImg) {
          ctx.save();
          if ('filter' in ctx) {
            ctx.filter = 'blur(40px) brightness(0.65)';
            drawImageCover(ctx, loadedAvatarImg, -40, -40, W + 80, H + 80);
            ctx.filter = 'none';
          } else {
            drawImageCover(ctx, loadedAvatarImg, 0, 0, W, H);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(0, 0, W, H);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // Central White Card
        const cardW = 940;
        const cardH = 940;
        const cardX = (W - cardW) / 2;
        const cardY = (H - cardH) / 2;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 44, '#FFFFFF');

        // Header Avatar + Name
        const avatarR = 55;
        const avatarCX = cardX + 90;
        const avatarCY = cardY + 90;
        if (loadedAvatarImg) {
          drawCircularAvatar(ctx, loadedAvatarImg, avatarCX, avatarCY, avatarR, '#0d6efd', 4);
        }

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(displayName, cardX + 165, cardY + 80);

        ctx.fillStyle = '#6b7280';
        ctx.font = '600 26px system-ui, -apple-system, sans-serif';
        ctx.fillText(`@${user.username}${location ? ' · ' + location : ''}`, cardX + 165, cardY + 118);

        // QR Code
        const qrX = (W - qrInnerSize) / 2;
        const qrY = cardY + 160;
        if (offCanvas) {
          ctx.drawImage(offCanvas, qrX, qrY, qrInnerSize, qrInnerSize);
        }
        if (loadedLogoImg) {
          const lx = Math.round((W - logoW) / 2);
          const ly = Math.round(qrY + (qrInnerSize - logoH) / 2);
          drawImageContain(ctx, loadedLogoImg, lx, ly, logoW, logoH);
        }

        // Footer
        ctx.textAlign = 'center';
        ctx.fillStyle = '#1f2937';
        ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
        ctx.fillText('Escanea para ver redes oficiales y fotos (+18)', W / 2, cardY + 775);

        ctx.fillStyle = '#0d6efd';
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(profileUrl.replace(/^https?:\/\//, ''), W / 2, cardY + 820);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${resolvedSiteName} · Perfil Verificado`, W / 2, cardY + 865);
      }

      const a = document.createElement('a');
      a.href = exportCanvas.toDataURL('image/jpeg', 0.95);
      a.download = `qr-${user.username}-${format}.jpg`;
      a.click();

      try {
        root.unmount();
      } catch {}
      if (container.parentNode) {
        document.body.removeChild(container);
      }
    } catch (e) {
      console.error('Error generando tarjeta QR:', e);
    } finally {
      setDownloadingQr(false);
    }
  };

  const handleShareProfile = async () => {
    if (!user) return;
    const resolvedSiteName = siteTitle || (typeof document !== 'undefined' && document.title && !document.title.toLowerCase().includes('link persons') ? document.title.split(' - ').pop()?.trim() : '') || 'Only Models';
    const displayName = user.name ? `${user.name} (@${user.username})` : `@${user.username}`;
    const shareUrl = `${window.location.origin}/u/${user.username}`;
    const shareData = {
      title: `${displayName} - ${resolvedSiteName}`,
      text: user.description || `Conoce el perfil de ${displayName} en ${resolvedSiteName}`,
      url: shareUrl,
    };

    if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: any) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setFollowNotice({
        variant: 'success',
        text: t('profile.link_copied', '¡Enlace del perfil copiado al portapapeles!'),
      });
    } catch {
      setFollowNotice({
        variant: 'info',
        text: shareUrl,
      });
    }
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

  const loadSimilarUsers = async (page: number = 1) => {
    if (!username && !user) return;
    setLoadingSimilar(true);
    try {
      const data = await graphqlRequest<{
        similarUsers: {
          data: User[];
          paginatorInfo: {
            currentPage: number;
            lastPage: number;
            total: number;
          };
        };
      }>({
        query: queries.similarUsers,
        variables: {
          username: username || user?.username,
          user_id: user?.id ? Number(user.id) : undefined,
          page,
          per_page: 8,
        },
        schema: 'public',
      });

      setSimilarUsers(data.similarUsers?.data || []);
      setSimilarPage(data.similarUsers?.paginatorInfo?.currentPage || 1);
      setSimilarTotalPages(data.similarUsers?.paginatorInfo?.lastPage || 1);
      setSimilarTotal(data.similarUsers?.paginatorInfo?.total || 0);
      setSimilarLoaded(true);
    } catch (e: any) {
      console.error('Error loading similar users:', e);
      setSimilarUsers([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'similar' && !similarLoaded && (username || user)) {
      loadSimilarUsers(1);
    }
  }, [activeTab, username, user, similarLoaded]);

  const handleTabChange = (tab: 'profile' | 'galleries' | 'similar') => {
    setActiveTab(tab);
    if (tab === 'galleries') {
      navigate(`/u/${username}/galleries`);
    } else if (tab === 'similar') {
      if (!similarLoaded) {
        loadSimilarUsers(1);
      }
    }
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

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentUser) return;
    if (!reportReason) {
      setReportStatus({ variant: 'danger', text: t('report_profile.reason_placeholder') });
      return;
    }
    if (reportDetails.trim().length < 10) {
      setReportStatus({ variant: 'danger', text: t('report_profile.details_min_length') });
      return;
    }

    setReportSending(true);
    setReportStatus(null);
    try {
      const reasonText = t(`report_profile.reason_${reportReason}`, reportReason);
      const subject = `[Denuncia] @${user.username} (#${user.id}) - ${reasonText}`;
      const description = `Denuncia de perfil reportada por @${currentUser.username} (ID: #${currentUser.id}, Email: ${currentUser.email || 'N/A'}).\n\nPerfil denunciado: @${user.username} (ID: #${user.id})\nURL: ${window.location.origin}/u/${user.username}\nMotivo: ${reasonText}\n\nDetalles del denunciante:\n${reportDetails.trim()}`;

      const res = await graphqlRequest<{ createTicket: { id: number } }>({
        query: mutations.createTicket,
        variables: {
          subject,
          description,
          category: 'contenido',
          priority: 'alta',
        },
        schema: 'default',
        authenticated: true,
      });

      setReportStatus({
        variant: 'success',
        text: t('report_profile.success_desc', { username: user.username, ticketId: res?.createTicket?.id || '' }),
        ticketId: res?.createTicket?.id,
      });
      setReportDetails('');
      setReportReason('');
    } catch (err: any) {
      setReportStatus({
        variant: 'danger',
        text: err?.response?.[0]?.message || err?.message || 'Error al enviar reporte.',
      });
    } finally {
      setReportSending(false);
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
  const completeness = isOwnProfile && isProfileCreator ? calculateProfileCompleteness(user, defaultAvatar) : null;

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

      {/* Modal Apple HIG de Denuncia de Perfil */}
      <Modal
        show={showReportModal}
        onHide={() => {
          if (!reportSending) setShowReportModal(false);
        }}
        centered
        contentClassName="profile-modal-content"
      >
        <Modal.Header closeButton={!reportSending}>
          <Modal.Title className="fs-5 d-flex align-items-center gap-2">
            <i className="fas fa-triangle-exclamation text-danger" aria-hidden="true"></i>
            <span>{t('report_profile.modal_title', { username: user.username })}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!isAuthenticated ? (
            <div className="text-center py-3">
              <div className="mb-3">
                <i className="fas fa-lock fa-2x text-muted" aria-hidden="true"></i>
              </div>
              <p className="text-muted mb-3">{t('report_profile.login_required')}</p>
              <Button
                variant="primary"
                className="rounded-pill px-4"
                as={Link}
                to="/login"
              >
                <i className="fas fa-arrow-right-to-bracket me-2" aria-hidden="true"></i>
                {t('report_profile.login_btn')}
              </Button>
            </div>
          ) : reportStatus?.variant === 'success' ? (
            <div className="text-center py-3">
              <div className="mb-3">
                <i className="fas fa-circle-check fa-3x text-success" aria-hidden="true"></i>
              </div>
              <h5 className="fw-bold mb-2">{t('report_profile.success_title')}</h5>
              <p className="text-muted small mb-4">{reportStatus.text}</p>
              <Button
                variant="secondary"
                className="rounded-pill px-4"
                onClick={() => setShowReportModal(false)}
              >
                {t('report_profile.close')}
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleReportSubmit}>
              <p className="text-muted small mb-3">
                {t('report_profile.modal_subtitle')}
              </p>

              {reportStatus?.variant === 'danger' && (
                <Alert variant="danger" className="py-2 small mb-3">
                  <i className="fas fa-circle-exclamation me-1" aria-hidden="true"></i>
                  {reportStatus.text}
                </Alert>
              )}

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  {t('report_profile.reason_label')} <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  disabled={reportSending}
                >
                  <option value="">{t('report_profile.reason_placeholder')}</option>
                  <option value="impersonation">{t('report_profile.reason_impersonation')}</option>
                  <option value="inappropriate">{t('report_profile.reason_inappropriate')}</option>
                  <option value="scam">{t('report_profile.reason_scam')}</option>
                  <option value="fake">{t('report_profile.reason_fake')}</option>
                  <option value="underage">{t('report_profile.reason_underage')}</option>
                  <option value="other">{t('report_profile.reason_other')}</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label className="small fw-semibold">
                  {t('report_profile.details_label')} <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  as="textarea"
                  rows={4}
                  maxLength={1000}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder={t('report_profile.details_placeholder')}
                  required
                  disabled={reportSending}
                />
                <Form.Text className="text-muted small">
                  {t('report_profile.details_min_length')}
                </Form.Text>
              </Form.Group>

              <div className="d-flex justify-content-end gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="rounded-pill px-3"
                  onClick={() => setShowReportModal(false)}
                  disabled={reportSending}
                >
                  {t('report_profile.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="danger"
                  className="rounded-pill px-4 fw-semibold"
                  disabled={reportSending || !reportReason || reportDetails.trim().length < 10}
                >
                  {reportSending ? (
                    <>
                      <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                      {t('report_profile.submitting')}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-1" aria-hidden="true"></i>
                      {t('report_profile.submit')}
                    </>
                  )}
                </Button>
              </div>
            </Form>
          )}
        </Modal.Body>
      </Modal>

      <Container
        className="mt-4"
        as={motion.div}
        initial={containerVariants.hidden}
        animate={containerVariants.visible}
      >
        {completeness && (
          <ProfileCompletenessCard completeness={completeness} />
        )}

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

                  <Button
                    variant="secondary"
                    className="profile-btn-solid profile-btn-secondary"
                    onClick={handleShareProfile}
                    title={t('profile.share', 'Compartir perfil')}
                    aria-label={t('profile.share', 'Compartir perfil')}
                  >
                    <i className="fas fa-share-nodes me-1" aria-hidden="true"></i>
                    <span>{t('profile.share', 'Compartir')}</span>
                  </Button>

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
                        const rawColor = String(t.color || 'primary').trim().toLowerCase();
                        const isNamedColor = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(rawColor);
                        const isHexOrRgb = rawColor.startsWith('#') || rawColor.startsWith('rgb');

                        const customStyle = isHexOrRgb
                          ? {
                              backgroundColor: rawColor.startsWith('#') && rawColor.length === 7 ? `${rawColor}18` : rawColor,
                              borderColor: rawColor.startsWith('#') && rawColor.length === 7 ? `${rawColor}38` : undefined,
                              color: rawColor,
                            }
                          : undefined;

                        const colorClass = isNamedColor ? `profile-tag-${rawColor}` : 'profile-tag-primary';

                        return (
                          <Link
                            key={String(t.id)}
                            to={`/t/${slug}`}
                            className={`profile-tag-pill ${colorClass}`}
                            style={customStyle}
                          >
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
                          const isSafe = /^https?:\/\//i.test(String(l.url || '').trim());
                          const targetHref = isAdult ? `/go/${l.id}` : (isSafe ? l.url : '#');
                          return (
                            <a
                              href={targetHref}
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

                {/* Botón sutil de denuncia de perfil */}
                {currentUser?.username !== user.username && (
                  <div className="profile-report-container">
                    <button
                      type="button"
                      className="profile-report-btn"
                      onClick={() => {
                        setReportStatus(null);
                        setShowReportModal(true);
                      }}
                      title={t('report_profile.button')}
                    >
                      <i className="fas fa-flag" aria-hidden="true"></i>
                      <span>{t('report_profile.button')}</span>
                    </button>
                  </div>
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
              <div className="profile-segmented-control" role="tablist">
                <button
                  type="button"
                  className={`profile-segment-btn ${activeTab === 'profile' ? 'active' : ''}`}
                  onClick={() => handleTabChange('profile')}
                  role="tab"
                  aria-selected={activeTab === 'profile'}
                >
                  <i className="fas fa-id-card me-1" aria-hidden="true"></i>
                  <span>{t('profile.tab_profile')}</span>
                </button>
                {(user as any)?.galleries_count > 0 && (
                  <button
                    type="button"
                    className={`profile-segment-btn ${activeTab === 'galleries' ? 'active' : ''}`}
                    onClick={() => handleTabChange('galleries')}
                    role="tab"
                    aria-selected={activeTab === 'galleries'}
                  >
                    <i className="fas fa-images me-1" aria-hidden="true"></i>
                    <span>{t('profile.tab_galleries')} ({(user as any).galleries_count})</span>
                  </button>
                )}
                <button
                  type="button"
                  className={`profile-segment-btn ${activeTab === 'similar' ? 'active' : ''}`}
                  onClick={() => handleTabChange('similar')}
                  role="tab"
                  aria-selected={activeTab === 'similar'}
                >
                  <i className="fas fa-wand-magic-sparkles me-1" aria-hidden="true"></i>
                  <span>{t('profile.tab_similar', 'Similares')}</span>
                </button>
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
                          <>
                            <div className="profile-detail-row">
                              <span className="profile-detail-label">
                                <i className="fas fa-tag me-1 text-success" aria-hidden="true"></i>
                                {t('profile.price_from_label')}
                                <OverlayTrigger
                                  placement="top"
                                  overlay={
                                    <Tooltip id="price-disclaimer-tooltip">
                                      {t('profile.price_from_disclaimer')}
                                    </Tooltip>
                                  }
                                >
                                  <button
                                    type="button"
                                    className="profile-info-tooltip-btn d-none d-md-inline-flex"
                                    aria-label={t('profile.price_from_disclaimer')}
                                  >
                                    <i className="fas fa-circle-info" aria-hidden="true"></i>
                                  </button>
                                </OverlayTrigger>
                              </span>
                              <span className="profile-detail-value text-success fw-bold">{priceStr}</span>
                            </div>
                            <div className="profile-price-callout-mobile d-md-none">
                              <i className="fas fa-circle-info" aria-hidden="true"></i>
                              <span>{t('profile.price_from_disclaimer')}</span>
                            </div>
                          </>
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
                            imageSettings={
                              (logoDataUrl || siteLogo)
                                ? {
                                    src: logoDataUrl || siteLogo,
                                    width: logoDimensions?.width || qrLogoSize,
                                    height: logoDimensions?.height || qrLogoSize,
                                    excavate: true,
                                  }
                                : undefined
                            }
                          />
                        </div>
                        <div className="mb-3 d-flex justify-content-center">
                          <Dropdown
                            as={ButtonGroup}
                            show={showQrDropdown}
                            onToggle={(isOpen) => setShowQrDropdown(isOpen)}
                            autoClose={true}
                          >
                            <Button
                              variant="secondary"
                              className="profile-btn-solid profile-btn-secondary d-inline-flex align-items-center"
                              onClick={() => handleDownloadQr('story')}
                              disabled={downloadingQr}
                            >
                              {downloadingQr ? (
                                <>
                                  <Spinner animation="border" size="sm" className="me-2" />
                                  {t('common.generating', 'Generando...')}
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-share-nodes me-2" aria-hidden="true"></i>
                                  {t('profile.download_qr_story', 'Tarjeta Historia (9:16)')}
                                </>
                              )}
                            </Button>
                            <Dropdown.Toggle
                              split
                              variant="secondary"
                              className="profile-btn-solid profile-btn-secondary"
                              id="dropdown-qr-download"
                              disabled={downloadingQr}
                            />
                            <Dropdown.Menu className="shadow-lg border-0 rounded-3 py-2">
                              <Dropdown.Item
                                onClick={() => {
                                  handleDownloadQr('story');
                                  setShowQrDropdown(false);
                                }}
                                className="py-2"
                              >
                                <i className="fas fa-mobile-screen me-2 text-primary"></i>
                                {t('profile.qr_story_opt', 'Tarjeta Historia / Reels (9:16)')}
                              </Dropdown.Item>
                              <Dropdown.Item
                                onClick={() => {
                                  handleDownloadQr('feed');
                                  setShowQrDropdown(false);
                                }}
                                className="py-2"
                              >
                                <i className="fas fa-square me-2 text-success"></i>
                                {t('profile.qr_feed_opt', 'Tarjeta Feed / Post (1:1)')}
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item
                                onClick={() => {
                                  handleDownloadQr('classic');
                                  setShowQrDropdown(false);
                                }}
                                className="py-2 text-muted"
                              >
                                <i className="fas fa-qrcode me-2"></i>
                                {t('profile.qr_classic_opt', 'Solo Código QR (1024x1024)')}
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
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

                {activeTab === 'similar' && (
                  <div className="profile-similar-content text-start">
                    <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="profile-info-heading mb-1 d-flex align-items-center gap-2">
                          <i className="fas fa-wand-magic-sparkles text-primary" aria-hidden="true" />
                          {t('profile.similar_profiles_heading', 'Perfiles similares')}
                        </h3>
                        <p className="profile-bio-text mb-0">
                          {t('profile.similar_profiles_desc', 'Creadores recomendados según etiquetas, intereses y características afines.')}
                        </p>
                      </div>
                      {similarTotal > 0 && (
                        <Badge bg="primary" className="rounded-pill px-3 py-2">
                          {similarTotal} {t('profile.similar_badge', 'sugeridos')}
                        </Badge>
                      )}
                    </div>

                    <UsersGrid
                      users={similarUsers}
                      loading={loadingSimilar}
                      skeletonCount={4}
                      colsDesktop={2}
                      colsMobile={1}
                      defaultAvatar={defaultAvatar}
                      vipBadgeLabel={vipBadgeLabel}
                      vipBadgeIcon={vipBadgeIcon}
                      showTags={true}
                      maxTags={3}
                      emptyMessage={t('profile.no_similar_profiles', 'No se encontraron perfiles similares en este momento.')}
                    />

                    {similarTotalPages > 1 && (
                      <div className="d-flex justify-content-center mt-4">
                        <Pagination size="sm">
                          <Pagination.First
                            onClick={() => { setSimilarPage(1); loadSimilarUsers(1); }}
                            disabled={similarPage === 1 || loadingSimilar}
                          />
                          <Pagination.Prev
                            onClick={() => { const p = Math.max(1, similarPage - 1); setSimilarPage(p); loadSimilarUsers(p); }}
                            disabled={similarPage === 1 || loadingSimilar}
                          />
                          {Array.from({ length: Math.min(5, similarTotalPages) }, (_, i) => {
                            let pageNum: number;
                            if (similarTotalPages <= 5) pageNum = i + 1;
                            else if (similarPage <= 3) pageNum = i + 1;
                            else if (similarPage >= similarTotalPages - 2) pageNum = similarTotalPages - 4 + i;
                            else pageNum = similarPage - 2 + i;

                            return (
                              <Pagination.Item
                                key={pageNum}
                                active={pageNum === similarPage}
                                onClick={() => { setSimilarPage(pageNum); loadSimilarUsers(pageNum); }}
                                disabled={loadingSimilar}
                              >
                                {pageNum}
                              </Pagination.Item>
                            );
                          })}
                          <Pagination.Next
                            onClick={() => { const p = Math.min(similarTotalPages, similarPage + 1); setSimilarPage(p); loadSimilarUsers(p); }}
                            disabled={similarPage === similarTotalPages || loadingSimilar}
                          />
                          <Pagination.Last
                            onClick={() => { setSimilarPage(similarTotalPages); loadSimilarUsers(similarTotalPages); }}
                            disabled={similarPage === similarTotalPages || loadingSimilar}
                          />
                        </Pagination>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </>
  );
}
