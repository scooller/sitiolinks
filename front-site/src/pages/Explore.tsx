import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import UsersGrid from '../components/UsersGrid.tsx';
import Paginator from '../components/Paginator';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { COUNTRY_NAMES, getCountryFlag } from '../lib/countryUtils.ts';
import type { Tag, UserPaginator } from '../types';

export default function Explore(): React.ReactElement {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || searchParams.get('q') || '';
  const { settings, loading: loadingSettings } = useSiteSettings();
  const [users, setUsers] = useState<UserPaginator | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>(initialSearch);
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [roleFilter] = useState<string>('creator');

  const hasActiveFilters = Boolean(
    searchText || genderFilter || nationalityFilter || tagFilter || minPrice || maxPrice
  );

  const resetFilters = (): void => {
    setSearchText('');
    setGenderFilter('');
    setNationalityFilter('');
    setTagFilter('');
    setMinPrice('');
    setMaxPrice('');
    setCurrentPage(1);
  };

  // Cargar tags
  useEffect(() => {
    async function fetchTags(): Promise<void> {
      try {
        const tagsResponse = await graphqlRequest<{ tags: Tag[] }>({
          query: queries.tags,
          schema: 'public',
        });

        if (tagsResponse.tags) {
          setAllTags(tagsResponse.tags);
        }
      } catch (err) {
        console.error('Error loading tags:', err);
      }
    }

    fetchTags();
  }, []);

  // Cargar usuarios paginados
  useEffect(() => {
    if (loadingSettings) return;

    async function fetchUsers(): Promise<void> {
      setLoading(true);
      setError(null);

      try {
        const variables: Record<string, unknown> = {
          page: currentPage,
          perPage: settings?.grid_users_per_page || 12,
          role: roleFilter,
        };

        if (searchText) variables.search = searchText;
        if (genderFilter) variables.gender = genderFilter;
        if (nationalityFilter) variables.nationality = nationalityFilter;
        if (tagFilter) variables.tagId = parseInt(tagFilter, 10);
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
        console.error('Error loading users:', err);
        setError(err instanceof Error ? err.message : t('explore.error_loading', 'Error al cargar usuarios'));
        setUsers(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentPage, settings, roleFilter, searchText, genderFilter, nationalityFilter, tagFilter, minPrice, maxPrice, loadingSettings, t]);

  return (
    <Container className="py-4">
      {/* 1. Hero Editorial Apple */}
      <section className="explore-hero-container">
        <span className="explore-section-kicker">
          <i className="fas fa-compass" aria-hidden="true"></i>
          {t('explore.kicker', 'Comunidad & Creadores')}
        </span>
        <h1 className="explore-hero-title">{t('explore.title', 'Explorar Creadores')}</h1>
        <p className="explore-hero-subtitle">
          {t('explore.subtitle', 'Descubre perfiles verificados y conecta con personas de todo el mundo')}
        </p>
        {users?.paginatorInfo && (
          <div className="explore-counter-pill">
            <span className="explore-counter-dot" aria-hidden="true"></span>
            <span>
              {users.paginatorInfo.total}{' '}
              {users.paginatorInfo.total === 1
                ? t('explore.creator_single', 'creador disponible')
                : t('explore.creators_plural', 'creadores disponibles')}
            </span>
          </div>
        )}
      </section>

      {/* 2. Barra de Filtros Liquid Glass */}
      <section className="explore-filter-bar">
        <Row className="g-3 align-items-center">
          {/* Buscador Principal Cápsula */}
          <Col xs={12} lg={4}>
            <div className="explore-search-input-wrapper">
              <i className="fas fa-magnifying-glass explore-search-icon" aria-hidden="true"></i>
              <Form.Control
                type="text"
                className="explore-search-input"
                placeholder={t('explore.search_placeholder', 'Buscar por nombre o descripción...')}
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                aria-label={t('explore.search_placeholder', 'Buscar usuarios')}
              />
              {searchText && (
                <button
                  type="button"
                  className="explore-search-clear"
                  onClick={() => {
                    setSearchText('');
                    setCurrentPage(1);
                  }}
                  aria-label={t('common.clear', 'Limpiar')}
                >
                  <i className="fas fa-times" aria-hidden="true"></i>
                </button>
              )}
            </div>
          </Col>

          {/* Filtro Sexo */}
          <Col xs={6} sm={4} lg={2}>
            <Form.Select
              className="explore-filter-select"
              value={genderFilter}
              onChange={(e) => {
                setGenderFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t('explore.gender_all', 'Filtrar por sexo')}
            >
              <option value="">{t('explore.gender_all', 'Sexo: Todos')}</option>
              <option value="hombre">{t('explore.gender_male', 'Sexo: Hombre')}</option>
              <option value="mujer">{t('explore.gender_female', 'Sexo: Mujer')}</option>
              <option value="trans">{t('explore.gender_trans', 'Sexo: Trans')}</option>
              <option value="otro">{t('explore.gender_other', 'Sexo: Otro')}</option>
            </Form.Select>
          </Col>

          {/* Filtro País */}
          <Col xs={6} sm={4} lg={2}>
            <Form.Select
              className="explore-filter-select"
              value={nationalityFilter}
              onChange={(e) => {
                setNationalityFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t('explore.country_all', 'Filtrar por país')}
            >
              <option value="">{t('explore.country_all', 'País: Todos')}</option>
              {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                <option key={code} value={code}>
                  {getCountryFlag(code)} {name}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Filtro Etiqueta */}
          <Col xs={12} sm={4} lg={2}>
            <Form.Select
              className="explore-filter-select"
              value={tagFilter}
              onChange={(e) => {
                setTagFilter(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t('explore.tag_all', 'Filtrar por etiqueta')}
            >
              <option value="">{t('explore.tag_all', 'Etiqueta: Todas')}</option>
              {allTags.map((tag) => (
                <option key={String(tag.id)} value={String(tag.id)}>
                  {tag.name}
                </option>
              ))}
            </Form.Select>
          </Col>

          {/* Rango de Precios */}
          <Col xs={6} sm={3} lg={1}>
            <Form.Control
              type="number"
              className="explore-filter-input"
              placeholder={t('explore.price_min', 'Mín $')}
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t('explore.price_min', 'Precio mínimo')}
              min={0}
            />
          </Col>

          <Col xs={6} sm={3} lg={1}>
            <Form.Control
              type="number"
              className="explore-filter-input"
              placeholder={t('explore.price_max', 'Máx $')}
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setCurrentPage(1);
              }}
              aria-label={t('explore.price_max', 'Precio máximo')}
              min={0}
            />
          </Col>
        </Row>

        {/* Barra de Acciones y Reset */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top border-light-subtle flex-wrap gap-2">
          <span className="text-muted small">
            {hasActiveFilters ? (
              <span className="text-primary fw-medium">
                <i className="fas fa-filter me-1" aria-hidden="true"></i>
                {t('explore.filters_active', 'Filtros activos')}
              </span>
            ) : (
              t('explore.showing_all', 'Mostrando catálogo completo')
            )}
          </span>
          <button
            type="button"
            className="explore-filter-reset-btn btn btn-secondary px-3"
            onClick={resetFilters}
            disabled={!hasActiveFilters}
          >
            <i className="fas fa-rotate-left me-1" aria-hidden="true"></i>
            <span>{t('common.clear_filters', 'Limpiar Filtros')}</span>
          </button>
        </div>
      </section>

      {/* 3. Estados de Error */}
      {error && (
        <Alert variant="danger" className="rounded-4 shadow-sm text-center py-3">
          <i className="fas fa-circle-exclamation me-2" aria-hidden="true"></i>
          {error}
        </Alert>
      )}

      {/* 4. Grilla de Usuarios, Skeletons o Estado Vacío */}
      {!error && (
        <>
          {loading ? (
            <UsersGrid
              loading={true}
              skeletonCount={settings?.grid_users_per_page || 12}
              showTags
              size={settings?.avatar_width || 96}
              colsDesktop={settings?.grid_cols_desktop || 4}
              colsMobile={settings?.grid_cols_mobile || 2}
            />
          ) : users && users.data.length === 0 ? (
            <div className="explore-empty-state">
              <div className="explore-empty-icon">
                <i className="fas fa-user-slash" aria-hidden="true"></i>
              </div>
              <h3 className="explore-empty-title">
                {t('explore.no_users_title', 'No se encontraron creadores')}
              </h3>
              <p className="explore-empty-desc">
                {t('explore.no_users', 'No hay usuarios disponibles con los filtros seleccionados. Intenta ajustar tus términos de búsqueda.')}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={resetFilters}
                  style={{ minHeight: 'var(--size-touch-min)', boxShadow: 'var(--shadow-button)' }}
                >
                  <i className="fas fa-rotate-left me-2" aria-hidden="true"></i>
                  {t('common.clear_filters', 'Restablecer filtros')}
                </button>
              )}
            </div>
          ) : users ? (
            <>
              <UsersGrid
                users={users.data}
                showTags
                size={settings?.avatar_width || 96}
                colsDesktop={settings?.grid_cols_desktop || 4}
                colsMobile={settings?.grid_cols_mobile || 2}
                defaultAvatar={settings?.default_avatar_url || ''}
                emptyMessage={t('explore.no_users', 'No hay usuarios disponibles.')}
                loading={loading}
                vipBadgeLabel={settings?.vip_badge_label || undefined}
                vipBadgeIcon={settings?.vip_badge_icon || undefined}
              />

              {users.paginatorInfo.lastPage > 1 && (
                <div className="explore-pagination-wrapper">
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
          ) : null}
        </>
      )}
    </Container>
  );
}
