import React from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Offline: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card className="text-center shadow">
            <Card.Body className="p-5">
              <div className="mb-4">
                <i className="fas fa-wifi-slash" style={{ fontSize: '5rem', color: '#dc3545' }}></i>
              </div>
              <h2 className="mb-3">{t('offline.title')}</h2>
              <p className="text-muted mb-4">
                {t('offline.description')}
              </p>
              <div className="d-flex gap-2 justify-content-center flex-wrap">
                <Button variant="primary" onClick={handleRetry}>
                  <i className="fas fa-sync me-2"></i>
                  {t('offline.retry')}
                </Button>
                <Button variant="outline-secondary" onClick={() => navigate('/')}>
                  <i className="fas fa-home me-2"></i>
                  {t('common.back_home')}
                </Button>
              </div>
              <hr className="my-4" />
              <small className="text-muted">
                <i className="fas fa-info-circle me-1"></i>
                {t('offline.recent_available')}
              </small>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Offline;
