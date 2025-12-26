import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Container, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { useTranslation } from 'react-i18next';

type PageData = { id: string | number; title: string; content: string } | null;

const Page: React.FC = () => {
  const location = useLocation();
  const [pageContent, setPageContent] = useState<PageData>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const { t, i18n, ready } = useTranslation();

  useEffect(() => {
    if (!ready) {
      return;
    }
    const fetchPage = async () => {
      setLoading(true);
      setError(null);

      const raw = location.pathname.slice(1).toLowerCase();
      const table: Record<string, Record<string, string>> = {
        // Terms & Privacy
        'terminos-y-condiciones': { es: 'terminos-y-condiciones', en: 'terms-and-conditions' },
        'terms-and-conditions': { es: 'terminos-y-condiciones', en: 'terms-and-conditions' },
        'politica-de-privacidad': { es: 'politica-de-privacidad', en: 'privacy-policy' },
        'privacy-policy': { es: 'politica-de-privacidad', en: 'privacy-policy' },
        // FAQs
        'faqs': { es: 'preguntas-frecuentes', en: 'faqs' },
        'preguntas-frecuentes': { es: 'preguntas-frecuentes', en: 'faqs' },
      };
      const lang = (i18n.language || 'es').split('-')[0];
      const preferred = table[raw]?.[lang] || raw;
      const fallback = table[raw]?.['es'] || raw;
      

      try {
        try {
          const response = await graphqlRequest({
            query: `
              query PageBySlug($slug: String!) {
                page(slug: $slug) { id title slug content }
              }
            `,
            variables: { slug: preferred },
            schema: 'public',
          });
          if (response.page) {
            setPageContent(response.page);
            return;
          }
        } catch (e) {
          
        }

        try {
          const resp2 = await graphqlRequest({
            query: `
              query PageBySlug($slug: String!) {
                page(slug: $slug) { id title slug content }
              }
            `,
            variables: { slug: fallback },
            schema: 'public',
          });
          setPageContent(resp2.page ?? null);
        } catch (err2: any) {
          setError(err2.message || t('home.error_loading_page'));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [location.pathname, ready]);

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" variant="primary" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="mt-5 mb-5">
      <Row className="justify-content-center">
        <Col lg={10} xl={8}>
          <div
            className="page-content"
            dangerouslySetInnerHTML={{ __html: pageContent?.content || `<p>${t('home.content_unavailable')}</p>` }}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Page;
