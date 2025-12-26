import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Login: React.FC = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [remember, setRemember] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as any;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password, remember);
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || t('auth.invalid_credentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} lg={5}>
          <Card>
            <Card.Body className="p-4">
              <h2 className="text-center mb-4">{t('auth.login_title')}</h2>
              {error && <Alert variant="danger">{error}</Alert>}
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="email">
                  <Form.Label>{t('auth.email')}</Form.Label>
                  <Form.Control type="email" placeholder={t('auth.email_placeholder')} value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="password">
                  <Form.Label>{t('auth.password')}</Form.Label>
                  <Form.Control type="password" placeholder={t('auth.password_placeholder')} value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                </Form.Group>
                <Form.Group className="mb-3" controlId="remember">
                  <Form.Check type="checkbox" label={t('auth.remember')} checked={remember} onChange={(e) => setRemember(e.target.checked)} disabled={loading} />
                </Form.Group>
                <Button variant="primary" type="submit" className="w-100" disabled={loading}>{loading ? t('auth.logging_in') : t('auth.login')}</Button>
                <div className="text-center mt-3"><p className="mb-0">{t('auth.no_account')} <Link to="/register">{t('auth.register_here')}</Link></p></div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Login;
