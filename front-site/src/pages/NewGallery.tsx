import { type ReactElement, useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Badge, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { SiteSettings, Role } from '../types';
import { useTranslation } from 'react-i18next';

interface FormData {
  title: string;
  description: string;
  visibility: 'public' | 'private' | 'followers';
}

interface FormErrors {
  title?: string;
  description?: string;
  visibility?: string;
}

interface CreateGalleryResponse {
  createGallery: {
    id: number;
    title: string;
  };
}

export default function NewGallery(): ReactElement | null {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    visibility: 'public',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [galleryCount, setGalleryCount] = useState<number>(0);
  const [loadingQuota, setLoadingQuota] = useState<boolean>(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadQuota();
    }
  }, [isAuthenticated, user]);

  const loadQuota = async (): Promise<void> => {
    try {
      setLoadingQuota(true);
      
      // Cargar configuración del sitio
      const settingsResponse = await graphqlRequest<{ siteSettings: SiteSettings }>({
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
      setSiteSettings(settingsResponse.siteSettings);

      // Cargar cantidad de galerías del usuario
      const galleriesResponse = await graphqlRequest<{ galleries: any[] }>({
        query: `
          query GetMyGalleries($userId: Int!) {
            galleries(user_id: $userId) {
              id
            }
          }
        `,
        variables: { userId: parseInt(String(user?.id)) },
        schema: 'public'
      });
      setGalleryCount(galleriesResponse.galleries?.length || 0);
    } catch (err) {
    } finally {
      setLoadingQuota(false);
    }
  };

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
  
  // Verificar si el usuario puede crear galerías
  const userRoles = Array.isArray(user?.roles) 
    ? user.roles.map((r: Role | string) => typeof r === 'string' ? r : r.name)
    : [];
  
  const canCreateGalleries = userRoles.includes('admin') || 
    userRoles.includes('super_admin') || 
    userRoles.includes('creator') ||
    userRoles.includes('vip');
  
  const isAtLimit = canCreateGalleries && galleryLimit !== null && galleryCount >= galleryLimit;
  const isVip = userRoles.includes('vip');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Limpiar error del campo al cambiar
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = t('validation.title_required');
    } else if (formData.title.length < 3) {
      newErrors.title = t('validation.title_min');
    } else if (formData.title.length > 255) {
      newErrors.title = t('validation.title_max');
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = t('validation.description_max');
    }

    if (!['public', 'private', 'followers'].includes(formData.visibility)) {
      newErrors.visibility = t('validation.visibility_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validate()) return;

      // Verificar límite de galerías
      if (isAtLimit) {
        setError(`${t('galleries.gallery_limit_reached')}. ${isVip ? '' : t('vip.upgrade_cta')}`);
        return;
      }

    try {
      setLoading(true);
      setError(null);

      const response = await graphqlRequest<CreateGalleryResponse>({
        query: `
          mutation CreateGallery($title: String!, $description: String, $visibility: String!) {
            createGallery(
              title: $title
              description: $description
              visibility: $visibility
            ) {
              id
              title
            }
          }
        `,
        variables: {
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          visibility: formData.visibility,
        },
        schema: 'default',
        authenticated: true,
      });

      // Redirigir a editar la galería para agregar imágenes
      navigate(`/mis-galerias/${response.createGallery.id}/editar`, {
        state: { message: `${t('galleries.success_created')} ${t('galleries.post_create_hint')}` },
      });
    } catch (err: any) {
      const msg = err?.message || '';
      // Si la sesión expiró o no hay autenticación, redirigir a login
      if (/autenticad|unauth/i.test(msg)) {
        navigate('/login', { state: { message: t('auth.session_expired') } });
        return;
      }
      setError(msg || t('galleries.error_creating'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <Container className="py-5" style={{ maxWidth: '800px' }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/mis-galerias">{t('galleries.my_galleries')}</Link>
          </li>
          <li className="breadcrumb-item active">{t('galleries.new_gallery')}</li>
        </ol>
      </nav>

      <Card>
        <Card.Header>
          <h2 className="mb-0">
            <i className="fas fa-plus-circle me-2"></i>
            {t('galleries.new_gallery')}
          </h2>
        </Card.Header>
        <Card.Body>
          {/* Cuota de galerías */}
          {!loadingQuota && galleryLimit !== null && (
            <Alert variant={isAtLimit ? 'danger' : galleryCount / galleryLimit >= 0.8 ? 'warning' : 'info'} className="mb-4">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <strong>
                  <i className="fas fa-chart-bar me-2"></i>
                  {t('galleries.quota_label', { count: galleryCount, limit: galleryLimit })}
                </strong>
                {isAtLimit && (
                  <Badge bg="danger">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    {t('galleries.gallery_limit_reached')}
                  </Badge>
                )}
              </div>
              <ProgressBar 
                now={(galleryCount / galleryLimit) * 100} 
                variant={isAtLimit ? 'danger' : galleryCount / galleryLimit >= 0.8 ? 'warning' : 'info'}
                className="mb-2"
              />
              {isAtLimit ? (
                <div className="text-danger small">
                  <i className="fas fa-ban me-1"></i>
                  {t('galleries.gallery_limit_reached')}. 
                  {!isVip && (
                    <span>
                      {' '}<strong>{t('vip.label')}</strong> — {t('vip.upgrade_cta')}
                    </span>
                  )}
                </div>
              ) : (
                <small className="text-muted">
                  {t('galleries.remaining', { count: galleryLimit - galleryCount })}
                </small>
              )}
            </Alert>
          )}

          {!loadingQuota && galleryLimit === null && (
            <Alert variant="success" className="mb-4">
              <i className="fas fa-infinity me-2"></i>
              <strong>{t('galleries.unlimited_title')}</strong> — {t('galleries.unlimited_desc')}
            </Alert>
          )}

          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          <Form onSubmit={handleSubmit}>
            {/* Título */}
            <Form.Group className="mb-3">
              <Form.Label>
                {t('galleries.title')} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                isInvalid={!!errors.title}
                placeholder={t('galleries.title_placeholder')}
                maxLength={255}
              />
              <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
              <Form.Text className="text-muted">{formData.title.length}/255 caracteres</Form.Text>
            </Form.Group>

            {/* Descripción */}
            <Form.Group className="mb-3">
              <Form.Label>{t('galleries.description')}</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={formData.description}
                onChange={handleChange}
                isInvalid={!!errors.description}
                rows={4}
                placeholder={t('galleries.description_placeholder')}
                maxLength={1000}
              />
              <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
              <Form.Text className="text-muted">{formData.description.length}/1000 caracteres</Form.Text>
            </Form.Group>

            {/* Visibilidad */}
            <Form.Group className="mb-4">
              <Form.Label>
                {t('galleries.visibility')} <span className="text-danger">*</span>
              </Form.Label>
              <div className='text-start'>
                <Form.Check
                  type="radio"
                  name="visibility"
                  id="visibility-public"
                  value="public"
                  checked={formData.visibility === 'public'}
                  onChange={handleChange}
                  label={
                    <>
                      <i className="fas fa-globe text-success me-2"></i>
                      <strong>{t('galleries.visibility_public')}</strong>
                    </>
                  }
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="visibility"
                  id="visibility-followers"
                  value="followers"
                  checked={formData.visibility === 'followers'}
                  onChange={handleChange}
                  label={
                    <>
                      <i className="fas fa-users text-warning me-2"></i>
                      <strong>{t('galleries.visibility_followers')}</strong>
                    </>
                  }
                  className="mb-2"
                />
                <Form.Check
                  type="radio"
                  name="visibility"
                  id="visibility-private"
                  value="private"
                  checked={formData.visibility === 'private'}
                  onChange={handleChange}
                  label={
                    <>
                      <i className="fas fa-lock text-danger me-2"></i>
                      <strong>{t('galleries.visibility_private')}</strong>
                    </>
                  }
                />
              </div>
              {errors.visibility && <div className="text-danger small mt-1">{errors.visibility}</div>}
            </Form.Group>

            {/* Botones */}
            <div className="d-flex gap-2">
              <Button variant="secondary" onClick={() => navigate('/mis-galerias')} disabled={loading}>
                {t('common.cancel')}
              </Button>
              <Button type="submit" variant="primary" disabled={loading} className="flex-grow-1">
                {loading ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" role="status" className="me-2" />
                    {t('common.creating')}
                  </>
                ) : (
                  <>
                    <i className="fas fa-check-circle me-2"></i>
                    {t('galleries.create_gallery')}
                  </>
                )}
              </Button>
            </div>
          </Form>

          <Alert variant="info" className="mt-4 mb-0">
            <i className="fas fa-info-circle me-2"></i>
            {t('galleries.post_create_hint')}
          </Alert>
        </Card.Body>
      </Card>
    </Container>
  );
}
