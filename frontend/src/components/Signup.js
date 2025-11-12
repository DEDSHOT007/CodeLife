import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Row, Col, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();

    if (password !== passwordConfirm) {
      return setError('Passwords do not match');
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      setError('');
      setLoading(true);
      await signup(email, password);
      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
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
              <p className="text-muted fs-6">Start Your Cybersecurity Journey</p>
            </div>

            {/* Card */}
            <Card className="card-glass border-0 shadow-lg animate-fadeIn">
              <Card.Body className="p-5">
                <h2 className="h4 fw-bold mb-4 text-white">Create Account</h2>

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
                    <small className="text-muted">At least 6 characters</small>
                  </Form.Group>

                  {/* Confirm Password Field */}
                  <Form.Group className="mb-4">
                    <Form.Label className="form-label mb-2">Confirm Password</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="••••••••"
                      value={passwordConfirm}
                      onChange={(e) => setPasswordConfirm(e.target.value)}
                      required
                      disabled={loading}
                      className="py-2"
                    />
                  </Form.Group>

                  {/* Signup Button */}
                  <Button
                    className="btn-gradient-purple w-100 py-2 mb-4"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Creating account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </Button>
                </Form>

                {/* Divider */}
                <div className="d-flex align-items-center my-4">
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                  <span className="px-3 text-muted small">or</span>
                  <hr className="flex-grow-1" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }} />
                </div>

                {/* Login Link */}
                <p className="text-center text-muted mb-0 small">
                  Already have an account?{' '}
                  <Link to="/login" className="text-primary fw-bold text-decoration-none">
                    Sign In
                  </Link>
                </p>
              </Card.Body>
            </Card>

            {/* Footer */}
            <p className="text-center text-muted mt-4 small">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
