import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Container, Spinner, Alert, Badge, Breadcrumb, Placeholder } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import OptimizedImage from '../components/OptimizedImage';
import LikeButton from '../components/LikeButton';
import type { Gallery } from '../types';
import { useTranslation } from 'react-i18next';

// Importar solo CSS de lightGallery
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
    bg: string;
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
        import('lightgallery/plugins/fullscreen')
    ]);

    return {
        lightGallery: lg.default,
        lgThumbnail: thumb.default,
        lgZoom: zoom.default,
        lgFullscreen: full.default
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
        // Inicializar lightGallery solo cuando se carguen las imágenes
        if (gallery && gallery.media && gallery.media.length > 0 && galleryRef.current && !lgInstance.current) {
            loadLightGallery().then(({ lightGallery, lgThumbnail, lgZoom, lgFullscreen }) => {
                if (galleryRef.current && !lgInstance.current) {
                    lgInstance.current = lightGallery(galleryRef.current, {
                        plugins: [lgThumbnail, lgZoom, lgFullscreen],
                        speed: 500,
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
            }).catch(err => {
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
            setImagesLoaded(new Set()); // Reset loaded images

            const response = await graphqlRequest<GalleryDetailResponse>({
                query: queries.galleryById,
                variables: { id: parseInt(id || '0') },
                authenticated: true,
            });

            if (!response.gallery) {
                setError(t('galleries.error_loading'));
                return;
            }

            if (!response.gallery.can_view) {
                setError(t('galleries.not_allowed'));
                return;
            }

            setGallery(response.gallery);

        } catch (err: any) {
            console.error('❌ Error en GalleryDetail.loadGallery:', err);
            console.error('GalleryDetail error detalles:', {
                galleryId: id,
                message: err?.message,
                response: err?.response,
                graphQLErrors: err?.response?.errors,
                networkError: err?.networkError,
                stack: err?.stack
            });
            
            const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.gallery') });
            setError(`Error cargando galería: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const handleImageLoad = (imageId: string | number) => {
        setImagesLoaded(prev => new Set(prev).add(String(imageId)));
    };

    const getVisibilityBadge = (visibility: string): VisibilityBadge => {
        const badges: Record<string, VisibilityBadge> = {
            public: { bg: 'success', text: t('galleries.visibility_public'), icon: 'fa-globe' },
            private: { bg: 'danger', text: t('galleries.visibility_private'), icon: 'fa-lock' },
            followers: { bg: 'warning', text: t('galleries.visibility_followers'), icon: 'fa-users' }
        };
        return badges[visibility] || { bg: 'secondary', text: visibility, icon: 'fa-question-circle' };
    };

    if (loading) {
        return (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">{t('common.loading')}</span>
                </Spinner>
            </Container>
        );
    }

    if (error) {
        return (
            <Container className="py-5">
                <Alert variant="danger">
                    <Alert.Heading>Error</Alert.Heading>
                    <p>{error}</p>
                    <hr />
                    <div className="d-flex justify-content-end">
                        <button 
                            className="btn btn-outline-danger"
                            onClick={() => navigate(-1)}
                        >
                            {t('common.back')}
                        </button>
                    </div>
                </Alert>
            </Container>
        );
    }

    if (!gallery) {
        return null;
    }

    const badge = getVisibilityBadge(gallery.visibility);

    return (
        <Container className="py-4">
            {/* Breadcrumb */}
            <Breadcrumb>
                <Breadcrumb.Item linkAs={Link} linkProps={{ to: '/' }}>
                    {t('nav.home')}
                </Breadcrumb.Item>
                <Breadcrumb.Item 
                    linkAs={Link} 
                    linkProps={{ to: `/u/${gallery.user?.username}/galleries` }}
                >
                    {t('galleries.of_user', { name: gallery.user?.name })}
                </Breadcrumb.Item>
                <Breadcrumb.Item active>{gallery.title}</Breadcrumb.Item>
            </Breadcrumb>

            {/* Header de la galería */}
            <div className="mb-4">
                <div className="d-flex align-items-start justify-content-between mb-3">
                    <div className="flex-grow-1">
                        <h1 className="mb-2">{gallery.title}</h1>
                        {gallery.description && (
                            <p className="text-muted">{gallery.description}</p>
                        )}
                    </div>
                    <div className="d-flex align-items-center gap-2">
                        <Badge bg={badge.bg} className="ms-3">
                            <i className={`fas ${badge.icon} me-1`}></i>
                            {badge.text}
                        </Badge>
                        {isAuthenticated && gallery.user && parseInt(String(gallery.user.id)) === parseInt(String(currentUser?.id)) && (
                            <button className="btn btn-outline-dark btn-sm" onClick={() => navigate(`/mis-galerias/${gallery.id}/editar`)}>
                                <i className="fas fa-pencil-alt me-1"></i>
                                {t('common.edit')}
                            </button>
                        )}
                    </div>
                </div>

                {/* Info del autor */}
                {gallery.user && (
                    <div className="d-flex align-items-center">
                        <Link 
                            to={`/u/${gallery.user.username}`}
                            className="d-flex align-items-center text-decoration-none"
                        >
                            <OptimizedImage
                                webpUrl={(gallery.user as any).avatar_thumb_webp}
                                fallbackUrl={(gallery.user as any).avatar_thumb || gallery.user.avatar_url}
                                smallWebpUrl={(gallery.user as any).avatar_small_webp}
                                mediumWebpUrl={(gallery.user as any).avatar_medium_webp}
                                alt={gallery.user.username}
                                className="rounded-circle me-2"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                                size={40}
                            />
                            <small className="text-muted">@{gallery.user.username}</small>
                        </Link>
                        <span className="mx-3 text-muted">•</span>
                        <small className="text-muted">
                            <i className="fas fa-images me-1"></i>
                            {gallery.media_count} {t('galleries.images', { count: gallery.media_count })}
                        </small>
                        <span className="mx-3 text-muted">•</span>
                        <LikeButton
                          galleryId={Number(gallery.id)}
                          ownerUserId={Number((gallery.user as any).id)}
                          initialLikesCount={Number(gallery.likes_count || 0)}
                          initialLiked={Boolean(gallery.liked_by_user)}
                        />
                    </div>
                )}
            </div>

            {/* Grid de imágenes */}
            {gallery.media && gallery.media.length > 0 ? (
                <div ref={galleryRef} className="gallery-grid">
                    {gallery.media.map((item) => {
                        const isLoaded = imagesLoaded.has(String(item.id));
                        return (
                            <a
                                key={item.id}
                                href={item.url}
                                data-src={item.url}
                                className="gallery-item"
                            >
                                {!isLoaded && (
                                    <Placeholder 
                                        as="div" 
                                        animation="glow" 
                                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                                    >
                                        <Placeholder xs={12} style={{ height: '100%', borderRadius: '0.5rem' }} />
                                    </Placeholder>
                                )}
                                <OptimizedImage
                                    webpUrl={(item as any).thumb_webp_url}
                                    fallbackUrl={item.thumb_url}
                                    alt={item.caption || ''}
                                    className={`img-fluid ${isLoaded ? 'loaded' : 'loading'}`}
                                    loading="lazy"
                                    onLoad={() => handleImageLoad(item.id)}
                                />
                            </a>
                        );
                    })}
                </div>
            ) : (
                <Alert variant="info">
                    {t('galleries.no_images')}
                </Alert>
            )}

            {/* CSS para el grid */}
            <style>{`
                .gallery-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                    gap: 1rem;
                    margin-top: 2rem;
                }

                .gallery-item {
                    position: relative;
                    overflow: hidden;
                    border-radius: 0.5rem;
                    cursor: pointer;
                    display: block;
                    aspect-ratio: 1;
                    background-color: #f0f0f0;
                }

                .gallery-item img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                }

                .gallery-item img.loading {
                    opacity: 0;
                }

                .gallery-item img.loaded {
                    opacity: 1;
                }

                .gallery-item:hover img {
                    transform: scale(1.05);
                }

                .gallery-caption {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: linear-gradient(to top, rgba(0,0,0,0.8), transparent);
                    color: white;
                    padding: 1rem;
                    transform: translateY(100%);
                    transition: transform 0.3s ease;
                }

                .gallery-item:hover .gallery-caption {
                    transform: translateY(0);
                }

                .gallery-caption p {
                    font-size: 0.875rem;
                    margin: 0;
                }

                @media (max-width: 768px) {
                    .gallery-grid {
                        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                        gap: 0.5rem;
                    }
                }
            `}</style>
        </Container>
    );
}
