import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner } from 'react-bootstrap';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { fadeIn, defaultTransition } from '../lib/animations';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useSiteSettings } from '../hooks/useSiteSettings';
import UsersGrid from '../components/UsersGrid';
import Paginator from '../components/Paginator';
import { COUNTRY_NAMES, getCountryFlag } from '../lib/countryUtils';
import type { UserPaginator } from '../types';

type Params = { tag?: string };

const TagPage: React.FC = () => {
  const { tag } = useParams<Params>();
  const cleanTag = (tag || '').trim();
  const { t } = useTranslation();
  const { settings, loading: loadingSettings } = useSiteSettings();

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserPaginator | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  const hasActiveFilters = Boolean(genderFilter || nationalityFilter || minPrice || maxPrice);

  const handleResetFilters = () => {
    setGenderFilter('');
    setNationalityFilter('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [cleanTag]);

  // Cargar creadores paginados asociados al tag
  useEffect(() => {
    if (!cleanTag || loadingSettings) return;

    setLoading(true);
    setError(null);

    async function fetchUsers(): Promise<void> {
      try {
        const variables: Record<string, unknown> = {
          page: currentPage,
          perPage: settings?.grid_users_per_page || 12,
          tag: cleanTag,
        };

        if (genderFilter) variables.gender = genderFilter;
        if (nationalityFilter) variables.nationality = nationalityFilter;
        if (minPrice) variables.minPrice = parseFloat(minPrice);
        if (maxPrice) variables.maxPrice = parseFloat(maxPrice);

        const response = await graphqlRequest<{ users: UserPaginator }>({
          query: queries.users,
          variables,
          schema: 'public',
        });

        if (response.users) {
          setUsers(response.users);
        } else {
          setUsers(null);
        }
      } catch (err) {
        console.error('Error loading users by tag:', err);
        setError(err instanceof Error ? err.message : t('tag.error_loading'));
        setUsers(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [cleanTag, currentPage, settings, genderFilter, nationalityFilter, minPrice, maxPrice, loadingSettings, t]);

  return (
    <Container className="tag-page-wrapper">
      {/* 1. Navegación Superior / Volver */}
      <div className="tag-top-nav">
        <Link to="/explorar" className="tag-back-btn" aria-label={t('tag.back')}>
          <i className="fas fa-chevron-left" aria-hidden="true" />
          <span>{t('tag.back')}</span>
        </Link>
      </div>

      {/* 2. Cabecera Hero Editorial Apple */}
      <motion.header
        className="tag-hero"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={defaultTransition}
      >
        <div className="tag-kicker">
          <i className="fas fa-hashtag" aria-hidden="true" />
          <span>{t('tag.kicker')}</span>
        </div>
        <h1 className="tag-hero-title">
          <span>{t('tag.title_prefix')}</span>
          <span className="tag-hero-pill">#{cleanTag}</span>
        </h1>
        <p className="tag-hero-subtitle">
          {t('tag.subtitle', { tag: cleanTag })}
        </p>
      </motion.header>

      {/* 3. Barra de Filtros Liquid Glass */}
      <motion.section
        className="tag-filters-card"
        variants={fadeIn}
        initial="initial"
        animate="animate"
        transition={defaultTransition}
        aria-label="Filtros de búsqueda de creadores"
      >
        <Row className="g-3 align-items-center">
          <Col xs={6} md={3} lg={2}>
            <div className="tag-filter-group">
              <i className="fas fa-dollar-sign tag-filter-icon" aria-hidden="true" />
              <input
                type="number"
                className="form-control tag-filter-input"
                placeholder={t('tag.min_price')}
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t('tag.min_price')}
                min={0}
              />
            </div>
          </Col>

          <Col xs={6} md={3} lg={2}>
            <div className="tag-filter-group">
              <i className="fas fa-dollar-sign tag-filter-icon" aria-hidden="true" />
              <input
                type="number"
                className="form-control tag-filter-input"
                placeholder={t('tag.max_price')}
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t('tag.max_price')}
                min={0}
              />
            </div>
          </Col>

          <Col xs={12} sm={6} md={3} lg={3}>
            <div className="tag-filter-group">
              <i className="fas fa-venus-mars tag-filter-icon" aria-hidden="true" />
              <select
                className="form-select tag-filter-select"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t('tag.filter_gender')}
              >
                <option value="">{t('tag.filter_gender_all')}</option>
                <option value="hombre">Hombre</option>
                <option value="mujer">Mujer</option>
                <option value="trans">Trans</option>
                <option value="otro">Otro</option>
              </select>
            </div>
          </Col>

          <Col xs={12} sm={6} md={3} lg={3}>
            <div className="tag-filter-group">
              <i className="fas fa-globe tag-filter-icon" aria-hidden="true" />
              <select
                className="form-select tag-filter-select"
                value={nationalityFilter}
                onChange={(e) => {
                  setNationalityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t('tag.filter_country')}
              >
                <option value="">{t('tag.filter_country_all')}</option>
                {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {getCountryFlag(code)} {name}
                  </option>
                ))}
              </select>
            </div>
          </Col>

          <Col xs={12} lg={2}>
            <button
              type="button"
              className="tag-filter-reset-btn"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              aria-label={t('tag.reset_filters')}
            >
              <i className="fas fa-rotate-left" aria-hidden="true" />
              <span>{t('tag.reset_filters')}</span>
            </button>
          </Col>
        </Row>
      </motion.section>

      {/* 4. Estado de Carga con Skeletons */}
      {loading && !users && (
        <UsersGrid
          loading={true}
          skeletonCount={settings?.grid_users_per_page || 12}
          showTags
          size={settings?.avatar_width || 96}
          colsDesktop={settings?.grid_cols_desktop || 4}
          colsMobile={settings?.grid_cols_mobile || 2}
        />
      )}

      {/* 5. Alerta de Error */}
      {error && (
        <div className="tag-empty-card">
          <div className="tag-empty-halo">
            <i className="fas fa-triangle-exclamation text-danger" aria-hidden="true" />
          </div>
          <h2 className="tag-empty-title">{t('tag.error_loading')}</h2>
          <p className="tag-empty-desc">{error}</p>
          <button
            type="button"
            className="tag-empty-cta"
            onClick={() => setCurrentPage(1)}
          >
            <i className="fas fa-rotate-right" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* 6. Contenido Principal */}
      {!error && users && (
        <motion.div
          variants={fadeIn}
          initial="initial"
          animate="animate"
          transition={defaultTransition}
        >
          {users.data.length === 0 ? (
            <div className="tag-empty-card">
              <div className="tag-empty-halo">
                <i className="fas fa-hashtag" aria-hidden="true" />
              </div>
              <h2 className="tag-empty-title">{t('tag.no_users')}</h2>
              <p className="tag-empty-desc">
                {t('tag.no_users_desc', { tag: cleanTag })}
              </p>
              <Link to="/explorar" className="tag-empty-cta">
                <i className="fas fa-compass" aria-hidden="true" />
                <span>{t('tag.explore_others')}</span>
              </Link>
            </div>
          ) : (
            <>
              <div className="tag-results-meta">
                <span className="tag-results-count">
                  {t('tag.showing_results', { tag: cleanTag })} (<strong>{users.paginatorInfo.total}</strong>)
                </span>
              </div>

              <UsersGrid
                users={users.data}
                showTags
                size={settings?.avatar_width || 96}
                colsDesktop={settings?.grid_cols_desktop || 4}
                colsMobile={settings?.grid_cols_mobile || 2}
                defaultAvatar={settings?.default_avatar_url || ''}
                vipBadgeLabel={settings?.vip_badge_label || undefined}
                vipBadgeIcon={settings?.vip_badge_icon || undefined}
              />

              {users.paginatorInfo.lastPage > 1 && (
                <div className="tag-pagination-wrapper">
                  <Paginator
                    currentPage={users.paginatorInfo.currentPage}
                    lastPage={users.paginatorInfo.lastPage}
                    total={users.paginatorInfo.total}
                    perPage={users.paginatorInfo.perPage}
                    onPageChange={(page) => {
                      setCurrentPage(page);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    loading={loading}
                  />
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
    </Container>
  );
};

export default TagPage;
