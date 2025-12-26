import { useState, useEffect } from 'react';
import type { ReactElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert, Form, InputGroup, Placeholder } from 'react-bootstrap';
import { motion } from 'motion/react';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useAuth } from '../contexts/AuthContext';
import Paginator from '../components/Paginator.tsx';
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
  const { isAuthenticated } = useAuth();
  const [galleries, setGalleries] = useState<GalleryPaginator | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(true);
  const [galleriesLoading, setGalleriesLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const [hoveredGallery, setHoveredGallery] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchInput, setSearchInput] = useState<string>('');
  const [perPage] = useState<number>(12);

  useEffect(() => {
    loadInitial();
  }, [username]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const term = searchInput && searchInput.length >= 4 ? searchInput : '';
      setSearchTerm(term);
    }, 400);
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
            }
          }
        `,
        variables: { username },
      });

      if (!userResponse.user) {
        setError('Usuario no encontrado');
        return;
      }

      setUser(userResponse.user);
      await loadGalleries(userResponse.user.id);
    } catch (err: any) {
      console.error('❌ Error en loadInitial:', err);
      console.error('Error detalles:', {
        message: err?.message,
        response: err?.response,
        graphQLErrors: err?.response?.errors,
        networkError: err?.networkError
      });
      
      const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.user_galleries') });
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
      console.error('LoadGalleries error detalles:', {
        userId: uid,
        page: currentPage,
        perPage: perPage,
        searchTerm: searchTerm,
        message: err?.message,
        response: err?.response,
        graphQLErrors: err?.response?.errors,
        networkError: err?.networkError
      });
      
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

  const getVisibilityBadge = (visibility: string): { bg: string; text: string } => {
    const badges: Record<string, { bg: string; text: string }> = {
      public: { bg: 'success', text: 'Pública' },
      private: { bg: 'danger', text: 'Privada' },
      followers: { bg: 'warning', text: 'Seguidores' },
    };
    return badges[visibility] || { bg: 'secondary', text: visibility };
  };

  if (loadingUser) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <motion.div 
        className="d-flex align-items-center mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {user && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="me-3"
          >
            <Link to={`/u/${user?.username}`} className="text-decoration-none">
              <OptimizedImage
                  webpUrl={(user as any).avatar_thumb_webp}
                  fallbackUrl={(user as any).avatar_thumb || user.avatar_url}
                  smallWebpUrl={(user as any).avatar_small_webp}
                  mediumWebpUrl={(user as any).avatar_medium_webp}
                  alt={user.username}
                className="rounded-circle"
                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                size={60}
                showSkeleton={true}
              />
            </Link>
          </motion.div>
        )}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="mb-1">{t('galleries.of_user', { name: user?.name })}</h2>
          <p className="text-muted text-start mb-0">
            <Link to={`/u/${user?.username}`} className="text-muted text-decoration-none">@{user?.username}</Link>
          </p>
        </motion.div>
      </motion.div>

      <div className="mb-4">
        <InputGroup>
          <InputGroup.Text>
            <i className="fas fa-search"></i>
          </InputGroup.Text>
          <Form.Control
            type="text"
            placeholder={t('galleries.search_placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </InputGroup>
      </div>

      {!galleries || galleries.data.length === 0 ? (
        <Alert variant="info">
          {searchTerm ? t('galleries.no_results_search') : t('galleries.no_public')}
        </Alert>
      ) : (
        <>
        <Row as={motion.div} xs={1} md={2} lg={3} className="g-4">
          {galleries.data.map((gallery, index) => {
            const isLoaded = imagesLoaded.has(String(gallery.id));
            const galleryId = String(gallery.id);
            const isHovered = hoveredGallery === galleryId;
            
            return (
            <Col key={galleryId}>
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                    }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onHoverStart={() => setHoveredGallery(galleryId)}
                    onHoverEnd={() => setHoveredGallery(null)}
                    transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.05 }}
                    style={{ borderRadius: 6, height: '100%' }}
                  >
                  <Card className="h-100 shadow-sm" style={{ boxShadow: isHovered ? '0 0.75rem 1.5rem rgba(0,0,0,0.18)' : undefined }}>
                <Link to={`/galleries/${gallery.id}`} className="text-decoration-none">
                  <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                    {(gallery as any).media && (gallery as any).media.length > 0 && (gallery as any).media[0].thumb_url ? (
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
                          webpUrl={(gallery as any).media[0].thumb_webp_url}
                          fallbackUrl={(gallery as any).media[0].thumb_url}
                          alt={gallery.title}
                          className="gallery-thumbnail"
                          style={{ 
                            height: '200px', 
                            width: '100%', 
                            objectFit: 'cover',
                            opacity: isLoaded ? 1 : 0,
                            transition: 'opacity 0.3s ease, filter 0.3s ease',
                            filter: isHovered ? 'blur(0)' : 'blur(5px)'
                          }}
                          loading="lazy"
                          onLoad={() => handleImageLoad(gallery.id)}
                        />
                      </>
                    ) : (
                      <div className="bg-light d-flex align-items-center justify-content-center" style={{ height: '200px' }}>
                        <i className="fas fa-images fs-1 text-muted"></i>
                      </div>
                    )}
                  </div>

                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <Card.Title className="mb-0 flex-grow-1" style={{ color: isHovered ? 'var(--bs-primary)' : undefined }}>{gallery.title}</Card.Title>
                      <Badge bg={getVisibilityBadge(gallery.visibility).bg} className="ms-2">
                        {getVisibilityBadge(gallery.visibility).text}
                      </Badge>
                    </div>

                    {gallery.description && (
                      <Card.Text className="text-muted small">
                        {gallery.description.length > 100 ? gallery.description.substring(0, 100) + '...' : gallery.description}
                      </Card.Text>
                    )}

                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <small className="text-muted">
                        <i className="fas fa-images me-1"></i>
                        {(gallery as any).media_count} {t('galleries.images', { count: (gallery as any).media_count })}
                      </small>
                      <LikeButton
                        galleryId={Number(gallery.id)}
                        ownerUserId={Number((user as any)?.id)}
                        initialLikesCount={Number(gallery.likes_count || 0)}
                        initialLiked={Boolean(gallery.liked_by_user)}
                      />
                    </div>
                  </Card.Body>
                </Link>
              </Card>
                  </motion.div>
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
            loading={galleriesLoading}
          />
        </div>
        </>
      )}

      <style>{`
        .h-100:hover .gallery-thumbnail {
          filter: blur(0px) !important;
        }
      `}</style>
    </Container>
  );
}
