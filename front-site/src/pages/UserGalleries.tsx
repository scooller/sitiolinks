import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Spinner, Placeholder } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition, appleEase } from '../lib/animations';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import Paginator from '../components/Paginator';
import OptimizedImage from '../components/OptimizedImage';
import LikeButton from '../components/LikeButton';
import type { GalleryPaginator, User } from '../types';
import { useTranslation } from 'react-i18next';

interface UserResponse {
  user: User | null;
}

export default function UserGalleries(): ReactElement {
  const { t } = useTranslation();
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [galleries, setGalleries] = useState<GalleryPaginator | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [galleriesLoading, setGalleriesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [perPage] = useState<number>(12);

  useEffect(() => {
    loadInitial();
  }, [username]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const term = searchInput && searchInput.length >= 3 ? searchInput : '';
      setSearchTerm(term);
    }, 350);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    if (!user) return;
    setGalleriesLoading(true);
    loadGalleries(user.id);
  }, [currentPage, searchTerm]);

  const loadInitial = async () => {
    try {
      setError(null);
      setImagesLoaded(new Set());

      const userResponse = await graphqlRequest<UserResponse>({
        query: `
          query GetUser($username: String!) {
            user(username: $username) {
              id
              name
              username
              avatar_url
              avatar_thumb
              avatar_thumb_webp
              avatar_small_webp
              avatar_medium_webp
            }
          }
        `,
        variables: { username },
      });

      if (!userResponse.user) {
        setError(t('errors.user_not_found', 'Usuario no encontrado'));
        return;
      }

      setUser(userResponse.user);
      await loadGalleries(userResponse.user.id);
    } catch (err: any) {
      console.error('❌ Error en loadInitial:', err);
      const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.user_galleries', 'galerías') });
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoadingUser(false);
    }
  };

  const loadGalleries = async (uid: string | number) => {
    try {
      const galleriesResponse = await graphqlRequest<{ galleries: GalleryPaginator }>({
        query: queries.galleries,
        variables: {
          user_id: Number(uid),
          page: currentPage,
          per_page: perPage,
          search: searchTerm || undefined,
        },
        ...(isAuthenticated ? { schema: 'default', authenticated: true } : {}),
      });
      setGalleries(galleriesResponse.galleries);
    } catch (err: any) {
      console.error('❌ Error cargando galerías del usuario:', err);
      const errorMessage = err?.response?.errors?.[0]?.message || err?.message;
      if (errorMessage) {
        setError(`Error al cargar galerías: ${errorMessage}`);
      }
    } finally {
      setGalleriesLoading(false);
    }
  };

  const handleImageLoad = (galleryId: string | number) => {
    setImagesLoaded(prev => new Set(prev).add(String(galleryId)));
  };

  const getVisibilityBadge = (visibility: string): { bgClass: string; text: string; icon: string } => {
    const badges: Record<string, { bgClass: string; text: string; icon: string }> = {
      public: { bgClass: 'public', text: t('galleries.visibility_public', 'Pública'), icon: 'fa-globe' },
      private: { bgClass: 'private', text: t('galleries.visibility_private', 'Privada'), icon: 'fa-lock' },
      followers: { bgClass: 'followers', text: t('galleries.visibility_followers', 'Seguidores'), icon: 'fa-users' },
    };
    return badges[visibility] || { bgClass: 'public', text: visibility, icon: 'fa-eye' };
  };

  if (loadingUser) {
    return (
      <Container className="py-4" aria-busy="true" aria-live="polite">
        {/* Segmented Control Skeleton */}
        <div className="profile-segmented-control mb-4">
          <div className="profile-segment-btn apple-skeleton" style={{ height: '44px' }} />
          <div className="profile-segment-btn apple-skeleton" style={{ height: '44px' }} />
        </div>

        {/* Creator Hero Skeleton */}
        <div className="gallery-creator-hero">
          <div className="gallery-creator-info">
            <div className="gallery-creator-avatar-wrap">
              <div
                className="apple-skeleton gallery-creator-avatar"
                style={{ width: '64px', height: '64px' }}
              />
            </div>
            <div>
              <div className="apple-skeleton apple-skeleton-text mb-2" style={{ width: '160px', height: '20px' }} />
              <div className="apple-skeleton apple-skeleton-text" style={{ width: '90px', height: '14px' }} />
            </div>
          </div>
          <div className="gallery-creator-count-badge apple-skeleton" style={{ width: '95px', height: '32px' }} />
        </div>

        {/* Search Bar Skeleton */}
        <div className="gallery-search-bar mb-5">
          <div className="apple-skeleton rounded-full w-100" style={{ height: '48px' }} />
        </div>

        {/* Galleries Grid Skeleton */}
        <Row xs={1} md={2} lg={3} className="g-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Col key={idx}>
              <div className="gallery-apple-card">
                <div className="gallery-card-media-wrap">
                  <div className="apple-skeleton" style={{ width: '100%', height: '100%' }} />
                  <div
                    className="apple-skeleton rounded-pill"
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      width: '64px',
                      height: '24px',
                      zIndex: 4,
                    }}
                  />
                </div>
                <div className="gallery-card-body">
                  <div className="apple-skeleton apple-skeleton-text w-75 mb-2" style={{ height: '18px' }} />
                  <div className="apple-skeleton apple-skeleton-text w-100 mb-1" style={{ height: '12px' }} />
                  <div className="apple-skeleton apple-skeleton-text w-60 mb-3" style={{ height: '12px' }} />
                  <div className="gallery-card-footer">
                    <div className="apple-skeleton apple-skeleton-text" style={{ width: '70px', height: '13px' }} />
                    <div className="apple-skeleton rounded-pill" style={{ width: '48px', height: '24px' }} />
                  </div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <div className="gallery-error-card">
          <div className="gallery-error-halo">
            <i className="fas fa-triangle-exclamation" aria-hidden="true" />
          </div>
          <h2 className="gallery-error-title">{t('common.error', 'Error')}</h2>
          <p className="gallery-error-desc">{error}</p>
          <div className="galleries-empty-actions">
            <button
              type="button"
              className="galleries-empty-cta"
              onClick={loadInitial}
            >
              <i className="fas fa-rotate-right" aria-hidden="true" />
              <span>{t('common.retry', 'Reintentar')}</span>
            </button>
            <Link to="/explorar" className="galleries-secondary-cta">
              <i className="fas fa-compass" aria-hidden="true" />
              <span>{t('nav.explore', 'Explorar')}</span>
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      {/* 1. Apple Segmented Control para alternar entre Perfil y Galerías */}
      <div className="profile-segmented-control mb-4" role="tablist">
        <button
          type="button"
          className="profile-segment-btn"
          onClick={() => navigate(`/u/${username}`)}
          role="tab"
          aria-selected="false"
        >
          <i className="fas fa-id-card me-1" aria-hidden="true" />
          <span>{t('profile.tab_profile', 'Perfil')}</span>
        </button>
        <button
          type="button"
          className="profile-segment-btn active"
          role="tab"
          aria-selected="true"
        >
          <i className="fas fa-images me-1" aria-hidden="true" />
          <span>
            {t('profile.tab_galleries', 'Galerías')}{' '}
            {galleries?.paginatorInfo?.total ? `(${galleries.paginatorInfo.total})` : ''}
          </span>
        </button>
      </div>

      {/* 2. Hero del Creador Apple Liquid Glass */}
      {user && (
        <motion.div
          className="gallery-creator-hero"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={defaultTransition}
        >
          <div className="gallery-creator-info">
            <Link to={`/u/${user.username}`} className="gallery-creator-avatar-wrap" aria-label={`Perfil de @${user.username}`}>
              <OptimizedImage
                webpUrl={(user as any).avatar_thumb_webp}
                fallbackUrl={(user as any).avatar_thumb || user.avatar_url}
                smallWebpUrl={(user as any).avatar_small_webp}
                mediumWebpUrl={(user as any).avatar_medium_webp}
                alt={user.username}
                className="gallery-creator-avatar"
                size={64}
                showSkeleton={true}
              />
            </Link>
            <div>
              <h1 className="gallery-creator-title">{t('galleries.of_user', { name: user.name })}</h1>
              <Link to={`/u/${user.username}`} className="gallery-creator-handle">
                <i className="fas fa-user-circle me-1" aria-hidden="true" />
                @{user.username}
              </Link>
            </div>
          </div>

          <div className="gallery-creator-count-badge">
            <i className="fas fa-images text-primary" aria-hidden="true" />
            <span>{galleries?.paginatorInfo?.total || 0} {t('galleries.of_user_simple', 'Galerías')}</span>
          </div>
        </motion.div>
      )}

      {/* 3. Barra de Búsqueda Liquid Glass */}
      <div className="gallery-search-bar">
        <div className="gallery-search-input-wrap">
          <i className="fas fa-search gallery-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="gallery-search-input"
            placeholder={t('galleries.search_placeholder', 'Buscar galerías...')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            aria-label={t('galleries.search_placeholder', 'Buscar galerías...')}
          />
          {searchInput && (
            <button
              type="button"
              className="gallery-search-clear"
              onClick={() => {
                setSearchInput('');
                setSearchTerm('');
              }}
              aria-label={t('galleries.clear_search', 'Limpiar búsqueda')}
            >
              <i className="fas fa-times-circle" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Contenido de Galerías */}
      {!galleries || galleries.data.length === 0 ? (
        <motion.div
          className="galleries-empty-card"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={defaultTransition}
        >
          <div className="galleries-empty-halo">
            <i className={`fas ${searchTerm ? 'fa-magnifying-glass' : 'fa-images'}`} aria-hidden="true" />
          </div>
          <h2 className="galleries-empty-title">
            {searchTerm ? t('galleries.empty_search_title', 'Sin resultados de búsqueda') : t('galleries.empty_user_title', 'Aún no hay galerías')}
          </h2>
          <p className="galleries-empty-desc">
            {searchTerm
              ? t('galleries.empty_search_desc', 'No encontramos ninguna galería que coincida con tu búsqueda.')
              : t('galleries.empty_user_desc', 'Este creador todavía no ha publicado colecciones de fotos.')}
          </p>
          <div className="galleries-empty-actions">
            {searchTerm ? (
              <button
                type="button"
                className="galleries-empty-cta"
                onClick={() => {
                  setSearchInput('');
                  setSearchTerm('');
                }}
              >
                <i className="fas fa-rotate-left" aria-hidden="true" />
                <span>{t('galleries.clear_search', 'Limpiar búsqueda')}</span>
              </button>
            ) : (
              <Link to={`/u/${username}`} className="galleries-empty-cta">
                <i className="fas fa-user" aria-hidden="true" />
                <span>{t('galleries.view_profile_cta', 'Ver perfil del creador')}</span>
              </Link>
            )}
            <Link to="/explorar" className="galleries-secondary-cta">
              <i className="fas fa-compass" aria-hidden="true" />
              <span>{t('nav.explore', 'Explorar otros creadores')}</span>
            </Link>
          </div>
        </motion.div>
      ) : (
        <>
          <Row xs={1} md={2} lg={3} className="g-4">
            {galleries.data.map((gallery, index) => {
              const isLoaded = imagesLoaded.has(String(gallery.id));
              const galleryId = String(gallery.id);
              const badge = getVisibilityBadge(gallery.visibility);

              return (
                <Col key={galleryId}>
                  <motion.div
                    className="gallery-apple-card"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, ease: appleEase, delay: Math.min(index * 0.04, 0.3) }}
                  >
                    <Link to={`/galleries/${gallery.id}`} className="text-decoration-none">
                      <div className="gallery-card-media-wrap">
                        <span className={`gallery-visibility-pill ${badge.bgClass}`}>
                          <i className={`fas ${badge.icon} me-1`} aria-hidden="true" />
                          {badge.text}
                        </span>

                        {(gallery as any).media && (gallery as any).media.length > 0 && (gallery as any).media[0].thumb_url ? (
                          <>
                            {!isLoaded && (
                              <div
                                className="apple-skeleton"
                                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                              />
                            )}
                            <OptimizedImage
                              webpUrl={(gallery as any).media[0].thumb_webp_url}
                              fallbackUrl={(gallery as any).media[0].thumb_url}
                              alt={gallery.title}
                              className="gallery-card-img"
                              style={{ opacity: isLoaded ? 1 : 0 }}
                              loading="lazy"
                              onLoad={() => handleImageLoad(gallery.id)}
                            />
                          </>
                        ) : (
                          <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                            <i className="fas fa-images fs-1 opacity-50" aria-hidden="true" />
                          </div>
                        )}
                      </div>
                    </Link>

                    <div className="gallery-card-body">
                      <Link to={`/galleries/${gallery.id}`} className="text-decoration-none">
                        <h2 className="gallery-card-title">{gallery.title}</h2>
                        {gallery.description && (
                          <p className="gallery-card-desc">{gallery.description}</p>
                        )}
                      </Link>

                      <div className="gallery-card-footer">
                        <span className="gallery-card-photo-count">
                          <i className="fas fa-camera me-1" aria-hidden="true" />
                          {(gallery as any).media_count || 0} {t('galleries.images', { count: (gallery as any).media_count || 0 })}
                        </span>
                        <LikeButton
                          galleryId={Number(gallery.id)}
                          ownerUserId={Number((user as any)?.id)}
                          initialLikesCount={Number(gallery.likes_count || 0)}
                          initialLiked={Boolean(gallery.liked_by_user)}
                        />
                      </div>
                    </div>
                  </motion.div>
                </Col>
              );
            })}
          </Row>

          {galleries.paginatorInfo.lastPage > 1 && (
            <div className="mt-5 d-flex justify-content-center">
              <Paginator
                currentPage={galleries.paginatorInfo.currentPage}
                lastPage={galleries.paginatorInfo.lastPage}
                total={galleries.paginatorInfo.total}
                perPage={galleries.paginatorInfo.perPage}
                onPageChange={(page) => {
                  setCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                loading={galleriesLoading}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}
