import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { Container, Badge, Spinner, Alert } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import type { Tag } from '../types';
import { useTranslation } from 'react-i18next';

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
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p className="text-muted mt-2">{t('common.loading')}</p>
      </div>
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
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
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
          transition={{ staggerChildren: 0.04 }}
        >
          {tags.map((tag) => {
            const iconClass = convertFA(tag.icon);
            const slug = String(tag.name).trim().toLowerCase().replace(/\s+/g, '-');
            return (
              <Link
                key={tag.id}
                to={`/t/${slug}`}
                className="text-decoration-none"
              >
                <motion.span
                  whileHover={{ scale: 1.06, y: -4, filter: 'brightness(1.1)' }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
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
                      <i className={`${iconClass} me-2`}></i>
                    )}
                    <span className="text-white">{i18n.language === 'en' && tag.name_en ? tag.name_en : tag.name}</span>
                  </Badge>
                </motion.span>
              </Link>
            );
          })}
        </motion.div>

        {/* Ver todas */}
        <div className="text-center">
          <Link to="/explorar" className="btn btn-outline-primary">
            <i className="fas fa-search me-2"></i>
            {t('tag.explore_by_tags')}
          </Link>
        </div>
      </Container>

      {/* Keep skeleton styles only; hover replaced by motion */}
    </section>
  );
}
