import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { fadeIn, defaultTransition, appleEase } from '../lib/animations';
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
            query {
              siteSettings {
                default_avatar_url
                grid_roles_order
                grid_users_per_page
                vip_badge_label
                vip_badge_icon
              }
            }
          `,
        });

        if (settings?.siteSettings?.default_avatar_url) {
          setDefaultAvatar(settings.siteSettings.default_avatar_url);
        }
        const rolesOrder: string[] = settings?.siteSettings?.grid_roles_order || [];
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
                      id
                      username
                      avatar_url
                      avatar_thumb_webp
                      avatar_small_webp
                      avatar_medium_webp
                      views
                      followers_count
                      following_count
                      gender
                      nationality
                      is_verified
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
          (res.users?.data || []).forEach((u: RankedUser) => {
            if (!seenIds.has(u.id)) {
              seenIds.add(u.id);
              combined.push(u);
            }
          });
        });

        combined.sort((a, b) => (b.views || 0) - (a.views || 0));
        setUsers(combined.slice(0, 10));
      } catch (err: any) {
        setError(err.message || t('ranking.error_loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, [t]);

  const normalizeFA = (icon?: string | null): string | null =>
    icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;

  const convertFA = (icon: string | undefined | null): string | null => {
    return icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  };

  if (loading) {
    return (
      <div className="ranking-page-wrapper" aria-busy="true" aria-live="polite">
        <Container>
          <div className="ranking-hero">
            <span className="ranking-kicker">
              <i className="fas fa-trophy" aria-hidden="true" /> {t('ranking.kicker')}
            </span>
            <h1 className="ranking-title">{t('ranking.title')}</h1>
            <p className="ranking-subtitle">{t('ranking.subtitle')}</p>
          </div>

          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              <div className="ranking-list">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="ranking-apple-card mb-3">
                    <Row className="align-items-center g-3">
                      <Col xs="auto">
                        <div className="apple-skeleton rounded-circle" style={{ width: '44px', height: '44px' }} />
                      </Col>
                      <Col xs="auto">
                        <div className="apple-skeleton rounded-circle" style={{ width: '56px', height: '56px' }} />
                      </Col>
                      <Col>
                        <div className="apple-skeleton apple-skeleton-text w-50 mb-2" style={{ height: '18px' }} />
                        <div className="apple-skeleton apple-skeleton-text w-75" style={{ height: '12px' }} />
                      </Col>
                      <Col xs="auto" className="d-none d-md-flex gap-2">
                        <div className="apple-skeleton rounded-pill" style={{ width: '80px', height: '32px' }} />
                        <div className="apple-skeleton rounded-pill" style={{ width: '80px', height: '32px' }} />
                      </Col>
                      <Col xs="auto">
                        <div className="apple-skeleton rounded-pill" style={{ width: '100px', height: '40px' }} />
                      </Col>
                    </Row>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ranking-page-wrapper">
        <Container>
          <Row className="justify-content-center">
            <Col lg={8}>
              <Alert variant="danger" className="contact-status-alert">
                <i className="fas fa-circle-exclamation me-2"></i>
                {error}
              </Alert>
            </Col>
          </Row>
        </Container>
      </div>
    );
  }

  return (
    <div className="ranking-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          {/* Cabecera Editorial Apple */}
          <div className="ranking-hero">
            <span className="ranking-kicker">
              <i className="fas fa-trophy" aria-hidden="true"></i> {t('ranking.kicker')}
            </span>
            <h1 className="ranking-title">{t('ranking.title')}</h1>
            <p className="ranking-subtitle">{t('ranking.subtitle')}</p>
          </div>

          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              {users.length === 0 ? (
                <div className="ranking-apple-card text-center py-5">
                  <i className="fas fa-users-slash fa-2x mb-3 text-muted"></i>
                  <p className="mb-0 text-muted">{t('ranking.no_users')}</p>
                </div>
              ) : (
                <div className="ranking-list">
                  {users.map((user, index) => {
                    const position = index + 1;
                    const avatarUrl = user.avatar_url || defaultAvatar;
                    const avatarWebp = (user as any).avatar_thumb_webp;
                    const smallWebp = (user as any).avatar_small_webp;
                    const mediumWebp = (user as any).avatar_medium_webp;
                    const isVip = (user as any)?.roles?.some((r: any) => r?.name === 'vip');
                    const badgeIconClass = normalizeFA(vipBadgeIcon) || 'fas fa-crown';
                    const badgeLabel = (vipBadgeLabel && vipBadgeLabel.trim()) || 'VIP';

                    // Clases según posición de podio
                    const podiumClass =
                      position === 1
                        ? 'ranking-podium-1'
                        : position === 2
                        ? 'ranking-podium-2'
                        : position === 3
                        ? 'ranking-podium-3'
                        : '';

                    const avatarFrameClass =
                      position === 1
                        ? 'avatar-gold'
                        : position === 2
                        ? 'avatar-silver'
                        : position === 3
                        ? 'avatar-bronze'
                        : '';

                    const badgeClass =
                      position === 1
                        ? 'badge-gold'
                        : position === 2
                        ? 'badge-silver'
                        : position === 3
                        ? 'badge-bronze'
                        : 'badge-standard';

                    return (
                      <motion.div
                        key={user.id}
                        initial={{ opacity: 0, y: 14 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-40px' }}
                        transition={{
                          duration: 0.28,
                          delay: index * 0.05,
                          ease: appleEase,
                        }}
                      >
                        <div className={`ranking-apple-card ${podiumClass}`}>
                          <Row className="align-items-center g-3">
                            {/* Insignia de Posición */}
                            <Col xs="auto" className="text-center">
                              <div className={`ranking-position-badge ${badgeClass}`}>
                                {position === 1 ? (
                                  <i className="fas fa-crown" aria-label="Top 1"></i>
                                ) : position === 2 ? (
                                  <i className="fas fa-medal" aria-label="Top 2"></i>
                                ) : position === 3 ? (
                                  <i className="fas fa-award" aria-label="Top 3"></i>
                                ) : (
                                  <span>#{position}</span>
                                )}
                              </div>
                            </Col>

                            {/* Avatar */}
                            <Col xs="auto">
                              <Link
                                to={`/u/${user.username}`}
                                className={`ranking-avatar-wrapper ${avatarFrameClass} d-block`}
                                aria-label={`Perfil de ${user.username}`}
                              >
                                <OptimizedImage
                                  webpUrl={avatarWebp}
                                  smallWebpUrl={smallWebp}
                                  mediumWebpUrl={mediumWebp}
                                  fallbackUrl={avatarUrl}
                                  alt={user.username}
                                  className="w-100 h-100"
                                  size={position <= 3 ? 76 : 64}
                                  style={{ objectFit: 'cover' }}
                                  priority={position <= 3}
                                />
                              </Link>
                            </Col>

                            {/* Información del Creador */}
                            <Col xs={12} md>
                              <div className="d-flex align-items-center flex-wrap gap-2 mb-1">
                                <Link to={`/u/${user.username}`} className="ranking-username">
                                  <span>@{user.username}</span>
                                  {user.is_verified && <VerifiedBadge />}
                                </Link>

                                {position <= 3 && (
                                  <span className={`ranking-top-pill top-${position}`}>
                                    TOP {position}
                                  </span>
                                )}

                                {isVip && (
                                  <span className="ranking-vip-pill">
                                    <i className={badgeIconClass} aria-hidden="true"></i>
                                    {badgeLabel}
                                  </span>
                                )}
                              </div>

                              {/* Tags */}
                              {user.tags && user.tags.length > 0 && (
                                <div className="d-flex align-items-center flex-wrap gap-1 mt-1">
                                  {user.tags.slice(0, 3).map(tag => {
                                    const iconClass = convertFA(tag.icon);
                                    const label =
                                      i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name;
                                    const slug =
                                      (tag as any).slug ||
                                      encodeURIComponent(tag.name.toLowerCase().replace(/\s+/g, '-'));
                                    return (
                                      <Link key={tag.id} to={`/t/${slug}`} className="ranking-tag-pill">
                                        {iconClass && <i className={`${iconClass} me-1`} aria-hidden="true"></i>}
                                        {label}
                                      </Link>
                                    );
                                  })}
                                </div>
                              )}
                            </Col>

                            {/* Métricas y Estadísticas */}
                            <Col xs={12} lg="auto">
                              <div className="ranking-stats-row">
                                <div className="ranking-stat-box">
                                  <i className="fas fa-eye ranking-stat-icon" aria-hidden="true"></i>
                                  <span className="ranking-stat-value">
                                    {(user.views ?? 0).toLocaleString()}
                                  </span>
                                  <span className="ranking-stat-label">{t('ranking.views')}</span>
                                </div>

                                <div className="ranking-stat-box">
                                  <i className="fas fa-users ranking-stat-icon" aria-hidden="true"></i>
                                  <span className="ranking-stat-value">
                                    {user.followers_count ?? 0}
                                  </span>
                                  <span className="ranking-stat-label">{t('ranking.followers')}</span>
                                </div>

                                <div className="ranking-stat-box">
                                  <i className="fas fa-user-check ranking-stat-icon" aria-hidden="true"></i>
                                  <span className="ranking-stat-value">
                                    {user.following_count ?? 0}
                                  </span>
                                  <span className="ranking-stat-label">{t('ranking.following')}</span>
                                </div>

                                {/* Botón de Acceso al Perfil */}
                                <Link
                                  to={`/u/${user.username}`}
                                  className="ranking-profile-btn ms-lg-2"
                                  aria-label={`Ver perfil de @${user.username}`}
                                >
                                  <span>{t('ranking.view_profile')}</span>
                                  <i className="fas fa-arrow-right" aria-hidden="true"></i>
                                </Link>
                              </div>
                            </Col>
                          </Row>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Tarjeta Informativa Inferior */}
              <div className="ranking-info-card">
                <i className="fas fa-circle-info ranking-info-icon" aria-hidden="true"></i>
                <span>{t('ranking.ranking_text')}</span>
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default Ranking;
