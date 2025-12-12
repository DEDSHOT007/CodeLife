import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, Button, Alert, Spinner, ProgressBar } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    async function loadData() {
      try {
        const [profileData, progressData] = await Promise.all([api.getUserProfile(), api.getUserProgress()]);
        setProfile(profileData);
        setProgress(progressData);
      } catch (err) {
        setError('Failed to load data: ' + err.message);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      setError('Failed to log out');
    }
  }

  const progressPercentage = useMemo(() => Math.round(progress?.progress_percentage ?? 0), [progress]);
  const lessonsCompleted = progress?.lessons_completed ?? progress?.courses_completed ?? 0;
  const userInitial = profile?.email?.charAt(0)?.toUpperCase() ?? 'C';
  const userHandle = profile?.email?.split('@')[0] ?? 'explorer';

  const statCards = [
    {
      id: 'courses',
      label: 'Courses completed',
      value: progress?.courses_completed ?? 0,
      delta: '+ Keep exploring new paths',
      accent: 'stat-card--blue',
    },
    {
      id: 'labs',
      label: 'Labs conquered',
      value: progress?.labs_completed ?? 0,
      delta: 'Hands-on mastery',
      accent: 'stat-card--teal',
    },
    {
      id: 'lessons',
      label: 'Lessons finished',
      value: lessonsCompleted,
      delta: 'Consistency is paying off',
      accent: 'stat-card--sunset',
    },
  ];

  const quickActions = [
    {
      id: 'learning-hub',
      icon: '📚',
      label: 'Learning Hub',
      desc: 'Curated courses & guided tracks',
      route: '/learning-hub',
    },
    {
      id: 'progress',
      icon: '📈',
      label: 'My Progress',
      desc: 'Visualize streaks and milestones',
      route: '/progress',
    },
    {
      id: 'courses',
      icon: '🗂️',
      label: 'My Courses',
      desc: 'Resume where you left off',
      route: '/my-courses',
    },
    {
      id: 'pentest',
      icon: '🛡️',
      label: 'Pentesting Toolkit',
      desc: 'Run specialized security scans',
      route: '/pentesting',
    },
    {
      id: 'threats',
      icon: '⚠️',
      label: 'Threat Intelligence',
      desc: 'Monitor OSINT feeds & threat data',
      route: '/threats',
    },
  ];

  const focusAreas = [
    {
      id: 'cloud',
      title: 'Cloud defense lab',
      detail: 'Strengthen posture with IAM drills',
      tag: 'New drop',
    },
    {
      id: 'blue-team',
      title: 'Blue team sprint',
      detail: 'Triage simulated incidents in 15 min',
      tag: 'Live',
    },
    {
      id: 'tooling',
      title: 'Automation toolkit',
      detail: 'Wire up scripts for faster audits',
      tag: 'Builder',
    },
  ];

  if (loading) {
    return (
      <div className="page-shell d-flex align-items-center justify-content-center">
        <div className="text-center">
          <Spinner animation="border" variant="light" className="mb-3" />
          <p className="text-muted">Calibrating your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="page-container">
        <header className="glass-nav d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <p className="mb-1 text-muted small">CodeLife Control Center</p>
            <h1 className="h4 mb-0 brand-gradient fw-bold">CodeLife</h1>
          </div>
          <div className="d-flex flex-wrap gap-2">
            <Button className="btn-modern-secondary" onClick={() => navigate('/learning-hub')}>
              Explore Learning Hub
            </Button>
            <Button className="btn-modern-primary" onClick={handleLogout}>
              Log out
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="danger" className="mb-4 animate-slideIn" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <section className="surface-blur hero-panel mb-4 animate-slideIn">
          <div className="flex-grow-1">
            <p className="eyebrow">Mission dashboard</p>
            <h2 className="page-title">Welcome back, {userHandle}</h2>
            <p className="page-subtitle">
              Keep the momentum going with fresh labs, guided defensive playbooks, and live pentesting utilities.
            </p>
            <div className="d-flex flex-wrap gap-3 mt-4">
              <Button className="btn-modern-primary" onClick={() => navigate('/learning-hub')}>
                Continue learning
              </Button>
              <Button className="btn-modern-secondary" onClick={() => navigate('/pentesting')}>
                Launch toolkit
              </Button>
            </div>
          </div>

          <div className="hero-progress surface-soft">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div>
                <p className="text-muted small mb-1">Overall progress</p>
                <h3 className="mb-0">{progressPercentage}%</h3>
              </div>
              <span className="badge-pill">Goal · 80%</span>
            </div>
            <ProgressBar
              now={progressPercentage}
              variant="info"
              style={{ height: '10px', borderRadius: '999px' }}
            />
            <div className="d-flex justify-content-between mt-3 text-muted small">
              <span>{progress?.courses_completed ?? 0} courses</span>
              <span>{progress?.labs_completed ?? 0} labs</span>
            </div>
          </div>
        </section>

        <section className="stat-grid mb-5">
          {statCards.map((stat) => (
            <div key={stat.id} className={`stat-card ${stat.accent} animate-fadeIn`}>
              <p className="stat-card__label mb-2 text-uppercase">{stat.label}</p>
              <p className="stat-card__value mb-2">{stat.value}</p>
              <p className="stat-card__delta mb-0">{stat.delta}</p>
            </div>
          ))}
        </section>

        <Row className="g-4 mb-4">
          <Col lg={5}>
            <Card className="card-glass border-0 h-100 animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  <div
                    className="surface-soft d-flex align-items-center justify-content-center"
                    style={{ width: 64, height: 64, borderRadius: '50%', fontSize: '1.5rem', fontWeight: 600 }}
                  >
                    {userInitial}
                  </div>
                  <div>
                    <p className="text-muted small mb-1">Signed in as</p>
                    <h5 className="mb-1">{profile?.email}</h5>
                    <span className={`badge ${profile?.email_verified ? 'bg-success' : 'bg-warning text-dark'}`}>
                      {profile?.email_verified ? 'Verified identity' : 'Verify your email'}
                    </span>
                  </div>
                </div>

                <div className="list-tile">
                  <div>
                    <p className="text-muted small mb-1">Email</p>
                    <p className="mb-0">{profile?.email}</p>
                  </div>
                </div>
                <div className="list-tile mt-3">
                  <div className="me-3">
                    <p className="text-muted small mb-1">User ID</p>
                    <p className="mb-0" style={{ wordBreak: 'break-all' }}>
                      {profile?.uid}
                    </p>
                  </div>
                </div>

                <Button className="btn-modern-secondary mt-4 w-100" onClick={() => navigate('/my-courses')}>
                  Manage enrolled courses
                </Button>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={7}>
            <Card className="card-glass border-0 h-100 animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <p className="section-label mb-1">Snapshot</p>
                    <h5 className="section-title mb-0">Learning momentum</h5>
                  </div>
                  <Button variant="link" className="btn-modern-ghost p-0 text-muted" onClick={() => navigate('/progress')}>
                    View detailed stats →
                  </Button>
                </div>
                <Row className="g-3">
                  <Col md={6}>
                    <div className="surface-card p-3 h-100">
                      <p className="text-muted small mb-1">Courses completed</p>
                      <h3 className="mb-0">{progress?.courses_completed ?? 0}</h3>
                      <small className="text-muted">Foundation locked in</small>
                    </div>
                  </Col>
                  <Col md={6}>
                    <div className="surface-card p-3 h-100">
                      <p className="text-muted small mb-1">Labs completed</p>
                      <h3 className="mb-0">{progress?.labs_completed ?? 0}</h3>
                      <small className="text-muted">Hands-on practice</small>
                    </div>
                  </Col>
                </Row>
                <div className="surface-soft p-3 rounded-4 mt-3">
                  <p className="text-muted small mb-1">Next checkpoint</p>
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <h4 className="mb-0">{Math.max(4, (progress?.courses_completed ?? 0) + 1)} courses</h4>
                      <small className="text-muted">Unlock the Strategy badge</small>
                    </div>
                    <Button className="btn-modern-primary" onClick={() => navigate('/learning-hub')}>
                      Start a course
                    </Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row className="g-4">
          <Col xl={8}>
            <Card className="card-glass border-0 animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div>
                    <p className="section-label mb-1">Quick actions</p>
                    <h5 className="section-title mb-0">Jump back into flow</h5>
                  </div>
                </div>
                <div className="quick-link-grid">
                  {quickActions.map((action) => (
                    <button
                      type="button"
                      key={action.id}
                      className="quick-link-card"
                      onClick={() => navigate(action.route)}
                    >
                      <div className="quick-link-card__icon">{action.icon}</div>
                      <p className="quick-link-card__label">{action.label}</p>
                      <p className="quick-link-card__desc mb-0">{action.desc}</p>
                    </button>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col xl={4}>
            <Card className="card-glass border-0 h-100 animate-fadeIn">
              <Card.Body className="p-4">
                <p className="section-label mb-1">Focus cues</p>
                <h5 className="section-title mb-4">What to tackle next</h5>
                {focusAreas.map((item) => (
                  <div key={item.id} className="surface-card p-3 mb-3">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <p className="mb-1 fw-semibold">{item.title}</p>
                        <small className="text-muted">{item.detail}</small>
                      </div>
                      <span className="badge-pill">{item.tag}</span>
                    </div>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}
