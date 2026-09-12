import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { motion, AnimatePresence } from 'motion/react';
import { fadeIn, defaultTransition, appleEase } from '../lib/animations';
import { useTranslation } from 'react-i18next';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useAuth } from '../contexts/AuthContext';

interface ParsedFaqItem {
  id: string;
  question: string;
  answerHtml: string;
  answerText: string;
}

interface PageData {
  id: string | number;
  title: string;
  slug: string;
  content: string;
}

const Faq: React.FC = () => {
  const location = useLocation();
  const { t, i18n, ready } = useTranslation();
  const { isAuthenticated, user } = useAuth();

  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});

  // Cargar contenido de la página desde Laravel vía GraphQL
  useEffect(() => {
    if (!ready) return;

    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      const raw = location.pathname.slice(1).toLowerCase();
      const lang = (i18n.language || 'es').split('-')[0];

      // Determinar slug preferido y fallback
      const isEnglish = lang === 'en' || raw === 'faqs';
      const preferredSlug = isEnglish ? 'faqs' : 'preguntas-frecuentes';
      const fallbackSlug = isEnglish ? 'preguntas-frecuentes' : 'faqs';

      try {
        let pageResult: PageData | null = null;

        // 1. Intentar con el slug preferido
        try {
          const resp = await graphqlRequest({
            query: `
              query PageBySlug($slug: String!) {
                page(slug: $slug) {
                  id
                  title
                  slug
                  content
                }
              }
            `,
            variables: { slug: preferredSlug },
            schema: 'public',
          });
          if (resp?.page) {
            pageResult = resp.page;
          }
        } catch {
          // Intentar fallback
        }

        // 2. Si no se encontró, probar fallback
        if (!pageResult) {
          const resp2 = await graphqlRequest({
            query: `
              query PageBySlug($slug: String!) {
                page(slug: $slug) {
                  id
                  title
                  slug
                  content
                }
              }
            `,
            variables: { slug: fallbackSlug },
            schema: 'public',
          });
          pageResult = resp2?.page ?? null;
        }

        setPageData(pageResult);
      } catch (err: any) {
        setError(err.message || t('home.error_loading_page'));
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [location.pathname, i18n.language, ready]);

  // Parsear el HTML del backend en preguntas y respuestas estructuradas
  const parsedFaqs = useMemo<ParsedFaqItem[]>(() => {
    if (!pageData?.content) return [];

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(pageData.content, 'text/html');

      // Buscar encabezados que actúen como preguntas (h2, h3, dt, summary)
      const headingElements = Array.from(doc.body.querySelectorAll('h2, h3, dt, summary'));

      if (headingElements.length === 0) {
        return [];
      }

      const items: ParsedFaqItem[] = [];

      headingElements.forEach((heading, index) => {
        const questionText = heading.textContent?.trim() || '';
        if (!questionText) return;

        // Recolectar todos los elementos hermanos hasta el próximo encabezado
        const answerNodes: string[] = [];
        let sibling = heading.nextElementSibling;

        while (sibling && !['H2', 'H3', 'DT', 'SUMMARY'].includes(sibling.tagName)) {
          answerNodes.push(sibling.outerHTML);
          sibling = sibling.nextElementSibling;
        }

        const answerHtml = answerNodes.join('') || '<p></p>';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = answerHtml;
        const answerText = tempDiv.textContent?.trim() || '';

        items.push({
          id: `faq-item-${index}`,
          question: questionText,
          answerHtml,
          answerText,
        });
      });

      return items;
    } catch {
      return [];
    }
  }, [pageData?.content]);

  // Abrir la primera pregunta por defecto cuando cargan los datos
  useEffect(() => {
    if (parsedFaqs.length > 0 && Object.keys(openItems).length === 0) {
      setOpenItems({ [parsedFaqs[0].id]: true });
    }
  }, [parsedFaqs]);

  // Alternar apertura de acordeón
  const toggleItem = (id: string) => {
    setOpenItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Filtrar según el buscador en vivo
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return parsedFaqs;

    return parsedFaqs.filter(item => {
      const matchQ = item.question.toLowerCase().includes(q);
      const matchA = item.answerText.toLowerCase().includes(q);
      return matchQ || matchA;
    });
  }, [parsedFaqs, searchQuery]);

  // Estado de Carga
  if (loading) {
    return (
      <div className="faq-page-wrapper">
        <Container className="text-center py-5">
          <div className="faq-apple-card d-inline-flex align-items-center gap-3 p-4">
            <Spinner animation="border" variant="primary" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-muted fw-medium">{t('common.loading', 'Cargando...')}</span>
          </div>
        </Container>
      </div>
    );
  }

  // Estado de Error
  if (error) {
    return (
      <div className="faq-page-wrapper">
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

  const pageTitle = pageData?.title || t('faqs.title');

  return (
    <div className="faq-page-wrapper">
      <Container>
        <motion.div
          initial="initial"
          animate="animate"
          variants={fadeIn}
          transition={defaultTransition}
        >
          {/* Hero Editorial Apple HIG */}
          <div className="faq-hero">
            <span className="faq-kicker">
              <i className="fas fa-circle-question" aria-hidden="true"></i> {t('faqs.kicker')}
            </span>
            <h1 className="faq-title">{pageTitle}</h1>
            <p className="faq-subtitle">{t('faqs.subtitle')}</p>

            {/* Buscador Interactivo en Tiempo Real (si hay preguntas parseadas) */}
            {parsedFaqs.length > 0 && (
              <div className="faq-search-wrapper">
                <i className="fas fa-search faq-search-icon" aria-hidden="true"></i>
                <input
                  type="text"
                  className="faq-search-input"
                  placeholder={t('faqs.search_placeholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  aria-label={t('faqs.search_placeholder')}
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="faq-search-clear"
                    onClick={() => setSearchQuery('')}
                    aria-label={t('faqs.clear_search')}
                  >
                    <i className="fas fa-xmark"></i>
                  </button>
                )}
              </div>
            )}
          </div>

          <Row className="justify-content-center">
            <Col lg={10} xl={9}>
              {/* Acordeón Principal en Tarjeta Squircle Liquid Glass */}
              <div className="faq-apple-card">
                {parsedFaqs.length > 0 ? (
                  filteredFaqs.length > 0 ? (
                    filteredFaqs.map(item => {
                      const isOpen = !!openItems[item.id];

                      return (
                        <div key={item.id} className="faq-item">
                          <button
                            type="button"
                            className={`faq-question-btn ${isOpen ? 'expanded' : ''}`}
                            onClick={() => toggleItem(item.id)}
                            aria-expanded={isOpen}
                          >
                            <span className="faq-question-text">
                              {item.question}
                            </span>
                            <i className="fas fa-chevron-down faq-chevron" aria-hidden="true"></i>
                          </button>

                          <AnimatePresence initial={false}>
                            {isOpen && (
                              <motion.div
                                key="content"
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.22, ease: appleEase }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div className="faq-answer-wrapper">
                                  <div
                                    className="faq-answer-content"
                                    dangerouslySetInnerHTML={{ __html: item.answerHtml }}
                                  />
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })
                  ) : (
                    <div className="faq-empty-state">
                      <i className="fas fa-circle-info faq-empty-icon" aria-hidden="true"></i>
                      <h3 className="faq-empty-title">{t('faqs.no_results_title')}</h3>
                      <p className="faq-empty-desc">{t('faqs.no_results_desc')}</p>
                      <button
                        type="button"
                        className="faq-empty-btn"
                        onClick={() => setSearchQuery('')}
                      >
                        <i className="fas fa-rotate-left"></i>
                        <span>{t('faqs.reset_filter')}</span>
                      </button>
                    </div>
                  )
                ) : (
                  /* Renderizado directo del contenido HTML del backend si no tiene estructura h2/h3 */
                  <div
                    className="faq-raw-container"
                    dangerouslySetInnerHTML={{ __html: pageData?.content || `<p>${t('home.content_unavailable')}</p>` }}
                  />
                )}
              </div>

              {/* Tarjeta Inferior de Asistencia y Contacto */}
              <div className="faq-cta-card">
                <div className="faq-cta-icon">
                  <i className="fas fa-comments" aria-hidden="true"></i>
                </div>
                <h3 className="faq-cta-title">{t('faqs.cta_title')}</h3>
                <p className="faq-cta-desc">{t('faqs.cta_desc')}</p>
                <div className="faq-cta-actions">
                  <Link to="/contacto" className="faq-cta-btn-primary">
                    <i className="fas fa-paper-plane" aria-hidden="true"></i>
                    <span>{t('faqs.contact_btn')}</span>
                  </Link>

                  {isAuthenticated && user?.email_verified_at ? (
                    <Link to="/tickets/nuevo" className="faq-cta-btn-secondary">
                      <i className="fas fa-ticket" aria-hidden="true"></i>
                      <span>{t('faqs.tickets_btn')}</span>
                    </Link>
                  ) : (
                    <Link to="/contacto" className="faq-cta-btn-secondary">
                      <i className="fas fa-headset" aria-hidden="true"></i>
                      <span>{t('contact.info_title')}</span>
                    </Link>
                  )}
                </div>
              </div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default Faq;
