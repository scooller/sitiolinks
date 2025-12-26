import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Modal, ProgressBar, Form, InputGroup, Placeholder } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import OptimizedImage from '../components/OptimizedImage';
import type { GalleryPaginator, SiteSettings, Role, Gallery } from '../types';
import Paginator from '../components/Paginator';

interface DeleteModalState {
    show: boolean;
    gallery: Gallery | null;
}

interface VisibilityBadge {
    bg: string;
    text: string;
    icon: string;
}

export default function MyGalleries() {
    const { t } = useTranslation();
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [galleries, setGalleries] = useState<GalleryPaginator | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [perPage] = useState<number>(12);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [deleteModal, setDeleteModal] = useState<DeleteModalState>({ show: false, gallery: null });
    const [deleting, setDeleting] = useState<boolean>(false);
    const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
    const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
    const [togglingFeatured, setTogglingFeatured] = useState<number | null>(null);

    // Calcular límite de galerías
    const getGalleryLimit = (): number | null => {
        if (!user || !siteSettings) return null;

        const userRoles = Array.isArray(user.roles)
            ? user.roles.map((r: Role | string) => typeof r === 'string' ? r : r.name)
            : [];

        // Admin/super_admin = ilimitado
        if (userRoles.includes('admin') || userRoles.includes('super_admin')) {
            return null;
        }

        // VIP = configurable o ilimitado
        if (userRoles.includes('vip')) {
            return siteSettings.max_galleries_vip ?? null;
        }

        // Creator = límite fijo
        if (userRoles.includes('creator')) {
            return siteSettings.max_galleries_creator ?? 1;
        }

        // Usuario normal sin permisos = sin acceso
        return null;
    };

    const galleryLimit = getGalleryLimit();

    // Verificar si el usuario puede crear galerías (tiene rol creator, vip, admin o super_admin)
    const userRoles = Array.isArray(user?.roles)
        ? user.roles.map((r: Role | string) => typeof r === 'string' ? r : r.name)
        : [];

    const canCreateGalleries = userRoles.includes('admin') ||
        userRoles.includes('super_admin') ||
        userRoles.includes('creator') ||
        userRoles.includes('vip');

    const isAtLimit = canCreateGalleries && galleryLimit !== null && (galleries?.paginatorInfo.total || 0) >= galleryLimit;

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (!user?.id) {
            return;
        }
        loadMyGalleries();
        loadSiteSettings();
    }, [isAuthenticated, user?.id, navigate, currentPage, searchTerm]);

    const loadMyGalleries = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);
            setImagesLoaded(new Set());

            if (!user?.id) {
                setLoading(false);
                return;
            }

            const response = await graphqlRequest<{ galleries: GalleryPaginator }>({
                query: `
                    query GetMyGalleries($userId: Int!, $page: Int, $perPage: Int, $search: String) {
                        galleries(user_id: $userId, page: $page, per_page: $perPage, search: $search) {
                            data {
                                id
                                title
                                description
                                visibility
                                status
                                is_featured
                                featured_at
                                can_be_featured
                                featured_limit
                                media_count
                                created_at
                                media {
                                    id
                                    thumb_url
                                    thumb_webp_url
                                }
                            }
                            paginatorInfo {
                                count
                                currentPage
                                firstItem
                                lastItem
                                lastPage
                                perPage
                                total
                            }
                        }
                    }
                `,
                variables: {
                    userId: Number(user.id),
                    page: currentPage,
                    perPage,
                    search: searchTerm || null
                },
                schema: 'public'
            });

            setGalleries(response.galleries);

        } catch (err: any) {
            console.error('❌ Error cargando galerías:', err);
            console.error('Error detalles:', {
                message: err?.message,
                response: err?.response,
                graphQLErrors: err?.response?.errors,
                networkError: err?.networkError,
                stack: err?.stack
            });
            
            const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('galleries.error_loading');
            setError(`Error al cargar galerías: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    const loadSiteSettings = async (): Promise<void> => {
        try {
            const response = await graphqlRequest<{ siteSettings: SiteSettings }>({
                query: `
                    query SiteSettings {
                        siteSettings {
                            max_galleries_creator
                            max_galleries_vip
                        }
                    }
                `,
                schema: 'public'
            });
            setSiteSettings(response.siteSettings);
        } catch (err: any) {
            console.error('⚠️ Error cargando configuración del sitio:', err);
            console.error('SiteSettings error detalles:', {
                message: err?.message,
                response: err?.response,
                graphQLErrors: err?.response?.errors
            });
        }
    };

    const handleDelete = async (): Promise<void> => {
        if (!deleteModal.gallery) return;

        try {
            setDeleting(true);

            await graphqlRequest({
                query: `
                    mutation DeleteGallery($id: Int!) {
                        deleteGallery(id: $id)
                    }
                `,
                variables: { id: parseInt(String(deleteModal.gallery.id)) },
                schema: 'default',
                authenticated: true
            });

            // Actualizar lista local
            if (galleries) {
                const filtered = galleries.data.filter((g: Gallery) => g.id !== deleteModal.gallery?.id);
                setGalleries({
                    ...galleries,
                    data: filtered,
                    paginatorInfo: {
                        ...galleries.paginatorInfo,
                        total: Math.max(0, (galleries.paginatorInfo.total || 0) - 1),
                        count: Math.max(0, (galleries.paginatorInfo.count || filtered.length)),
                        lastItem: filtered.length > 0 ? (galleries.paginatorInfo.firstItem || 1) + filtered.length - 1 : null,
                    }
                });
            }
            setDeleteModal({ show: false, gallery: null });

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            alert('Error al eliminar la galería: ' + message);
        } finally {
            setDeleting(false);
        }
    };

    const handleImageLoad = (galleryId: string | number) => {
        setImagesLoaded(prev => new Set(prev).add(String(galleryId)));
    };

    const handleToggleFeatured = async (gallery: Gallery): Promise<void> => {
        const galleryId = parseInt(String(gallery.id));

        try {
            setTogglingFeatured(galleryId);

            const newFeaturedState = !gallery.is_featured;

            await graphqlRequest({
                query: `
                    mutation ToggleFeaturedGallery($id: Int!, $is_featured: Boolean!) {
                        toggleFeaturedGallery(id: $id, is_featured: $is_featured) {
                            id
                            is_featured
                            featured_at
                        }
                    }
                `,
                variables: { id: galleryId, is_featured: newFeaturedState },
                schema: 'default',
                authenticated: true
            });

            // Actualizar localmente
            if (galleries) {
                setGalleries({
                    ...galleries,
                    data: galleries.data.map(g =>
                        g.id === gallery.id
                            ? { ...g, is_featured: newFeaturedState, featured_at: newFeaturedState ? new Date().toISOString() : undefined }
                            : g
                    )
                });
            }

        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            alert('Error al destacar/desdestacar galería: ' + message);
        } finally {
            setTogglingFeatured(null);
        }
    };

    const getVisibilityBadge = (visibility: string): VisibilityBadge => {
        const badges: Record<string, VisibilityBadge> = {
            public: { bg: 'success', text: t('galleries.visibility_public'), icon: 'fa-globe' },
            private: { bg: 'danger', text: t('galleries.visibility_private'), icon: 'fa-lock' },
            followers: { bg: 'warning', text: t('profile.followers'), icon: 'fa-users' }
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

    return (
        <Container className="py-5">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="mb-1">{t('galleries.my_galleries')}</h1>
                    <p className="text-muted mb-0">
                        {t('galleries.manage_hint')}
                    </p>
                </div>
                {canCreateGalleries && !isAtLimit && (
                    <Button
                        as={Link as any}
                        to="/mis-galerias/nueva"
                        variant="primary"
                        size="lg"
                    >
                        <i className="fas fa-plus-circle me-2"></i>
                        {t('galleries.new_gallery')}
                    </Button>
                )}
            </div>

            <div className="mb-4">
                <InputGroup>
                    <InputGroup.Text>
                        <i className="fas fa-search"></i>
                    </InputGroup.Text>
                    <Form.Control
                        type="text"
                        placeholder={t('galleries.search_my_placeholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </InputGroup>
            </div>

            {/* Quota de galerías */}
            {canCreateGalleries && galleryLimit !== null && (
                <Alert variant={isAtLimit ? 'warning' : 'info'} className="mb-4">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                        <strong>
                            <i className="fas fa-chart-bar me-2"></i>
                            {t('galleries.quota_label', { count: galleries?.paginatorInfo.total || 0, limit: galleryLimit })}
                        </strong>
                        {isAtLimit && (
                                <Badge bg="warning" text="dark">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    {t('galleries.gallery_limit_reached')}
                                </Badge>
                        )}
                    </div>
                    <ProgressBar
                        now={((galleries?.paginatorInfo.total || 0) / galleryLimit) * 100}
                        variant={isAtLimit ? 'warning' : 'primary'}
                        className="mb-2"
                    />
                    {isAtLimit && (
                                <small className="text-muted d-block">
                                    <i className="fas fa-star me-1"></i>
                                    {t('vip.upgrade_cta')}
                                </small>
                    )}
                </Alert>
            )}

            {canCreateGalleries && galleryLimit === null && (
                <Alert variant="success" className="mb-4">
                    <i className="fas fa-infinity me-2"></i>
                    <strong>Galerías Ilimitadas</strong> - Puedes crear tantas galerías como desees
                </Alert>
            )}

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {!galleries || galleries.data.length === 0 ? (
                <Card className="text-center py-5">
                    <Card.Body>
                        <i className="fas fa-images fs-1 text-muted mb-3 d-block"></i>
                        <h4>{searchTerm ? t('galleries.no_results') : t('galleries.no_galleries')}</h4>
                        {canCreateGalleries && !isAtLimit ? (
                            <>
                                <p className="text-muted mb-4">
                                    {searchTerm
                                        ? t('galleries.try_other_terms')
                                        : t('galleries.create_first_hint')
                                    }
                                </p>
                                {!searchTerm && (
                                    <Button
                                        as={Link as any}
                                        to="/mis-galerias/nueva"
                                        variant="primary"
                                    >
                                        {t('galleries.create_first')}
                                    </Button>
                                )}
                            </>
                        ) : (
                            <p className="text-muted mb-4">
                                {t('galleries.only_admins_creators')}
                            </p>
                        )}
                    </Card.Body>
                </Card>
            ) : (
                <>
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {galleries.data.map((gallery) => {
                            const badge = getVisibilityBadge(gallery.visibility);
                            const isLoaded = imagesLoaded.has(String(gallery.id));
                            return (
                                <Col key={gallery.id}>
                                    <Card className="h-100 shadow-sm hover-card">
                                        {/* Imagen de portada */}
                                        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                                            {gallery.media && gallery.media.length > 0 && gallery.media[0].thumb_url ? (
                                                <>
                                                    {!isLoaded && (
                                                        <Placeholder
                                                            as="div"
                                                            animation="glow"
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
                                                        >
                                                            <Placeholder xs={12} style={{ height: '100%' }} />
                                                        </Placeholder>
                                                    )}
                                                    <OptimizedImage
                                                        webpUrl={(gallery.media[0] as any).thumb_webp_url}
                                                        fallbackUrl={gallery.media[0].thumb_url}
                                                        alt={gallery.title}
                                                        style={{
                                                            height: '200px',
                                                            width: '100%',
                                                            objectFit: 'cover',
                                                            cursor: 'pointer',
                                                            opacity: isLoaded ? 1 : 0,
                                                            transition: 'opacity 0.3s ease'
                                                        }}
                                                        loading="lazy"
                                                        onClick={() => navigate(`/galleries/${gallery.id}`)}
                                                        onLoad={() => handleImageLoad(gallery.id)}
                                                    />
                                                </>
                                            ) : (
                                                <div
                                                    className="bg-light d-flex align-items-center justify-content-center"
                                                    style={{
                                                        height: '200px',
                                                        cursor: 'pointer'
                                                    }}
                                                    onClick={() => navigate(`/galleries/${gallery.id}`)}
                                                >
                                                    <i className="fas fa-images fs-1 text-muted"></i>
                                                </div>
                                            )}
                                        </div>

                                        <Card.Body>
                                            <div className="d-flex justify-content-between align-items-start mb-2">
                                                <Card.Title className="mb-0 flex-grow-1">
                                                    {gallery.title}
                                                </Card.Title>
                                                <div className="d-flex gap-1">
                                                    <Badge bg={badge.bg}>
                                                        <i className={`fas ${badge.icon} me-1`}></i>
                                                        {badge.text}
                                                    </Badge>
                                                    {gallery.is_featured && (
                                                        <Badge bg="warning" text="dark">
                                                            <i className="fas fa-star me-1"></i>
                                                            {t('galleries.featured')}
                                                        </Badge>
                                                    )}
                                                    {gallery.status && gallery.status !== 'approved' && (
                                                        <Badge bg={gallery.status === 'pending' ? 'warning' : 'danger'}>
                                                            <i className={`fas ${gallery.status === 'pending' ? 'fa-hourglass-half' : 'fa-times-circle'} me-1`}></i>
                                                            {gallery.status === 'pending' ? t('galleries.pending') : t('galleries.rejected')}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>

                                            {gallery.description && (
                                                <Card.Text className="text-muted small mb-3">
                                                    {gallery.description.length > 100
                                                        ? gallery.description.substring(0, 100) + '...'
                                                        : gallery.description
                                                    }
                                                </Card.Text>
                                            )}

                                            <div className="d-flex justify-content-between align-items-center mb-3">
                                                <small className="text-muted">
                                                    <i className="fas fa-images me-1"></i>
                                                    {gallery.media_count} {gallery.media_count === 1 ? t('galleries.images_one') : t('galleries.images_other')}
                                                </small>
                                                <small className="text-muted">
                                                    {new Date(gallery.created_at || '').toLocaleDateString('es-ES')}
                                                </small>
                                            </div>

                                            {/* Botones de acción */}
                                            <div className="d-grid gap-2">
                                                <Button
                                                    variant="outline-dark"
                                                    size="sm"
                                                    as={Link as any}
                                                    to={`/mis-galerias/${gallery.id}/editar`}
                                                >
                                                    <i className="fas fa-pencil-alt me-1"></i>
                                                    {t('common.edit')}
                                                </Button>
                                                <div className="d-flex gap-2">
                                                    {gallery.can_be_featured && (
                                                        <Button
                                                            variant={gallery.is_featured ? "warning" : "outline-warning"}
                                                            size="sm"
                                                            className="flex-grow-1"
                                                            onClick={() => handleToggleFeatured(gallery)}
                                                            disabled={togglingFeatured === parseInt(String(gallery.id))}
                                                            title={gallery.is_featured ? "Quitar destacado" : "Destacar galería"}
                                                        >
                                                            {togglingFeatured === parseInt(String(gallery.id)) ? (
                                                                <Spinner size="sm" animation="border" />
                                                            ) : (
                                                                <>
                                                                    <i className={`fas fa-star me-1`}></i>
                                                                    {gallery.is_featured ? 'Destacada' : 'Destacar'}
                                                                </>
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="outline-secondary"
                                                        size="sm"
                                                        className="flex-grow-1"
                                                        onClick={() => navigate(`/galleries/${gallery.id}`)}
                                                    >
                                                        <i className="fas fa-eye me-1"></i>
                                                        {t('common.view_profile')}
                                                    </Button>
                                                    <Button
                                                        variant="outline-danger"
                                                        size="sm"
                                                        onClick={() => setDeleteModal({ show: true, gallery })}
                                                    >
                                                        <i className="fas fa-trash"></i>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>

                    <div className="mt-4">
                        <Paginator
                            currentPage={galleries.paginatorInfo.currentPage}
                            lastPage={galleries.paginatorInfo.lastPage}
                            total={galleries.paginatorInfo.total}
                            perPage={galleries.paginatorInfo.perPage}
                            onPageChange={setCurrentPage}
                            loading={loading}
                        />
                    </div>
                </>
            )}

            {/* Modal de confirmación de eliminación */}
            <Modal
                show={deleteModal.show}
                onHide={() => !deleting && setDeleteModal({ show: false, gallery: null })}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{t('confirm.delete')} - {t('galleries.gallery_detail')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        ¿Estás seguro de que deseas eliminar la galería
                        <strong> "{deleteModal.gallery?.title}"</strong>?
                    </p>
                    <p className="text-danger mb-0">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        Esta acción no se puede deshacer. Las imágenes serán eliminadas permanentemente.
                    </p>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setDeleteModal({ show: false, gallery: null })}
                        disabled={deleting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant="danger"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        {deleting ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    className="me-2"
                                />
                                Eliminando...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-trash me-2"></i>
                                {t('galleries.delete_gallery')}
                            </>
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* CSS */}
            <style>{`
                .hover-card {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .hover-card:hover {
                    transform: translateY(-4px);
                    box-shadow: 0 0.5rem 1.5rem rgba(0, 0, 0, 0.15) !important;
                }
            `}</style>
        </Container>
    );
}
