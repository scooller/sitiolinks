import React from 'react';
import { Button, Col, Container, Row } from 'react-bootstrap';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import CafesWithReviews from '../components/CafesWithReviews';

export default function Cafes(): React.ReactElement {
  const { t } = useTranslation();

  return (
    <>
      <Container className="mt-5 mb-2">
        <Row className="justify-content-center">
          <Col md={8} className="text-center">
            <h1 className="mb-3">{t('cafes.title')}</h1>
            <p className="lead mb-0">{t('cafes.subtitle')}</p>
            <Button as={Link} to="/sugerir-cafe" variant="outline-primary" className="mt-3 rounded-pill">
              <i className="fas fa-circle-plus me-1"></i>
              {t('suggest.title')}
            </Button>
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
