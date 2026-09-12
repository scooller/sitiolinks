import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Container, Badge, Spinner, Alert } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Tag } from '../types';
import { useTranslation } from 'react-i18next';
import { appleEase } from '../lib/animations';

interface PopularTagsProps {
  limit?: number;
}

export default function PopularTags({ limit = 20 }: PopularTagsProps) {
  const { t } = useTranslation();
  const { i18n } = useTranslation();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPopularTags();
  }, [limit]);

  const convertFA = (icon: string | undefined): string | null => {
    return icon ? icon.replace(/^(fas|fab|far|fal|fa)-/, '$1 fa-') : null;
  };

  const getBadgeTextColor = (bgName?: string | null): string => {
    if (!bgName) return 'text-white';
    const lightBgs = ['warning', 'light', 'info', '#ffc107', '#f8f9fa', '#0dcaf0', 'yellow', '#ffd166'];
    const lower = bgName.toLowerCase();
    return lightBgs.some(c => lower.includes(c)) ? 'text-dark' : 'text-white';
  };

  const loadPopularTags = async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await graphqlRequest<{ tags: Tag[] }>({
        query: `
          query Tags {
            tags {
              id
              name
              name_en
              color
              icon
              weight
            }
          }
        `,
        schema: 'public'
      });

      // Ordenar por weight (peso) de mayor a menor y limitar
      const sortedTags = (response.tags || [])
        .sort((a, b) => (Number(b.weight) || 0) - (Number(a.weight) || 0))
        .slice(0, limit);

      setTags(sortedTags);
    } catch (err: any) {
      setError(err?.message || t('errors.loading', { entity: t('entities.tags') }));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <section className="popular-tags-section py-5 bg-light" aria-busy="true" aria-live="polite">
        <Container>
          <div className="text-center mb-4">
            <h2 className="mb-2">
              <i className="fas fa-tags text-primary me-2" aria-hidden="true" />
              {t('home.popular_tags_title')}
            </h2>
            <p className="text-muted">
              {t('home.popular_tags_desc')}
            </p>
          </div>
          <div className="d-flex flex-wrap justify-content-center gap-2 mb-4">
            {[85, 115, 70, 95, 130, 80, 105, 90, 120, 75, 100, 85].map((w, idx) => (
              <div
                key={idx}
                className="apple-skeleton apple-skeleton-pill"
                style={{ width: `${w}px`, height: '38px' }}
              />
            ))}
          </div>
        </Container>
      </section>
    );
  }

  if (error) {
    return (
      <Alert variant="danger" className="mb-0">
        <i className="fas fa-exclamation-triangle me-2"></i>
        {error}
      </Alert>
    );
  }

  if (tags.length === 0) {
    return null; // No mostrar nada si no hay tags
  }

  return (
    <section className="popular-tags-section py-5 bg-light">
      <Container>
        {/* Header de sección */}
        <motion.div
          className="text-center mb-4"
          initial={{ opacity: 0, y: -12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.28, ease: appleEase }}
        >
          <h2 className="mb-2">
            <i className="fas fa-tags text-primary me-2"></i>
            {t('home.popular_tags')}
          </h2>
          <p className="text-muted">
            {t('home.popular_tags_desc')}
          </p>
        </motion.div>

        {/* Tags como badges */}
        <motion.div className="d-flex flex-wrap justify-content-center gap-2 mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.03 }}
        >
          {tags.map((tag) => {
            const iconClass = convertFA(tag.icon);
            const slug = String(tag.name).trim().toLowerCase().replace(/\s+/g, '-');
            const textColor = getBadgeTextColor(tag.color);
            return (
              <Link
                key={tag.id}
                to={`/t/${slug}`}
                className="text-decoration-none"
              >
                <motion.span
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.16, ease: appleEase }}
                  style={{ display: 'inline-block' }}
                >
                  <Badge
                    bg={tag.color || 'secondary'}
                    className="tag-badge"
                    style={{
                      fontSize: '1rem',
                      padding: '0.6em 1em',
                      cursor: 'pointer',
                    }}
                  >
                    {iconClass && (
                      <i className={`${iconClass} me-2 ${textColor}`}></i>
                    )}
                    <span className={textColor}>{i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name}</span>
                  </Badge>
                </motion.span>
              </Link>
            );
          })}
        </motion.div>

        {/* Ver todas */}
        <div className="text-center">
          <Link to="/explorar" className="btn btn-outline-primary" style={{ minHeight: '44px', display: 'inline-flex', alignItems: 'center' }}>
            <i className="fas fa-search me-2"></i>
            {t('tag.explore_by_tags')}
          </Link>
        </div>
      </Container>

      {/* Keep skeleton styles only; hover replaced by motion */}
    </section>
  );
}
