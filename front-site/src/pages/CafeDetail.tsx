import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  ButtonGroup,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import { QRCodeCanvas } from 'qrcode.react';
import { createRoot } from 'react-dom/client';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_CURRENCY, APP_CURRENCY_FRACTION_DIGITS, BACKEND_URL } from '../config/constants';
import { queries } from '../lib/graphql/queries';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Cafe, CafeBranch, SiteSettings } from '../types';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-fullscreen.css';

interface SettingsWithQR extends SiteSettings {
  qr_logo_size?: number;
}

interface LightGalleryInstance {
  destroy: () => void;
}

const loadLightGallery = async (): Promise<{
  lightGallery: any;
  lgZoom: any;
  lgFullscreen: any;
}> => {
  const [lightGallery, zoom, fullscreen] = await Promise.all([
    import('lightgallery'),
    import('lightgallery/plugins/zoom'),
    import('lightgallery/plugins/fullscreen'),
  ]);

  return {
    lightGallery: lightGallery.default,
    lgZoom: zoom.default,
    lgFullscreen: fullscreen.default,
  };
};

interface CafeDetailResponse {
  cafeDetail: Cafe;
}

interface CreateReviewResponse {
  createCafeBranchReview: {
    id: string | number;
  };
}

export default function CafeDetail(): React.ReactElement {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const cafeImageRef = useRef<HTMLDivElement | null>(null);
  const lightGalleryInstance = useRef<LightGalleryInstance | null>(null);

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBranchKey, setActiveBranchKey] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showShareDialog, setShowShareDialog] = useState<boolean>(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [showMapDialog, setShowMapDialog] = useState<boolean>(false);
  const [branchDropdownOpen, setBranchDropdownOpen] = useState<boolean>(false);
  const [siteLogo, setSiteLogo] = useState<string | null>(null);
  const [siteTitle, setSiteTitle] = useState<string | null>(null);
  const [qrLogoSize, setQrLogoSize] = useState<number>(48);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoDimensions, setLogoDimensions] = useState<{ width: number; height: number } | null>(null);
  const [downloadingQr, setDownloadingQr] = useState<boolean>(false);
  const [showQrDropdown, setShowQrDropdown] = useState<boolean>(false);
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const QR_DISPLAY_SIZE = 200;

  const activeBranch = useMemo(() => {
    return (cafe?.branches ?? []).find((branch) => String(branch.id) === activeBranchKey) ?? null;
  }, [activeBranchKey, cafe?.branches]);

  const activeBranchTags = useMemo(() => {
    if (!activeBranch) return [];
    return Array.from(
      new Map(
        (activeBranch.creators ?? [])
          .flatMap((creator) => creator.tags ?? [])
          .map((tag) => [String(tag.id), tag])
      ).values()
    );
  }, [activeBranch]);

  const loadCafeDetail = async (): Promise<void> => {
    if (!slug) {
      setError(t('cafes.detail.invalid_id'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const query = `
        query CafeDetail($id: ID, $slug: String) {
          cafeDetail(id: $id, slug: $slug) {
            id
            slug
            name
            description
            website
            image_url
            branches_count
            reviews_count
            average_rating
            branches {
              id
              name
              description
              address
              city
              state
              postal_code
              phone
              website
              google_maps_url
              menu_qr_url
              entry_price
              consumo_individual
              consumo_chica
              image_url
              reviews_count
              average_rating
              tags {
                id
                name
                color
              }
              creators {
                id
                name
                username
                avatar_thumb
                avatar_url
                tags {
                  id
                  name
                  color
                }
              }
              reviews {
                id
                rating
                comment
                created_at
              }
            }
          }
        }
      `;

      const [settingsRes, response] = await Promise.all([
        graphqlRequest<{ siteSettings: SettingsWithQR }>({ query: queries.siteSettings, schema: 'public' }).catch(() => null),
        graphqlRequest<CafeDetailResponse>({
          query,
          variables: {
            id: /^\d+$/.test(slug) ? Number(slug) : null,
            slug: /^\d+$/.test(slug) ? null : slug,
          },
          schema: 'public',
        }),
      ]);

      if (settingsRes?.siteSettings) {
        const titleRaw = settingsRes.siteSettings.site_title;
        if (titleRaw && !titleRaw.toLowerCase().includes('link persons')) {
          setSiteTitle(titleRaw);
        }
        const logoRaw = settingsRes.siteSettings.logo_url || (settingsRes.siteSettings as any)?.logo;
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
        const qls = settingsRes.siteSettings.qr_logo_size;
        if (typeof qls === 'number' && qls > 0) {
          const clamped = Math.max(24, Math.min(96, qls));
          setQrLogoSize(clamped);
        }
      }

      const detail = response?.cafeDetail ?? null;
      setCafe(detail);

      const firstBranch = detail?.branches?.[0];
      setActiveBranchKey(firstBranch ? String(firstBranch.id) : '');
    } catch (err: any) {
      const message = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.cafes') });
      setError(message);
      setCafe(null);
      setActiveBranchKey('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCafeDetail();
  }, [slug]);

  useEffect(() => {
    if (!cafe?.image_url || !cafeImageRef.current || lightGalleryInstance.current) {
      return;
    }

    loadLightGallery().then(({ lightGallery, lgZoom, lgFullscreen }) => {
      if (cafeImageRef.current && !lightGalleryInstance.current) {
        lightGalleryInstance.current = lightGallery(cafeImageRef.current, {
          plugins: [lgZoom, lgFullscreen],
          speed: 350,
          zoom: true,
          zoomFromOrigin: true,
          download: false,
          counter: false,
        });
      }
    });

    return () => {
      lightGalleryInstance.current?.destroy();
      lightGalleryInstance.current = null;
    };
  }, [cafe?.image_url]);

  const renderStars = (value: number): string => {
    const fullStars = Math.max(0, Math.min(5, Math.round(value)));
    return `${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}`;
  };

  const branchLocationLabel = (branch: CafeBranch): string => {
    const comuna = (branch.city ?? branch.state ?? '').trim();
    return comuna !== '' ? `${branch.name} · ${comuna}` : branch.name;
  };

  const branches = useMemo(() => cafe?.branches ?? [], [cafe?.branches]);
  const isManyBranches = branches.length > 3;
  const currentBranchIndex = useMemo(() => {
    const idx = branches.findIndex((b) => String(b.id) === activeBranchKey);
    return idx >= 0 ? idx : 0;
  }, [branches, activeBranchKey]);

  const handlePrevBranch = () => {
    if (branches.length <= 1) return;
    const nextIdx = (currentBranchIndex - 1 + branches.length) % branches.length;
    setActiveBranchKey(String(branches[nextIdx].id));
  };

  const handleNextBranch = () => {
    if (branches.length <= 1) return;
    const nextIdx = (currentBranchIndex + 1) % branches.length;
    setActiveBranchKey(String(branches[nextIdx].id));
  };


  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: APP_CURRENCY,
      maximumFractionDigits: APP_CURRENCY_FRACTION_DIGITS,
    }).format(value);
  };

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (!activeBranch) {
      return;
    }

    try {
      setSubmittingReview(true);
      setSubmitError(null);
      setSubmitMessage(null);

      const mutation = `
        mutation CreateCafeBranchReview($branchId: ID!, $rating: Int!, $comment: String) {
          createCafeBranchReview(branch_id: $branchId, rating: $rating, comment: $comment) {
            id
          }
        }
      `;

      await graphqlRequest<CreateReviewResponse>({
        query: mutation,
        variables: {
          branchId: activeBranch.id,
          rating,
          comment: comment.trim() || null,
        },
        schema: 'default',
        authenticated: true,
      });

      setComment('');
      setRating(5);
      setSubmitMessage(t('cafes.detail.review_success'));
      await loadCafeDetail();
    } catch (err: any) {
      const message = err?.response?.errors?.[0]?.message || err?.message || t('cafes.detail.review_error');
      setSubmitError(message);
    } finally {
      setSubmittingReview(false);
    }
  };

  const getShareUrl = (): string => {
    if (typeof window === 'undefined') {
      return '';
    }

    return window.location.href;
  };

  const openShareDialog = (): void => {
    setShareMessage(null);
    setShowShareDialog(true);
  };

  const closeShareDialog = (): void => {
    setShowShareDialog(false);
  };

  const handleCopyShareUrl = async (): Promise<void> => {
    const shareUrl = getShareUrl();
    if (shareUrl === '') {
      setShareMessage(t('cafes.detail.share_error'));
      return;
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const tempInput = document.createElement('input');
        tempInput.value = shareUrl;
        document.body.appendChild(tempInput);
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
      }

      setShareMessage(t('cafes.detail.share_copied'));
    } catch {
      setShareMessage(t('cafes.detail.share_error'));
    }
  };

  const handleNativeShare = async (): Promise<void> => {
    const shareUrl = getShareUrl();
    if (!cafe || !(typeof navigator !== 'undefined' && 'share' in navigator) || shareUrl === '') {
      return;
    }

    try {
      await navigator.share({
        title: cafe.name,
        text: cafe.description || cafe.name,
        url: shareUrl,
      });
    } catch {
      // Ignore canceled share dialog to avoid noisy UI errors.
    }
  };

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
    return () => {
      cancelled = true;
    };
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
    borderCol: string = '#6f4e37',
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
    if (!cafe) return;
    setDownloadingQr(true);

    try {
      const cafeUrl = `${window.location.origin}/cafes/${cafe.slug || slug}`;
      const resolvedSiteName = siteTitle || (typeof document !== 'undefined' && document.title && !document.title.toLowerCase().includes('link persons') ? document.title.split(' - ').pop()?.trim() : '') || 'Only Models';
      const displayName = cafe.name;
      const branchLocation = activeBranch?.city || activeBranch?.state || '';
      const branchesCountText = cafe.branches_count && cafe.branches_count > 1 ? `${cafe.branches_count} sucursales` : branchLocation;
      const ratingText = typeof cafe.average_rating === 'number' && cafe.average_rating > 0 ? `${cafe.average_rating.toFixed(1)} ★` : '';
      const detailTxt = [branchesCountText, ratingText].filter(Boolean).join(' · ');

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

      // 2. Preload Cafe Image
      let loadedCafeImg: HTMLImageElement | null = null;
      let cafeImgSrc = cafe.image_url;
      if (cafeImgSrc) {
        if (!cafeImgSrc.startsWith('http') && !cafeImgSrc.startsWith('data:')) {
          const backendBase = String((import.meta as any).env?.VITE_BACKEND_URL || BACKEND_URL).replace(/\/$/, '');
          cafeImgSrc = `${backendBase}${cafeImgSrc.startsWith('/') ? '' : '/'}${cafeImgSrc}`;
        }
        try {
          const img = new Image();
          if (!cafeImgSrc.startsWith('data:')) img.crossOrigin = 'anonymous';
          img.src = cafeImgSrc;
          await new Promise<void>((resolve, reject) => {
            if (img.complete) return resolve();
            img.onload = () => resolve();
            img.onerror = () => reject();
          });
          loadedCafeImg = img;
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
          value={cafeUrl}
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
        if (loadedCafeImg) {
          ctx.save();
          if ('filter' in ctx) {
            ctx.filter = 'blur(45px) brightness(0.65)';
            drawImageCover(ctx, loadedCafeImg, -50, -50, W + 100, H + 100);
            ctx.filter = 'none';
          } else {
            drawImageCover(ctx, loadedCafeImg, 0, 0, W, H);
          }
          ctx.restore();
        } else {
          const grad = ctx.createLinearGradient(0, 0, 0, H);
          grad.addColorStop(0, '#3e2723');
          grad.addColorStop(1, '#1b1b1b');
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, W, H);
        }
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        // Top Branding Pill
        const pillW = 440;
        const pillH = 50;
        const pillX = (W - pillW) / 2;
        const pillY = 120;
        drawRoundedRect(ctx, pillX, pillY, pillW, pillH, 25, 'rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.3)', 1.5);
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${resolvedSiteName.toUpperCase()} · CAFETERÍAS`, W / 2, pillY + pillH / 2);

        // Central White Card
        const cardW = 900;
        const cardH = 1420;
        const cardX = (W - cardW) / 2;
        const cardY = 220;
        drawRoundedRect(ctx, cardX, cardY, cardW, cardH, 48, '#FFFFFF');

        // Card Avatar
        const avatarR = 80;
        const avatarCY = cardY + 120;
        if (loadedCafeImg) {
          drawCircularAvatar(ctx, loadedCafeImg, W / 2, avatarCY, avatarR, '#6f4e37', 6);
        }

        // Display Name & detail
        ctx.fillStyle = '#111827';
        ctx.font = 'bold 44px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(displayName, W / 2, avatarCY + 115);

        if (detailTxt) {
          ctx.fillStyle = '#6f4e37';
          ctx.font = 'bold 26px system-ui, -apple-system, sans-serif';
          ctx.fillText(detailTxt, W / 2, avatarCY + 165);
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
        ctx.fillText(t('cafes.detail.qr_cta_scan', 'Escanea para ver información, sucursales y reseñas'), W / 2, cardY + 1120);

        ctx.fillStyle = '#6f4e37';
        ctx.font = '600 26px system-ui, -apple-system, sans-serif';
        ctx.fillText(cafeUrl.replace(/^https?:\/\//, ''), W / 2, cardY + 1170);

        const badgePillW = 380;
        const badgePillH = 46;
        const badgePillX = (W - badgePillW) / 2;
        const badgePillY = cardY + 1225;
        drawRoundedRect(ctx, badgePillX, badgePillY, badgePillW, badgePillH, 23, '#f3f4f6');
        ctx.fillStyle = '#4b5563';
        ctx.font = 'bold 20px system-ui, -apple-system, sans-serif';
        ctx.fillText('☕ CAFETERÍA DESTACADA', W / 2, badgePillY + badgePillH / 2);

        // Subtitle
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = '500 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(`Encuéntranos en ${resolvedSiteName}`, W / 2, 1720);

      } else if (format === 'feed') {
        // Feed 1:1 (1080 x 1080)
        if (loadedCafeImg) {
          ctx.save();
          if ('filter' in ctx) {
            ctx.filter = 'blur(40px) brightness(0.65)';
            drawImageCover(ctx, loadedCafeImg, -40, -40, W + 80, H + 80);
            ctx.filter = 'none';
          } else {
            drawImageCover(ctx, loadedCafeImg, 0, 0, W, H);
          }
          ctx.restore();
        } else {
          ctx.fillStyle = '#2d1810';
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
        if (loadedCafeImg) {
          drawCircularAvatar(ctx, loadedCafeImg, avatarCX, avatarCY, avatarR, '#6f4e37', 4);
        }

        ctx.fillStyle = '#111827';
        ctx.font = 'bold 36px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(displayName, cardX + 165, cardY + 80);

        if (detailTxt) {
          ctx.fillStyle = '#6b7280';
          ctx.font = '600 26px system-ui, -apple-system, sans-serif';
          ctx.fillText(detailTxt, cardX + 165, cardY + 118);
        }

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
        ctx.fillText(t('cafes.detail.qr_cta_scan', 'Escanea para ver información, sucursales y reseñas'), W / 2, cardY + 775);

        ctx.fillStyle = '#6f4e37';
        ctx.font = '600 24px system-ui, -apple-system, sans-serif';
        ctx.fillText(cafeUrl.replace(/^https?:\/\//, ''), W / 2, cardY + 820);

        ctx.fillStyle = '#9ca3af';
        ctx.font = '500 20px system-ui, -apple-system, sans-serif';
        ctx.fillText(`${resolvedSiteName} · Directorio Oficial`, W / 2, cardY + 865);
      }

      const a = document.createElement('a');
      a.href = exportCanvas.toDataURL('image/jpeg', 0.95);
      a.download = `qr-cafe-${cafe.slug || slug}-${format}.jpg`;
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

  if (loading) {
    return (
      <Container className="cafe-detail-page py-4" aria-busy="true" aria-live="polite">
        <div className="cafe-detail-header-bar mb-3">
          <div className="apple-skeleton rounded-xl" style={{ width: '110px', height: '44px' }} />
          <div className="apple-skeleton rounded-xl" style={{ width: '90px', height: '44px' }} />
        </div>

        <div className="cafe-detail-hero-card mb-4 overflow-hidden position-relative" style={{ height: '360px', borderRadius: 'var(--rounded-2xl)' }}>
          <div className="apple-skeleton w-100 h-100" />
          <div style={{ position: 'absolute', bottom: '24px', left: '24px', right: '24px', zIndex: 2 }}>
            <div className="apple-skeleton apple-skeleton-text mb-2" style={{ width: '120px', height: '14px' }} />
            <div className="apple-skeleton apple-skeleton-text mb-3" style={{ width: '45%', height: '32px' }} />
            <div className="d-flex gap-2">
              <div className="apple-skeleton rounded-pill" style={{ width: '70px', height: '28px' }} />
              <div className="apple-skeleton rounded-pill" style={{ width: '110px', height: '28px' }} />
              <div className="apple-skeleton rounded-pill" style={{ width: '90px', height: '28px' }} />
            </div>
          </div>
        </div>

        <Row className="g-4">
          <Col lg={8}>
            <div className="apple-skeleton-card p-4 text-start">
              <div className="apple-skeleton apple-skeleton-text w-50 mb-3" style={{ height: '22px' }} />
              <div className="apple-skeleton apple-skeleton-text w-100 mb-2" style={{ height: '14px' }} />
              <div className="apple-skeleton apple-skeleton-text w-85 mb-4" style={{ height: '14px' }} />
              <div className="apple-skeleton rounded-2xl w-100" style={{ height: '180px' }} />
            </div>
          </Col>
          <Col lg={4}>
            <div className="apple-skeleton-card p-4 text-start">
              <div className="apple-skeleton apple-skeleton-text w-60 mb-3" style={{ height: '20px' }} />
              <div className="apple-skeleton rounded-xl w-100 mb-3" style={{ height: '60px' }} />
              <div className="apple-skeleton rounded-xl w-100" style={{ height: '60px' }} />
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error || !cafe) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">{error || t('cafes.detail.not_found')}</Alert>
        <Link to="/cafes" className="cafe-detail-back-btn btn btn-secondary">
          <i className="fas fa-chevron-left me-2" aria-hidden="true"></i>
          {t('common.back')}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="cafe-detail-page">
      {/* Barra Superior: Retroceso y Acciones */}
      <div className="cafe-detail-header-bar">
        <Link to="/cafes" className="cafe-detail-back-btn btn btn-secondary">
          <i className="fas fa-chevron-left me-2" aria-hidden="true"></i>
          {t('common.back')}
        </Link>

        <div className="d-flex gap-2 align-items-center">
          {cafe.website && (
            <a
              href={cafe.website}
              target="_blank"
              rel="noreferrer"
              className="cafe-detail-action-btn btn btn-secondary d-none d-sm-inline-flex"
            >
              <i className="fas fa-globe me-2" aria-hidden="true"></i>
              {t('home.view_cafe_site')}
            </a>
          )}
          <Button variant="secondary" className="cafe-detail-action-btn" onClick={openShareDialog}>
            <i className="fas fa-arrow-up-from-bracket me-2" aria-hidden="true"></i>
            {t('cafes.detail.share')}
          </Button>
        </div>
      </div>

      {/* Hero Card Visual */}
      <div className="cafe-detail-hero-card">
        {cafe.image_url ? (
          <div ref={cafeImageRef} className="cafe-detail-cover-wrapper">
            <a href={cafe.image_url} data-src={cafe.image_url} aria-label={t('cafes.detail.open_image')}>
              <img
                src={cafe.image_url}
                alt={cafe.name}
                width="1200"
                height="420"
                className="cafe-detail-cover"
                loading="eager"
              />
            </a>
            <div className="cafe-detail-cover-overlay">
              <div className="cafe-detail-hero-content">
                <span className="cafe-detail-hero-kicker">{t('cafes.detail.eyebrow')}</span>
                <h1 className="cafe-detail-hero-title">{cafe.name}</h1>
                <div className="cafe-detail-hero-badges">
                  {typeof cafe.average_rating === 'number' && (
                    <span className="cafe-pill-rating">
                      <i className="fas fa-star" aria-hidden="true"></i>
                      {cafe.average_rating.toFixed(1)}
                    </span>
                  )}
                  <span className="cafe-pill-meta">
                    <i className="fas fa-store me-1" aria-hidden="true"></i>
                    {t('home.branches_count_label', { count: cafe.branches_count ?? 0 })}
                  </span>
                  <span className="cafe-pill-meta">
                    <i className="fas fa-message me-1" aria-hidden="true"></i>
                    {t('home.reviews_count_label', { count: cafe.reviews_count ?? 0 })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 p-md-5">
            <span className="cafes-section-kicker">{t('cafes.detail.eyebrow')}</span>
            <h1 className="cafe-detail-hero-title text-dark">{cafe.name}</h1>
            <div className="cafe-detail-hero-badges mt-3">
              {typeof cafe.average_rating === 'number' && (
                <span className="cafe-pill-rating text-dark border">
                  <i className="fas fa-star" aria-hidden="true"></i> {cafe.average_rating.toFixed(1)}
                </span>
              )}
              <span className="cafe-pill-meta text-dark border">
                <i className="fas fa-store me-1" aria-hidden="true"></i>
                {t('home.branches_count_label', { count: cafe.branches_count ?? 0 })}
              </span>
              <span className="cafe-pill-meta text-dark border">
                <i className="fas fa-message me-1" aria-hidden="true"></i>
                {t('home.reviews_count_label', { count: cafe.reviews_count ?? 0 })}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contenido Principal en 2 Columnas (Editorial Layout) */}
      <Row className="g-4">
        {/* Columna Principal (Detalles, Sucursales, Creadores, Reseñas) */}
        <Col lg={8}>
          {/* Historia / Descripción del Café */}
          {cafe.description && (
            <div className="cafe-apple-card">
              <div className="cafe-card-heading">
                <h2 className="cafe-card-title">
                  <i className="fas fa-circle-info text-primary" aria-hidden="true"></i>
                  {t('cafes.detail.sections.details')}
                </h2>
              </div>
              <p className="fs-5 text-muted mb-0" style={{ lineHeight: 'var(--lh-normal)' }}>
                {cafe.description}
              </p>
            </div>
          )}

          {/* Sección de Sucursales */}
          <div className="cafe-apple-card">
            <div className="cafe-card-heading">
              <h2 className="cafe-card-title">
                <i className="fas fa-location-dot text-primary" aria-hidden="true"></i>
                {t('cafes.detail.sections.branches')}
              </h2>
              <Badge bg="secondary" className="rounded-pill">
                {(cafe.branches ?? []).length}
              </Badge>
            </div>

            {(cafe.branches ?? []).length === 0 ? (
              <Alert variant="light" className="mb-0 rounded-3 border">
                {t('cafes.detail.no_branches')}
              </Alert>
            ) : (
              <>
                {/* Selector de Sucursales: Dropdown Pop-Up y Segmentado Adaptativo */}
                {branches.length > 1 && (
                  <>
                    {/* Pop-Up Button Dropdown (Visible siempre en móvil, y en escritorio si hay más de 3 sucursales) */}
                    <div className={`apple-branch-picker-wrapper ${isManyBranches ? 'd-flex' : 'd-flex d-md-none'}`}>
                      <div className="d-flex align-items-center gap-2 w-100">
                        <Dropdown
                          className="flex-grow-1 apple-branch-dropdown"
                          show={branchDropdownOpen}
                          onToggle={(isOpen) => setBranchDropdownOpen(isOpen)}
                          autoClose={true}
                        >
                          <Dropdown.Toggle
                            variant="link"
                            id="branch-picker-dropdown"
                            className="apple-branch-picker-btn text-decoration-none"
                            aria-label={t('cafes.detail.select_branch')}
                          >
                            <div className="apple-branch-picker-content">
                              <div className="apple-branch-picker-icon">
                                <i className="fas fa-store" aria-hidden="true"></i>
                              </div>
                              <div className="apple-branch-picker-text text-start">
                                <div className="apple-branch-picker-kicker">
                                  {t('cafes.detail.sections.branches')} ({currentBranchIndex + 1} / {branches.length})
                                </div>
                                <div className="apple-branch-picker-title">
                                  {activeBranch?.name}
                                  {(activeBranch?.city || activeBranch?.state) && (
                                    <span className="apple-branch-picker-comuna">
                                      {' '}· {(activeBranch?.city ?? activeBranch?.state)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="apple-branch-picker-trailing">
                              <i className="fas fa-chevron-down" aria-hidden="true"></i>
                            </div>
                          </Dropdown.Toggle>

                          <Dropdown.Menu className="apple-liquid-glass-dropdown apple-branch-dropdown-menu w-100 shadow-lg">
                            <Dropdown.Header className="apple-branch-dropdown-header">
                              <i className="fas fa-location-dot me-2 text-primary" aria-hidden="true"></i>
                              {t('cafes.detail.select_branch')} ({branches.length})
                            </Dropdown.Header>
                            <div className="apple-branch-dropdown-scroll">
                              {branches.map((branch) => {
                                const isSelected = activeBranchKey === String(branch.id);
                                const comuna = (branch.city ?? branch.state ?? '').trim();
                                return (
                                  <Dropdown.Item
                                    key={branch.id}
                                    onClick={() => {
                                      setActiveBranchKey(String(branch.id));
                                      setBranchDropdownOpen(false);
                                    }}
                                    className={`apple-branch-menu-item ${isSelected ? 'active' : ''}`}
                                  >
                                    <div className="apple-branch-item-left">
                                      <div className={`apple-branch-item-icon ${isSelected ? 'active' : ''}`}>
                                        <i className="fas fa-store" aria-hidden="true"></i>
                                      </div>
                                      <div className="apple-branch-item-info">
                                        <div className="apple-branch-item-name">
                                          {branch.name}
                                          {comuna && <span className="text-muted fw-normal ms-1">· {comuna}</span>}
                                        </div>
                                        {branch.address && (
                                          <div className="apple-branch-item-address">
                                            <i className="fas fa-map-pin me-1 opacity-50" aria-hidden="true"></i>
                                            {branch.address}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    {isSelected && (
                                      <div className="apple-branch-item-check text-primary">
                                        <i className="fas fa-check" aria-hidden="true"></i>
                                      </div>
                                    )}
                                  </Dropdown.Item>
                                );
                              })}
                            </div>
                          </Dropdown.Menu>
                        </Dropdown>

                        {/* Botones Stepper Anterior / Siguiente */}
                        <div className="apple-branch-stepper d-flex align-items-center gap-1">
                          <button
                            type="button"
                            className="apple-branch-step-btn"
                            onClick={handlePrevBranch}
                            title={t('cafes.detail.prev_branch')}
                            aria-label={t('cafes.detail.prev_branch')}
                          >
                            <i className="fas fa-chevron-left" aria-hidden="true"></i>
                          </button>
                          <button
                            type="button"
                            className="apple-branch-step-btn"
                            onClick={handleNextBranch}
                            title={t('cafes.detail.next_branch')}
                            aria-label={t('cafes.detail.next_branch')}
                          >
                            <i className="fas fa-chevron-right" aria-hidden="true"></i>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Selector Segmentado de Sucursales (Solo escritorio si hay <= 3 sucursales) */}
                    {!isManyBranches && (
                      <div className="apple-segmented-control d-none d-md-flex" role="tablist">
                        {branches.map((branch) => (
                          <button
                            key={branch.id}
                            type="button"
                            role="tab"
                            aria-selected={activeBranchKey === String(branch.id)}
                            className={`apple-segment-btn ${activeBranchKey === String(branch.id) ? 'active' : ''}`}
                            onClick={() => setActiveBranchKey(String(branch.id))}
                          >
                            <i className="fas fa-store" aria-hidden="true"></i>
                            <span className="text-truncate">{branchLocationLabel(branch)}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Ficha de Información de la Sucursal Activa */}
                {activeBranch && (
                  <div className="apple-list-rows mt-3">
                    <div className="apple-list-row">
                      <span className="apple-list-row-label">
                        <i className="fas fa-signature text-muted" aria-hidden="true"></i>
                        {t('cafes.detail.fields.name')}
                      </span>
                      <span className="apple-list-row-value">{activeBranch.name}</span>
                    </div>

                    {activeBranch.address && (
                      <div className="apple-list-row">
                        <span className="apple-list-row-label">
                          <i className="fas fa-map-pin text-muted" aria-hidden="true"></i>
                          {t('cafes.detail.fields.address')}
                        </span>
                        <span className="apple-list-row-value">
                          <a
                            href={
                              activeBranch.google_maps_url && activeBranch.google_maps_url.startsWith('http') && !activeBranch.google_maps_url.includes('embed')
                                ? activeBranch.google_maps_url
                                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                    [cafe.name, activeBranch.name, activeBranch.address, activeBranch.city ?? activeBranch.state].filter(Boolean).join(', ')
                                  )}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="apple-address-pill"
                            title={t('cafes.detail.open_in_maps')}
                            aria-label={`${activeBranch.address} - ${t('cafes.detail.open_in_maps')}`}
                          >
                            <i className="fas fa-location-dot me-1 text-danger" aria-hidden="true"></i>
                            <span className="apple-address-text">{activeBranch.address}</span>
                            <i className="fas fa-arrow-up-right-from-square ms-1 apple-address-ext-icon" aria-hidden="true"></i>
                          </a>
                        </span>
                      </div>
                    )}

                    {(activeBranch.city || activeBranch.state) && (
                      <div className="apple-list-row">
                        <span className="apple-list-row-label">
                          <i className="fas fa-city text-muted" aria-hidden="true"></i>
                          {t('cafes.detail.fields.comuna')}
                        </span>
                        <span className="apple-list-row-value">
                          {(activeBranch.city ?? activeBranch.state) || '-'}
                        </span>
                      </div>
                    )}

                    {activeBranch.phone && (
                      <div className="apple-list-row">
                        <span className="apple-list-row-label">
                          <i className="fas fa-phone text-muted" aria-hidden="true"></i>
                          {t('cafes.detail.fields.phone')}
                        </span>
                        <span className="apple-list-row-value">
                          <a href={`tel:${activeBranch.phone}`} className="text-decoration-none">
                            {activeBranch.phone}
                          </a>
                        </span>
                      </div>
                    )}

                    <div className="apple-list-row">
                      <span className="apple-list-row-label">
                        <i className="fas fa-ticket text-muted" aria-hidden="true"></i>
                        {t('cafes.detail.fields.entry_price')}
                      </span>
                      <span className="apple-list-row-value">
                        {typeof activeBranch.entry_price === 'number' && activeBranch.entry_price > 0
                          ? formatCurrency(activeBranch.entry_price)
                          : t('cafes.detail.free_entry')}
                      </span>
                    </div>

                    <div className="apple-list-row">
                      <span className="apple-list-row-label">
                        <i className="fas fa-mug-hot text-muted" aria-hidden="true"></i>
                        {t('cafes.detail.fields.individual_consumption')}
                      </span>
                      <span className="apple-list-row-value">
                        {typeof activeBranch.consumo_individual === 'number' && activeBranch.consumo_individual > 0 ? (
                          <span className="badge text-bg-info rounded-pill px-3 py-1">
                            {formatCurrency(activeBranch.consumo_individual)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>

                    <div className="apple-list-row">
                      <span className="apple-list-row-label">
                        <i className="fas fa-cookie-bite text-muted" aria-hidden="true"></i>
                        {t('cafes.detail.fields.small_consumption')}
                      </span>
                      <span className="apple-list-row-value">
                        {typeof activeBranch.consumo_chica === 'number' && activeBranch.consumo_chica > 0 ? (
                          <span className="badge text-bg-info rounded-pill px-3 py-1">
                            {formatCurrency(activeBranch.consumo_chica)}
                          </span>
                        ) : (
                          '-'
                        )}
                      </span>
                    </div>

                    {activeBranch.description && (
                      <div className="apple-list-row">
                        <span className="apple-list-row-label">
                          <i className="fas fa-align-left text-muted" aria-hidden="true"></i>
                          {t('cafes.detail.fields.description')}
                        </span>
                        <span className="apple-list-row-value text-muted fw-normal text-start">
                          {activeBranch.description}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Creadores de la Sucursal */}
          {activeBranch && (
            <div className="cafe-apple-card">
              <div className="cafe-card-heading">
                <h2 className="cafe-card-title">
                  <i className="fas fa-users text-primary" aria-hidden="true"></i>
                  {t('cafes.detail.branch_creators')}
                </h2>
                <span className="small text-muted">
                  {(activeBranch.creators ?? []).length}
                </span>
              </div>

              {(activeBranch.creators ?? []).length === 0 ? (
                <p className="text-muted mb-0">{t('cafes.detail.no_creators')}</p>
              ) : (
                <>
                  <div className="cafe-creators-list">
                    {(activeBranch.creators ?? []).map((creator) => (
                      <Link
                        key={creator.id}
                        to={`/u/${creator.username}`}
                        className="cafe-creator-pill"
                      >
                        {creator.avatar_thumb || creator.avatar_url ? (
                          <img
                            src={creator.avatar_thumb || creator.avatar_url}
                            alt={creator.name || creator.username}
                            width={72}
                            height={72}
                            className="cafe-creator-avatar"
                          />
                        ) : (
                          <div className="cafe-creator-avatar-placeholder">
                            {(creator.name || creator.username || '?').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="cafe-creator-name">
                          {creator.name || `@${creator.username}`}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {activeBranchTags.length > 0 && (
                    <div className="mt-4 pt-3 border-top">
                      <p className="text-muted small mb-2">{t('cafes.detail.creators_tags')}</p>
                      <div className="d-flex flex-wrap gap-2">
                        {activeBranchTags.map((tag) => {
                          const tagSlug = String(tag.name).trim().toLowerCase().replace(/\s+/g, '-');
                          return (
                            <Badge key={tag.id} bg={(tag.color as any) || 'secondary'} className="rounded-pill px-3 py-2">
                              <Link to={`/t/${tagSlug}`} className="text-white text-decoration-none">
                                #{tag.name}
                              </Link>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Reseñas de la Sucursal */}
          {activeBranch && (
            <div className="cafe-apple-card">
              <div className="cafe-card-heading">
                <h2 className="cafe-card-title">
                  <i className="fas fa-star text-warning" aria-hidden="true"></i>
                  {t('cafes.detail.branch_reviews')}
                </h2>
                <Badge bg="warning" text="dark" className="rounded-pill px-3 py-2">
                  {typeof activeBranch.average_rating === 'number'
                    ? `${activeBranch.average_rating.toFixed(1)} ★ (${activeBranch.reviews_count ?? 0})`
                    : t('cafes.detail.no_reviews_short')}
                </Badge>
              </div>

              {(activeBranch.reviews ?? []).length === 0 ? (
                <p className="text-muted mb-4">{t('cafes.detail.no_reviews')}</p>
              ) : (
                <div className="d-flex flex-column gap-3 mb-4">
                  {(activeBranch.reviews ?? []).map((review) => (
                    <div key={review.id} className="cafe-review-item">
                      <div className="cafe-review-header">
                        <span className="fw-bold">{t('home.anonymous_reviewer')}</span>
                        <span className="badge bg-warning text-dark rounded-pill">
                          {renderStars(review.rating)} ({review.rating}/5)
                        </span>
                      </div>
                      {review.comment && (
                        <p className="cafe-review-comment">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Formulario de Reseña */}
              {isAuthenticated ? (
                <Form onSubmit={handleSubmitReview} className="border-top pt-4">
                  <h3 className="h6 fw-bold mb-3">
                    <i className="fas fa-pen-to-square me-2 text-primary" aria-hidden="true"></i>
                    {t('cafes.detail.write_review', 'Escribir una reseña')}
                  </h3>
                  {submitMessage && <Alert variant="success" className="py-2 rounded-3">{submitMessage}</Alert>}
                  {submitError && <Alert variant="danger" className="py-2 rounded-3">{submitError}</Alert>}

                  <Row className="g-3">
                    <Col md={3}>
                      <Form.Group controlId="review-rating">
                        <Form.Label className="small fw-semibold text-muted">{t('cafes.detail.form.rating')}</Form.Label>
                        <Form.Select
                          value={rating}
                          onChange={(event) => setRating(Number(event.target.value))}
                          disabled={submittingReview}
                          className="rounded-pill"
                        >
                          <option value={5}>5 ★★★★★</option>
                          <option value={4}>4 ★★★★☆</option>
                          <option value={3}>3 ★★★☆☆</option>
                          <option value={2}>2 ★★☆☆☆</option>
                          <option value={1}>1 ★☆☆☆☆</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={9}>
                      <Form.Group controlId="review-comment">
                        <Form.Label className="small fw-semibold text-muted">{t('cafes.detail.form.comment')}</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          maxLength={1000}
                          placeholder={t('cafes.detail.form.comment_placeholder')}
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          disabled={submittingReview}
                          className="rounded-3"
                        />
                      </Form.Group>
                    </Col>
                  </Row>

                  <div className="mt-3 d-flex justify-content-end">
                    <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={submittingReview}>
                      {submittingReview ? t('cafes.detail.form.sending') : t('cafes.detail.form.submit')}
                    </Button>
                  </div>
                </Form>
              ) : (
                <Alert variant="info" className="mb-0 rounded-4">
                  <i className="fas fa-circle-info me-2" aria-hidden="true"></i>
                  {t('cafes.detail.login_to_review')} <Link to="/login" className="fw-bold">{t('nav.login')}</Link>
                </Alert>
              )}
            </div>
          )}
        </Col>

        {/* Columna Lateral (Acciones Rápidas / Resumen) */}
        <Col lg={4}>
          <div className="cafe-action-card">
            {/* Tarjeta de Acciones Rápidas */}
            <div className="cafe-apple-card">
              <h3 className="cafe-card-title mb-3">
                <i className="fas fa-bolt text-warning" aria-hidden="true"></i>
                {t('cafes.detail.quick_actions', 'Acciones Rápidas')}
              </h3>

              {activeBranch?.google_maps_url && (
                <button
                  type="button"
                  className="cafe-primary-action-btn"
                  onClick={() => setShowMapDialog(true)}
                >
                  <i className="fas fa-map-location-dot" aria-hidden="true"></i>
                  {t('cafes.detail.fields.maps')}
                </button>
              )}

              {(activeBranch?.website || cafe.website) && (
                <a
                  href={activeBranch?.website || cafe.website}
                  target="_blank"
                  rel="noreferrer"
                  className="cafe-secondary-action-btn btn btn-secondary"
                >
                  <i className="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  {t('home.view_cafe_site')}
                </a>
              )}

              {activeBranch?.menu_qr_url && (
                <a
                  href={activeBranch.menu_qr_url}
                  target="_blank"
                  rel="noreferrer"
                  className="cafe-secondary-action-btn btn btn-secondary"
                >
                  <i className="fas fa-qrcode" aria-hidden="true"></i>
                  {t('cafes.detail.view_menu')}
                </a>
              )}

              <Button
                variant="secondary"
                className="cafe-secondary-action-btn"
                onClick={openShareDialog}
              >
                <i className="fas fa-share-nodes" aria-hidden="true"></i>
                {t('cafes.detail.share')}
              </Button>
            </div>

            {/* Tarjeta Código QR de la Cafetería */}
            <div className="cafe-apple-card cafe-qr-card">
              <h3 className="cafe-card-title mb-3">
                <i className="fas fa-qrcode text-primary" aria-hidden="true"></i>
                {t('cafes.detail.qr_title', 'Código QR de la Cafetería')}
              </h3>
              <div className="cafe-qr-canvas-container">
                <QRCodeCanvas
                  ref={qrCanvasRef}
                  value={typeof window !== 'undefined' ? `${window.location.origin}/cafes/${cafe.slug || slug}` : ''}
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
                    className="cafe-secondary-action-btn d-inline-flex align-items-center mt-0"
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
                        <i className="fas fa-arrow-down-to-bracket me-2" aria-hidden="true"></i>
                        {t('cafes.detail.download_qr_story', 'Tarjeta Historia (9:16)')}
                      </>
                    )}
                  </Button>
                  <Dropdown.Toggle
                    split
                    variant="secondary"
                    className="mt-0 rounded-pill px-3"
                    id="dropdown-cafe-qr-download"
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
                      {t('cafes.detail.qr_story_opt', 'Tarjeta Historia / Reels (9:16)')}
                    </Dropdown.Item>
                    <Dropdown.Item
                      onClick={() => {
                        handleDownloadQr('feed');
                        setShowQrDropdown(false);
                      }}
                      className="py-2"
                    >
                      <i className="fas fa-square me-2 text-success"></i>
                      {t('cafes.detail.qr_feed_opt', 'Tarjeta Feed / Post (1:1)')}
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
                      {t('cafes.detail.qr_classic_opt', 'Solo Código QR (1024x1024)')}
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <p className="small mb-0">
                <a
                  href={typeof window !== 'undefined' ? `${window.location.origin}/cafes/${cafe.slug || slug}` : ''}
                  className="cafe-qr-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  {typeof window !== 'undefined' ? `${window.location.origin}/cafes/${cafe.slug || slug}` : ''}
                </a>
              </p>
            </div>

            {/* Ficha Resumen */}
            {activeBranch && (
              <div className="cafe-apple-card">
                <h4 className="fs-6 fw-bold mb-3 text-muted">
                  <i className="fas fa-circle-check me-2 text-success" aria-hidden="true"></i>
                  {t('cafes.detail.summary_title', 'Información Clave')}
                </h4>
                <div className="d-flex flex-column gap-2 small">
                  <div className="d-flex justify-content-between">
                    <span className="text-muted">{t('cafes.detail.fields.entry_price')}:</span>
                    <span className="fw-semibold">
                      {typeof activeBranch.entry_price === 'number' && activeBranch.entry_price > 0
                        ? formatCurrency(activeBranch.entry_price)
                        : t('cafes.detail.free_entry')}
                    </span>
                  </div>
                  {activeBranch.city && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">{t('cafes.detail.fields.comuna')}:</span>
                      <span className="fw-semibold">{activeBranch.city}</span>
                    </div>
                  )}
                  {activeBranch.postal_code && (
                    <div className="d-flex justify-content-between">
                      <span className="text-muted">{t('cafes.detail.fields.postal_code')}:</span>
                      <span className="fw-semibold">{activeBranch.postal_code}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>

      {/* Modal de Mapa Google Maps */}
      <Modal show={showMapDialog} onHide={() => setShowMapDialog(false)} size="lg" centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="h5 fw-bold">{activeBranch?.name || t('cafes.detail.fields.maps')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-3">
          {activeBranch?.google_maps_url && (
            <div className="rounded-4 overflow-hidden border">
              <iframe
                src={activeBranch.google_maps_url}
                width="100%"
                height="420"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={t('cafes.detail.fields.maps_iframe_title')}
              />
            </div>
          )}
        </Modal.Body>
      </Modal>

      {/* Modal de Compartir */}
      <Modal show={showShareDialog} onHide={closeShareDialog} centered>
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="h5 fw-bold">{t('cafes.detail.share_title')}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">
          <p className="text-muted small mb-3">{t('cafes.detail.share_description')}</p>
          <Form.Control
            type="text"
            readOnly
            value={getShareUrl()}
            onFocus={(event) => event.currentTarget.select()}
            className="rounded-3"
          />
          {shareMessage && (
            <Alert variant="info" className="mt-3 py-2 mb-0 rounded-3">
              {shareMessage}
            </Alert>
          )}
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0 d-flex gap-2 justify-content-between flex-wrap">
          <div className="d-flex gap-2 flex-wrap">
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button variant="dark" className="rounded-pill" onClick={handleNativeShare}>
                <i className="fas fa-share-nodes me-2" aria-hidden="true"></i>
                {t('cafes.detail.share_native')}
              </Button>
            )}
            <Dropdown as={ButtonGroup}>
              <Button
                variant="outline-primary"
                className="rounded-pill"
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
                    <i className="fas fa-qrcode me-2" aria-hidden="true"></i>
                    {t('cafes.detail.download_qr', 'Descargar QR')}
                  </>
                )}
              </Button>
              <Dropdown.Toggle
                split
                variant="outline-primary"
                className="rounded-pill"
                id="dropdown-modal-qr-download"
                disabled={downloadingQr}
              />
              <Dropdown.Menu className="shadow-lg border-0 rounded-3 py-2">
                <Dropdown.Item onClick={() => handleDownloadQr('story')} className="py-2">
                  <i className="fas fa-mobile-screen me-2 text-primary"></i>
                  {t('cafes.detail.qr_story_opt', 'Tarjeta Historia / Reels (9:16)')}
                </Dropdown.Item>
                <Dropdown.Item onClick={() => handleDownloadQr('feed')} className="py-2">
                  <i className="fas fa-square me-2 text-success"></i>
                  {t('cafes.detail.qr_feed_opt', 'Tarjeta Feed / Post (1:1)')}
                </Dropdown.Item>
                <Dropdown.Divider />
                <Dropdown.Item onClick={() => handleDownloadQr('classic')} className="py-2 text-muted">
                  <i className="fas fa-qrcode me-2"></i>
                  {t('cafes.detail.qr_classic_opt', 'Solo Código QR (1024x1024)')}
                </Dropdown.Item>
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <div className="d-flex gap-2 ms-auto">
            <Button variant="secondary" className="rounded-pill" onClick={closeShareDialog}>{t('common.close')}</Button>
            <Button variant="dark" className="rounded-pill" onClick={handleCopyShareUrl}>
              <i className="fas fa-copy me-2" aria-hidden="true"></i>
              {t('cafes.detail.share_copy')}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
