import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Card, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Cafe } from '../types';

interface CafesWithReviewsProps {
  limit?: number;
  showFilters?: boolean;
  orderBy?: 'name' | 'latest' | 'featured' | 'latest_featured';
  title?: string;
  description?: string;
}

export default function CafesWithReviews({
  limit = 6,
  showFilters = true,
  orderBy = 'name',
  title,
  description,
}: CafesWithReviewsProps): React.ReactElement | null {
  const { t } = useTranslation();
  const [cafes, setCafes] = useState<Cafe[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchText, setSearchText] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [selectedMinRating, setSelectedMinRating] = useState<string>('');
  const [selectedTagId, setSelectedTagId] = useState<string>('');

  const cityOptions = useMemo(() => {
    const options = new Set<string>();

    for (const cafe of cafes) {
      for (const branch of cafe.branches ?? []) {
        const city = (branch.city ?? '').trim();
        if (city.length > 0) {
          options.add(city);
        }
      }
    }

    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [cafes]);

  const tagOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const cafe of cafes) {
      for (const branch of cafe.branches ?? []) {
        for (const tag of branch.tags ?? []) {
          if (tag.id !== undefined && tag.id !== null && tag.name) {
            options.set(String(tag.id), tag.name);
          }
        }
      }
    }

    return Array.from(options.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [cafes]);

  const hasActiveFilters = searchText !== '' || selectedCity !== '' || selectedMinRating !== '' || selectedTagId !== '';

  useEffect(() => {
    const loadCafes = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const minRatingValue = selectedMinRating === '' ? null : Number(selectedMinRating);
        const tagIdValue = selectedTagId === '' ? null : Number(selectedTagId);
        const query = `
          query CafesWithReviews($limit: Int, $branchesPerCafe: Int, $reviewsPerBranch: Int, $city: String, $minRating: Float, $tagId: Int, $search: String, $orderBy: String) {
            cafesWithReviews(limit: $limit, branches_per_cafe: $branchesPerCafe, reviews_per_branch: $reviewsPerBranch, city: $city, min_rating: $minRating, tag_id: $tagId, search: $search, order_by: $orderBy) {
              id
              name
              slug
              description
              website
              image_url
              branches_count
              reviews_count
              average_rating
              branches {
                id
                name
                city
                state
                tags {
                  id
                  name
                }
              }
            }
          }
        `;

        const baseVariables = {
          limit,
          branchesPerCafe: 2,
          reviewsPerBranch: 2,
          city: selectedCity || null,
          minRating: Number.isFinite(minRatingValue) ? minRatingValue : null,
          tagId: Number.isFinite(tagIdValue) ? tagIdValue : null,
          search: searchText.trim() || null,
        };

        const fetchCafes = async (order: 'name' | 'latest' | 'featured'): Promise<Cafe[]> => {
          const response = await graphqlRequest<{ cafesWithReviews: Cafe[] }>({
            query,
            variables: {
              ...baseVariables,
              orderBy: order,
            },
            schema: 'public',
          });

          return response.cafesWithReviews || [];
        };

        if (orderBy === 'latest_featured') {
          const [latestCafes, featuredCafes] = await Promise.all([
            fetchCafes('latest'),
            fetchCafes('featured'),
          ]);

          const mergedCafes = [...latestCafes, ...featuredCafes];
          const uniqueCafes = mergedCafes.filter(
            (cafe, index, source) => source.findIndex((item) => item.id === cafe.id) === index,
          );

          setCafes(uniqueCafes.slice(0, limit));
          return;
        }

        setCafes(await fetchCafes(orderBy));
      } catch (err: any) {
        const errorMessage = err?.response?.errors?.[0]?.message || err?.message || t('errors.loading', { entity: t('entities.cafes') });
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    loadCafes();
  }, [limit, orderBy, searchText, selectedCity, selectedMinRating, selectedTagId, t]);

  if (loading) {
    return (
      <section className="py-5">
        <Container className="text-center">
          <Spinner animation="border" variant="warning" />
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-5">
        <Container>
          <Alert variant="danger" className="mb-0">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {error}
          </Alert>
        </Container>
      </section>
    );
  }

  if (cafes.length === 0 && !hasActiveFilters && !showFilters) {
    return null;
  }

  return (
    <section className="py-5" style={{ backgroundColor: '#fff8f1' }}>
      <Container>
        <div className="text-center mb-4">
          <h2 className="mb-2 cafes-section-title">
            <i className="fas fa-mug-hot text-warning me-2"></i>
            {title || t('home.cafes_reviews_title')}
          </h2>
          <p className="text-muted mb-0">{description || t('home.cafes_reviews_desc')}</p>
        </div>

        {showFilters && (
          <Row className="g-2 mb-4" xs={1} md={5}>
            <Col>
              <Form.Group controlId="cafes-filter-search">
                <Form.Label className="small text-muted mb-1">{t('home.filter_search')}</Form.Label>
                <Form.Control
                  type="text"
                  value={searchText}
                  onChange={(event) => setSearchText(event.target.value)}
                  placeholder={t('home.search_cafes_placeholder')}
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="cafes-filter-city">
                <Form.Label className="small text-muted mb-1">{t('home.filter_city')}</Form.Label>
                <Form.Select
                  value={selectedCity}
                  onChange={(event) => setSelectedCity(event.target.value)}
                >
                  <option value="">{t('home.all_cities')}</option>
                  {cityOptions.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="cafes-filter-rating">
                <Form.Label className="small text-muted mb-1">{t('home.filter_min_rating')}</Form.Label>
                <Form.Select
                  value={selectedMinRating}
                  onChange={(event) => setSelectedMinRating(event.target.value)}
                >
                  <option value="">{t('home.any_rating')}</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                  <option value="4">4+</option>
                  <option value="5">5</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group controlId="cafes-filter-tag">
                <Form.Label className="small text-muted mb-1">{t('home.filter_branch_tag')}</Form.Label>
                <Form.Select
                  value={selectedTagId}
                  onChange={(event) => setSelectedTagId(event.target.value)}
                >
                  <option value="">{t('home.all_tags')}</option>
                  {tagOptions.map((tag) => (
                    <option key={tag.id} value={tag.id}>{tag.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col className="d-flex align-items-end">
              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchText('');
                  setSelectedCity('');
                  setSelectedMinRating('');
                  setSelectedTagId('');
                }}
                disabled={!hasActiveFilters}
              >
                <i className="fas fa-rotate-left me-2"></i>
                {t('home.clear_cafes_filters')}
              </button>
            </Col>
          </Row>
        )}

        {cafes.length === 0 ? (
          <Alert variant="light" className="text-center border mb-0">
            {t('home.no_cafes_for_filters')}
          </Alert>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {cafes.map((cafe) => (
              <Col key={cafe.id}>
                <Card className="h-100 border-0 shadow-sm">
                  {cafe.image_url && (
                    <Card.Img variant="top" src={cafe.image_url} alt={cafe.name} style={{ height: '200px', objectFit: 'cover' }} />
                  )}
                  <Card.Body className="d-flex flex-column gap-3">
                    <div className="d-flex justify-content-between align-items-start gap-2">
                      <div>
                        <Card.Title className="mb-1">
                          <Link to={`/cafes/${cafe.slug || cafe.id}`} className="text-decoration-none text-dark">
                            {cafe.name}
                          </Link>
                        </Card.Title>
                        {cafe.description && (
                          <Card.Text className="text-muted small mb-0">
                            {cafe.description}
                          </Card.Text>
                        )}
                      </div>
                      {typeof cafe.average_rating === 'number' && (
                        <Badge bg="warning" text="dark" pill>
                          {cafe.average_rating.toFixed(1)}
                        </Badge>
                      )}
                    </div>

                    <div className="d-flex gap-2 flex-wrap">
                      <Badge bg="light" text="dark">
                        {t('home.reviews_count_label', { count: cafe.reviews_count ?? 0 })}
                      </Badge>
                      <Badge bg="light" text="dark">
                        {t('home.branches_count_label', { count: cafe.branches_count ?? 0 })}
                      </Badge>
                    </div>

                    <div className="d-flex flex-wrap gap-2">
                      {(cafe.branches ?? []).map((branch) => {
                        const comuna = (branch.city ?? branch.state ?? '').trim();

                        return (
                          <Badge key={branch.id} bg="secondary">
                            {comuna !== '' ? `${branch.name}/${comuna}` : branch.name}
                          </Badge>
                        );
                      })}
                    </div>

                    {cafe.website && (
                      <a
                        href={cafe.website}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-outline-dark btn-sm mt-auto"
                      >
                        <i className="fas fa-link me-2"></i>
                        {t('home.view_cafe_site')}
                      </a>
                    )}

                    <Link to={`/cafes/${cafe.slug || cafe.id}`} className="btn btn-dark btn-sm">
                      <i className="fas fa-mug-hot me-2"></i>
                      {t('cafes.detail.view')}
                    </Link>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  );
}
