import type { ReactElement } from 'react';
import { Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound(): ReactElement {
  const { t } = useTranslation();
  return (
    <Container className="mt-5 text-center">
      <h1 className="display-1">404</h1>
      <h2>{t('common.page_not_found_title')}</h2>
      <p className="lead mb-4">
        {t('common.page_not_found_desc')}
      </p>
      <Button variant="primary" as={Link as any} to="/">
        {t('common.back_home')}
      </Button>
    </Container>
  );
}
