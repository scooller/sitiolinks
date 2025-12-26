import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Container, Spinner, Alert, Badge, Button, Form } from 'react-bootstrap';
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
  const { settings, loading: loadingSettings } = useSiteSettings();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<UserPaginator | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [nationalityFilter, setNationalityFilter] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');

  // Cargar usuarios paginados por tag
  useEffect(() => {
    if (!tag || loadingSettings) return;
    
    setLoading(true);
    setError(null);

    async function fetchUsers(): Promise<void> {
      try {
        const variables: Record<string, unknown> = {
          page: currentPage,
          perPage: settings?.grid_users_per_page || 12,
          tag,
        };

        if (genderFilter) variables.gender = genderFilter;
        if (nationalityFilter) variables.nationality = nationalityFilter;
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
  }, [tag, currentPage, settings, genderFilter, nationalityFilter, minPrice, maxPrice, loadingSettings]);

  if (loading) return (<Container className="mt-4 text-center"><Spinner animation="border" /></Container>);
  if (error) return (<Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>);

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Usuarios con el tag: <Badge bg="secondary">{tag}</Badge></h4>
        <Button as={Link} to="/" variant="outline-secondary" size="sm">Volver</Button>
      </div>

      <div className="d-flex gap-2 flex-wrap mb-3">
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
      </div>

      {loading && (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {!loading && !error && users && (
        <>
          {users.data.length === 0 ? (
            <Alert variant="warning">No hay usuarios con este tag.</Alert>
          ) : (
            <>
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
    </Container>
  );
};

export default TagPage;
