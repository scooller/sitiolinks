import React, { type ReactElement, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Modal, Spinner } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn, appleEase } from '../lib/animations';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { mutations } from '../lib/graphql/mutations';
import { getCountryFlag } from '../lib/countryUtils';
import { FilePond, registerPlugin } from 'react-filepond';
import type { FilePondFile } from 'filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import type { User, Tag } from '../types';
import { useTranslation } from 'react-i18next';
import LinkEditorModal, { type ProfileLinkItem } from '../components/LinkEditorModal';
import { SOCIAL_PLATFORMS, detectSocialPlatform, getPlatformById } from '../lib/socialLinks';

registerPlugin(FilePondPluginImagePreview, FilePondPluginFileValidateType, FilePondPluginFileValidateSize);

interface FormData {
  name: string;
  description: string;
  nationality: string;
  country: string;
  city: string;
  gender: string;
  birth_date: string;
  price_from: string;
  country_block: boolean;
  card_bg_color: string;
  card_bg_opacity: number;
  privacy_consent: boolean;
  privacy_consent_at: string | null;
  search_indexing_opt_in: boolean;
}

interface ProfileLink {
  id?: string | number;
  name: string;
  url: string;
  icon: string;
  order?: number;
  is_adult?: boolean;
}

interface CountriesData {
  countries: Record<string, string>;
  cities?: Record<string, string[]>;
}

type TabType = 'general' | 'creator' | 'links' | 'tags' | 'security';

