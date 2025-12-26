import { Row, Col, Card, Badge, Button, ListGroup, ListGroupItem, Placeholder } from 'react-bootstrap';
import { motion, useMotionValue, useSpring } from 'motion/react';
import { Link } from 'react-router-dom';
import React from 'react';
import type { User } from '../types';
import { getCountryFlag, getCountryName } from '../lib/countryUtils.ts';
import OptimizedImage from './OptimizedImage';
import VerifiedBadge from './VerifiedBadge';
import { useTranslation } from 'react-i18next';

interface UsersGridProps {
    users?: User[];
    showTags?: boolean;
    emptyMessage?: string;
    maxTags?: number;
    size?: number;
    colsDesktop?: number;
    colsMobile?: number;
    defaultAvatar?: string;
    loading?: boolean;
    skeletonCount?: number;
    vipBadgeLabel?: string | null;
    vipBadgeIcon?: string | null;
}

// Motion item variants accessible to UserCard
const itemVariants = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -10 } };

function formatPriceCL(value: number | string | null | undefined): string | null {
    const num = typeof value === 'number' ? value : (value ? Number(value) : null);
    if (num == null || Number.isNaN(num)) return null;
    return `$${num.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function calcAge(birthDate: string | null | undefined): number | null {
    if (!birthDate) return null;
    const bd = new Date(birthDate);
    if (Number.isNaN(bd.getTime())) return null;
    const today = new Date();
    let a = today.getFullYear() - bd.getFullYear();
    const m = today.getMonth() - bd.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < bd.getDate())) a--;
    return a;
}

// New component to satisfy hook rules
const UserCard: React.FC<{ u: User; size: number; showTags: boolean; maxTags: number; defaultAvatar: string; vipBadgeLabel: string | null; vipBadgeIcon: string | null }> = ({ u, size, showTags, maxTags, defaultAvatar, vipBadgeLabel, vipBadgeIcon }) => {
    const { t, i18n } = useTranslation();
    const rotateX = useMotionValue(0);
    const rotateY = useMotionValue(0);
    const translateZ = useMotionValue(0);
    const springRotateX = useSpring(rotateX, { stiffness: 420, damping: 34 });
    const springRotateY = useSpring(rotateY, { stiffness: 420, damping: 34 });
    const springTranslateZ = useSpring(translateZ, { stiffness: 300, damping: 36 });
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const onPointerMove = (e: React.PointerEvent) => {
        if (prefersReduced) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const cx = rect.width / 2; const cy = rect.height / 2;
        const nx = (px - cx) / cx; const ny = (py - cy) / cy;
        const maxRotate = 12;
        rotateY.set(nx * maxRotate * -1); rotateX.set(ny * maxRotate); translateZ.set(28 * (1 - Math.max(Math.abs(nx), Math.abs(ny))));
    };
    const onPointerLeave = () => { if (prefersReduced) return; rotateX.set(0); rotateY.set(0); translateZ.set(0); };
    const age = calcAge(u.birth_date);
    const priceStr = formatPriceCL(u.price_from);
    const genderAbbr = (() => { const g = (u.gender || '').toLowerCase(); if (!g) return null; if (g === 'hombre') return 'H'; if (g === 'mujer') return 'M'; if (g === 'trans') return 'T'; if (g === 'otro') return 'O'; return g.charAt(0).toUpperCase(); })();
    const genderIcon = (() => { const g = (u.gender || '').toLowerCase(); if (g === 'hombre') return 'fas fa-mars'; if (g === 'mujer') return 'fas fa-venus'; if (g === 'trans') return 'fas fa-transgender'; if (g === 'otro') return 'fas fa-genderless'; return null; })();
    const description = u.description ? String(u.description) : ''; const shortDesc = description.length > 120 ? description.slice(0, 117) + '…' : description;
    const isVip = u.roles?.some((role: any) => role.name === 'vip') ?? false;
    const vipBorderClass = isVip ? 'border-warning border-2' : '';
    const vipShadowStyle = isVip ? { boxShadow: '0 0 15px rgba(255, 193, 7, 0.4)' } : {};
    const badgeIconClass = vipBadgeIcon ? vipBadgeIcon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : 'fas fa-crown';
    const badgeLabel = (vipBadgeLabel && vipBadgeLabel.trim()) ? vipBadgeLabel.trim() : 'VIP';
    const fixedTagClasses = (() => {
        const tags = (u as any).tags as any[] | undefined;
        if (!Array.isArray(tags) || tags.length === 0) return '';
        const sluggify = (s: string) => String(s).trim().toLowerCase().replace(/\s+/g, '-');
        const fixed = tags.filter((t) => t && t.is_fixed && t.name);
        if (fixed.length === 0) return '';
        return fixed.map((t) => `tag-${sluggify(t.name)}`).join(' ');
    })();
    return (
        <motion.div initial={itemVariants.initial} animate={itemVariants.animate} exit={itemVariants.exit} whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15), 0 10px 20px rgba(0, 0, 0, 0.1)' }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.25, ease: 'easeOut' }} style={{ willChange: 'transform, opacity, box-shadow', perspective: 900, rotateX: springRotateX, rotateY: springRotateY, translateZ: springTranslateZ, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)' }} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave} className="h-100">
            <Card className={`h-100 text-center position-relative ${vipBorderClass} ${fixedTagClasses}`} style={vipShadowStyle}>
                {isVip && (
                    <div className="position-absolute top-0 start-50 translate-middle-x" style={{ zIndex: 10, marginTop: '-12px' }}>
                        <Badge bg="warning" text="dark" className="px-3 py-2 fw-bold shadow-sm" style={{ fontSize: '0.85rem', letterSpacing: '0.5px', border: '2px solid #ffc107', borderRadius: '20px' }}>
                            <i className={`${badgeIconClass} me-1`} style={{ color: '#f59e0b' }}></i>{badgeLabel}
                        </Badge>
                    </div>
                )}
                <Link to={`/u/${u.username}`} className="text-decoration-none">
                    <OptimizedImage webpUrl={u.avatar_thumb_webp} fallbackUrl={u.avatar_thumb || u.avatar_url || defaultAvatar} smallWebpUrl={u.avatar_small_webp} mediumWebpUrl={u.avatar_medium_webp} style={{ objectFit: 'cover' }} alt={u.username} className="rounded-circle" size={size} showSkeleton={true} />
                </Link>
                <Card.Body className="d-flex flex-column">
                    <Card.Title className="mb-1 d-flex align-items-center justify-content-center">
                        @{u.username}{u.is_verified && <VerifiedBadge />}
                    </Card.Title>
                    {(shortDesc || u.nationality || age != null || genderAbbr || priceStr) && (
                        <div className="mb-2" style={{ fontSize: '0.9rem' }}>
                            {shortDesc && <div className="mb-2">{shortDesc}</div>}
                            <ListGroup horizontal className="justify-content-center">
                                {u.nationality && (
                                    <ListGroupItem title={getCountryName(u.nationality)} style={{ padding: '0.25rem 0.5rem', background: 'transparent', border: 0 }}>
                                        <span style={{ fontSize: '1.5rem' }}>{getCountryFlag(u.nationality)}</span>
                                    </ListGroupItem>
                                )}
                                {age != null && <ListGroupItem style={{ background: 'transparent', border: 0 }}>{age} {t('profile.years')}</ListGroupItem>}
                                {genderAbbr && (
                                    <ListGroupItem style={{ background: 'transparent', border: 0 }}>
                                        {genderIcon && <i className={`${genderIcon} me-1`}></i>}{genderAbbr}
                                    </ListGroupItem>
                                )}
                                {priceStr && <ListGroupItem style={{ background: 'transparent', border: 0 }}>{priceStr}</ListGroupItem>}
                            </ListGroup>
                        </div>
                    )}
                    {showTags && u.tags && (
                        <div className="mb-2">
                            {u.tags.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, maxTags).map((t) => {
                                const iconClass = t.icon ? t.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                                const slug = String(t.name).trim().toLowerCase().replace(/\s+/g, '-');
                                const label = i18n.language === 'en' && t.name_en ? t.name_en : t.name;
                                return (
                                    <Badge key={t.id} bg={t.color || 'secondary'} className="me-1">
                                        <Link to={`/t/${slug}`} className="text-white text-decoration-none">
                                            {iconClass && <i className={`${iconClass} me-1`}></i>}{label}
                                        </Link>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}
                    <Button as={Link as any} to={`/u/${u.username}`} variant="primary" size="sm" className="mt-auto text-white">
                        <i className="fa-regular fa-face-grin-hearts"></i> {t('common.view_profile')}
                    </Button>
                </Card.Body>
            </Card>
        </motion.div>
    );
};

export default function UsersGrid({ users = [], showTags = false, emptyMessage = 'No hay usuarios.', maxTags = 3, size = 96, colsDesktop = 4, colsMobile = 2, defaultAvatar = '', loading = false, skeletonCount = 8, vipBadgeLabel = 'VIP', vipBadgeIcon = 'fas fa-crown' }: UsersGridProps) {
    const span = (cols: number): number => { const c = parseInt(String(cols), 10); if (!c || c <= 0) return 12; const clamped = Math.max(1, Math.min(12, c)); return Math.max(1, Math.round(12 / clamped)); };
    const smSpan = span(colsMobile); const mdSpan = span(colsDesktop);
    if (loading) {
        return (
            <Row aria-busy="true" aria-live="polite">
                {Array.from({ length: skeletonCount }).map((_, idx) => (
                    <Col key={idx} xs={12} sm={smSpan} md={mdSpan} lg={mdSpan} className="mb-4">
                        <Card className="h-100 text-center">
                            <div className="p-3 rounded-circle mx-auto bg-light position-relative" style={{ width: `${size}px`, height: `${size}px` }}>
                                <Placeholder as="div" animation="wave" className="w-100 h-100 rounded-circle" />
                            </div>
                            <Card.Body className="d-flex flex-column">
                                <Placeholder as={Card.Title} animation="wave"><Placeholder xs={6} /></Placeholder>
                                <div className="mb-2">
                                    <Placeholder animation="wave"><Placeholder xs={8} /></Placeholder>
                                    <div className="d-flex justify-content-center gap-2 mt-2">
                                        <Placeholder animation="wave"><Placeholder xs={2} /></Placeholder>
                                        <Placeholder animation="wave"><Placeholder xs={2} /></Placeholder>
                                        <Placeholder animation="wave"><Placeholder xs={3} /></Placeholder>
                                    </div>
                                </div>
                                {showTags && (
                                    <div className="mb-2 d-flex justify-content-center gap-1">
                                        {Array.from({ length: maxTags }).map((__, i) => (
                                            <Placeholder key={i} animation="wave"><Badge bg="secondary" className="opacity-50">&nbsp;&nbsp;&nbsp;</Badge></Placeholder>
                                        ))}
                                    </div>
                                )}
                                <Placeholder.Button variant="primary" xs={6} className="mt-auto mx-auto" />
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        );
    }
    if (!users.length) return <div className="alert alert-info" aria-live="polite">{emptyMessage}</div>;

    return (
        <Row as={motion.div}>
            {users.map((u) => (
                <Col key={u.id} xs={12} sm={smSpan} md={mdSpan} lg={mdSpan} className="mb-4">
                    <UserCard u={u} size={size} showTags={showTags} maxTags={maxTags} defaultAvatar={defaultAvatar} vipBadgeLabel={vipBadgeLabel} vipBadgeIcon={vipBadgeIcon} />
                </Col>
            ))}
        </Row>
    );
}
