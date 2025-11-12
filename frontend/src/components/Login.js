import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    } catch (error) {
      setError('Failed to sign in: ' + error.message);
    }
    setLoading(false);
  }

  return (
    <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Container>
        <Row className="justify-content-center">
          <Col lg={5} md={6} sm={8} xs={12}>
            {/* Header */}
            <div className="text-center mb-5 animate-slideIn">
              <h1 className="display-5 fw-bold mb-2">
                <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  CodeLife
                </span>
              </h1>
              <p className="text-muted fs-6">Master Cybersecurity Through Interactive Learning</p>
            </div>

            {/* Card */}
            <Card className="card-glass border-0 shadow-lg animate-fadeIn">
              <Card.Body className="p-5">
                <h2 className="h4 fw-bold mb-4 text-white">Welcome Back</h2>

                {/* Error Alert */}
                {error && (
                  <Alert variant="danger" className="mb-4 border-0" role="alert">
                    <strong>Error:</strong> {error}
                  </Alert>
                )}

                {/* Form */}
                <Form onSubmit={handleSubmit}>
                  {/* Email Field */}
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

                  {/* Password Field */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label mb-2">Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={loading}
                      className="py-2"
                    />
                  </Form.Group>

                  {/* Login Button */}
                  <Button
                    className="btn-gradient w-100 py-2 mb-4"
                    type="submit"
                    disabled={loading}
                  >
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

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                  <span className="px-3 text-muted small">or</span>
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                </div>

                {/* Sign Up Link */}
                <p className="text-center text-muted mb-0 small">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-primary fw-bold text-decoration-none">
                    Sign Up
                  </Link>
                </p>
              </Card.Body>
            </Card>

            {/* Footer */}
            <p className="text-center text-muted mt-4 small">
              By signing in, you agree to our Terms of Service and Privacy Policy
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
