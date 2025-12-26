import React, { type ReactElement, useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { getCountryFlag } from '../lib/countryUtils.ts';
import { FilePond, registerPlugin } from 'react-filepond';
import type { FilePondFile } from 'filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import type { User, Tag } from '../types';
import { useTranslation } from 'react-i18next';

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
}

interface ProfileLink {
  id?: string | number;
  name: string;
  url: string;
  icon: string;
  order?: number;
}

interface CountriesData {
  countries: Record<string, string>;
  cities?: Record<string, string[]>;
}

export default function EditProfile(): ReactElement {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser } = useAuth();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [countries, setCountries] = useState<Record<string, string>>({});
  const [cities, setCities] = useState<string[]>([]);

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
  });

  const [links, setLinks] = useState<ProfileLink[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [avatarFiles, setAvatarFiles] = useState<FilePondFile[]>([]);
  const [uploadingAvatar, setUploadingAvatar] = useState<boolean>(false);
  const filePondRef = useRef<FilePond | null>(null);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<(string | number)[]>([]);
  const [tagSearch, setTagSearch] = useState<string>('');

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
            links {
              id
              name
              url
              icon
              order
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
          card_bg_color: (userData as any).card_bg_color || '',
          card_bg_opacity: typeof (userData as any).card_bg_opacity === 'number' ? (userData as any).card_bg_opacity : 1,
        });

        setLinks((userData as any).links || []);
        const userTagIds = ((userData as any).tags || []).map((t: Tag) => t.id);
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
      const fixedUserTags = tags.filter((t) => t.is_fixed && selectedTagIds.includes(t.id)).map((t) => t.id);
      if (fixedUserTags.length) {
        setSelectedTagIds((prev) => Array.from(new Set([...prev, ...fixedUserTags])));
      }
    } catch (e) {
    }
  };

  const filteredTags = useMemo(() => {
    const term = tagSearch.trim().toLowerCase();
    return allTags
      .filter((t) => !term || (t.name && t.name.toLowerCase().includes(term)) || (t.name_en && t.name_en.toLowerCase().includes(term)) || (t.icon && t.icon.toLowerCase().includes(term)))
      .sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0));
  }, [allTags, tagSearch]);

  const loadCities = async (countryCode: string) => {
    try {
      const query = `query { countries }`;
      const data = await graphqlRequest<{ countries: string }>({ query, schema: 'public' });
      const parsed: CountriesData = JSON.parse(data.countries);
      setCities(parsed.cities?.[countryCode] || []);
    } catch (err) {
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

  const handleLinkChange = (index: number, field: keyof ProfileLink, value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
  };

  const addLink = () => {
    setLinks([...links, { name: '', url: '', icon: 'fas-link' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
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
          $card_bg_opacity: Float
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
            card_bg_opacity: $card_bg_opacity
          ) {
            id
            name
            username
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

      const isCreator = (currentUser as any).roles?.some((role: any) => role.name === 'creator') || (currentUser as any).roles?.includes('creator');
      if (isCreator) {
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
        const isAdmin =
          (currentUser as any).roles?.some((r: any) => r.name === 'admin' || r.name === 'super_admin') ||
          (currentUser as any).roles?.includes('admin') ||
          (currentUser as any).roles?.includes('super_admin');
        let tagIdsToSend = selectedTagIds.slice();
        if (!isAdmin) {
          const fixedUserTagIds = allTags.filter((t) => t.is_fixed && selectedTagIds.includes(t.id)).map((t) => t.id);
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
      }

      setSuccess(true);
      await refreshUser();

      setTimeout(() => {
        navigate(`/u/${currentUser?.username}`);
      }, 2000);
    } catch (err: any) {
      setError(err?.message || t('profile.error_updating'));
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Container className="mt-4">
        <Alert variant="warning">{t('auth.login_required_edit_profile')}</Alert>
      </Container>
    );
  }

  if (loadingData) {
    return (
      <Container className="mt-4 text-center">
        <Spinner animation="border" role="status" />
        <p className="mt-3">{t('profile.loading')}</p>
      </Container>
    );
  }

  const isCreator = (currentUser as any).roles?.some((role: any) => role.name === 'creator') || (currentUser as any).roles?.includes('creator');
  const isAdmin =
    (currentUser as any).roles?.some((r: any) => r.name === 'admin' || r.name === 'super_admin') ||
    (currentUser as any).roles?.includes('admin') ||
    (currentUser as any).roles?.includes('super_admin');

  return (
    <Container className="mt-4">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Card>
            <Card.Header>
              <h4>{t('profile.edit_profile')}</h4>
            </Card.Header>
            <Card.Body>
              {error && <Alert variant="danger">{error}</Alert>}
              {success && <Alert variant="success">{t('profile.success_updated')}</Alert>}

              <Form onSubmit={handleSubmit}>
                <h5 className="mb-3">{t('profile.avatar')}</h5>
                <Form.Group className="mb-4">
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
                          }
                          const plainId = parseInt(String(responseText).trim(), 10);
                          if (Number.isSafeInteger(plainId) && plainId > 0 && plainId <= 2147483647) {
                            return String(plainId);
                          }
                          return '';
                        },
                        onerror: (response: any) => {
                          setUploadingAvatar(false);
                          return response;
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
                  <Form.Text className="text-muted">{t('profile.avatar_help')}</Form.Text>
                </Form.Group>

                <h5 className="mb-3">{t('profile.basic_info')}</h5>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {t('profile.full_name')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control type="text" name="name" value={formData.name} onChange={handleChange} required />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {t('profile.description')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Control as="textarea" rows={4} name="description" value={formData.description} onChange={handleChange} required />
                </Form.Group>

                {isCreator && (
                  <>
                    <h5 className="mb-3 mt-4">{t('profile.card_customization')}</h5>
                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group>
                          <Form.Label>{t('profile.card_bg_color')}</Form.Label>
                          <Form.Control type="color" name="card_bg_color" value={formData.card_bg_color || '#ffffff'} onChange={handleChange} />
                          <Form.Label className="mt-2">{t('profile.opacity')}</Form.Label>
                          <Form.Range
                            name="card_bg_opacity"
                            min={0.1}
                            max={1}
                            step={0.01}
                            value={formData.card_bg_opacity}
                            onChange={(e) => setFormData((prev) => ({ ...prev, card_bg_opacity: parseFloat(e.target.value) }))}
                          />
                          <div className="small text-muted">{t('profile.card_bg_opacity_help')}</div>
                        </Form.Group>
                      </Col>
                      <Col md={6} className="d-flex align-items-end">
                        <div className="w-100">
                          <div
                            className="border rounded p-3 text-center"
                            style={{
                              backgroundColor: (() => {
                                const hex = formData.card_bg_color || '#ffffff';
                                const opacity = typeof formData.card_bg_opacity === 'number' ? formData.card_bg_opacity : 1;
                                const h = hex.replace('#', '');
                                if (h.length !== 6) return hex;
                                const r = parseInt(h.substring(0, 2), 16);
                                const g = parseInt(h.substring(2, 4), 16);
                                const b = parseInt(h.substring(4, 6), 16);
                                return `rgba(${r},${g},${b},${opacity})`;
                              })(),
                            }}
                          >
                            <strong
                              style={{
                                color: (() => {
                                  const h = (formData.card_bg_color || '#ffffff').replace('#', '');
                                  if (h.length !== 6) return '#111';
                                  const r = parseInt(h.substring(0, 2), 16);
                                  const g = parseInt(h.substring(2, 4), 16);
                                  const b = parseInt(h.substring(4, 6), 16);
                                  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
                                  return lum > 0.6 ? '#111' : '#fff';
                                })(),
                              }}
                            >
                              {t('common.preview')}
                            </strong>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {t('profile.gender')} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select name="gender" value={formData.gender} onChange={handleChange} required>
                        <option value="">{t('common.select')}</option>
                        <option value="hombre">{t('explore.gender_male').replace('Gender: ', '')}</option>
                        <option value="mujer">{t('explore.gender_female').replace('Gender: ', '')}</option>
                        <option value="trans">{t('explore.gender_trans').replace('Gender: ', '')}</option>
                        <option value="otro">{t('explore.gender_other').replace('Gender: ', '')}</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {t('profile.birth_date')} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control type="date" name="birth_date" value={formData.birth_date} onChange={handleChange} required />
                      <Form.Text className="text-muted">{t('profile.must_be_adult')}</Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <h5 className="mb-3 mt-4">{t('profile.location')}</h5>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {t('profile.nationality')} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select name="nationality" value={formData.nationality} onChange={handleChange} required>
                        <option value="">{t('common.select')}</option>
                        {Object.entries(countries).map(([code, name]) => (
                          <option key={code} value={code}>
                            {getCountryFlag(code)} {name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>
                        {t('profile.country')} <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Select name="country" value={formData.country} onChange={handleChange} required>
                        <option value="">{t('common.select')}</option>
                        {Object.entries(countries).map(([code, name]) => (
                          <option key={code} value={code}>
                            {getCountryFlag(code)} {name}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-3">
                  <Form.Label>
                    {t('profile.city')} <span className="text-danger">*</span>
                  </Form.Label>
                  <Form.Select name="city" value={formData.city} onChange={handleChange} required disabled={!formData.country}>
                    <option value="">{t('common.select')}</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>
                        {city}
                      </option>
                    ))}
                  </Form.Select>
                  {!formData.country && <Form.Text className="text-muted">{t('profile.select_first_country')}</Form.Text>}
                </Form.Group>

                {isCreator && (
                  <>
                    <Form.Group className="mb-3">
                      <Form.Check
                        type="checkbox"
                        name="country_block"
                        label={t('profile.country_block_label')}
                        checked={formData.country_block}
                        onChange={handleChange}
                      />
                    </Form.Group>

                    <h5 className="mb-3 mt-4">{t('profile.creator_info')}</h5>

                    <Form.Group className="mb-3">
                      <Form.Label>{t('profile.price_from_label')}</Form.Label>
                      <Form.Control type="number" step="0.01" name="price_from" value={formData.price_from} onChange={handleChange} placeholder="0.00" />
                      <Form.Text className="text-muted">{t('profile.price_from_help')}</Form.Text>
                    </Form.Group>

                    <h5 className="mb-3 mt-4">{t('profile.custom_links')}</h5>
                    {links.map((link, index) => (
                      <Card key={index} className="mb-3">
                        <Card.Body>
                          <Row>
                            <Col md={4}>
                              <Form.Group className="mb-2">
                                <Form.Label>{t('common.name')}</Form.Label>
                                <Form.Control
                                  type="text"
                                  value={link.name}
                                  onChange={(e) => handleLinkChange(index, 'name', e.target.value)}
                                  placeholder={t('profile.link_name_placeholder')}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={5}>
                              <Form.Group className="mb-2">
                                <Form.Label>{t('common.url')}</Form.Label>
                                <Form.Control
                                  type="url"
                                  value={link.url}
                                  onChange={(e) => handleLinkChange(index, 'url', e.target.value)}
                                  placeholder={t('profile.link_url_placeholder')}
                                />
                              </Form.Group>
                            </Col>
                            <Col md={2}>
                              <Form.Group className="mb-2">
                                <Form.Label>{t('common.icon')}</Form.Label>
                                <Form.Select value={link.icon} onChange={(e) => handleLinkChange(index, 'icon', e.target.value)}>
                                  <option value="fas-link">Link</option>
                                  <option value="fas-globe">Web</option>
                                  <option value="fab-facebook">Facebook</option>
                                  <option value="fab-instagram">Instagram</option>
                                  <option value="fab-twitter">Twitter</option>
                                  <option value="fab-youtube">YouTube</option>
                                  <option value="fab-tiktok">TikTok</option>
                                </Form.Select>
                              </Form.Group>
                            </Col>
                            <Col md={1} className="d-flex align-items-end">
                              <Button variant="danger" size="sm" onClick={() => removeLink(index)} className="mb-2">
                                <i className="fas fa-trash"></i>
                              </Button>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                      <Button variant="outline-dark" onClick={addLink} className="mb-3">
                        <i className="fas fa-plus me-2"></i>
                        {t('profile.add_link')}
                      </Button>
                  </>
                )}

                {isCreator && (
                <>
                <h5 className="mb-3 mt-4">{t('profile.tags')}</h5>
                <Form.Group className="mb-3">
                  {allTags.length === 0 && <div className="text-muted">{t('common.loading')}</div>}
                  {allTags.length > 0 && (
                    <>
                      <div className="mb-2">
                        <Form.Control
                          type="text"
                          placeholder={t('profile.tag_search_placeholder')}
                          value={tagSearch}
                          onChange={(e) => setTagSearch(e.target.value)}
                          size="sm"
                        />
                        <div className="small text-muted mt-1">
                          {t('profile.tags_visible_count', { visible: filteredTags.length, total: allTags.length })}
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                        {filteredTags.map((tag) => {
                          const isSelected = selectedTagIds.includes(tag.id);
                          const disabled = tag.is_fixed && !isAdmin;
                          const iconClass = tag.icon ? tag.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                          return (
                            <Button
                              key={String(tag.id)}
                              type="button"
                              variant={isSelected ? (tag.color || 'primary') : `outline-${tag.color || 'secondary'}`}
                              size="sm"
                              className="d-flex align-items-center"
                              disabled={disabled}
                              onClick={() => {
                                setSelectedTagIds((prev) => {
                                  if (prev.includes(tag.id)) {
                                    return prev.filter((id) => id !== tag.id);
                                  }
                                  return [...prev, tag.id];
                                });
                              }}
                            >
                              {iconClass && <i className={`${iconClass} me-1`}></i>}
                              {i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name}
                              {tag.is_fixed && t('profile.fixed_tag_suffix')}
                            </Button>
                          );
                        })}
                        {filteredTags.length === 0 && <div className="text-muted small">{t('profile.tags_no_results', { term: tagSearch })}</div>}
                      </div>
                    </>
                  )}
                  <Form.Text className="text-muted d-block mt-2">
                    {isAdmin ? t('profile.tags_help_admin') : t('profile.tags_help_non_admin')}
                  </Form.Text>
                </Form.Group>
                </>
              )}

                <div className="d-flex gap-2 mt-4">
                  <Button type="submit" variant="primary" disabled={loading || uploadingAvatar}>
                    {uploadingAvatar ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {t('common.uploading_avatar')}
                      </>
                    ) : loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        {t('common.saving')}
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        {t('profile.save_changes')}
                      </>
                    )}
                  </Button>
                  <Button variant="secondary" onClick={() => navigate(`/u/${currentUser.username}`)} disabled={loading || uploadingAvatar}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}
