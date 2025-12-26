import React, { type ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { graphqlRequest } from '../lib/graphql/graphqlRequest';
import { mutations } from '../lib/graphql/mutations';
import { useTranslation } from 'react-i18next';

interface CreateTicketResponse {
  createTicket: {
    id: string | number;
  };
}

export default function NewTicket(): ReactElement {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = React.useState({ subject: '', description: '', category: 'tecnico', priority: 'media' });
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>('');

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const variables = { user_id: Number(user?.id) || undefined, ...form };
      const data = await graphqlRequest<CreateTicketResponse>({ query: mutations.createTicket, variables, schema: 'public' });
      const id = data?.createTicket?.id;
      navigate(id ? `/tickets/${id}` : '/tickets');
    } catch (err: any) {
      setError(err?.message || t('tickets.error_creating'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container className="py-4">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <h2>
            <i className="fas fa-plus me-2" />
            {t('tickets.new')}
          </h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={onSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>{t('tickets.subject')}</Form.Label>
              <Form.Control name="subject" value={form.subject} onChange={onChange} required minLength={5} maxLength={150} />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>{t('tickets.description')}</Form.Label>
              <Form.Control as="textarea" rows={6} name="description" value={form.description} onChange={onChange} required minLength={10} maxLength={5000} />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('tickets.category')}</Form.Label>
                  <Form.Select name="category" value={form.category} onChange={onChange}>
                    <option value="tecnico">{t('tickets.categories.tecnico')}</option>
                    <option value="facturacion">{t('tickets.categories.facturacion')}</option>
                    <option value="cuenta">{t('tickets.categories.cuenta')}</option>
                    <option value="contenido">{t('tickets.categories.contenido')}</option>
                    <option value="otro">{t('tickets.categories.otro')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>{t('tickets.priority')}</Form.Label>
                  <Form.Select name="priority" value={form.priority} onChange={onChange}>
                    <option value="baja">{t('tickets.priority_labels.baja')}</option>
                    <option value="media">{t('tickets.priority_labels.media')}</option>
                    <option value="alta">{t('tickets.priority_labels.alta')}</option>
                    <option value="urgente">{t('tickets.priority_labels.urgente')}</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex gap-2">
              <Button type="submit" disabled={submitting}>
                {submitting ? t('common.creating') : t('tickets.create')}
              </Button>
              <Button variant="secondary" onClick={() => navigate('/tickets')} disabled={submitting}>
                {t('common.cancel')}
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}
