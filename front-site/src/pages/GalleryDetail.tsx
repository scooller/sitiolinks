import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner } from 'react-bootstrap';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition } from '../lib/animations';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import OptimizedImage from '../components/OptimizedImage';
import LikeButton from '../components/LikeButton';
import type { Gallery } from '../types';
import { useTranslation } from 'react-i18next';

// Importar CSS de lightGallery
import 'lightgallery/css/lightgallery.css';
import 'lightgallery/css/lg-thumbnail.css';
import 'lightgallery/css/lg-zoom.css';
import 'lightgallery/css/lg-fullscreen.css';

// Tipos para lightGallery
interface LightGalleryInstance {
  destroy: () => void;
}

type LightGalleryModule = any;
type LightGalleryPlugin = any;

interface VisibilityBadge {
  bgClass: string;
  text: string;
  icon: string;
}

interface GalleryDetailResponse {
  gallery: Gallery;
}

// Lazy load de lightGallery y sus plugins
const loadLightGallery = async (): Promise<{
  lightGallery: LightGalleryModule;
  lgThumbnail: LightGalleryPlugin;
  lgZoom: LightGalleryPlugin;
  lgFullscreen: LightGalleryPlugin;
}> => {
  const [lg, thumb, zoom, full] = await Promise.all([
    import('lightgallery'),
    import('lightgallery/plugins/thumbnail'),
    import('lightgallery/plugins/zoom'),
    import('lightgallery/plugins/fullscreen'),
  ]);

  return {
    lightGallery: lg.default,
    lgThumbnail: thumb.default,
    lgZoom: zoom.default,
    lgFullscreen: full.default,
  };
};

