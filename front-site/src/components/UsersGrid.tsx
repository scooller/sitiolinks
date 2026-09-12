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

function getBadgeTextColor(bgName?: string | null): string {
    if (!bgName) return 'text-white';
    const lightBgs = ['warning', 'light', 'info', '#ffc107', '#f8f9fa', '#0dcaf0', 'yellow', '#ffd166'];
    const lower = bgName.toLowerCase();
    return lightBgs.some(c => lower.includes(c)) ? 'text-dark' : 'text-white';
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
    const isFinePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: fine)').matches;

    const onPointerMove = (e: React.PointerEvent) => {
        if (prefersReduced || !isFinePointer) return;
        const target = e.currentTarget as HTMLElement;
        const rect = target.getBoundingClientRect();
        const px = e.clientX - rect.left;
        const py = e.clientY - rect.top;
        const cx = rect.width / 2; const cy = rect.height / 2;
        const nx = (px - cx) / cx; const ny = (py - cy) / cy;
        const maxRotate = 12;
        rotateY.set(nx * maxRotate * -1); rotateX.set(ny * maxRotate); translateZ.set(28 * (1 - Math.max(Math.abs(nx), Math.abs(ny))));
    };
    const onPointerLeave = () => { if (prefersReduced || !isFinePointer) return; rotateX.set(0); rotateY.set(0); translateZ.set(0); };
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
        <motion.div
            initial={itemVariants.initial}
            animate={itemVariants.animate}
            exit={itemVariants.exit}
            whileHover={prefersReduced ? undefined : { y: -6 }}
            whileTap={prefersReduced ? undefined : { scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{ willChange: 'transform, opacity, box-shadow', perspective: 900, rotateX: springRotateX, rotateY: springRotateY, translateZ: springTranslateZ }}
            onPointerMove={onPointerMove}
            onPointerLeave={onPointerLeave}
            className="h-100"
        >
            <div className={`user-apple-card text-center ${isVip ? 'is-vip' : ''} ${fixedTagClasses}`}>
                {isVip && (
                    <span className="user-vip-pill" title={badgeLabel}>
                        <i className={`${badgeIconClass} text-white`}></i>
                        <span>{badgeLabel}</span>
                    </span>
                )}
                <div className="user-avatar-wrapper">
                    <Link to={`/u/${u.username}`} className="text-decoration-none">
                        <OptimizedImage
                            webpUrl={u.avatar_thumb_webp}
                            fallbackUrl={u.avatar_thumb || u.avatar_url || defaultAvatar}
                            smallWebpUrl={u.avatar_small_webp}
                            mediumWebpUrl={u.avatar_medium_webp}
                            alt={u.username}
                            className="user-avatar-img"
                            size={size}
                            showSkeleton={true}
                        />
                    </Link>
                </div>
                <div className="d-flex flex-column flex-grow-1">
                    <Link to={`/u/${u.username}`} className="user-card-username">
                        <span>@{u.username}</span>
                        {u.is_verified && <VerifiedBadge />}
                    </Link>

                    {shortDesc && <p className="user-card-bio">{shortDesc}</p>}

                    {(u.nationality || age != null || genderAbbr || priceStr) && (
                        <div className="user-meta-row">
                            {u.nationality && (
                                <span className="user-meta-pill" title={getCountryName(u.nationality)}>
                                    <span role="img" aria-label={getCountryName(u.nationality)}>{getCountryFlag(u.nationality)}</span>
                                    <span>{getCountryName(u.nationality)}</span>
                                </span>
                            )}
                            {age != null && (
                                <span className="user-meta-pill">
                                    <i className="fas fa-cake-candles me-1 text-muted" aria-hidden="true"></i>
                                    {age} {t('profile.years')}
                                </span>
                            )}
                            {genderAbbr && (
                                <span className="user-meta-pill">
                                    {genderIcon && <i className={`${genderIcon} me-1 text-muted`} aria-hidden="true"></i>}
                                    {genderAbbr}
                                </span>
                            )}
                            {priceStr && (
                                <span className="user-meta-pill price-pill">
                                    <i className="fas fa-tag me-1" aria-hidden="true"></i>
                                    {priceStr}
                                </span>
                            )}
                        </div>
                    )}

                    {showTags && u.tags && u.tags.length > 0 && (
                        <div className="user-tags-row">
                            {u.tags.slice().sort((a, b) => (b.weight || 0) - (a.weight || 0)).slice(0, maxTags).map((t) => {
                                const iconClass = t.icon ? t.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
                                const slug = String(t.name).trim().toLowerCase().replace(/\s+/g, '-');
                                const label = i18n.language === 'en' && t.name_en ? t.name_en : t.name;
                                return (
                                    <Link key={t.id} to={`/t/${slug}`} className="user-tag-pill">
                                        {iconClass && <i className={`${iconClass}`}></i>}
                                        <span>{label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    )}

                    <Link
                        to={`/u/${u.username}`}
                        className="user-card-cta"
                        style={{ minHeight: 'var(--size-touch-min)' }}
                    >
                        <i className="fa-regular fa-face-grin-hearts me-2" aria-hidden="true"></i>
                        {t('common.view_profile')}
                    </Link>
                </div>
            </div>
        </motion.div>
    );
};

// Skeleton 100% fiel a la geometría de UserCard
const UserCardSkeleton: React.FC<{ size: number; showTags: boolean; maxTags: number; isVip?: boolean }> = ({ size, showTags, maxTags, isVip = false }) => {
    return (
        <div className={`user-apple-card text-center h-100 ${isVip ? 'is-vip' : ''}`}>
            {isVip && (
                <span className="user-vip-pill" style={{ opacity: 0.85 }}>
                    <i className="fas fa-crown text-white" aria-hidden="true" />
                    <span>VIP</span>
                </span>
            )}
            <div className="user-avatar-wrapper">
                <div
                    className="apple-skeleton rounded-circle user-avatar-img mx-auto"
                    style={{
                        width: `${size}px`,
                        height: `${size}px`,
                        borderRadius: size > 96 ? 'var(--rounded-2xl)' : 'var(--rounded-full)',
                        border: '2px solid rgba(255, 255, 255, 0.2)'
                    }}
                />
            </div>
            <div className="d-flex flex-column flex-grow-1">
                {/* Username + verified badge placeholder */}
                <div className="d-flex align-items-center justify-content-center gap-2 mb-2 mt-1">
                    <div className="apple-skeleton apple-skeleton-text" style={{ width: '100px', height: '18px' }} />
                    <div className="apple-skeleton rounded-circle" style={{ width: '15px', height: '15px' }} />
                </div>

                {/* Short Bio description lines */}
                <div className="d-flex flex-column align-items-center gap-1 mb-3">
                    <div className="apple-skeleton apple-skeleton-text" style={{ width: '84%', height: '12px' }} />
                    <div className="apple-skeleton apple-skeleton-text" style={{ width: '62%', height: '12px' }} />
                </div>

                {/* Meta pills row (Country, Age, Gender, Price) */}
                <div className="user-meta-row justify-content-center mb-3">
                    <div className="apple-skeleton user-meta-pill" style={{ width: '68px', height: '26px' }} />
                    <div className="apple-skeleton user-meta-pill" style={{ width: '56px', height: '26px' }} />
                    <div className="apple-skeleton user-meta-pill" style={{ width: '38px', height: '26px' }} />
                    <div className="apple-skeleton user-meta-pill price-pill" style={{ width: '76px', height: '26px' }} />
                </div>

                {/* Tag pills row */}
                {showTags && (
                    <div className="user-tags-row justify-content-center mb-3">
                        {Array.from({ length: Math.min(maxTags, 3) }).map((_, i) => (
                            <div
                                key={i}
                                className="apple-skeleton user-tag-pill"
                                style={{
                                    width: `${[62, 80, 70][i % 3]}px`,
                                    height: '24px'
                                }}
                            />
                        ))}
                    </div>
                )}

                {/* CTA Button matching .user-card-cta */}
                <div
                    className="apple-skeleton user-card-cta mt-auto"
                    style={{
                        minHeight: 'var(--size-touch-min, 44px)',
                        cursor: 'default',
                        opacity: 0.9
                    }}
                />
            </div>
        </div>
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
                        <UserCardSkeleton size={size} showTags={showTags} maxTags={maxTags} isVip={idx === 0} />
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
