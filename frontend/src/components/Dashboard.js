import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Navbar, Nav } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { currentUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, progressData] = await Promise.all([
          api.getUserProfile(),
          api.getUserProgress(),
        ]);
        setProfile(profileData);
        setProgress(progressData);
      } catch (error) {
        setError('Failed to load data: ' + error.message);
      }
      setLoading(false);
    }

    loadData();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      setError('Failed to log out');
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="primary" className="mb-3" />
          <p className="text-muted">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-dark min-vh-100">
      {/* Header/Navbar */}
      <Navbar bg="dark" expand="lg" className="border-bottom" style={{ borderColor: 'rgba(148, 163, 184, 0.2)' }}>
        <Container>
          <Navbar.Brand className="fw-bold" style={{ fontSize: '1.5rem' }}>
            <span style={{ background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)', backgroundClip: 'text', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              CodeLife
            </span>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="ms-auto">
              <Button variant="outline-primary" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <Container className="py-5">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" className="mb-4 animate-slideIn" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        {/* Welcome Section */}
        <div className="mb-5 animate-slideIn">
          <h2 className="h3 fw-bold text-white">Welcome, {profile?.email}!</h2>
          <p className="text-muted">Get ready to master cybersecurity through interactive learning</p>
        </div>

        {/* Profile and Progress Cards */}
        <Row className="g-4 mb-5">
          {/* User Profile Card */}
          <Col lg={6} md={12}>
            <Card className="card-glass border-0 h-100 shadow-lg animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '24px',
                      fontWeight: 'bold',
                      color: 'white',
                      marginRight: '15px',
                    }}
                  >
                    {profile?.email?.toUpperCase()}
                  </div>
                  <div>
                    <h5 className="text-white mb-0">Profile</h5>
                    <small className="text-muted">Your account information</small>
                  </div>
                </div>

                {profile && (
                  <div className="space-y-3">
                    <div className="p-3" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px' }}>
                      <small className="text-muted">Email</small>
                      <p className="text-white fw-500 mb-0">{profile.email}</p>
                    </div>
                    <div className="p-3" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px' }}>
                      <small className="text-muted">User ID</small>
                      <p className="text-white fw-500 mb-0" style={{ fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {profile.uid}
                      </p>
                    </div>
                    <div className="p-3" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px' }}>
                      <small className="text-muted">Email Verified</small>
                      <div className="mt-2">
                        <span
                          className={`badge ${profile.email_verified ? 'bg-success' : 'bg-warning'}`}
                        >
                          {profile.email_verified ? '✓ Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>

          {/* Learning Progress Card */}
          <Col lg={6} md={12}>
            <Card className="card-glass border-0 h-100 shadow-lg animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-4">
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                      marginRight: '15px',
                    }}
                  >
                    📊
                  </div>
                  <div>
                    <h5 className="text-white mb-0">Progress</h5>
                    <small className="text-muted">Your learning statistics</small>
                  </div>
                </div>

                {progress && (
                  <div className="space-y-3">
                    <div className="p-3" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px' }}>
                      <small className="text-muted">Courses Completed</small>
                      <p className="text-white fw-bold mb-0" style={{ fontSize: '28px' }}>
                        {progress.courses_completed}
                      </p>
                    </div>
                    <div className="p-3" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px' }}>
                      <small className="text-muted">Labs Completed</small>
                      <p className="text-white fw-bold mb-0" style={{ fontSize: '28px' }}>
                        {progress.labs_completed}
                      </p>
                    </div>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Card className="card-glass border-0 shadow-lg animate-fadeIn">
          <Card.Body className="p-4">
            <h5 className="text-white mb-4 fw-bold">Quick Actions</h5>
            <div className="mb-3 d-flex">
              <Button variant="primary" onClick={() => navigate('/learning-hub')}>
                📚 Learning Hub
              </Button>
              <Button variant="success" className="ms-2" onClick={() => navigate('/progress')}>
                📊 My Progress
              </Button>
              <Button variant="info" className="ms-2" onClick={() => navigate('/my-courses')}>
                📖 My Courses
              </Button>
            </div>
            <Row className="g-3">
              <Col md={4}>
                <div className="p-3 text-center" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s' }} 
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.4)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.2)'}>
                  <p className="text-muted small mb-2">Start Learning</p>
                  <p className="text-white fw-semibold mb-0">→ Browse Courses</p>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3 text-center" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.4)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.2)'}>
                  <p className="text-muted small mb-2">Practice Skills</p>
                  <p className="text-white fw-semibold mb-0">→ Launch Lab</p>
                </div>
              </Col>
              <Col md={4}>
                <div className="p-3 text-center" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)', borderRadius: '8px', cursor: 'pointer', transition: 'all 0.3s' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.4)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(71, 85, 105, 0.2)'}>
                  <p className="text-muted small mb-2">View Operations</p>
                  <p className="text-white fw-semibold mb-0">→ Live Feed</p>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