export default function GalleryDetail() {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const lgInstance = useRef<LightGalleryInstance | null>(null);
  const { user: currentUser, isAuthenticated } = useAuth();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadGallery();
  }, [id]);

  useEffect(() => {
    // Inicializar lightGallery cuando se carguen las imágenes
    if (gallery && gallery.media && gallery.media.length > 0 && galleryRef.current && !lgInstance.current) {
      loadLightGallery()
        .then(({ lightGallery, lgThumbnail, lgZoom, lgFullscreen }) => {
          if (galleryRef.current && !lgInstance.current) {
            lgInstance.current = lightGallery(galleryRef.current, {
              plugins: [lgThumbnail, lgZoom, lgFullscreen],
              speed: 400,
              thumbnail: true,
              animateThumb: true,
              zoomFromOrigin: true,
              allowMediaOverlap: true,
              toggleThumb: true,
              download: false,
              counter: true,
              getCaptionFromTitleOrAlt: false,
            });
          }
        })
        .catch(err => {
          console.error('Error inicializando lightGallery:', err);
        });
    }

    // Cleanup
    return () => {
      if (lgInstance.current) {
        lgInstance.current.destroy();
        lgInstance.current = null;
      }
    };
  }, [gallery]);

  const loadGallery = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      setImagesLoaded(new Set());

      const response = await graphqlRequest<GalleryDetailResponse>({
        query: queries.galleryById,
        variables: { id: parseInt(id || '0', 10) },
        authenticated: true,
      });

      if (!response.gallery) {
        setError(t('galleries.error_loading', 'Error al cargar galería'));
        return;
      }

      if (!response.gallery.can_view) {
        setError(t('galleries.not_allowed', 'No tienes permiso para ver esta galería'));
        return;
      }

      setGallery(response.gallery);
    } catch (err: any) {
      console.error('❌ Error en GalleryDetail.loadGallery:', err);
      const errorMessage =
        err?.response?.errors?.[0]?.message ||
        err?.message ||
        t('errors.loading', { entity: t('entities.gallery', 'galería') });
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (imageId: string | number) => {
    setImagesLoaded(prev => new Set(prev).add(String(imageId)));
  };

  const getVisibilityBadge = (visibility: string): VisibilityBadge => {
    const badges: Record<string, VisibilityBadge> = {
      public: { bgClass: 'public', text: t('galleries.visibility_public', 'Pública'), icon: 'fa-globe' },
      private: { bgClass: 'private', text: t('galleries.visibility_private', 'Privada'), icon: 'fa-lock' },
      followers: { bgClass: 'followers', text: t('galleries.visibility_followers', 'Seguidores'), icon: 'fa-users' },
    };
    return badges[visibility] || { bgClass: 'public', text: visibility, icon: 'fa-eye' };
  };

  if (loading) {
    return (
      <Container className="py-4" aria-busy="true" aria-live="polite">
        {/* Navigation Return Skeleton */}
        <div className="mb-3 d-flex align-items-center justify-content-between">
          <div className="gallery-back-link apple-skeleton" style={{ width: '160px', height: '44px' }} />
        </div>

        {/* Header Card Skeleton */}
        <div className="gallery-detail-header-card">
          <div className="gallery-detail-top-bar">
            <div className="apple-skeleton rounded-pill" style={{ width: '80px', height: '24px' }} />
          </div>
          <div className="apple-skeleton apple-skeleton-text mb-3" style={{ width: '55%', height: '32px' }} />
          <div className="apple-skeleton apple-skeleton-text mb-2" style={{ width: '85%', height: '14px' }} />
          <div className="apple-skeleton apple-skeleton-text mb-4" style={{ width: '60%', height: '14px' }} />

          <div className="gallery-detail-meta-strip">
            <div className="d-flex align-items-center gap-2">
              <div className="apple-skeleton rounded-circle" style={{ width: '28px', height: '28px' }} />
              <div className="apple-skeleton apple-skeleton-text" style={{ width: '90px', height: '14px' }} />
            </div>
            <div className="apple-skeleton rounded-pill" style={{ width: '75px', height: '22px' }} />
            <div className="apple-skeleton rounded-pill ms-auto" style={{ width: '50px', height: '28px' }} />
          </div>
        </div>

        {/* Apple Photo Grid Skeleton */}
        <div className="apple-gallery-grid">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="apple-gallery-item">
              <div className="apple-skeleton" style={{ width: '100%', height: '100%' }} />
            </div>
          ))}
        </div>
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
              onClick={() => navigate(-1)}
            >
              <i className="fas fa-arrow-left" aria-hidden="true" />
              <span>{t('common.back', 'Volver')}</span>
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

  if (!gallery) {
    return null;
  }

  const badge = getVisibilityBadge(gallery.visibility);
  const isOwner =
    isAuthenticated &&
    gallery.user &&
    parseInt(String(gallery.user.id), 10) === parseInt(String(currentUser?.id), 10);

  return (
    <Container className="py-4">
      {/* 1. Barra de Navegación de Retorno Apple HIG */}
      <div className="mb-3 d-flex align-items-center justify-content-between flex-wrap gap-2">
        <Link
          to={gallery.user ? `/u/${gallery.user.username}/galleries` : '/explorar'}
          className="gallery-back-link"
          aria-label={t('common.back', 'Volver')}
        >
          <i className="fas fa-chevron-left" aria-hidden="true" />
          <span>
            {gallery.user
              ? t('galleries.of_user', { name: gallery.user.name })
              : t('common.back', 'Volver')}
          </span>
        </Link>

        {isOwner && (
          <Link
            to={`/mis-galerias/${gallery.id}/editar`}
            className="gallery-btn-solid gallery-btn-dark"
          >
            <i className="fas fa-pencil-alt" aria-hidden="true" />
            <span>{t('common.edit', 'Editar')}</span>
          </Link>
        )}
      </div>

      {/* 2. Cabecera Liquid Glass de la galería */}
      <motion.div
        className="gallery-detail-header-card"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={defaultTransition}
      >
        <div className="gallery-detail-top-bar">
          <div className="d-flex align-items-center gap-2">
            <span className={`gallery-visibility-pill ${badge.bgClass}`} style={{ position: 'static' }}>
              <i className={`fas ${badge.icon} me-1`} aria-hidden="true" />
              {badge.text}
            </span>
          </div>
        </div>

        <h1 className="gallery-detail-title">{gallery.title}</h1>
        {gallery.description && (
          <p className="gallery-detail-desc">{gallery.description}</p>
        )}

        {/* Info del autor & métricas */}
        {gallery.user && (
          <div className="gallery-detail-meta-strip">
            <Link
              to={`/u/${gallery.user.username}`}
              className="gallery-author-chip"
              aria-label={`Ver perfil de @${gallery.user.username}`}
            >
              <OptimizedImage
                webpUrl={(gallery.user as any).avatar_thumb_webp}
                fallbackUrl={(gallery.user as any).avatar_thumb || gallery.user.avatar_url}
                smallWebpUrl={(gallery.user as any).avatar_small_webp}
                mediumWebpUrl={(gallery.user as any).avatar_medium_webp}
                alt={gallery.user.username}
                className="gallery-author-chip-avatar"
                size={28}
              />
              <span>@{gallery.user.username}</span>
            </Link>

            <span className="gallery-card-photo-count">
              <i className="fas fa-camera me-1" aria-hidden="true" />
              {gallery.media_count || 0} {t('galleries.images', { count: gallery.media_count || 0 })}
            </span>

            <LikeButton
              galleryId={Number(gallery.id)}
              ownerUserId={Number((gallery.user as any).id)}
              initialLikesCount={Number(gallery.likes_count || 0)}
              initialLiked={Boolean(gallery.liked_by_user)}
            />
          </div>
        )}
      </motion.div>

      {/* 3. Cuadrícula de fotos Apple HIG con LightGallery */}
      {gallery.media && gallery.media.length > 0 ? (
        <motion.div
          ref={galleryRef}
          className="apple-gallery-grid"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={defaultTransition}
        >
          {gallery.media.map((item) => {
            const isLoaded = imagesLoaded.has(String(item.id));
            return (
              <a
                key={item.id}
                href={item.url}
                data-src={item.url}
                className="apple-gallery-item"
                aria-label={item.caption || gallery.title}
              >
                {!isLoaded && (
                  <div
                    className="apple-skeleton"
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1, borderRadius: 'var(--rounded-xl)' }}
                  />
                )}
                <OptimizedImage
                  webpUrl={(item as any).thumb_webp_url}
                  fallbackUrl={item.thumb_url}
                  alt={item.caption || ''}
                  className={`apple-gallery-img ${isLoaded ? 'loaded' : 'loading'}`}
                  loading="lazy"
                  onLoad={() => handleImageLoad(item.id)}
                />
                {item.caption && (
                  <div className="apple-gallery-caption-overlay">
                    <p className="mb-0">{item.caption}</p>
                  </div>
                )}
              </a>
            );
          })}
        </motion.div>
      ) : (
        <motion.div
          className="galleries-empty-card"
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={defaultTransition}
        >
          <div className="galleries-empty-halo">
            <i className="fas fa-camera" aria-hidden="true" />
          </div>
          <h2 className="galleries-empty-title">{t('galleries.no_images', 'Esta galería aún no tiene imágenes')}</h2>
          <p className="galleries-empty-desc">
            {t('galleries.try_other_terms', 'Pronto el creador publicará fotografías en esta colección.')}
          </p>
          <div className="galleries-empty-actions">
            <Link
              to={gallery.user ? `/u/${gallery.user.username}/galleries` : '/explorar'}
              className="galleries-empty-cta"
            >
              <i className="fas fa-arrow-left" aria-hidden="true" />
              <span>{t('common.back', 'Volver a galerías')}</span>
            </Link>
          </div>
        </motion.div>
      )}
    </Container>
  );
}
