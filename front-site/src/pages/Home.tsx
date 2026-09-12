import { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useAuth } from '../contexts/AuthContext';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { appleEase } from '../lib/animations';
import FeaturedGalleries from '../components/FeaturedGalleries';
import CafesWithReviews from '../components/CafesWithReviews';
import UsersGrid from '../components/UsersGrid';
import PopularTags from '../components/PopularTags';
import type { Page, User } from '../types';

export default function Home(): React.ReactElement {
  const { t, i18n, ready } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { settings, loading: loadingSettings } = useSiteSettings();
  const [pageContent, setPageContent] = useState<Page | null>(null);
  const [vipUsers, setVipUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
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
      <Container className="mt-5 text-center" role="status">
        <Spinner animation="border" variant="primary">
          <span className="visually-hidden">{t('common.loading')}</span>
        </Spinner>
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explorar?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/explorar');
    }
  };

  return (
    <>
      {/* Hero Section Apple HIG */}
      <section className="apple-hero-section py-4">
        <Container>
          <motion.div
            className="apple-hero-container"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: appleEase }}
          >
            <h1 className="apple-hero-title">
              {settings?.site_title || t('home.hero_title', 'Descubre Creadores y Lugares Exclusivos')}
            </h1>
            <p className="apple-hero-subtitle">
              {settings?.site_description || t('home.hero_subtitle', 'Explora perfiles destacados, cafeterías recomendadas y contenido seleccionado con la mejor experiencia visual.')}
            </p>

            {/* Apple Liquid Glass Search Pill */}
            <form onSubmit={handleSearchSubmit} className="apple-search-pill-wrapper">
              <div className="apple-search-pill">
                <i className="fas fa-search text-muted me-3"></i>
                <input
                  type="text"
                  className="apple-search-input"
                  placeholder={t('home.search_placeholder', 'Buscar creadores, cafeterías o etiquetas...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  aria-label={t('common.search', 'Buscar')}
                />
                <button
                  type="submit"
                  className="btn btn-primary apple-search-btn shadow-sm"
                  aria-label={t('common.search', 'Buscar')}
                >
                  <i className="fas fa-arrow-right d-sm-none"></i>
                  <span className="d-none d-sm-inline">{t('common.search', 'Buscar')}</span>
                </button>
              </div>
            </form>

            {/* Botones de acción rápida cápsula HIG */}
            <div className="d-flex flex-wrap justify-content-center gap-3">
              <Link to="/explorar" className="btn btn-primary rounded-pill px-4 py-2 fw-medium shadow-sm">
                <i className="fa-solid fa-person-dress me-2"></i>
                {t('nav.explore', 'Explorar creadores')}
              </Link>
              <Link to="/cafes" className="btn btn-secondary rounded-pill px-4 py-2 fw-medium shadow-sm">
                <i className="fas fa-mug-hot me-2"></i>
                {t('nav.cafes', 'Ver Cafeterías')}
              </Link>
            </div>
          </motion.div>
        </Container>
      </section>

      {/* Contenido editorial de la página (Grouped Card) */}
      {pageContent?.content && (
        <Container className="mb-5">
          <Row className="justify-content-center">
            <Col lg={10} xl={8}>
              <motion.div
                className="apple-grouped-card page-content"
                dangerouslySetInnerHTML={{ __html: pageContent.content }}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: appleEase }}
              />
            </Col>
          </Row>
        </Container>
      )}

      {/* Galerías destacadas - Solo para usuarios autenticados */}
      {isAuthenticated && <FeaturedGalleries limit={8} />}

      {/* Sección de usuarios VIP */}
      {settings?.vip_featured_profile && (
        <section className="vip-users-section py-5">
          <Container>
            <motion.div
              className="text-center mb-4"
              initial={{ opacity: 0, y: -12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.28, ease: appleEase }}
            >
              <h2 className="mb-2">
                <i className="fas fa-crown text-warning me-2"></i>
                {t('home.vip_creators')}
              </h2>
              <p className="text-muted">
                {t('home.vip_creators_desc')}
              </p>
            </motion.div>

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
              loading={loadingVips}
              skeletonCount={settings?.grid_cols_desktop || 5}
            />
            {!loadingVips && vipUsers.length > 0 && (
              <div className="text-center mt-4">
                <Link to="/explorar" className="btn btn-warning rounded-pill px-4 py-2 fw-semibold shadow-sm">
                  <i className="fas fa-users me-2"></i>
                  {t('home.view_all_users')}
                </Link>
              </div>
            )}
          </Container>
        </section>
      )}

      {/* Cafes en home: ultimos y destacados en una sola seccion */}
      <CafesWithReviews
        limit={12}
        showFilters={false}
        orderBy="latest_featured"
        title={t('home.cafes_reviews_title')}
        description={t('home.cafes_reviews_desc')}
      />

      {/* Etiquetas populares */}
      <PopularTags limit={20} />
    </>
  );
}
