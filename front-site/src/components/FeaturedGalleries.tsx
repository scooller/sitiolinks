import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Spinner, Alert } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import OptimizedImage from './OptimizedImage';
import type { Gallery } from '../types';
import { useTranslation } from 'react-i18next';

interface FeaturedGalleriesProps {
  limit?: number;
}

export default function FeaturedGalleries({ limit = 12 }: FeaturedGalleriesProps) {
  const { t } = useTranslation();
  const [galleries, setGalleries] = useState<Gallery[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState<Set<string>>(new Set());
  const [hoveredGallery, setHoveredGallery] = useState<string | null>(null);

  useEffect(() => {
    loadFeaturedGalleries();
  }, [limit]);

  const loadFeaturedGalleries = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await graphqlRequest<{ featuredGalleries: Gallery[] }>({
        query: `
          query FeaturedGalleries($limit: Int) {
            featuredGalleries(limit: $limit) {
              id
              title
              description
              visibility
              status
              is_featured
              featured_at
              media_count
              created_at
              user {
                id
                name
                username
                roles {
                  name
                }
              }
              media {
                id
                thumb_url
                thumb_webp_url
              }
            }
          }
        `,
        variables: { limit },
        schema: 'public'
      });

      setGalleries(response.featuredGalleries || []);
    } catch (err: any) {
      console.error('❌ Error cargando galerías destacadas:', err);
      console.error('FeaturedGalleries error detalles:', {
        message: err?.message,
        response: err?.response,
        graphQLErrors: err?.response?.errors,
        networkError: err?.networkError,
        stack: err?.stack
      });
      
      const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.featured_galleries') });
      setError(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleImageLoad = (galleryId: string | number) => {
    setImagesLoaded(prev => new Set(prev).add(String(galleryId)));
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="warning" />
        <p className="text-muted mt-2">{t('common.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mb-0">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
      </Alert>
    );
  }

  if (galleries.length === 0) {
    return null; // No mostrar nada si no hay galerías destacadas
  }

  return (
    <section className="featured-galleries-section py-5 bg-light">
      <Container>
        {/* Header de sección */}
        <div className="text-center mb-4">
          <h2 className="mb-2">
            <i className="fas fa-star text-warning me-2"></i>
            {t('galleries.featured_title')}
          </h2>
          <p className="text-muted">
            {t('galleries.featured_desc')}
          </p>
        </div>

        {/* Grid de galerías */}
        <Row xs={1} sm={2} md={3} lg={4} className="g-4">
          {galleries.map((gallery) => {
            const isLoaded = imagesLoaded.has(String(gallery.id));
            const isHovered = hoveredGallery === String(gallery.id);
            const userRoles = Array.isArray(gallery.user?.roles)
              ? gallery.user.roles.map((r: any) => typeof r === 'string' ? r : r.name)
              : [];
            const isVIP = userRoles.includes('vip');

            return (
              <Col key={gallery.id}>
                <Link 
                  to={`/galleries/${gallery.id}`} 
                  className="text-decoration-none"
                  style={{ display: 'block', height: '100%' }}
                  onMouseEnter={() => setHoveredGallery(String(gallery.id))}
                  onMouseLeave={() => setHoveredGallery(null)}
                >
                  <Card className="h-100 shadow-sm hover-card border-0 position-relative">
                    {/* Badge VIP en esquina superior derecha */}
                    {isVIP && (
                      <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                        <Badge bg="warning" text="dark">
                          <i className="fas fa-crown me-1"></i>
                          VIP
                        </Badge>
                      </div>
                    )}

                    {/* Badge destacada en esquina superior izquierda */}
                    <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                      <Badge bg="warning" text="dark">
                        <i className="fas fa-star me-1"></i>
                        Destacada
                      </Badge>
                    </div>

                    {/* Imagen de portada */}
                    <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
                      {gallery.media && gallery.media.length > 0 && gallery.media[0].thumb_url ? (
                        <>
                          {!isLoaded && (
                            <div 
                              className="skeleton-loader" 
                              style={{ 
                                position: 'absolute', 
                                top: 0, 
                                left: 0, 
                                width: '100%', 
                                height: '100%' 
                              }} 
                            />
                          )}
                          <OptimizedImage
                            webpUrl={(gallery.media[0] as any).thumb_webp_url}
                            fallbackUrl={gallery.media[0].thumb_url}
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
                        <div 
                          className="bg-secondary bg-opacity-10 d-flex align-items-center justify-content-center"
                          style={{ height: '200px' }}
                        >
                          <i className="fas fa-images fs-1 text-muted"></i>
                        </div>
                      )}
                    </div>
                    
                    <Card.Body>
                      <Card.Title className="mb-2 text-truncate" title={gallery.title}>
                        {gallery.title}
                      </Card.Title>
                      
                      {gallery.description && (
                        <Card.Text 
                          className="text-muted small mb-2"
                          style={{
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            height: '2.8em',
                            lineHeight: '1.4em'
                          }}
                        >
                          {gallery.description}
                        </Card.Text>
                      )}

                      <div className="d-flex justify-content-between align-items-center mt-3">
                        <small className="text-muted">
                          <i className="fas fa-user me-1"></i>
                          {gallery.user?.name || gallery.user?.username}
                        </small>
                        <small className="text-muted">
                          <i className="fas fa-images me-1"></i>
                          {gallery.media_count}
                        </small>
                      </div>
                    </Card.Body>
                  </Card>
                </Link>
              </Col>
            );
          })}
        </Row>

        {/* Ver todas */}
        {galleries.length >= limit && (
          <div className="text-center mt-4">
            <Link to="/explorar" className="btn btn-outline-warning">
              <i className="fas fa-th me-2"></i>
              {t('galleries.view_more')}
            </Link>
          </div>
        )}
      </Container>

      {/* Estilos hover */}
      <style>{`
        .hover-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        }

        .hover-card:hover .gallery-thumbnail {
          filter: blur(0px) !important;
        }

        .skeleton-loader {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </section>
  );
}
