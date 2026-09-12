import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import CafesWithReviews from '../components/CafesWithReviews';

export default function Cafes(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <Container className="apple-hero-container">
        <Row className="justify-content-center">
          <Col md={10} className="text-center">
            <span className="cafes-section-kicker">
              <i className="fas fa-compass me-1" aria-hidden="true"></i>
              {t('cafes.directory_kicker', 'Guía de Cafeterías')}
            </span>
            <h1 className="apple-hero-title mb-3">{t('cafes.title')}</h1>
            <p className="apple-hero-subtitle mb-4">{t('cafes.subtitle')}</p>
            <div>
              <Button
                as={Link}
                to="/sugerir-cafe"
                variant="primary"
                className="rounded-pill px-4 shadow-sm"
                style={{ minHeight: 'var(--size-touch-min)', display: 'inline-flex', alignItems: 'center' }}
              >
                <i className="fas fa-circle-plus me-2" aria-hidden="true"></i>
                {t('suggest.title')}
              </Button>
            </div>
          </Col>
        </Row>
      </Container>

      <CafesWithReviews
        limit={24}
        showFilters
        orderBy="featured"
        title={t('cafes.grid_title')}
        description={t('cafes.grid_desc')}
      />
    </>
  );
}
