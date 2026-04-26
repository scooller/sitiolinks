import { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  Alert,
  Badge,
  Button,
  Card,
  Col,
  Container,
  Form,
  ListGroup,
  Row,
  Spinner,
  Tab,
  Tabs,
} from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Cafe, CafeBranch } from '../types';

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
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated } = useAuth();

  const [cafe, setCafe] = useState<Cafe | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeBranchKey, setActiveBranchKey] = useState<string>('');
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState<string>('');
  const [submittingReview, setSubmittingReview] = useState<boolean>(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const activeBranch = useMemo(() => {
    return (cafe?.branches ?? []).find((branch) => String(branch.id) === activeBranchKey) ?? null;
  }, [activeBranchKey, cafe?.branches]);

  const loadCafeDetail = async (): Promise<void> => {
    if (!id) {
      setError(t('cafes.detail.invalid_id'));
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const query = `
        query CafeDetail($id: ID!) {
          cafeDetail(id: $id) {
            id
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
              }
              reviews {
                id
                rating
                comment
                created_at
                user {
                  id
                  name
                  username
                  avatar_thumb
                }
              }
            }
          }
        }
      `;

      const response = await graphqlRequest<CafeDetailResponse>({
        query,
        variables: { id },
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
  }, [id]);

  const renderStars = (value: number): string => {
    const fullStars = Math.max(0, Math.min(5, Math.round(value)));
    return `${'★'.repeat(fullStars)}${'☆'.repeat(5 - fullStars)}`;
  };

  const branchLocationLabel = (branch: CafeBranch): string => {
    const comuna = (branch.city ?? branch.state ?? '').trim();
    return comuna !== '' ? `${branch.name}/${comuna}` : branch.name;
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

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="warning" />
      </Container>
    );
  }

  if (error || !cafe) {
    return (
      <Container className="py-5">
        <Alert variant="danger" className="mb-3">{error || t('cafes.detail.not_found')}</Alert>
        <Link to="/cafes" className="btn btn-outline-secondary btn-sm">
          <i className="fas fa-arrow-left me-2"></i>
          {t('common.back')}
        </Link>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="mb-4 g-4 align-items-center">
        <Col md={8}>
          <h1 className="mb-2">{cafe.name}</h1>
          {cafe.description && <p className="text-muted mb-0">{cafe.description}</p>}
        </Col>
        <Col md={4} className="text-md-end">
          <Link to="/cafes" className="btn btn-outline-secondary btn-sm">
            <i className="fas fa-arrow-left me-2"></i>
            {t('common.back')}
          </Link>
        </Col>
      </Row>

      <Accordion alwaysOpen defaultActiveKey={['0', '1']}>
        <Accordion.Item eventKey="0">
          <Accordion.Header>{t('cafes.detail.sections.details')}</Accordion.Header>
          <Accordion.Body>
            <Row className="g-4">
              <Col lg={4}>
                {cafe.image_url ? (
                  <img
                    src={cafe.image_url}
                    alt={cafe.name}
                    className="img-fluid rounded shadow-sm"
                    style={{ width: '100%', maxHeight: '320px', objectFit: 'cover' }}
                  />
                ) : (
                  <Card className="h-100 border-dashed">
                    <Card.Body className="d-flex align-items-center justify-content-center text-muted">
                      {t('cafes.detail.no_image')}
                    </Card.Body>
                  </Card>
                )}
              </Col>
              <Col lg={8}>
                <div className="d-flex flex-wrap gap-2 mb-3">
                  <Badge bg="light" text="dark">{t('home.branches_count_label', { count: cafe.branches_count ?? 0 })}</Badge>
                  <Badge bg="light" text="dark">{t('home.reviews_count_label', { count: cafe.reviews_count ?? 0 })}</Badge>
                  {typeof cafe.average_rating === 'number' && (
                    <Badge bg="warning" text="dark">{renderStars(cafe.average_rating)} {cafe.average_rating.toFixed(1)}</Badge>
                  )}
                </div>

                {cafe.website && (
                  <p className="mb-0">
                    <a href={cafe.website} target="_blank" rel="noreferrer">
                      <i className="fas fa-link me-2"></i>
                      {t('home.view_cafe_site')}
                    </a>
                  </p>
                )}
              </Col>
            </Row>
          </Accordion.Body>
        </Accordion.Item>

        <Accordion.Item eventKey="1">
          <Accordion.Header>{t('cafes.detail.sections.branches')}</Accordion.Header>
          <Accordion.Body>
            {(cafe.branches ?? []).length === 0 ? (
              <Alert variant="light" className="mb-0">{t('cafes.detail.no_branches')}</Alert>
            ) : (
              <Tabs
                id="cafe-branches-tabs"
                activeKey={activeBranchKey}
                onSelect={(key) => setActiveBranchKey(key ?? '')}
                className="mb-3"
              >
                {(cafe.branches ?? []).map((branch) => (
                  <Tab key={branch.id} eventKey={String(branch.id)} title={branchLocationLabel(branch)}>
                    <Row className="g-4 mt-1">
                      <Col lg={6}>
                        <Card className="h-100">
                          <Card.Header>{t('cafes.detail.branch_data')}</Card.Header>
                          <ListGroup variant="flush">
                            <ListGroup.Item><strong>{t('cafes.detail.fields.name')}:</strong> {branch.name}</ListGroup.Item>
                            {branch.description && <ListGroup.Item><strong>{t('cafes.detail.fields.description')}:</strong> {branch.description}</ListGroup.Item>}
                            {branch.address && <ListGroup.Item><strong>{t('cafes.detail.fields.address')}:</strong> {branch.address}</ListGroup.Item>}
                            {(branch.city || branch.state) && <ListGroup.Item><strong>{t('cafes.detail.fields.comuna')}:</strong> {(branch.city ?? branch.state) || '-'}</ListGroup.Item>}
                            {branch.postal_code && <ListGroup.Item><strong>{t('cafes.detail.fields.postal_code')}:</strong> {branch.postal_code}</ListGroup.Item>}
                            {branch.phone && <ListGroup.Item><strong>{t('cafes.detail.fields.phone')}:</strong> {branch.phone}</ListGroup.Item>}
                            {typeof branch.entry_price === 'number' && <ListGroup.Item><strong>{t('cafes.detail.fields.entry_price')}:</strong> {branch.entry_price}</ListGroup.Item>}
                            {branch.website && (
                              <ListGroup.Item>
                                <strong>{t('cafes.detail.fields.website')}:</strong>{' '}
                                <a href={branch.website} target="_blank" rel="noreferrer">{branch.website}</a>
                              </ListGroup.Item>
                            )}
                            {branch.google_maps_url && (
                              <ListGroup.Item>
                                <strong>{t('cafes.detail.fields.maps')}:</strong>{' '}
                                <a href={branch.google_maps_url} target="_blank" rel="noreferrer">Google Maps</a>
                              </ListGroup.Item>
                            )}
                            {branch.menu_qr_url && (
                              <ListGroup.Item>
                                <strong>{t('cafes.detail.fields.menu')}:</strong>{' '}
                                <a href={branch.menu_qr_url} target="_blank" rel="noreferrer">{t('cafes.detail.view_menu')}</a>
                              </ListGroup.Item>
                            )}
                          </ListGroup>
                        </Card>
                      </Col>

                      <Col lg={6}>
                        <Card className="mb-3">
                          <Card.Header>{t('cafes.detail.branch_creators')}</Card.Header>
                          <Card.Body>
                            {(branch.creators ?? []).length === 0 ? (
                              <p className="text-muted mb-0">{t('cafes.detail.no_creators')}</p>
                            ) : (
                              <div className="d-flex flex-wrap gap-2">
                                {(branch.creators ?? []).map((creator) => (
                                  <Link
                                    key={creator.id}
                                    to={`/u/${creator.username}`}
                                    className="btn btn-outline-dark btn-sm"
                                  >
                                    {creator.name || `@${creator.username}`}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </Card.Body>
                        </Card>

                        <Card>
                          <Card.Header className="d-flex justify-content-between align-items-center">
                            <span>{t('cafes.detail.branch_reviews')}</span>
                            <Badge bg="warning" text="dark">
                              {typeof branch.average_rating === 'number' ? `${branch.average_rating.toFixed(1)} (${branch.reviews_count ?? 0})` : t('cafes.detail.no_reviews_short')}
                            </Badge>
                          </Card.Header>
                          <Card.Body>
                            {(branch.reviews ?? []).length === 0 ? (
                              <p className="text-muted mb-0">{t('cafes.detail.no_reviews')}</p>
                            ) : (
                              <div className="d-flex flex-column gap-2 mb-3">
                                {(branch.reviews ?? []).map((review) => (
                                  <div key={review.id} className="border rounded p-2">
                                    <div className="d-flex justify-content-between align-items-center gap-2">
                                      <strong>{review.user?.name || t('home.anonymous_reviewer')}</strong>
                                      <Badge bg="light" text="dark">{renderStars(review.rating)} ({review.rating}/5)</Badge>
                                    </div>
                                    {review.comment && <p className="mb-0 mt-2 small">{review.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            )}

                            {isAuthenticated ? (
                              <Form onSubmit={handleSubmitReview}>
                                {submitMessage && <Alert variant="success" className="py-2">{submitMessage}</Alert>}
                                {submitError && <Alert variant="danger" className="py-2">{submitError}</Alert>}

                                <Row className="g-2 align-items-end">
                                  <Col md={3}>
                                    <Form.Group controlId="review-rating">
                                      <Form.Label>{t('cafes.detail.form.rating')}</Form.Label>
                                      <Form.Select
                                        value={rating}
                                        onChange={(event) => setRating(Number(event.target.value))}
                                        disabled={submittingReview}
                                      >
                                        <option value={5}>5</option>
                                        <option value={4}>4</option>
                                        <option value={3}>3</option>
                                        <option value={2}>2</option>
                                        <option value={1}>1</option>
                                      </Form.Select>
                                    </Form.Group>
                                  </Col>
                                  <Col md={9}>
                                    <Form.Group controlId="review-comment">
                                      <Form.Label>{t('cafes.detail.form.comment')}</Form.Label>
                                      <Form.Control
                                        as="textarea"
                                        rows={2}
                                        maxLength={1000}
                                        placeholder={t('cafes.detail.form.comment_placeholder')}
                                        value={comment}
                                        onChange={(event) => setComment(event.target.value)}
                                        disabled={submittingReview}
                                      />
                                    </Form.Group>
                                  </Col>
                                </Row>

                                <div className="mt-3 d-flex justify-content-end">
                                  <Button type="submit" variant="dark" disabled={submittingReview}>
                                    {submittingReview ? t('cafes.detail.form.sending') : t('cafes.detail.form.submit')}
                                  </Button>
                                </div>
                              </Form>
                            ) : (
                              <Alert variant="info" className="mb-0">
                                {t('cafes.detail.login_to_review')} <Link to="/login">{t('nav.login')}</Link>
                              </Alert>
                            )}
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Tab>
                ))}
              </Tabs>
            )}
          </Accordion.Body>
        </Accordion.Item>
      </Accordion>
    </Container>
  );
}
