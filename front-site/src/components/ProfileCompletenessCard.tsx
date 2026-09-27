import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { type ProfileCompletenessResult, type CompletenessCheckItem } from '../lib/profileCompleteness';

interface ProfileCompletenessCardProps {
  completeness: ProfileCompletenessResult;
  onSelectTab?: (tab: 'general' | 'creator' | 'links' | 'tags') => void;
  compact?: boolean;
}

export default function ProfileCompletenessCard({ completeness, onSelectTab, compact = false }: ProfileCompletenessCardProps) {
  const { t } = useTranslation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // If already 100% complete, hide the card
  if (completeness.isComplete) {
    return null;
  }

  const { percentage, pendingItems } = completeness;

  // Visual color based on completion percentage
  const getProgressGradient = (pct: number) => {
    if (pct < 40) return 'linear-gradient(90deg, #F59E0B, #EF4444)';
    if (pct < 80) return 'linear-gradient(90deg, #3B82F6, #8B5CF6)';
    return 'linear-gradient(90deg, #10B981, #059669)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`apple-completeness-card mb-4 rounded-4 shadow-sm overflow-hidden ${compact ? 'p-3' : 'p-3 p-md-4'}`}
      style={{
        background: 'var(--apple-glass-bg, rgba(255, 255, 255, 0.9))',
        backdropFilter: 'blur(20px) saturate(160%)',
        WebkitBackdropFilter: 'blur(20px) saturate(160%)',
        border: '1px solid rgba(var(--color-primary-rgb, 0, 113, 227), 0.25)',
      }}
    >
      {/* Header with Title, Percentage & Collapse Button */}
      <div className="d-flex align-items-center justify-content-between gap-3 mb-2">
        <div className="d-flex align-items-center gap-2">
          <div
            className="d-flex align-items-center justify-content-center text-white flex-shrink-0"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '9px',
              background: 'linear-gradient(135deg, #8B5CF6, #3B82F6)',
              boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
            }}
          >
            <i className="fas fa-sparkles" style={{ fontSize: '0.85rem' }}></i>
          </div>
          <div>
            <div className="fw-bold" style={{ fontSize: '0.96rem', color: 'var(--color-text)' }}>
              {t('profile.completeness_title', 'Completa tu perfil de Creador(a)')}
            </div>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
          <span
            className="badge rounded-pill fw-bold px-2 py-1"
            style={{
              background: 'rgba(var(--color-primary-rgb, 0, 113, 227), 0.12)',
              color: 'var(--color-primary)',
              fontSize: '0.82rem',
            }}
          >
            {percentage}%
          </span>
          <button
            type="button"
            className="btn btn-sm btn-link p-1 text-muted text-decoration-none"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label={isCollapsed ? t('common.expand', 'Expandir') : t('common.collapse', 'Contraer')}
          >
            <i className={`fas fa-chevron-${isCollapsed ? 'down' : 'up'}`} style={{ fontSize: '0.8rem' }}></i>
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div
        className="w-100 rounded-pill overflow-hidden my-2"
        style={{ height: '7px', background: 'rgba(120, 120, 128, 0.15)' }}
      >
        <div
          className="h-100 rounded-pill transition-all"
          style={{
            width: `${percentage}%`,
            background: getProgressGradient(percentage),
            transition: 'width 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        ></div>
      </div>

      {/* Expandable Tasks Checklist */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-3"
          >
            <p className="text-muted small mb-2" style={{ fontSize: '0.78rem' }}>
              {t(
                'profile.completeness_hint',
                'Los perfiles completos reciben hasta 4x más visitas y destacan primero en el Ranking.'
              )}
            </p>

            <div className="d-flex flex-wrap gap-2 pt-1">
              {pendingItems.map((item: CompletenessCheckItem) => {
                const iconClass = item.icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-');
                
                // If onSelectTab is provided and item has a targetTab, trigger tab change
                if (onSelectTab && item.targetTab) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectTab(item.targetTab!)}
                      className="apple-completeness-chip d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill border text-decoration-none"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        background: 'rgba(120, 120, 128, 0.08)',
                        borderColor: 'var(--apple-glass-border)',
                        color: 'var(--color-text)',
                        cursor: 'pointer',
                        transition: 'all 0.14s ease',
                      }}
                    >
                      <i className={`${iconClass} text-primary me-1`} style={{ fontSize: '0.75rem' }}></i>
                      <span>+ {item.shortLabel}</span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    to={item.actionPath || '/profile/edit'}
                    className="apple-completeness-chip d-inline-flex align-items-center gap-1 px-3 py-1 rounded-pill border text-decoration-none"
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      background: 'rgba(120, 120, 128, 0.08)',
                      borderColor: 'var(--apple-glass-border)',
                      color: 'var(--color-text)',
                      transition: 'all 0.14s ease',
                    }}
                  >
                    <i className={`${iconClass} text-primary me-1`} style={{ fontSize: '0.75rem' }}></i>
                    <span>+ {item.shortLabel}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
