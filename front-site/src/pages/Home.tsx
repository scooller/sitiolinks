import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import FeaturedGalleries from '../components/FeaturedGalleries';
import UsersGrid from '../components/UsersGrid';
import PopularTags from '../components/PopularTags';
import type { Page, User } from '../types';

export default function Home(): React.ReactElement {
  const { t, i18n, ready } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { settings, loading: loadingSettings } = useSiteSettings();
  const [pageContent, setPageContent] = useState<Page | null>(null);
  const [vipUsers, setVipUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingVips, setLoadingVips] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ready) {
      return;
    }
    const fetchPage = async () => {
      try {
        const lang = (i18n.language || 'es').split('-')[0];
        const primary = lang === 'en' ? 'home' : 'inicio';
        const fallback = lang === 'en' ? 'inicio' : 'home';
        try {
          const response = await graphqlRequest<{ page: Page | null }>({
            query: `
              query PageBySlug($slug: String!) {
                page(slug: $slug) { id title slug content }
              }
            `,
            variables: { slug: primary },
            schema: 'public'
          });
          if (response.page) {
            setPageContent(response.page);
            return;
          }
        } catch (e) {
          
        }

        try {
          const resp2 = await graphqlRequest<{ page: Page | null }>({
          query: `
            query PageBySlug($slug: String!) {
              page(slug: $slug) { id title slug content }
            }
          `,
            variables: { slug: fallback },
            schema: 'public'
          });
          setPageContent(resp2.page ?? null);
        } catch (err2: any) {
          setError(err2?.message || t('home.error_loading_page'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [i18n.language, ready]);

  useEffect(() => {
    // Esperar a que settings estén cargados
    if (loadingSettings || !settings) return;

    const fetchVipUsers = async () => {
      try {
        setLoadingVips(true);

        // Solo cargar usuarios VIP si la funcionalidad está activada
        if (!settings.vip_home_enabled) {
          setVipUsers([]);
          setLoadingVips(false);
          return;
        }

        // Obtener usuarios VIP
        const response = await graphqlRequest<{ users: { data: User[] } }>({
          query: `
            query($limit: Int) {
              users(role: "vip", per_page: $limit) {
                data {
                  id
                  username
                  name
                  avatar_thumb
                  avatar_thumb_webp
                  avatar_small_webp
                  avatar_medium_webp
                  avatar_url
                  gender
                  nationality
                  country
                  birth_date
                  price_from
                  roles { name }
                  tags { id name name_en color icon weight }
                }
              }
            }
          `,
          variables: { limit: settings.vip_home_limit ?? 10 },
          schema: 'public'
        });
        setVipUsers(response.users?.data || []);
      } catch (err: any) {
      } finally {
        setLoadingVips(false);
      }
    };

    fetchVipUsers();
  }, [settings, loadingSettings]);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <>

      {/* Contenido de la página */}
      <Container className="mt-5 mb-5">
        <Row className="justify-content-center">
          <Col lg={10} xl={8}>
            <motion.div
              className="page-content"
              dangerouslySetInnerHTML={{ __html: pageContent?.content || `<p>${t('home.content_unavailable')}</p>` }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </Col>
        </Row>
      </Container>

      {/* Galerías destacadas */}
      {/* Galerías destacadas - Solo para usuarios autenticados */}
      {isAuthenticated && <FeaturedGalleries limit={8} />}

      {/* Sección de usuarios VIP */}
      {settings?.vip_featured_profile && (
        <section className="vip-users-section py-5">
          <Container>
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h2 className="mb-2">
                <i className="fas fa-crown text-warning me-2"></i>
                {t('home.vip_creators')}
              </h2>
              <p className="text-muted">
                {t('home.vip_creators_desc')}
              </p>
            </motion.div>

            {loadingVips ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="warning" />
              </div>
            ) : vipUsers.length > 0 ? (
              <>
                <UsersGrid
                  users={vipUsers}
                  showTags
                  size={settings?.avatar_width || 96}
                  colsDesktop={settings?.grid_cols_desktop || 5}
                  colsMobile={settings?.grid_cols_mobile || 2}
                  defaultAvatar={settings?.default_avatar_url || ''}
                  vipBadgeLabel={settings?.vip_badge_label || 'VIP'}
                  vipBadgeIcon={settings?.vip_badge_icon || 'fas fa-crown'}
                  emptyMessage=""
                  loading={false}
                />
                <div className="text-center mt-4">
                  <Link to="/explorar" className="btn btn-outline-warning">
                    <i className="fas fa-users me-2"></i>
                    {t('home.view_all_users')}
                  </Link>
                </div>
              </>
            ) : null}
          </Container>
        </section>
      )}

      {/* Etiquetas populares */}
      <PopularTags limit={20} />
    </>
  );
}
