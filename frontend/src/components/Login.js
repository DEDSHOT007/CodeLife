import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      setError('');
      setLoading(true);
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Failed to sign in: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell bg-gradient-dark">
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={6} sm={8} xs={12}>
            <div className="text-center mb-5 animate-slideIn">
              <p className="eyebrow mb-2">Welcome back</p>
              <h1 className="display-6 fw-bold mb-2 brand-gradient">CodeLife</h1>
              <p className="text-muted fs-6">Master cybersecurity through immersive, modern learning</p>
            </div>

            <Card className="card-glass border-0 shadow-lg animate-fadeIn">
              <Card.Body className="p-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                  <div>
                    <h2 className="h4 fw-bold mb-1">Welcome back</h2>
                    <p className="text-muted small mb-0">Sign in to continue your journey</p>
                  </div>
                  <span className="badge-pill">Secure login</span>
                </div>

                {error && (
                  <Alert variant="danger" className="mb-4 border-0" role="alert">
                    <strong>Error:</strong> {error}
                  </Alert>
                )}

                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label mb-2">Email Address</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="py-2"
                    />
                  </Form.Group>

                  <Form.Group className="mb-4 position-relative">
                    <Form.Label className="form-label mb-2">Password</Form.Label>
                    <div className="position-relative">
                      <Form.Control
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="py-2 pe-5"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="btn btn-link position-absolute end-0 top-50 translate-middle-y text-muted"
                        style={{ textDecoration: 'none', border: 'none', background: 'none' }}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                      </button>
                    </div>
                  </Form.Group>

                  <Button className="btn-modern-primary w-100 py-2 mb-4" type="submit" disabled={loading}>
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </Form>

                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                  <span className="px-3 text-muted small">or</span>
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                </div>

                <p className="text-center text-muted mb-0 small">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary fw-bold text-decoration-none">
                    Sign Up
                  </Link>
                </p>
              </Card.Body>
            </Card>

            <p className="text-center text-muted mt-4 small">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
