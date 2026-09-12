import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Col,
  Container,
  Dropdown,
  Form,
  Modal,
  Row,
  Spinner,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { APP_CURRENCY, APP_CURRENCY_FRACTION_DIGITS } from '../config/constants';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Cafe, CafeBranch } from '../types';
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-fullscreen.css';

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

      const response = await graphqlRequest<CafeDetailResponse>({
        query,
        variables: {
          id: /^\d+$/.test(slug) ? Number(slug) : null,
          slug: /^\d+$/.test(slug) ? null : slug,
        },
        schema: 'public',
      });

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
                        <Dropdown className="flex-grow-1 apple-branch-dropdown">
                          <Dropdown.Toggle
                            as="button"
                            id="branch-picker-dropdown"
                            className="apple-branch-picker-btn"
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
                                    onClick={() => setActiveBranchKey(String(branch.id))}
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
        <Modal.Footer className="border-top-0 pt-0 d-flex gap-2 justify-content-between">
          <div>
            {typeof navigator !== 'undefined' && 'share' in navigator && (
              <Button variant="dark" className="rounded-pill" onClick={handleNativeShare}>
                <i className="fas fa-share-nodes me-2" aria-hidden="true"></i>
                {t('cafes.detail.share_native')}
              </Button>
            )}
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
