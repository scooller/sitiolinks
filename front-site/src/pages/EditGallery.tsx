import { useState, useEffect, useRef, type ReactElement } from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { Container, Card, Form, Button, Alert, Spinner, Row, Col, Modal, Badge, ProgressBar } from 'react-bootstrap';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { mutations } from '../lib/graphql/mutations';
import OptimizedImage from '../components/OptimizedImage';
import type { Gallery, GalleryMediaItem, User, SiteSettings, Role } from '../types';
import { useTranslation } from 'react-i18next';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FormData {
  title: string;
  description: string;
  visibility: 'public' | 'private' | 'followers';
}

interface FormErrors {
  title?: string;
  description?: string;
}

interface GalleryResponse {
  gallery: Gallery | null;
}

interface FollowersResponse {
  followers: User[];
}

interface UpdateGalleryResponse {
  updateGallery: {
    id: number;
    title: string;
  };
}

interface AddMediaResponse {
  addMediaToGallery: {
    media: GalleryMediaItem[];
  };
}

interface DragState {
  draggingId: number | null;
  overId: number | null;
}

export default function EditGallery(): ReactElement | null {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [gallery, setGallery] = useState<Gallery | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    visibility: 'public',
  });
  const [allowedUserIds, setAllowedUserIds] = useState<number[]>([]); // para privadas
  const [followers, setFollowers] = useState<User[]>([]); // seguidores del propietario
  const [allowAllFollowers, setAllowAllFollowers] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>((location.state as any)?.message || null);
  const [filePondWarning] = useState<string | null>(null);
  const filePondRef = useRef<any>(null);
  const [mediaToRemove, setMediaToRemove] = useState<GalleryMediaItem | null>(null);
  const [removing, setRemoving] = useState<boolean>(false);
  const [reordering, setReordering] = useState<boolean>(false);
  const [dragState, setDragState] = useState<DragState>({ draggingId: null, overId: null });
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [pendingFiles, setPendingFiles] = useState<number>(0);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadGallery();
    loadSiteSettings();
  }, [id, isAuthenticated]);

  const loadSiteSettings = async (): Promise<void> => {
    try {
      const response = await graphqlRequest<{ siteSettings: SiteSettings }>({
        query: `
          query SiteSettings {
            siteSettings {
              max_media_per_gallery_creator
              max_media_per_gallery_vip
              max_upload_size_creator
              max_upload_size_vip
            }
          }
        `,
        schema: 'public'
      });
      setSiteSettings(response.siteSettings);
    } catch (err) {
    }
  };

  // Calcular límite de medios por galería según rol
  const getMediaLimit = (): number | null => {
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
      return siteSettings.max_media_per_gallery_vip ?? null;
    }
    
    // Creator = límite fijo
    if (userRoles.includes('creator')) {
      return siteSettings.max_media_per_gallery_creator ?? 20;
    }
    
    return null;
  };

  // Límite de tamaño por archivo (MB) según rol
  const getUploadSizeLimitMB = (): number | null => {
    if (!user || !siteSettings) return null;
    const userRoles = Array.isArray(user.roles)
      ? user.roles.map((r: Role | string) => typeof r === 'string' ? r : r.name)
      : [];
    if (userRoles.includes('admin') || userRoles.includes('super_admin')) return null; // ilimitado
    if (userRoles.includes('vip')) return siteSettings.max_upload_size_vip ?? 20;
    if (userRoles.includes('creator')) return siteSettings.max_upload_size_creator ?? 5;
    return null;
  };

  const uploadSizeLimitMB = getUploadSizeLimitMB();

  const mediaLimit = getMediaLimit();
  const currentMediaCount = gallery?.media?.length || 0;
  const isAtMediaLimit = mediaLimit !== null && currentMediaCount >= mediaLimit;

  const loadGallery = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);

      const response = await graphqlRequest<GalleryResponse>({
        query: `
          query GetGallery($id: Int!) {
            gallery(id: $id) {
              id
              title
              description
              visibility
              status
              user_id
              allowed_user_ids
              media {
                id
                order
                caption
                file_name
                thumb_url
                thumb_webp_url
                url
              }
            }
          }
        `,
        variables: { id: parseInt(id) },
      });

      if (!response.gallery) {
        setError('Galería no encontrada');
        return;
      }

      // Verificar que sea el propietario
      if (parseInt(String(response.gallery.user_id)) !== parseInt(String(user?.id))) {
        setError('No tienes permiso para editar esta galería');
        return;
      }

      setGallery(response.gallery);
      setFormData({
        title: response.gallery.title,
        description: response.gallery.description || '',
        visibility: response.gallery.visibility as 'public' | 'private' | 'followers',
      });
      setAllowedUserIds((response.gallery as any).allowed_user_ids || []);

      // cargar seguidores del propietario para selector
      const followersRes = await graphqlRequest<FollowersResponse>({
        query: `
          query Followers($user_id: ID!) {
            followers(user_id: $user_id) { id username }
          }
        `,
        variables: { user_id: parseInt(String(response.gallery.user_id)) },
        schema: 'default',
        authenticated: true,
      });
      const flw = followersRes.followers || [];
      setFollowers(flw);

      // Marcar toggle si todos los seguidores están permitidos actualmente
      const followerIds = flw.map((f) => parseInt(String(f.id)));
      const allowed = ((response.gallery as any).allowed_user_ids || []).map((n: any) => parseInt(String(n)));
      const allSelected = followerIds.length > 0 && followerIds.every((id) => allowed.includes(id));
      setAllowAllFollowers(allSelected);
    } catch (err: any) {
      setError(t('errors.loading', { entity: t('entities.gallery') }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Si está activo "permitir a todos", sincroniza la lista cuando cambian seguidores
  useEffect(() => {
    if (allowAllFollowers) {
      setAllowedUserIds(followers.map((f) => parseInt(String(f.id))));
    }
  }, [allowAllFollowers, followers]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'El título es obligatorio';
    } else if (formData.title.length < 3) {
      newErrors.title = 'El título debe tener al menos 3 caracteres';
    } else if (formData.title.length > 255) {
      newErrors.title = 'El título no puede superar 255 caracteres';
    }

    if (formData.description && formData.description.length > 1000) {
      newErrors.description = 'La descripción no puede superar 1000 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();

    if (!validate() || !gallery) return;

    try {
      setSaving(true);
      setError(null);

      await graphqlRequest<UpdateGalleryResponse>({
        query: `
          mutation UpdateGallery($id: Int!, $title: String, $description: String, $visibility: String) {
            updateGallery(
              id: $id
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
          id: parseInt(String(gallery.id)),
          title: formData.title.trim(),
          description: formData.description.trim() || null,
          visibility: formData.visibility,
        },
        schema: 'default',
        authenticated: true,
      });

      // Actualizar usuarios permitidos si es privada, o limpiar si cambió a no privada
      const idsToSend = formData.visibility === 'private' ? allowedUserIds.map((n) => parseInt(String(n))) : [];
      await graphqlRequest({
        query: `
          mutation UpdateAllowed($gallery_id: Int!, $user_ids: [Int!]!) {
            updateGalleryAllowedUsers(gallery_id: $gallery_id, user_ids: $user_ids)
          }
        `,
        variables: { gallery_id: parseInt(String(gallery.id)), user_ids: idsToSend },
        schema: 'default',
        authenticated: true,
      });

      setSuccess('Galería actualizada exitosamente');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al actualizar la galería');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMedia = async (): Promise<void> => {
    if (!mediaToRemove || !gallery) return;

    try {
      setRemoving(true);

      await graphqlRequest({
        query: mutations.removeMediaFromGallery,
        variables: {
          gallery_id: parseInt(String(gallery.id)),
          media_ids: [parseInt(String(mediaToRemove.id))],
        },
        schema: 'default',
        authenticated: true,
      });

      // Actualizar lista local
      setGallery((prev) =>
        prev
          ? {
              ...prev,
              media: prev.media?.filter((m) => m.id !== mediaToRemove.id) || [],
            }
          : null
      );

      setMediaToRemove(null);
      setSuccess('Imagen eliminada de la galería');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al eliminar la imagen');
    } finally {
      setRemoving(false);
    }
  };

  const handleAttachUploaded = async (): Promise<void> => {
    if (!gallery || !filePondRef.current) return;
    
    const files = filePondRef.current.getFiles();
    if (files.length === 0) return;

    try {
      setSaving(true);
      
      // Verificar límite
      if (mediaLimit !== null) {
        const current = gallery.media?.length || 0;
        const remaining = mediaLimit - current;
        if (remaining <= 0) {
          setError('No puedes agregar más imágenes. Elimina algunas para liberar espacio.');
          setTimeout(() => setError(null), 5000);
          return;
        }
        if (files.length > remaining) {
          setError(`Solo puedes agregar ${remaining} imagen(es) más. Tienes ${files.length} seleccionadas.`);
          setTimeout(() => setError(null), 5000);
          return;
        }
      }

      // Subir cada archivo y obtener media_ids
      const uploadedIds: number[] = [];
      setUploadProgress({ current: 0, total: files.length });
      
      for (let i = 0; i < files.length; i++) {
        const fileItem = files[i];
        setUploadProgress({ current: i + 1, total: files.length });
        
        const formData = new FormData();
        formData.append('file', fileItem.file);

        const base = import.meta.env.DEV ? '' : (import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');
        const response = await fetch(`${base}/api/gallery-media/upload`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Error subiendo ${fileItem.filename}`);
        }

        const data = await response.json();
        if (data?.media_id !== undefined && data?.media_id !== null) {
          const id = parseInt(String(data.media_id), 10);
          if (Number.isSafeInteger(id) && id > 0 && id <= 2147483647) {
            uploadedIds.push(id);
          } else {
            throw new Error('ID de media inválido devuelto por el upload');
          }
        }
      }

      if (uploadedIds.length === 0) {
        throw new Error('No se pudo subir ningún archivo');
      }

      // Adjuntar a la galería
      const res = await graphqlRequest<AddMediaResponse>({
        query: mutations.addMediaToGallery,
        variables: {
          gallery_id: parseInt(String(gallery.id)),
          media_ids: uploadedIds,
        },
        schema: 'default',
        authenticated: true,
      });

      // Actualizar galería con medios
      setGallery((prev) => (prev ? { ...prev, media: res.addMediaToGallery.media } : null));

      // Limpiar FilePond y resetear contador
      filePondRef.current.removeFiles();
      setPendingFiles(0);
      setUploadProgress(null);

      setSuccess(`${uploadedIds.length} imagen(es) agregada(s) correctamente`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error al agregar imágenes');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSaving(false);
      setUploadProgress(null);
    }
  };

  // Drag & drop reorder
  const onDragStart = (id: number): void => setDragState({ draggingId: id, overId: null });
  const onDragEnter = (id: number): void => setDragState((s) => ({ ...s, overId: id }));
  const onDragEnd = async (): Promise<void> => {
    const { draggingId, overId } = dragState;
    if (!draggingId || !overId || draggingId === overId || !gallery) {
      setDragState({ draggingId: null, overId: null });
      return;
    }
    // Reordenar en memoria
    const items = [...(gallery?.media || [])];
    const from = items.findIndex((i) => i.id === draggingId);
    const to = items.findIndex((i) => i.id === overId);
    if (from < 0 || to < 0) return;
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setGallery((prev) => (prev ? { ...prev, media: items } : null));

    // Persistir orden
    try {
      setReordering(true);
      await graphqlRequest({
        query: mutations.reorderGalleryMedia,
        variables: {
          gallery_id: parseInt(String(gallery.id)),
          media_ids: items.map((i) => parseInt(String(i.id))),
        },
        schema: 'default',
        authenticated: true,
      });
    } catch (err: any) {
      setError(err.message || 'Error al reordenar');
    } finally {
      setReordering(false);
      setDragState({ draggingId: null, overId: null });
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </Container>
    );
  }

  if (error && !gallery) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error}</p>
          <hr />
          <Button variant="outline-danger" onClick={() => navigate('/mis-galerias')}>
            {t('galleries.back_to_my_galleries')}
          </Button>
        </Alert>
      </Container>
    );
  }

  const getVisibilityBadge = (visibility: string): { bg: string; text: string; icon: string } => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      public: { bg: 'success', text: 'Pública', icon: 'fa-globe' },
      private: { bg: 'danger', text: 'Privada', icon: 'fa-lock' },
      followers: { bg: 'warning', text: 'Seguidores', icon: 'fa-users' },
    };
    return badges[visibility] || { bg: 'secondary', text: visibility, icon: 'fa-question-circle' };
  };

  const badge = getVisibilityBadge(formData.visibility);

  return (
    <Container className="py-5" style={{ maxWidth: '1200px' }}>
      {/* Breadcrumb */}
      <nav aria-label="breadcrumb" className="mb-4">
        <ol className="breadcrumb">
          <li className="breadcrumb-item">
            <Link to="/mis-galerias">{t('galleries.my_galleries')}</Link>
          </li>
          <li className="breadcrumb-item active">Editar: {gallery?.title}</li>
        </ol>
      </nav>

      {/* Mensajes */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          <i className="fas fa-check-circle me-2"></i>
          {success}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          <i className="fas fa-exclamation-triangle me-2"></i>
          {error}
        </Alert>
      )}

      <Row>
        {/* Formulario de edición */}
        <Col lg={5}>
          <Card className="mb-4">
            <Card.Header>
              <h4 className="mb-0">
                <i className="fas fa-pencil-alt me-2"></i>
                {t('galleries.edit_gallery')}
              </h4>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Título */}
                <Form.Group className="mb-3">
                  <Form.Label>
                    Título <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    isInvalid={!!errors.title}
                    maxLength={255}
                  />
                  <Form.Control.Feedback type="invalid">{errors.title}</Form.Control.Feedback>
                  <Form.Text className="text-muted">{formData.title.length}/255</Form.Text>
                </Form.Group>

                {/* Descripción */}
                <Form.Group className="mb-3">
                  <Form.Label>Descripción</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    isInvalid={!!errors.description}
                    rows={3}
                    maxLength={1000}
                  />
                  <Form.Control.Feedback type="invalid">{errors.description}</Form.Control.Feedback>
                  <Form.Text className="text-muted">{formData.description.length}/1000</Form.Text>
                </Form.Group>

                {/* Visibilidad */}
                <Form.Group className="mb-3">
                  <Form.Label>Visibilidad</Form.Label>
                  <div className="text-start">
                    <Form.Check
                      type="radio"
                      name="visibility"
                      value="public"
                      checked={formData.visibility === 'public'}
                      onChange={handleChange}
                      label={
                        <>
                          <i className="fas fa-globe text-success me-1"></i> Pública
                        </>
                      }
                      className="mb-1"
                    />
                    <Form.Check
                      type="radio"
                      name="visibility"
                      value="followers"
                      checked={formData.visibility === 'followers'}
                      onChange={handleChange}
                      label={
                        <>
                          <i className="fas fa-users text-warning me-1"></i> Seguidores
                        </>
                      }
                      className="mb-1"
                    />
                    <Form.Check
                      type="radio"
                      name="visibility"
                      value="private"
                      checked={formData.visibility === 'private'}
                      onChange={handleChange}
                      label={
                        <>
                          <i className="fas fa-lock text-danger me-1"></i> Privada
                        </>
                      }
                    />
                  </div>
                </Form.Group>

                {/* Selector de usuarios permitidos (para privada) */}
                {formData.visibility === 'private' && (
                  <Form.Group className="mb-3">
                    <Form.Label>Permitir acceso a seguidores</Form.Label>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                      <Form.Check
                        type="switch"
                        id="allow-all-followers"
                        label="Permitir a todos mis seguidores"
                        disabled={followers.length === 0}
                        checked={allowAllFollowers}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setAllowAllFollowers(checked);
                          if (checked) {
                            setAllowedUserIds(followers.map((f) => parseInt(String(f.id))));
                          }
                        }}
                      />
                      {followers.length === 0 && <span className="text-muted small ms-2">No tienes seguidores aún</span>}
                    </div>
                    <Form.Select
                      multiple
                      htmlSize={8}
                      value={allowedUserIds.map(String)}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions).map((o) => parseInt(o.value));
                        setAllowedUserIds(options);
                        // Si se modifica manualmente, desactivar el switch si ya no coincide con "todos"
                        const followerIds = followers.map((f) => String(f.id));
                        const isAll = followerIds.length > 0 && followerIds.every((id) => options.map(String).includes(id));
                        setAllowAllFollowers(isAll);
                      }}
                      disabled={allowAllFollowers}
                    >
                      {followers.map((f) => (
                        <option key={String(f.id)} value={String(f.id)}>
                          {f.username}
                        </option>
                      ))}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {allowAllFollowers ? 'Todos tus seguidores podrán ver esta galería privada.' : 'Selecciona qué seguidores podrán ver esta galería privada.'}
                    </Form.Text>
                  </Form.Group>
                )}

                {/* Botones */}
                <div className="d-grid gap-2">
                  <Button type="submit" variant="primary" disabled={saving}>
                    {saving ? (
                      <>
                        <Spinner size="sm" className="me-2" />
                        Guardando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Guardar Cambios
                      </>
                    )}
                  </Button>
                  <Button variant="outline-secondary" onClick={() => navigate('/mis-galerias')}>
                    Volver
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Gestión de imágenes */}
        <Col lg={7}>
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <i className="fas fa-images me-2"></i>
                Imágenes ({gallery?.media?.length || 0})
              </h4>
              <Badge bg={badge.bg}>
                <i className={`fas ${badge.icon} me-1`}></i>
                {badge.text}
              </Badge>
              {gallery?.status && (
                <Badge bg={gallery.status === 'approved' ? 'success' : gallery.status === 'pending' ? 'warning' : 'danger'} className="ms-2">
                  <i className={`fas ${gallery.status === 'approved' ? 'fa-check-circle' : gallery.status === 'pending' ? 'fa-hourglass-half' : 'fa-times-circle'} me-1`}></i>
                  {gallery.status === 'approved' ? 'Aprobada' : gallery.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                </Badge>
              )}
            </Card.Header>
            <Card.Body>
              {gallery?.status === 'pending' && (
                <Alert variant="warning" className="mb-3">
                  <i className="fas fa-hourglass-half me-2"></i>
                  Esta galería está pendiente de aprobación. Solo tú y moderadores la pueden ver.
                </Alert>
              )}
              {gallery?.status === 'rejected' && (
                <Alert variant="danger" className="mb-3">
                  <i className="fas fa-times-circle me-2"></i>
                  Esta galería fue rechazada. Puedes editarla para solicitar nueva revisión.
                </Alert>
              )}
              {/* Cuota de medios por galería */}
              {mediaLimit !== null && (
                <Alert variant={isAtMediaLimit ? 'danger' : currentMediaCount / mediaLimit >= 0.8 ? 'warning' : 'info'} className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <strong>
                      <i className="fas fa-chart-pie me-2"></i>
                      Cuota de Imágenes: {currentMediaCount} de {mediaLimit}
                    </strong>
                    {isAtMediaLimit && (
                      <Badge bg="danger">
                        <i className="fas fa-exclamation-triangle me-1"></i>
                        Límite alcanzado
                      </Badge>
                    )}
                  </div>
                  <ProgressBar 
                    now={(currentMediaCount / mediaLimit) * 100} 
                    variant={isAtMediaLimit ? 'danger' : currentMediaCount / mediaLimit >= 0.8 ? 'warning' : 'info'}
                    className="mb-2"
                  />
                  {isAtMediaLimit ? (
                    <small className="text-danger d-block">
                      <i className="fas fa-ban me-1"></i>
                      Has alcanzado el límite máximo de imágenes para esta galería.
                    </small>
                  ) : (
                    <small className="text-muted">
                      Te quedan <strong>{mediaLimit - currentMediaCount}</strong> imágenes disponibles. 
                      <span className="text-warning d-block mt-1">
                        <i className="fas fa-info-circle me-1"></i>
                        Si intentas seleccionar más archivos del límite permitido, no se adjuntarán.
                        {uploadSizeLimitMB !== null && (
                          <>
                            <br />Límite de tamaño por archivo: <strong>{uploadSizeLimitMB}MB</strong>.
                          </>
                        )}
                      </span>
                    </small>
                  )}
                </Alert>
              )}

              {mediaLimit === null && (
                <Alert variant="success" className="mb-3">
                  <i className="fas fa-infinity me-2"></i>
                  <strong>Imágenes Ilimitadas</strong> - Puedes agregar tantas imágenes como desees
                </Alert>
              )}

              {/* Subir y agregar imágenes */}
              <div className="mb-3">
                {isAtMediaLimit && (
                  <Alert variant="warning" className="mb-3">
                    <i className="fas fa-info-circle me-2"></i>
                    No puedes agregar más imágenes. Elimina algunas para liberar espacio.
                  </Alert>
                )}

                {!isAtMediaLimit && (
                  <>
                    <FilePond
                      ref={filePondRef}
                      name="file"
                      allowMultiple={true}
                      maxFiles={mediaLimit === null ? 10 : Math.max(1, mediaLimit - currentMediaCount)}
                      acceptedFileTypes={['image/jpeg', 'image/png', 'image/webp', 'image/gif']}
                      {...(uploadSizeLimitMB !== null ? { maxFileSize: `${uploadSizeLimitMB}MB` } : {})}
                      onupdatefiles={(fileItems) => setPendingFiles(fileItems.length)}
                      labelIdle='Arrastra y suelta tus imágenes o <span class="filepond--label-action">Explora</span>'
                      {...{ labelMaxFileCountExceeded: `Solo puedes seleccionar hasta ${mediaLimit === null ? 10 : Math.max(1, mediaLimit - currentMediaCount)} archivo(s) para esta galería.` }}
                      {...(uploadSizeLimitMB !== null ? { labelMaxFileSizeExceeded: `El archivo supera el límite de ${uploadSizeLimitMB}MB permitido por tu rol.`, labelMaxFileSize: `Tamaño máximo: ${uploadSizeLimitMB}MB` } : {})}
                    />
                    {filePondWarning && (
                      <Alert variant="warning" className="mt-2 py-1 small">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {filePondWarning}
                      </Alert>
                    )}
                  </>
                )}
                {!isAtMediaLimit && (
                  <div className="d-flex flex-column gap-2">
                    {/* Barra de progreso de upload */}
                    {uploadProgress && (
                      <Alert variant="info" className="mb-0">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <small>
                            <i className="fas fa-cloud-upload-alt me-2"></i>
                            Subiendo imagen {uploadProgress.current} de {uploadProgress.total}
                          </small>
                          <small className="text-muted">
                            {Math.round((uploadProgress.current / uploadProgress.total) * 100)}%
                          </small>
                        </div>
                        <ProgressBar 
                          now={(uploadProgress.current / uploadProgress.total) * 100} 
                          variant="info"
                          animated
                        />
                      </Alert>
                    )}
                    
                    <div className="d-flex justify-content-end gap-2">
                      <Button variant="primary" size="sm" disabled={pendingFiles === 0 || saving} onClick={handleAttachUploaded}>
                        {saving ? (
                          <>
                            <Spinner size="sm" className="me-2" />
                            Agregando...
                          </>
                        ) : (
                          <>Agregar a galería ({pendingFiles})</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {gallery?.media && gallery.media.length > 0 ? (
                <Row xs={2} md={3} className="g-3">
                  {gallery.media.map((item) => (
                    <Col key={String(item.id)}>
                      <Card
                        className={`h-100 ${dragState.draggingId === item.id ? 'border-primary' : ''}`}
                        draggable
                        onDragStart={() => onDragStart(Number(item.id))}
                        onDragEnter={() => onDragEnter(Number(item.id))}
                        onDragEnd={onDragEnd}
                      >
                        <div style={{ position: 'relative', cursor: 'grab' }}>
                          <OptimizedImage
                            webpUrl={(item as any).thumb_webp_url}
                            fallbackUrl={item.thumb_url}
                            alt={item.caption || ''}
                            style={{ height: '150px', width: '100%', objectFit: 'cover' }}
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            style={{ position: 'absolute', top: '5px', right: '5px' }}
                            onClick={() => setMediaToRemove(item)}
                            title="Quitar de la galería"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
                          <span className="badge bg-secondary" style={{ position: 'absolute', left: '5px', top: '5px' }}>
                            <i className="fas fa-grip-vertical me-1" />
                            Arrastra
                          </span>
                        </div>
                      </Card>
                    </Col>
                  ))}
                </Row>
              ) : (
                <div className="text-center py-5">
                  <i className="fas fa-images fs-1 text-muted d-block mb-3"></i>
                  <p className="text-muted mb-0">Aún no has agregado imágenes a esta galería.</p>
                </div>
              )}

              {reordering && (
                <div className="text-muted small mt-3">
                  <Spinner size="sm" className="me-2" />
                  Guardando orden...
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Modal confirmación eliminar imagen */}
      <Modal show={!!mediaToRemove} onHide={() => !removing && setMediaToRemove(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Eliminar Imagen</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>¿Estás seguro de que deseas eliminar esta imagen de la galería?</p>
          <p className="text-muted small mb-0">La imagen será eliminada permanentemente, esta accion no se puede deshacer.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setMediaToRemove(null)} disabled={removing}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleRemoveMedia} disabled={removing}>
            {removing ? (
              <>
                <Spinner size="sm" className="me-2" />
                Eliminando...
              </>
            ) : (
              'Eliminar'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
