import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { motion } from 'motion/react';
import UsersGrid from '../components/UsersGrid.tsx';
import Paginator from '../components/Paginator';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { queries } from '../lib/graphql/queries';
import { useSiteSettings } from '../hooks/useSiteSettings';
import { COUNTRY_NAMES, getCountryFlag } from '../lib/countryUtils.ts';
import type { Tag, UserPaginator } from '../types';

export default function Explore(): React.ReactElement {
  const { settings, loading: loadingSettings } = useSiteSettings();
  const [users, setUsers] = useState<UserPaginator | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [tagFilter, setTagFilter] = useState<string>('');
  const [searchText, setSearchText] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [roleFilter] = useState<string>('creator');

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
    if (loadingSettings) return; // Esperar a que settings carguen

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
          schema: 'public'
        });

        if (response.users) {
          setUsers(response.users);
        } else {
          setUsers(null);
        }
      } catch (err) {
        console.error('Error loading users:', err);
        setError(err instanceof Error ? err.message : 'Error al cargar usuarios');
        setUsers(null);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [currentPage, settings, roleFilter, searchText, genderFilter, nationalityFilter, tagFilter, minPrice, maxPrice, loadingSettings]);

  return (
    <Container className="mt-5">
      <Row className="justify-content-center mb-5">
        <Col md={8} className="text-center">
          <h1 className="mb-4">Explorar Usuarios</h1>
          <p className="lead">Descubre perfiles y conecta con personas</p>
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          <motion.div 
            className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2"
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <h2 className="mb-0">Usuarios</h2>
            <motion.div 
              className="d-flex gap-2 flex-wrap"
              initial={{ opacity: 0, scale: 0.85 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            >
              <Form.Control
                type="text"
                size="sm"
                placeholder="Buscar por nombre o descripción..."
                value={searchText}
                onChange={(e) => {
                  setSearchText(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ minWidth: '220px', maxWidth: '300px' }}
                aria-label="Buscar usuarios"
              />
              <Form.Control
                type="number"
                size="sm"
                placeholder="Precio mín"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ maxWidth: '120px' }}
                aria-label="Precio mínimo"
                min={0}
              />
              <Form.Control
                type="number"
                size="sm"
                placeholder="Precio máx"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ maxWidth: '120px' }}
                aria-label="Precio máximo"
                min={0}
              />
              <Form.Select
                size="sm"
                value={genderFilter}
                onChange={(e) => {
                  setGenderFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ maxWidth: '180px' }}
                aria-label="Filtrar por sexo"
              >
                <option value="">Sexo: Todos</option>
                <option value="hombre">Sexo: Hombre</option>
                <option value="mujer">Sexo: Mujer</option>
                <option value="trans">Sexo: Trans</option>
                <option value="otro">Sexo: Otro</option>
              </Form.Select>
              <Form.Select
                size="sm"
                value={nationalityFilter}
                onChange={(e) => {
                  setNationalityFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ maxWidth: '200px' }}
                aria-label="Filtrar por país"
              >
                <option value="">País: Todos</option>
                {Object.entries(COUNTRY_NAMES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {getCountryFlag(code)} {name}
                  </option>
                ))}
              </Form.Select>
              <Form.Select
                size="sm"
                value={tagFilter}
                onChange={(e) => {
                  setTagFilter(e.target.value);
                  setCurrentPage(1);
                }}
                style={{ maxWidth: '200px' }}
                aria-label="Filtrar por etiqueta"
              >
                <option value="">Etiqueta: Todas</option>
                {allTags.map((tag) => (
                  <option key={String(tag.id)} value={String(tag.id)}>
                    {tag.name}
                  </option>
                ))}
              </Form.Select>
            </motion.div>
          </motion.div>

          {loading && (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && <Alert variant="danger">{error}</Alert>}

          {!loading && !error && users && (
            <>
              {users.data.length === 0 ? (
                <Alert variant="info">No hay usuarios disponibles con los filtros seleccionados.</Alert>
              ) : (
                <>
                  <UsersGrid
                    users={users.data}
                    showTags
                    size={settings?.avatar_width || 96}
                    colsDesktop={settings?.grid_cols_desktop || 4}
                    colsMobile={settings?.grid_cols_mobile || 2}
                    defaultAvatar={settings?.default_avatar_url || ''}
                    emptyMessage="No hay usuarios disponibles."
                    loading={loading}
                    vipBadgeLabel={settings?.vip_badge_label || undefined}
                    vipBadgeIcon={settings?.vip_badge_icon || undefined}
                  />

                  {users.paginatorInfo.lastPage > 1 && (
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
                  )}
                </>
              )}
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
}