export default function EditProfile(): ReactElement {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser, logout } = useAuth();
  const { t, i18n } = useTranslation();

  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<string[]>([]);
  const [currentAvatarUrl, setCurrentAvatarUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    nationality: '',
    country: '',
    city: '',
    gender: '',
    birth_date: '',
    price_from: '',
    country_block: false,
    card_bg_color: '',
    card_bg_opacity: 1,
    privacy_consent: false,
    privacy_consent_at: null,
    search_indexing_opt_in: true,
  });

  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [showLinkModal, setShowLinkModal] = useState<boolean>(false);
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [selectedLinkForEdit, setSelectedLinkForEdit] = useState<ProfileLinkItem | null>(null);
  const [showCreatorRequestModal, setShowCreatorRequestModal] = useState<boolean>(false);
  const [creatorRequestNotes, setCreatorRequestNotes] = useState<string>('');
  const [creatorRequestSending, setCreatorRequestSending] = useState<boolean>(false);
  const [creatorRequestSuccess, setCreatorRequestSuccess] = useState<boolean>(false);
  const [creatorRequestError, setCreatorRequestError] = useState<string | null>(null);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [avatarFiles, setAvatarFiles] = useState<FilePondFile[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const filePondRef = useRef<FilePond | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<(string | number)[]>([]);
  const [tagSearch, setTagSearch] = useState<string>('');
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deleteEmail, setDeleteEmail] = useState<string>('');
  const [deleting, setDeleting] = useState<boolean>(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [exportingData, setExportingData] = useState<boolean>(false);

  const handleExportData = async () => {
    setExportingData(true);
    try {
      const resp = await graphqlRequest<{ exportMyData: string }>({
        query: `query { exportMyData }`,
        schema: 'default',
        authenticated: true,
      });
      if (resp?.exportMyData) {
        const blob = new Blob([resp.exportMyData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `link-persons-portabilidad-${currentUser?.username || 'usuario'}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch {
      //
    } finally {
      setExportingData(false);
    }
  };

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadUserData();
  }, [currentUser, navigate]);

  const loadUserData = async () => {
    if (!currentUser?.username) return;

    try {
      setLoadingData(true);
      const query = `
        query UserProfile($username: String!) {
          user(username: $username) {
            id
            name
            username
            email
            description
            nationality
            country
            city
            gender
            birth_date
            price_from
            country_block
            card_bg_color
            card_bg_opacity
            avatar_url
            avatar_thumb
            privacy_consent
            privacy_consent_at
            search_indexing_opt_in
            links {
              id
              name
              url
              icon
              order
              is_adult
            }
            roles {
              name
            }
            tags { id name color icon weight is_fixed }
          }
        }
      `;

      const data = await graphqlRequest<{ user: User }>({
        query,
        variables: { username: currentUser.username },
        schema: 'default',
        authenticated: true,
      });

      if (data?.user) {
        const userData = data.user;
        setCurrentAvatarUrl(userData.avatar_thumb || userData.avatar_url || null);
        setFormData({
          name: userData.name || '',
          description: userData.description || '',
          nationality: userData.nationality || '',
          country: userData.country || '',
          city: userData.city || '',
          gender: userData.gender || '',
          birth_date: userData.birth_date || '',
          price_from: String(userData.price_from || ''),
          country_block: (userData as any).country_block || false,
          card_bg_color: (userData as any).card_bg_color || '#ffffff',
          card_bg_opacity: typeof (userData as any).card_bg_opacity === 'number' ? (userData as any).card_bg_opacity : 1,
          privacy_consent: !!(userData as any).privacy_consent,
          privacy_consent_at: (userData as any).privacy_consent_at || null,
          search_indexing_opt_in: (userData as any).search_indexing_opt_in !== false,
        });

        setLinks((userData as any).links || []);
        const userTagIds = ((userData as any).tags || []).map((tg: Tag) => tg.id);
        setSelectedTagIds(userTagIds);
      }

      await loadCountriesAndCities();
      await loadAllTags();
    } catch (err: any) {
      setError(t('errors.loading', { entity: t('entities.profile') }));
    } finally {
      setLoadingData(false);
    }
  };

  const loadCountriesAndCities = async () => {
    try {
      const query = `query { countries }`;
      const data = await graphqlRequest<{ countries: string }>({ query, schema: 'public' });
      const parsed: CountriesData = JSON.parse(data.countries);
      setCountries(parsed.countries || {});
      if (formData.country && parsed.cities) {
        const countryCities = parsed.cities[formData.country] || [];
        setCities(countryCities);
      }
    } catch (err) {
      // Ignorar fallback
    }
  };

  const loadAllTags = async () => {
    try {
      const data = await graphqlRequest<{ tags: Tag[] }>({
        query: `query { tags { id name name_en color icon weight is_fixed } }`,
        schema: 'public',
      });
      const tags = data.tags || [];
      setAllTags(tags);
      const fixedUserTags = tags.filter((tg) => tg.is_fixed && selectedTagIds.includes(tg.id)).map((tg) => tg.id);
      if (fixedUserTags.length) {
        setSelectedTagIds((prev) => Array.from(new Set([...prev, ...fixedUserTags])));
      }
    } catch (e) {
      // Ignorar fallback
    }
  };

  const filteredTags = useMemo(() => {
    const term = tagSearch.trim().toLowerCase();
    return allTags
      .filter((tg) => !term || (tg.name && tg.name.toLowerCase().includes(term)) || (tg.name_en && tg.name_en.toLowerCase().includes(term)) || (tg.icon && tg.icon.toLowerCase().includes(term)))
      .sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
  }, [allTags, tagSearch]);

  const loadCities = async (countryCode: string) => {
    try {
      const query = `query { countries }`;
      const data = await graphqlRequest<{ countries: string }>({ query, schema: 'public' });
      const parsed: CountriesData = JSON.parse(data.countries);
      setCities(parsed.cities?.[countryCode] || []);
    } catch (err) {
      // Ignorar fallback
    }
  };

  useEffect(() => {
    if (formData.country) {
      loadCities(formData.country);
    }
  }, [formData.country]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const target = e.target as HTMLInputElement;
    const { name, value, type, checked } = target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const openAddLink = (presetPlatformId?: string) => {
    setEditingLinkIndex(null);
    if (presetPlatformId) {
      const plat = getPlatformById(presetPlatformId);
      setSelectedLinkForEdit({
        name: plat.name,
        url: '',
        icon: plat.icon,
        is_adult: !!plat.isAdultDefault,
      });
    } else {
      setSelectedLinkForEdit(null);
    }
    setShowLinkModal(true);
  };

  const openEditLink = (index: number) => {
    setEditingLinkIndex(index);
    setSelectedLinkForEdit(links[index]);
    setShowLinkModal(true);
  };

  const handleSaveLink = (linkItem: ProfileLinkItem) => {
    if (editingLinkIndex !== null && editingLinkIndex >= 0 && editingLinkIndex < links.length) {
      const updated = [...links];
      updated[editingLinkIndex] = {
        ...updated[editingLinkIndex],
        ...linkItem,
      };
      setLinks(updated);
    } else {
      setLinks([...links, { ...linkItem, order: links.length }]);
    }
  };

  const moveLink = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= links.length) return;
    const newLinks = [...links];
    const temp = newLinks[index];
    newLinks[index] = newLinks[targetIndex];
    newLinks[targetIndex] = temp;
    setLinks(newLinks.map((item, idx) => ({ ...item, order: idx })));
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleSendCreatorRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatorRequestSending(true);
    setCreatorRequestError(null);

    try {
      const description = `El usuario ${currentUser?.name || ''} (@${currentUser?.username || ''}) ha solicitado la activación de su perfil como Creador(a) desde su panel de perfil.\n\n` +
        `Email: ${currentUser?.email || ''}\n` +
        `Mensaje / Detalles adicionales: ${creatorRequestNotes.trim() || 'Sin notas adicionales'}\n\n` +
        `Revisar y cambiar su rol a 'creator' en la tabla de Usuarios de Filament si cumple con los requisitos.`;

      await graphqlRequest({
        query: mutations.createTicket,
        variables: {
          subject: `Solicitud de Perfil Creador(a) - @${currentUser?.username || 'usuario'}`,
          description,
          category: 'cuenta',
          priority: 'alta',
        },
        schema: 'default',
        authenticated: true,
      });

      setCreatorRequestSuccess(true);
    } catch (err: any) {
      setCreatorRequestError(err?.message || t('profile.creator_request_error', 'Error al enviar la solicitud. Por favor intenta de nuevo.'));
    } finally {
      setCreatorRequestSending(false);
    }
  };

  const handleDeleteProfile = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      await graphqlRequest<boolean>({
        query: `
          mutation DeleteProfile($email: String!) {
            deleteProfile(email: $email)
          }
        `,
        variables: { email: deleteEmail },
        schema: 'default',
        authenticated: true,
      });
      await logout();
      navigate('/');
    } catch (err: any) {
      setDeleteError(err?.response?.[0]?.message || err?.message || t('profile.delete_error'));
    } finally {
      setDeleting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const profileMutation = `
        mutation UpdateProfile(
          $name: String,
          $description: String,
          $nationality: String,
          $country: String,
          $city: String,
          $gender: String,
          $birth_date: String,
          $price_from: Float,
          $country_block: Boolean,
          $card_bg_color: String,
          $card_bg_opacity: Float,
          $privacy_consent: Boolean,
          $search_indexing_opt_in: Boolean
        ) {
          updateProfile(
            name: $name,
            description: $description,
            nationality: $nationality,
            country: $country,
            city: $city,
            gender: $gender,
            birth_date: $birth_date,
            price_from: $price_from,
            country_block: $country_block,
            card_bg_color: $card_bg_color,
            card_bg_opacity: $card_bg_opacity,
            privacy_consent: $privacy_consent,
            search_indexing_opt_in: $search_indexing_opt_in
          ) {
            id
            name
            username
            privacy_consent
            privacy_consent_at
            search_indexing_opt_in
          }
        }
      `;

      await graphqlRequest({
        query: profileMutation,
        variables: {
          ...formData,
          price_from: formData.price_from ? parseFloat(formData.price_from) : null,
          card_bg_color: formData.card_bg_color || null,
          card_bg_opacity: typeof formData.card_bg_opacity === 'number' ? formData.card_bg_opacity : 1,
          privacy_consent: formData.privacy_consent,
          search_indexing_opt_in: formData.search_indexing_opt_in,
        },
        schema: 'default',
        authenticated: true,
      });

      if (avatarFiles.length > 0 && (avatarFiles[0] as any).serverId) {
        const avatarMutation = `
          mutation UpdateAvatar($media_id: Int!) {
            updateAvatar(media_id: $media_id) {
              id
              avatar_url
            }
          }
        `;

        const rawServerId = (avatarFiles[0] as any).serverId;
        const mediaId = parseInt(String(rawServerId), 10);
        if (Number.isSafeInteger(mediaId) && mediaId > 0 && mediaId <= 2147483647) {
          await graphqlRequest({
            query: avatarMutation,
            variables: {
              media_id: mediaId,
            },
            schema: 'default',
            authenticated: true,
          });
        } else {
          throw new Error('ID de media inválido devuelto por el upload');
        }
      }

      const isUserCreator = (currentUser as any).roles?.some((role: any) => role.name === 'creator') || (currentUser as any).roles?.includes('creator');
      if (isUserCreator) {
        const linksMutation = `
          mutation UpdateLinks($links: [LinkInput]) {
            updateLinks(links: $links) {
              id
              username
            }
          }
        `;

        await graphqlRequest({
          query: linksMutation,
          variables: {
            links: links.filter((link) => link.name && link.url),
          },
          schema: 'default',
          authenticated: true,
        });
      }

      try {
        const isUserAdmin =
          (currentUser as any).roles?.some((r: any) => r.name === 'admin' || r.name === 'super_admin') ||
          (currentUser as any).roles?.includes('admin') ||
          (currentUser as any).roles?.includes('super_admin');
        let tagIdsToSend = selectedTagIds.slice();
        if (!isUserAdmin) {
          const fixedUserTagIds = allTags.filter((tg) => tg.is_fixed && selectedTagIds.includes(tg.id)).map((tg) => tg.id);
          tagIdsToSend = Array.from(new Set([...tagIdsToSend, ...fixedUserTagIds]));
        }
        if (allTags.length) {
          await graphqlRequest({
            query: `
              mutation AssignUserTags($user_id: ID!, $tag_ids: [ID]!) {
                assignUserTags(user_id: $user_id, tag_ids: $tag_ids) {
                  id
                  username
                  tags { id name }
                }
              }
            `,
            variables: { user_id: String(currentUser?.id), tag_ids: tagIdsToSend.map((id) => String(id)) },
            schema: 'default',
            authenticated: true,
          });
        }
      } catch (tagErr) {
        // Tag sync non-fatal
      }

      setSuccess(true);
      await refreshUser();

      setTimeout(() => {
        navigate(`/u/${currentUser?.username}`);
      }, 1500);
    } catch (err: any) {
      setError(err?.message || t('profile.error_updating'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container className="mt-5 text-center">
        <div className="apple-glass-card p-4 mx-auto" style={{ maxWidth: 480 }}>
          <i className="fas fa-lock text-warning fa-2x mb-3"></i>
          <h5>{t('auth.login_required_edit_profile')}</h5>
          <button className="apple-btn-primary mt-3" onClick={() => navigate('/login')}>
            {t('nav.login')}
          </button>
        </div>
      </Container>
    );
  }

  if (loadingData) {
    return (
      <Container className="mt-5 text-center">
        <div className="d-flex flex-column align-items-center justify-content-center py-5">
          <Spinner animation="border" variant="primary" style={{ width: '3rem', height: '3rem' }} />
          <p className="mt-3 text-muted fw-semibold">{t('profile.loading')}</p>
        </div>
      </Container>
    );
  }

  const isCreator =
    (currentUser as any).roles?.some((role: any) => role.name === 'creator') ||
    (currentUser as any).roles?.includes('creator');

  const isAdmin =
    (currentUser as any).roles?.some((r: any) => r.name === 'admin' || r.name === 'super_admin') ||
    (currentUser as any).roles?.includes('admin') ||
    (currentUser as any).roles?.includes('super_admin');

  // Cálculo de luminancia para live preview de card
  const previewBgColor = formData.card_bg_color || '#ffffff';
  const previewOpacity = typeof formData.card_bg_opacity === 'number' ? formData.card_bg_opacity : 1;
  const hex = previewBgColor.replace('#', '');
  const r = hex.length === 6 ? parseInt(hex.substring(0, 2), 16) : 255;
  const g = hex.length === 6 ? parseInt(hex.substring(2, 4), 16) : 255;
  const b = hex.length === 6 ? parseInt(hex.substring(4, 6), 16) : 255;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const previewTextColor = lum > 0.6 ? '#111827' : '#ffffff';

  return (
    <div className="edit-profile-wrapper">
      {/* 1. Cabecera Editorial Apple */}
      <div className="edit-profile-hero">
        <Link to={`/u/${currentUser.username}`} className="edit-profile-back-link">
          <i className="fas fa-arrow-left"></i>
          <span>{t('profile.view_public')}</span>
        </Link>
        <div className="edit-profile-kicker">
          <i className="fas fa-user-gear"></i>
          <span>{t('profile.kicker')}</span>
        </div>
        <h1 className="edit-profile-title">{t('profile.edit_profile')}</h1>
        <p className="edit-profile-subtitle">
          <span>{t('profile.subtitle')}</span>
          <span className="badge rounded-pill bg-secondary bg-opacity-25 text-body">@{currentUser.username}</span>
        </p>
      </div>

      {/* Banner de Solicitud de Creador para usuarios con rol estándar */}
      {!isCreator && (
        <div
          className="apple-creator-banner mb-4 p-3 p-md-4 rounded-4"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.12), rgba(236, 72, 153, 0.12))',
            border: '1px solid rgba(139, 92, 246, 0.28)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div className="d-flex align-items-center gap-3">
            <div
              className="d-flex align-items-center justify-content-center text-white flex-shrink-0"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '13px',
                background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
              }}
            >
              <i className="fas fa-wand-magic-sparkles fs-5"></i>
            </div>
            <div>
              <h5 className="fw-bold mb-1" style={{ color: 'var(--color-text)', fontSize: '1.05rem' }}>
                {t('profile.become_creator_title', '¿Quieres ser Creador(a) de Contenido?')}
              </h5>
              <p className="text-muted small mb-0" style={{ maxWidth: '540px' }}>
                {t('profile.become_creator_desc', 'Publica tus propias galerías, enlaces directos y redes sociales para que tu audiencia te encuentre. Envía tu solicitud al administrador.')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="apple-btn-primary"
            onClick={() => {
              setCreatorRequestSuccess(false);
              setCreatorRequestError(null);
              setShowCreatorRequestModal(true);
            }}
            style={{
              background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
              border: 'none',
              minHeight: '44px',
              padding: '0.55rem 1.4rem',
              boxShadow: '0 4px 14px rgba(139, 92, 246, 0.3)',
            }}
          >
            <i className="fas fa-paper-plane me-1"></i>
            <span>{t('profile.request_creator_btn', 'Solicitar Perfil de Creador')}</span>
          </button>
        </div>
      )}

      {/* 2. Apple Segmented Control Navigation */}
      <nav className="edit-profile-segmented" aria-label="Secciones de perfil">
        <button
          type="button"
          className={`edit-profile-tab-btn ${activeTab === 'general' ? 'active' : ''}`}
          onClick={() => setActiveTab('general')}
        >
          <i className="fas fa-user"></i>
          <span>{t('profile.tab_general')}</span>
        </button>

        {isCreator && (
          <button
            type="button"
            className={`edit-profile-tab-btn ${activeTab === 'creator' ? 'active' : ''}`}
            onClick={() => setActiveTab('creator')}
          >
            <i className="fas fa-wand-magic-sparkles"></i>
            <span>{t('profile.tab_creator')}</span>
          </button>
        )}

        {isCreator && (
          <button
            type="button"
            className={`edit-profile-tab-btn ${activeTab === 'links' ? 'active' : ''}`}
            onClick={() => setActiveTab('links')}
          >
            <i className="fas fa-link"></i>
            <span>{t('profile.tab_links')}</span>
            {links.length > 0 && <span className="badge rounded-pill bg-primary ms-1">{links.length}</span>}
          </button>
        )}

        {isCreator && (
          <button
            type="button"
            className={`edit-profile-tab-btn ${activeTab === 'tags' ? 'active' : ''}`}
            onClick={() => setActiveTab('tags')}
          >
            <i className="fas fa-tags"></i>
            <span>{t('profile.tab_tags')}</span>
            {selectedTagIds.length > 0 && <span className="badge rounded-pill bg-primary ms-1">{selectedTagIds.length}</span>}
          </button>
        )}

        <button
          type="button"
          className={`edit-profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
          onClick={() => setActiveTab('security')}
        >
          <i className="fas fa-shield-halved"></i>
          <span>{t('profile.tab_security')}</span>
        </button>
      </nav>

      {/* Alertas de Notificación Apple */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert-danger rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm"
        >
          <i className="fas fa-circle-exclamation fs-5"></i>
          <span className="fw-medium">{error}</span>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="alert alert-success rounded-4 d-flex align-items-center gap-2 mb-4 shadow-sm"
        >
          <i className="fas fa-circle-check fs-5"></i>
          <span className="fw-medium">{t('profile.success_updated')}</span>
        </motion.div>
      )}

      {/* Formulario Principal con Pestañas */}
      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait">
          {/* ================= PESTAÑA: GENERAL ================= */}
          {activeTab === 'general' && (
            <motion.div
              key="tab-general"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.exit}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              <div className="edit-profile-card">
                <div className="edit-profile-section-header">
                  <div className="edit-profile-icon-plate icon-plate-blue">
                    <i className="fas fa-camera"></i>
                  </div>
                  <div>
                    <h4>{t('profile.avatar')}</h4>
                    <p>{t('profile.avatar_help')}</p>
                  </div>
                </div>

                <div className="edit-profile-avatar-row">
                  {currentAvatarUrl ? (
                    <img
                      src={currentAvatarUrl}
                      alt={formData.name || currentUser.username}
                      className="edit-profile-avatar-squircle"
                    />
                  ) : (
                    <div className="edit-profile-avatar-squircle">
                      <i className="fas fa-user"></i>
                    </div>
                  )}
                  <div className="edit-profile-avatar-info">
                    <h6>{t('profile.current_avatar')}</h6>
                    <p>{t('profile.change_avatar')}</p>
                  </div>
                </div>

                <div className="edit-profile-filepond mb-4">
                  <FilePond
                    ref={filePondRef}
                    name="file"
                    files={avatarFiles as any}
                    onupdatefiles={(files) => setAvatarFiles(files as any)}
                    allowMultiple={false}
                    maxFiles={1}
                    acceptedFileTypes={['image/jpeg', 'image/png', 'image/jpg', 'image/webp']}
                    maxFileSize="10MB"
                    labelIdle={t('filepond.label_idle')}
                    onprocessfilestart={() => setUploadingAvatar(true)}
                    onprocessfile={() => setUploadingAvatar(false)}
                    onprocessfilerevert={() => setUploadingAvatar(false)}
                    server={{
                      url: (import.meta.env.DEV ? '/api' : `${(import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000').replace(/\/$/, '')}/api`),
                      process: {
                        url: '/avatar/upload',
                        method: 'POST',
                        withCredentials: true,
                        onload: (responseText: string) => {
                          try {
                            const data = JSON.parse(responseText);
                            const id = parseInt(String(data?.media_id), 10);
                            if (Number.isSafeInteger(id) && id > 0 && id <= 2147483647) {
                              return String(id);
                            }
                          } catch (e) {
                            // Ignorar fallback
                          }
                          const plainId = parseInt(String(responseText).trim(), 10);
                          if (Number.isSafeInteger(plainId) && plainId > 0 && plainId <= 2147483647) {
                            return String(plainId);
                          }
                          return '';
                        },
                        onerror: (res: any) => {
                          setUploadingAvatar(false);
                          return res;
                        },
                      },
                      revert: {
                        url: '/avatar/revert',
                        method: 'DELETE',
                        withCredentials: true,
                      },
                    }}
                    credits={false}
                  />
                </div>

                <div className="edit-profile-section-header mt-4">
                  <div className="edit-profile-icon-plate icon-plate-teal">
                    <i className="fas fa-id-card"></i>
                  </div>
                  <div>
                    <h4>{t('profile.basic_info')}</h4>
                    <p>{t('profile.full_name')} &amp; {t('profile.description')}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="apple-label">
                    {t('profile.full_name')} <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className="apple-input"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="apple-label">
                    {t('profile.description')}
                  </label>
                  <textarea
                    name="description"
                    className="apple-textarea"
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                  ></textarea>
                </div>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <label className="apple-label">
                      {t('profile.gender')} <span className="text-danger">*</span>
                    </label>
                    <select
                      name="gender"
                      className="apple-select"
                      value={formData.gender}
                      onChange={handleChange}
                      required
                    >
                      <option value="">{t('common.select')}</option>
                      <option value="hombre">{t('explore.gender_male').replace('Gender: ', '')}</option>
                      <option value="mujer">{t('explore.gender_female').replace('Gender: ', '')}</option>
                      <option value="trans">{t('explore.gender_trans').replace('Gender: ', '')}</option>
                      <option value="otro">{t('explore.gender_other').replace('Gender: ', '')}</option>
                    </select>
                  </Col>

                  <Col md={6}>
                    <label className="apple-label">
                      {t('profile.birth_date')} <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      name="birth_date"
                      className="apple-input"
                      value={formData.birth_date}
                      onChange={handleChange}
                      required
                    />
                    <div className="apple-form-hint">{t('profile.must_be_adult')}</div>
                  </Col>
                </Row>

                <div className="edit-profile-section-header mt-4">
                  <div className="edit-profile-icon-plate icon-plate-orange">
                    <i className="fas fa-globe"></i>
                  </div>
                  <div>
                    <h4>{t('profile.location')}</h4>
                    <p>{t('profile.nationality')}, {t('profile.country')} &amp; {t('profile.city')}</p>
                  </div>
                </div>

                <Row className="g-3 mb-3">
                  <Col md={6}>
                    <label className="apple-label">
                      {t('profile.nationality')}
                    </label>
                    <select
                      name="nationality"
                      className="apple-select"
                      value={formData.nationality}
                      onChange={handleChange}
                    >
                      <option value="">{t('common.select')}</option>
                      {Object.entries(countries).map(([code, countryName]) => (
                        <option key={code} value={code}>
                          {getCountryFlag(code)} {countryName}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md={6}>
                    <label className="apple-label">
                      {t('profile.country')}
                    </label>
                    <select
                      name="country"
                      className="apple-select"
                      value={formData.country}
                      onChange={handleChange}
                    >
                      <option value="">{t('common.select')}</option>
                      {Object.entries(countries).map(([code, countryName]) => (
                        <option key={code} value={code}>
                          {getCountryFlag(code)} {countryName}
                        </option>
                      ))}
                    </select>
                  </Col>

                  <Col md={12}>
                    <label className="apple-label">
                      {t('profile.city')}
                    </label>
                    <select
                      name="city"
                      className="apple-select"
                      value={formData.city}
                      onChange={handleChange}
                      disabled={!formData.country}
                    >
                      <option value="">{t('common.select')}</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                    {!formData.country && (
                      <div className="apple-form-hint">{t('profile.select_first_country')}</div>
                    )}
                  </Col>
                </Row>
              </div>
            </motion.div>
          )}

          {/* ================= PESTAÑA: CREADOR ================= */}
          {activeTab === 'creator' && isCreator && (
            <motion.div
              key="tab-creator"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.exit}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              <div className="edit-profile-card">
                <div className="edit-profile-section-header">
                  <div className="edit-profile-icon-plate icon-plate-purple">
                    <i className="fas fa-wand-magic-sparkles"></i>
                  </div>
                  <div>
                    <h4>{t('profile.creator_info')}</h4>
                    <p>{t('profile.price_from_help')}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="apple-label">
                    {t('profile.price_from_label')}
                  </label>
                  <div className="position-relative">
                    <input
                      type="number"
                      step="0.01"
                      name="price_from"
                      className="apple-input ps-5"
                      value={formData.price_from}
                      onChange={handleChange}
                      placeholder="0.00"
                    />
                    <span className="position-absolute top-50 start-0 translate-middle-y ps-3 text-muted fw-bold">
                      $
                    </span>
                  </div>
                  <div className="apple-form-hint">
                    {t('profile.price_from_help')} — {t('profile.price_from_disclaimer')}
                  </div>
                </div>

                <div className="apple-switch-wrapper">
                  <div>
                    <div className="apple-switch-label">{t('profile.country_block_label')}</div>
                    <div className="apple-switch-desc">{t('profile.country_block_active')}</div>
                  </div>
                  <div className="form-check form-switch m-0">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      role="switch"
                      id="country_block_switch"
                      name="country_block"
                      checked={formData.country_block}
                      onChange={handleChange}
                      style={{ width: '2.5rem', height: '1.4rem', cursor: 'pointer' }}
                    />
                  </div>
                </div>

                <div className="edit-profile-section-header mt-4">
                  <div className="edit-profile-icon-plate icon-plate-rose">
                    <i className="fas fa-palette"></i>
                  </div>
                  <div>
                    <h4>{t('profile.card_customization')}</h4>
                    <p>{t('profile.card_bg_opacity_help')}</p>
                  </div>
                </div>

                <Row className="g-3 align-items-center">
                  <Col md={6}>
                    <div className="mb-3">
                      <label className="apple-label">{t('profile.card_bg_color')}</label>
                      <div className="d-flex align-items-center gap-3">
                        <input
                          type="color"
                          name="card_bg_color"
                          value={formData.card_bg_color || '#ffffff'}
                          onChange={handleChange}
                          style={{
                            width: '54px',
                            height: '44px',
                            padding: '2px',
                            borderRadius: '12px',
                            border: '1px solid var(--apple-glass-border)',
                            cursor: 'pointer',
                            backgroundColor: 'transparent',
                          }}
                        />
                        <input
                          type="text"
                          name="card_bg_color"
                          className="apple-input"
                          value={formData.card_bg_color}
                          onChange={handleChange}
                          placeholder="#ffffff"
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="apple-label d-flex justify-content-between">
                        <span>{t('profile.opacity')}</span>
                        <span className="badge bg-secondary bg-opacity-25 text-body">
                          {Math.round((formData.card_bg_opacity ?? 1) * 100)}%
                        </span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        name="card_bg_opacity"
                        min={0.1}
                        max={1}
                        step={0.01}
                        value={formData.card_bg_opacity}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            card_bg_opacity: parseFloat(e.target.value),
                          }))
                        }
                      />
                    </div>
                  </Col>

                  <Col md={6}>
                    <div className="p-2">
                      <div className="apple-label mb-2">{t('common.preview')}</div>
                      <div
                        className="apple-card-live-preview"
                        style={{
                          backgroundColor: `rgba(${r}, ${g}, ${b}, ${previewOpacity})`,
                          color: previewTextColor,
                        }}
                      >
                        <div className="d-flex align-items-center gap-2">
                          <div
                            style={{
                              width: '38px',
                              height: '38px',
                              borderRadius: '10px',
                              background: lum > 0.6 ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.2)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <i className="fas fa-user"></i>
                          </div>
                          <div>
                            <div className="fw-bold" style={{ fontSize: '0.9rem' }}>
                              {formData.name || currentUser.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', opacity: 0.75 }}>
                              @{currentUser.username}
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-between align-items-center mt-3 pt-2 border-top border-secondary border-opacity-25">
                          <span className="badge rounded-pill bg-primary bg-opacity-75" style={{ fontSize: '0.7rem' }}>
                            VIP
                          </span>
                          <span className="fw-bold" style={{ fontSize: '0.85rem' }}>
                            ${formData.price_from || '0.00'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </motion.div>
          )}

          {/* ================= PESTAÑA: ENLACES ================= */}
          {activeTab === 'links' && isCreator && (
            <motion.div
              key="tab-links"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.exit}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              <div className="edit-profile-card">
                <div className="edit-profile-section-header">
                  <div className="edit-profile-icon-plate icon-plate-indigo">
                    <i className="fas fa-link"></i>
                  </div>
                  <div className="flex-grow-1">
                    <h4>{t('profile.custom_links', 'Enlaces Directos')}</h4>
                    <p>{t('profile.links_intro_help', 'Agrega tus redes sociales, mensajería y páginas para tu perfil público.')}</p>
                  </div>
                  <button
                    type="button"
                    className="apple-btn-primary"
                    onClick={() => openAddLink()}
                    style={{ minHeight: '40px', padding: '0.4rem 1.1rem' }}
                  >
                    <i className="fas fa-plus me-1"></i>
                    <span>{t('profile.add_link', 'Agregar Enlace')}</span>
                  </button>
                </div>

                {/* Acceso rápido a plataformas populares */}
                <div className="mb-3">
                  <div className="apple-label mb-2" style={{ fontSize: '0.78rem' }}>
                    {t('profile.quick_add_label', 'Añadir rápidamente:')}
                  </div>
                  <div className="apple-quick-add-group">
                    {SOCIAL_PLATFORMS.filter((p) => p.id !== 'custom').slice(0, 8).map((plat) => {
                      const iconClass = plat.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');
                      return (
                        <button
                          key={plat.id}
                          type="button"
                          className="apple-quick-add-pill"
                          onClick={() => openAddLink(plat.id)}
                        >
                          <i className={iconClass} style={{ color: plat.color }}></i>
                          <span>{plat.name}</span>
                        </button>
                      );
                    })}
                    <button
                      type="button"
                      className="apple-quick-add-pill"
                      onClick={() => openAddLink('custom')}
                    >
                      <i className="fas fa-globe text-primary"></i>
                      <span>{t('common.other', 'Otro...')}</span>
                    </button>
                  </div>
                </div>

                {links.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-link-slash fa-2x mb-2 opacity-50"></i>
                    <p className="mb-3">{t('profile.no_links_yet', 'Aún no has agregado enlaces a tu perfil.')}</p>
                    <button type="button" className="apple-btn-primary" onClick={() => openAddLink()}>
                      <i className="fas fa-plus me-1"></i>
                      {t('profile.add_first_link', 'Agregar mi primer enlace')}
                    </button>
                  </div>
                ) : (
                  <div className="apple-links-list">
                    {links.map((link, index) => {
                      const detected = detectSocialPlatform(link.url || '');
                      const platform = getPlatformById(detected.platform.id);
                      const iconClass = (link.icon || platform.icon).replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');
                      const brandColor = platform.color || 'var(--color-primary)';

                      return (
                        <div key={index} className="apple-link-row-item">
                          {/* Ícono de Plataforma */}
                          <div
                            className="apple-link-row-icon shadow-sm"
                            style={{ background: brandColor }}
                          >
                            <i className={iconClass}></i>
                          </div>

                          {/* Contenido / Título & URL */}
                          <div className="apple-link-row-content">
                            <div className="apple-link-row-title">
                              <span>{link.name || platform.name}</span>
                              {link.is_adult && (
                                <span className="profile-link-badge-18">+18</span>
                              )}
                            </div>
                            <div className="apple-link-row-url" title={link.url}>
                              {link.url}
                            </div>
                          </div>

                          {/* Acciones (Subir, Bajar, Editar, Eliminar) */}
                          <div className="apple-link-row-actions">
                            <button
                              type="button"
                              className="apple-action-btn-icon"
                              onClick={() => moveLink(index, 'up')}
                              disabled={index === 0}
                              title={t('common.move_up', 'Subir')}
                              aria-label={t('common.move_up', 'Subir')}
                            >
                              <i className="fas fa-chevron-up"></i>
                            </button>
                            <button
                              type="button"
                              className="apple-action-btn-icon"
                              onClick={() => moveLink(index, 'down')}
                              disabled={index === links.length - 1}
                              title={t('common.move_down', 'Bajar')}
                              aria-label={t('common.move_down', 'Bajar')}
                            >
                              <i className="fas fa-chevron-down"></i>
                            </button>
                            <button
                              type="button"
                              className="apple-action-btn-icon"
                              onClick={() => openEditLink(index)}
                              title={t('common.edit', 'Editar')}
                              aria-label={t('common.edit', 'Editar')}
                            >
                              <i className="fas fa-pen"></i>
                            </button>
                            <button
                              type="button"
                              className="apple-action-btn-icon apple-action-btn-danger"
                              onClick={() => removeLink(index)}
                              title={t('common.delete', 'Eliminar')}
                              aria-label={t('common.delete', 'Eliminar')}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* ================= PESTAÑA: ETIQUETAS ================= */}
          {activeTab === 'tags' && isCreator && (
            <motion.div
              key="tab-tags"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.exit}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              <div className="edit-profile-card">
                <div className="edit-profile-section-header">
                  <div className="edit-profile-icon-plate icon-plate-emerald">
                    <i className="fas fa-tags"></i>
                  </div>
                  <div>
                    <h4>{t('profile.tags')}</h4>
                    <p>{isAdmin ? t('profile.tags_help_admin') : t('profile.tags_help_non_admin')}</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="position-relative">
                    <input
                      type="text"
                      className="apple-input ps-5"
                      placeholder={t('profile.tag_search_placeholder')}
                      value={tagSearch}
                      onChange={(e) => setTagSearch(e.target.value)}
                    />
                    <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ps-3 text-muted"></i>
                  </div>
                  <div className="apple-form-hint">
                    {t('profile.tags_visible_count', {
                      visible: filteredTags.length,
                      total: allTags.length,
                    })}
                  </div>
                </div>

                <div
                  className="d-flex flex-wrap gap-2 p-2 border rounded-4"
                  style={{
                    maxHeight: '320px',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(120, 120, 128, 0.04)',
                    borderColor: 'var(--apple-glass-border)',
                  }}
                >
                  {filteredTags.map((tg) => {
                    const isSelected = selectedTagIds.includes(tg.id);
                    const disabled = tg.is_fixed && !isAdmin;
                    const iconClass = tg.icon ? tg.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                    return (
                      <button
                        key={String(tg.id)}
                        type="button"
                        disabled={disabled}
                        className={`apple-tag-pill ${isSelected ? 'active' : ''}`}
                        onClick={() => {
                          setSelectedTagIds((prev) => {
                            if (prev.includes(tg.id)) {
                              return prev.filter((id) => id !== tg.id);
                            }
                            return [...prev, tg.id];
                          });
                        }}
                      >
                        {iconClass && <i className={iconClass}></i>}
                        <span>{i18n.language === 'en' && tg.name_en ? tg.name_en : tg.name}</span>
                        {tg.is_fixed && (
                          <span className="apple-tag-fixed-badge">
                            {t('profile.fixed_tag_suffix').replace(/[()]/g, '').trim()}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {filteredTags.length === 0 && (
                    <div className="text-muted p-4 text-center w-100">
                      {t('profile.tags_no_results', { term: tagSearch })}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ================= PESTAÑA: SEGURIDAD ================= */}
          {activeTab === 'security' && (
            <motion.div
              key="tab-security"
              initial={fadeIn.initial}
              animate={fadeIn.animate}
              exit={fadeIn.exit}
              transition={{ duration: 0.22, ease: appleEase }}
            >
              {/* Sección Privacidad & Protección de Datos (Ley N° 21.719) */}
              <div className="edit-profile-card mb-4">
                <div className="edit-profile-section-header">
                  <div className="edit-profile-icon-plate icon-plate-indigo">
                    <i className="fas fa-shield-halved"></i>
                  </div>
                  <div>
                    <h4>{t('profile.privacy_title', 'Protección de Datos & Derechos ARCOP (Ley N° 21.719)')}</h4>
                    <p>{t('profile.privacy_subtitle', 'Control sobre el tratamiento de tus datos personales, visibilidad pública y portabilidad.')}</p>
                  </div>
                </div>

                {/* Check 1: Consentimiento explícito de tratamiento de datos */}
                <div className="d-flex align-items-start justify-content-between gap-3 py-3 border-bottom border-secondary border-opacity-10">
                  <div>
                    <h6 className="fw-bold mb-1">
                      {t('profile.privacy_consent_label', 'Consentimiento de Tratamiento de Datos')}
                    </h6>
                    <p className="small text-muted mb-1">
                      {t('profile.privacy_consent_desc', 'Consiento expresamente el tratamiento de mis datos de perfil conforme a la Ley N° 21.719 y la Política de Protección de Datos.')}
                    </p>
                    {formData.privacy_consent_at ? (
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 small">
                        <i className="fas fa-check-circle me-1"></i>
                        {t('profile.privacy_consent_registered', 'Consentimiento registrado el')} {new Date(formData.privacy_consent_at).toLocaleDateString()}
                      </span>
                    ) : (
                      <span className="badge bg-warning bg-opacity-10 text-warning border border-warning border-opacity-25 small">
                        <i className="fas fa-triangle-exclamation me-1"></i>
                        {t('profile.privacy_consent_pending', 'Pendiente de confirmación')}
                      </span>
                    )}
                  </div>
                  <div className="form-check form-switch fs-4 m-0">
                    <input
                      type="checkbox"
                      role="switch"
                      className="form-check-input"
                      checked={formData.privacy_consent}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        privacy_consent: e.target.checked,
                        privacy_consent_at: e.target.checked ? (prev.privacy_consent_at || new Date().toISOString()) : null
                      }))}
                      aria-label="Consentimiento de privacidad"
                    />
                  </div>
                </div>

                {/* Check 2: Indexación y Búsquedas Públicas (Derecho de Oposición) */}
                <div className="d-flex align-items-start justify-content-between gap-3 py-3 border-bottom border-secondary border-opacity-10">
                  <div>
                    <h6 className="fw-bold mb-1">
                      {t('profile.privacy_indexing_label', 'Visibilidad en Búsquedas & Directorio')}
                    </h6>
                    <p className="small text-muted mb-0">
                      {t('profile.privacy_indexing_desc', 'Derecho de Oposición: Permite que tu perfil sea indexable y aparezca en las búsquedas del explorador de creadores.')}
                    </p>
                  </div>
                  <div className="form-check form-switch fs-4 m-0">
                    <input
                      type="checkbox"
                      role="switch"
                      className="form-check-input"
                      checked={formData.search_indexing_opt_in}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        search_indexing_opt_in: e.target.checked
                      }))}
                      aria-label="Indexación en búsquedas"
                    />
                  </div>
                </div>

                {/* Herramientas de Portabilidad y Derechos */}
                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3 pt-3">
                  <div>
                    <h6 className="fw-bold mb-1">
                      {t('profile.privacy_portability_title', 'Portabilidad de Datos Personales (ARCOP)')}
                    </h6>
                    <p className="small text-muted mb-0">
                      {t('profile.privacy_portability_desc', 'Descarga una copia completa y estructurada de tus datos en formato JSON legible por máquina.')}
                    </p>
                  </div>
                  <div className="d-flex align-items-center gap-2">
                    <Link to="/privacidad-datos" className="apple-btn-glass text-decoration-none">
                      <i className="fas fa-scale-balanced"></i>
                      <span>{t('profile.privacy_center_link', 'Centro ARCOP')}</span>
                    </Link>
                    <button
                      type="button"
                      className="apple-btn-secondary"
                      onClick={handleExportData}
                      disabled={exportingData}
                    >
                      {exportingData ? (
                        <>
                          <Spinner animation="border" size="sm" />
                          <span>{t('common.generating', 'Generando...')}</span>
                        </>
                      ) : (
                        <>
                          <i className="fas fa-download"></i>
                          <span>{t('profile.privacy_download_btn', 'Descargar JSON')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="edit-profile-card apple-danger-zone-card">
                <div className="edit-profile-section-header border-danger border-opacity-25">
                  <div className="edit-profile-icon-plate icon-plate-rose">
                    <i className="fas fa-triangle-exclamation"></i>
                  </div>
                  <div>
                    <h4 className="text-danger">{t('profile.danger_zone')}</h4>
                    <p>{t('profile.delete_warning')}</p>
                  </div>
                </div>

                <div className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3">
                  <div>
                    <h6 className="fw-bold mb-1">{t('profile.delete_confirm_title')}</h6>
                    <p className="small text-muted mb-0">{t('profile.delete_permanent_warning')}</p>
                  </div>
                  <button
                    type="button"
                    className="apple-btn-danger-solid"
                    onClick={() => {
                      setShowDeleteModal(true);
                      setDeleteEmail('');
                      setDeleteError(null);
                    }}
                  >
                    <i className="fas fa-user-slash"></i>
                    <span>{t('profile.delete_button')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Barra de Acciones Fija / Inferior */}
        <div className="edit-profile-actions-bar">
          <button
            type="button"
            className="apple-btn-glass"
            onClick={() => navigate(`/u/${currentUser.username}`)}
            disabled={loading || uploadingAvatar}
          >
            {t('common.cancel')}
          </button>

          <button
            type="submit"
            className="apple-btn-primary"
            disabled={loading || uploadingAvatar}
          >
            {uploadingAvatar ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>{t('common.uploading_avatar')}</span>
              </>
            ) : loading ? (
              <>
                <Spinner animation="border" size="sm" />
                <span>{t('common.saving')}</span>
              </>
            ) : (
              <>
                <i className="fas fa-check"></i>
                <span>{t('profile.save_changes')}</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Modal de Confirmación de Borrado Apple HIG */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
        contentClassName="apple-glass-modal rounded-4 border-0 shadow-lg"
      >
        <Modal.Header closeButton className="border-bottom-0 pb-0">
          <Modal.Title className="text-danger fw-bold d-flex align-items-center gap-2">
            <i className="fas fa-triangle-exclamation"></i>
            <span>{t('profile.delete_confirm_title')}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-3">
          <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
            {t('profile.delete_permanent_warning')}
          </div>
          <p className="small mb-2">
            {t('profile.delete_type_email')} <strong className="text-body">{currentUser.email}</strong>
          </p>
          {deleteError && (
            <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
              {deleteError}
            </div>
          )}
          <input
            type="email"
            className="apple-input"
            value={deleteEmail}
            onChange={(e) => setDeleteEmail(e.target.value)}
            placeholder={t('profile.delete_email_placeholder')}
          />
        </Modal.Body>
        <Modal.Footer className="border-top-0 pt-0">
          <button
            type="button"
            className="apple-btn-glass"
            onClick={() => setShowDeleteModal(false)}
            disabled={deleting}
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            className="apple-btn-danger-solid"
            disabled={deleting || deleteEmail.trim().toLowerCase() !== (currentUser.email || '').toLowerCase()}
            onClick={handleDeleteProfile}
          >
            {deleting ? <Spinner animation="border" size="sm" /> : t('profile.delete_confirm_button')}
          </button>
        </Modal.Footer>
      </Modal>

      {/* Modal Editor de Enlaces Apple HIG */}
      <LinkEditorModal
        show={showLinkModal}
        onHide={() => setShowLinkModal(false)}
        onSave={handleSaveLink}
        initialLink={selectedLinkForEdit}
      />

      {/* Modal de Solicitud de Creador Apple HIG */}
      <Modal
        show={showCreatorRequestModal}
        onHide={() => setShowCreatorRequestModal(false)}
        centered
        contentClassName="apple-glass-modal rounded-4 border-0 shadow-lg overflow-hidden"
      >
        <form onSubmit={handleSendCreatorRequest}>
          <div className="p-4 pb-3 border-bottom border-secondary border-opacity-10 d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div
                className="d-flex align-items-center justify-content-center text-white"
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                  boxShadow: '0 4px 12px rgba(139, 92, 246, 0.35)',
                }}
              >
                <i className="fas fa-wand-magic-sparkles fs-5"></i>
              </div>
              <div>
                <h5 className="modal-title fw-bold mb-0" style={{ fontSize: '1.15rem' }}>
                  {t('profile.request_creator_modal_title', 'Solicitar Perfil de Creador(a)')}
                </h5>
                <p className="text-muted small mb-0">
                  {t('profile.request_creator_modal_sub', 'Revisión y activación por el equipo administrativo')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="btn-close"
              onClick={() => setShowCreatorRequestModal(false)}
              aria-label={t('common.close', 'Cerrar')}
            ></button>
          </div>

          <div className="p-4">
            {creatorRequestSuccess ? (
              <div className="text-center py-4">
                <div
                  className="mx-auto mb-3 d-flex align-items-center justify-content-center text-success"
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(52, 199, 89, 0.15)',
                  }}
                >
                  <i className="fas fa-check fs-2"></i>
                </div>
                <h5 className="fw-bold mb-2">{t('profile.creator_request_sent_title', '¡Solicitud enviada con éxito!')}</h5>
                <p className="text-muted small mb-0">
                  {t('profile.creator_request_sent_desc', 'Se ha generado un ticket de solicitud para el administrador. Se te notificará una vez activado tu perfil de creador.')}
                </p>
              </div>
            ) : (
              <>
                <div className="alert alert-info rounded-3 py-2 px-3 small mb-3 d-flex align-items-center gap-2">
                  <i className="fas fa-circle-info fs-5 flex-shrink-0"></i>
                  <div>
                    {t('profile.creator_request_info_note', 'Al activar tu rol podrás publicar galerías, configurar redes sociales y personalizar tu tarjeta de perfil público.')}
                  </div>
                </div>

                {creatorRequestError && (
                  <div className="alert alert-danger rounded-3 py-2 px-3 small mb-3">
                    {creatorRequestError}
                  </div>
                )}

                <div className="mb-3">
                  <label className="apple-label">
                    {t('profile.creator_notes_label', 'Detalles o enlaces adicionales (opcional)')}
                  </label>
                  <textarea
                    className="apple-input apple-textarea"
                    rows={4}
                    value={creatorRequestNotes}
                    onChange={(e) => setCreatorRequestNotes(e.target.value)}
                    placeholder={t('profile.creator_notes_placeholder', 'Cuéntanos qué tipo de contenido publicarás, tus redes principales o cualquier detalle relevante...')}
                    disabled={creatorRequestSending}
                  />
                  <div className="apple-form-hint">
                    {t('profile.creator_notes_hint', 'Esta información se enviará al equipo de administración.')}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="p-3 border-top border-secondary border-opacity-10 d-flex justify-content-end gap-2">
            {creatorRequestSuccess ? (
              <button
                type="button"
                className="apple-btn-primary"
                onClick={() => setShowCreatorRequestModal(false)}
                style={{ minHeight: '42px', padding: '0.5rem 1.4rem' }}
              >
                {t('common.understood', 'Entendido')}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  className="apple-btn-glass"
                  onClick={() => setShowCreatorRequestModal(false)}
                  disabled={creatorRequestSending}
                  style={{ minHeight: '42px', padding: '0.5rem 1.25rem' }}
                >
                  {t('common.cancel', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  className="apple-btn-primary"
                  disabled={creatorRequestSending}
                  style={{
                    minHeight: '42px',
                    padding: '0.5rem 1.5rem',
                    background: 'linear-gradient(135deg, #8B5CF6, #EC4899)',
                    border: 'none',
                  }}
                >
                  {creatorRequestSending ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-1" />
                      <span>{t('common.sending', 'Enviando...')}</span>
                    </>
                  ) : (
                    <>
                      <i className="fas fa-paper-plane me-1"></i>
                      <span>{t('profile.send_request', 'Enviar Solicitud')}</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </form>
      </Modal>
    </div>
  );
}

