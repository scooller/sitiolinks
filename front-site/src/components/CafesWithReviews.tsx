import { useEffect, useMemo, useState } from 'react';
import { Alert, Col, Container, Form, Row, Spinner } from 'react-bootstrap';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { appleEase } from '../lib/animations';
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
      <section className="cafes-section" aria-busy="true" aria-live="polite">
        <Container>
          <div className="cafes-section-heading text-center">
            <span className="cafes-section-kicker">
              <i className="fas fa-mug-saucer me-1" aria-hidden="true" />
              {t('cafes.kicker', 'Cafeterías de Especialidad')}
            </span>
            <h2 className="cafes-section-title">
              {title || t('home.cafes_reviews_title')}
            </h2>
            <p className="cafes-section-subtitle mb-0">
              {description || t('home.cafes_reviews_desc')}
            </p>
          </div>

          <Row xs={1} md={2} lg={3} className="g-4">
            {Array.from({ length: Math.min(limit || 6, 6) }).map((_, idx) => (
              <Col key={idx}>
                <article className="cafe-tile">
                  <div className="cafe-tile-media">
                    <div className="apple-skeleton" style={{ width: '100%', height: '100%' }} />
                    <div
                      className="apple-skeleton rounded-pill"
                      style={{
                        position: 'absolute',
                        top: '12px',
                        right: '12px',
                        width: '54px',
                        height: '24px',
                        zIndex: 2,
                      }}
                    />
                  </div>
                  <div className="cafe-tile-content">
                    <div className="apple-skeleton apple-skeleton-text w-75 mb-2" style={{ height: '18px' }} />
                    <div className="apple-skeleton apple-skeleton-text w-100 mb-3" style={{ height: '13px' }} />
                    <div className="cafe-tile-meta">
                      <div className="apple-skeleton rounded-pill" style={{ width: '70px', height: '24px' }} />
                      <div className="apple-skeleton rounded-pill" style={{ width: '80px', height: '24px' }} />
                      <div className="apple-skeleton rounded-pill" style={{ width: '60px', height: '24px' }} />
                    </div>
                  </div>
                </article>
              </Col>
            ))}
          </Row>
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
    <section className="cafes-section">
      <Container>
        <div className="cafes-section-heading text-center">
          <span className="cafes-section-kicker">
            <i className="fas fa-mug-saucer me-1" aria-hidden="true"></i>
            {t('cafes.kicker', 'Cafeterías de Especialidad')}
          </span>
          <h2 className="cafes-section-title">
            {title || t('home.cafes_reviews_title')}
          </h2>
          <p className="cafes-section-subtitle mb-0">
            {description || t('home.cafes_reviews_desc')}
          </p>
        </div>

        {showFilters && (
          <div className="cafes-filter-bar">
            <Row className="g-3 align-items-end" xs={1} sm={2} md={5}>
              <Col>
                <Form.Group controlId="cafes-filter-search">
                  <Form.Label className="small text-muted mb-1 fw-semibold">
                    <i className="fas fa-magnifying-glass me-1" aria-hidden="true"></i>
                    {t('home.filter_search')}
                  </Form.Label>
                  <Form.Control
                    type="text"
                    className="cafes-filter-input"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder={t('home.search_cafes_placeholder')}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="cafes-filter-city">
                  <Form.Label className="small text-muted mb-1 fw-semibold">
                    <i className="fas fa-location-dot me-1" aria-hidden="true"></i>
                    {t('home.filter_city')}
                  </Form.Label>
                  <Form.Select
                    className="cafes-filter-select"
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
                  <Form.Label className="small text-muted mb-1 fw-semibold">
                    <i className="fas fa-star me-1" aria-hidden="true"></i>
                    {t('home.filter_min_rating')}
                  </Form.Label>
                  <Form.Select
                    className="cafes-filter-select"
                    value={selectedMinRating}
                    onChange={(event) => setSelectedMinRating(event.target.value)}
                  >
                    <option value="">{t('home.any_rating')}</option>
                    <option value="1">1+ ★</option>
                    <option value="2">2+ ★</option>
                    <option value="3">3+ ★</option>
                    <option value="4">4+ ★</option>
                    <option value="5">5 ★</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group controlId="cafes-filter-tag">
                  <Form.Label className="small text-muted mb-1 fw-semibold">
                    <i className="fas fa-tag me-1" aria-hidden="true"></i>
                    {t('home.filter_branch_tag')}
                  </Form.Label>
                  <Form.Select
                    className="cafes-filter-select"
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
              <Col>
                <button
                  type="button"
                  className="btn btn-secondary w-100 cafes-filter-reset-btn"
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
          </div>
        )}

        {cafes.length === 0 ? (
          <Alert variant="light" className="text-center border rounded-4 py-4 mb-0">
            <i className="fas fa-mug-hot text-muted mb-2 d-block" style={{ fontSize: '2rem' }}></i>
            {t('home.no_cafes_for_filters')}
          </Alert>
        ) : (
          <Row xs={1} md={2} lg={3} className="g-4">
            {cafes.map((cafe, index) => (
              <Col key={cafe.id}>
                <motion.article
                  className="cafe-tile"
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(index * 0.03, 0.18), ease: appleEase }}
                >
                  <Link to={`/cafes/${cafe.slug || cafe.id}`} className="cafe-tile-link">
                    <div className="cafe-tile-media">
                      {cafe.image_url ? (
                        <img src={cafe.image_url} alt={cafe.name} width="600" height="360" loading="lazy" />
                      ) : (
                        <div className="cafe-tile-placeholder" aria-hidden="true">
                          <i className="fas fa-mug-hot"></i>
                        </div>
                      )}
                      {typeof cafe.average_rating === 'number' && (
                        <span className="cafe-tile-rating">
                          <i className="fas fa-star" aria-hidden="true"></i> {cafe.average_rating.toFixed(1)}
                        </span>
                      )}
                      <span className="cafe-tile-arrow" aria-hidden="true">
                        <i className="fas fa-arrow-up-right-from-square"></i>
                      </span>
                    </div>

                    <div className="cafe-tile-content">
                      <h3 className="cafe-tile-title mb-0">{cafe.name}</h3>
                      {cafe.description && <p className="cafe-tile-description">{cafe.description}</p>}
                      <div className="cafe-tile-meta">
                        <span className="cafe-tile-badge">
                          <i className="fas fa-message me-1" aria-hidden="true"></i>
                          {t('home.reviews_count_label', { count: cafe.reviews_count ?? 0 })}
                        </span>
                        <span className="cafe-tile-badge">
                          <i className="fas fa-store me-1" aria-hidden="true"></i>
                          {t('home.branches_count_label', { count: cafe.branches_count ?? 0 })}
                        </span>
                        {(cafe.branches ?? []).slice(0, 1).map((branch) => {
                          const location = (branch.city ?? branch.state ?? '').trim();
                          return location ? (
                            <span key={branch.id} className="cafe-tile-badge">
                              <i className="fas fa-location-dot me-1" aria-hidden="true"></i>
                              {location}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  </Link>
                </motion.article>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </section>
  );
}
