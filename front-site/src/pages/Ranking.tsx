import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import VerifiedBadge from '../components/VerifiedBadge';
import OptimizedImage from '../components/OptimizedImage';

type Tag = { id: string | number; name: string; name_en?: string; color?: string; icon?: string };
type RankedUser = {
  id: string | number;
  name: string;
  username: string;
  avatar_url?: string;
  avatar_thumb_webp?: string;
  avatar_small_webp?: string;
  avatar_medium_webp?: string;
  views: number;
  followers_count: number;
  following_count: number;
  gender?: string;
  nationality?: string;
  is_verified?: boolean;
  tags?: Tag[];
};

const Ranking: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState<RankedUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [defaultAvatar, setDefaultAvatar] = useState<string>('');
  const [vipBadgeLabel, setVipBadgeLabel] = useState<string | null>(null);
  const [vipBadgeIcon, setVipBadgeIcon] = useState<string | null>(null);

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const settings = await graphqlRequest({
          query: `
            query { siteSettings { default_avatar_url grid_roles_order grid_users_per_page vip_badge_label vip_badge_icon } }
          `,
        });

        if (settings?.siteSettings?.default_avatar_url) setDefaultAvatar(settings.siteSettings.default_avatar_url);
        const rolesOrder: string[] = settings?.siteSettings?.grid_roles_order || [];
        const perPage: number = settings?.siteSettings?.grid_users_per_page || 50;
        setVipBadgeLabel((settings?.siteSettings as any)?.vip_badge_label ?? null);
        setVipBadgeIcon((settings?.siteSettings as any)?.vip_badge_icon ?? null);

        if (!rolesOrder || rolesOrder.length === 0) {
          setUsers([]);
          setLoading(false);
          return;
        }

        const usersByRole = await Promise.all(
          rolesOrder.map(role =>
            graphqlRequest({
              query: `
                query UsersByRole($role: String!, $perPage: Int) {
                  users(role: $role, per_page: $perPage) {
                    data {
                      id username avatar_url avatar_thumb_webp avatar_small_webp avatar_medium_webp views followers_count following_count gender nationality is_verified
                      roles { name }
                      tags { id name name_en color icon }
                    }
                  }
                }
              `,
              variables: { role, perPage: 100 },
            })
          )
        );

        const seenIds = new Set<string | number>();
        const combined: RankedUser[] = [];
        usersByRole.forEach((res: any) => {
          ((res.users?.data) || []).forEach((u: RankedUser) => {
            if (!seenIds.has(u.id)) { seenIds.add(u.id); combined.push(u); }
          });
        });

        combined.sort((a, b) => (b.views || 0) - (a.views || 0));
        setUsers(combined.slice(0, 10));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  const getMedalEmoji = (position: number): string => position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `#${position}`;
  const getPositionClass = (position: number): string => position === 1 ? 'border-warning bg-warning bg-opacity-10' : position === 2 ? 'border-secondary bg-secondary bg-opacity-10' : position === 3 ? 'border-danger bg-danger bg-opacity-10' : '';

  if (loading) return (<Container className="mt-5 text-center"><Spinner animation="border" variant="primary" /><p className="mt-3">{t('common.loading')}</p></Container>);
  if (error) return (<Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>);

  const normalizeFA = (icon?: string | null): string | null => icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  const convertFA = (icon: string | undefined | null): string | null => {
    return icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  };

  return (
    <Container className="mt-5 mb-5">
      <Row className="justify-content-center mb-4">
        <Col lg={10}>
          <div className="text-center mb-4">
            <h1 className="display-4 mb-3"><i className="fas fa-trophy text-warning me-3"></i>{t('ranking.title')}</h1>
            <p className="lead text-muted">{t('ranking.subtitle')}</p>
          </div>

          {users.length === 0 ? (
            <Alert variant="info" className="text-center">{t('ranking.no_users')}</Alert>
          ) : (
            <motion.div
              className="ranking-list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {users.map((user, index) => {
                const position = index + 1;
                const avatarUrl = user.avatar_url || defaultAvatar;
                const avatarWebp = (user as any).avatar_thumb_webp;
                const smallWebp = (user as any).avatar_small_webp;
                const mediumWebp = (user as any).avatar_medium_webp;
                const isVip = (user as any)?.roles?.some((r: any) => r?.name === 'vip');
                const badgeIconClass = normalizeFA(vipBadgeIcon) || 'fas fa-crown';
                const badgeLabel = (vipBadgeLabel && vipBadgeLabel.trim()) || 'VIP';
                return (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-50px" }}
                    transition={{
                      duration: 0.4,
                      delay: index * 0.08,
                      ease: "easeOut"
                    }}
                  >
                    <Card className={`mb-3 shadow-sm ${getPositionClass(position)}`} style={{ borderWidth: position <= 3 ? '2px' : '1px' }}>
                      <Card.Body>
                        <Row className="align-items-center">
                          <Col xs={2} md={1} className="text-center"><h3 className="mb-0" style={{ fontSize: position <= 3 ? '2rem' : '1.5rem' }}>{getMedalEmoji(position)}</h3></Col>
                          <Col xs={3} md={2} className="text-center">
                            <Link to={`/u/${user.username}`}>
                              <OptimizedImage
                                webpUrl={avatarWebp}
                                smallWebpUrl={smallWebp}
                                mediumWebpUrl={mediumWebp}
                                fallbackUrl={avatarUrl}
                                alt={user.username}
                                className="rounded-circle"
                                size={position <= 3 ? 80 : 60}
                                style={{ width: position <= 3 ? '80px' : '60px', height: position <= 3 ? '80px' : '60px', objectFit: 'cover', border: position <= 3 ? '3px solid var(--bs-warning)' : 'none' }}
                                priority={position <= 3}
                              />
                            </Link>
                          </Col>
                          <Col xs={7} md={5}>
                            <Link to={`/u/${user.username}`} className="text-decoration-none text-dark">
                              <h5 className="mb-1 d-flex align-items-center flex-wrap">
                                <span className="d-flex align-items-center">
                                  @{user.username}
                                  {user.is_verified && <VerifiedBadge />}
                                </span>
                                {position <= 3 && (<Badge bg="warning" text="dark" className="ms-2">TOP {position}</Badge>)}
                                {isVip && (
                                  <Badge bg="warning" text="dark" className="ms-2">
                                    <i className={`${badgeIconClass} me-1`} />{badgeLabel}
                                  </Badge>
                                )}
                              </h5>
                            </Link>
                            {user.tags && user.tags.length > 0 && (
                              <div className="mt-2">
                                {(user.tags || []).slice(0, 3).map((tag) => {
                                  const iconClass = convertFA(tag.icon);
                                  const label = i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name;
                                  return (
                                    <Badge key={tag.id} bg={(tag.color as any) || 'secondary'} className="me-1 mb-1" style={{ fontSize: '0.75rem' }}>
                                      {iconClass && <i className={`${iconClass} me-1`}></i>}
                                      {label}
                                    </Badge>
                                  );
                                })}
                              </div>
                            )}
                          </Col>
                          <Col xs={12} md={4} className="mt-3 mt-md-0">
                            <Row className="text-center g-2">
                              <Col xs={4}><div className="d-flex flex-column align-items-center"><i className="fas fa-eye text-primary mb-1"></i><strong className="d-block">{(user.views ?? 0).toLocaleString()}</strong><small className="text-muted">{t('ranking.views')}</small></div></Col>
                              <Col xs={4}><div className="d-flex flex-column align-items-center"><i className="fas fa-users text-success mb-1"></i><strong className="d-block">{user.followers_count ?? 0}</strong><small className="text-muted">{t('ranking.followers')}</small></div></Col>
                              <Col xs={4}><div className="d-flex flex-column align-items-center"><i className="fas fa-user-check text-info mb-1"></i><strong className="d-block">{user.following_count ?? 0}</strong><small className="text-muted">{t('ranking.following')}</small></div></Col>
                            </Row>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          <Card className="mt-4 bg-light"><Card.Body className="text-center"><small className="text-muted"><i className="fas fa-info-circle me-2"></i>{t('ranking.ranking_text')}</small></Card.Body></Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Ranking;
