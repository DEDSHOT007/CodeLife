import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, Alert, Spinner,Badge} from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';

export default function ProgressTrackingPage() {
  const [progress, setProgress] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  useEffect(() => {
    let isMounted = true;

    async function loadProgress() {
      try {
        setLoading(true);
        const token = await currentUser.getIdToken();

        const response = await fetch('http://localhost:8000/courses/progress/summary', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch progress');

        const data = await response.json();
        if (isMounted) {
          setProgress(data);
          setAchievements([
            {
              id: 1,
              title: 'First Steps',
              description: 'Complete your first lesson',
              icon: '🎯',
              unlocked: data.lessons_completed >= 1
            },
            {
              id: 2,
              title: 'Learning Enthusiast',
              description: 'Complete 5 lessons',
              icon: '⭐',
              unlocked: data.lessons_completed >= 5
            },
            {
              id: 3,
              title: 'Course Master',
              description: 'Complete an entire course',
              icon: '🏆',
              unlocked: data.courses_completed >= 1
            },
            {
              id: 4,
              title: 'Knowledge Seeker',
              description: 'Complete 10 lessons',
              icon: '📚',
              unlocked: data.lessons_completed >= 10
            }
          ]);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load progress: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (currentUser) {
      loadProgress();
    }

    return () => {
      isMounted = false;
    };
  }, [currentUser]);

  if (loading) {
    return (
      <div className="page-shell d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Container className="page-container">
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <div className="mb-5 animate-slideIn">
          <p className="section-label mb-2">Progress</p>
          <h1 className="page-title fs-2">Your learning heartbeat</h1>
          <p className="page-subtitle">Track streaks, completed content, and upcoming milestones.</p>
        </div>

        {progress && (
          <>
            <Row className="g-4 mb-5">
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="fw-bold mb-2">{progress.courses_completed}</h3>
                    <p className="text-muted small mb-0">Courses Completed</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="fw-bold mb-2">{progress.lessons_completed}</h3>
                    <p className="text-muted small mb-0">Lessons Completed</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="fw-bold mb-2">{progress.total_lessons}</h3>
                    <p className="text-muted small mb-0">Total Lessons</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="fw-bold mb-2">{progress.progress_percentage}%</h3>
                    <p className="text-muted small mb-0">Overall Progress</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Card className="card-glass border-0 shadow-lg mb-5 animate-fadeIn">
              <Card.Body className="p-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div>
                    <p className="section-label mb-1">Overview</p>
                    <h5 className="section-title mb-0">Overall Progress</h5>
                  </div>
                  <span className="badge-pill">Aim for 80%</span>
                </div>
                <ProgressBar
                  now={progress.progress_percentage}
                  label={`${progress.progress_percentage}%`}
                  style={{ height: '24px', borderRadius: '999px' }}
                />
              </Card.Body>
            </Card>

            <div className="mb-5 animate-slideIn">
              <h4 className="section-title mb-4">🏅 Achievements</h4>
              <Row className="g-4">
                {achievements.map(achievement => (
                  <Col lg={3} md={6} key={achievement.id}>
                    <div className={`achievement-card ${achievement.unlocked ? '' : 'locked'}`}>
                      <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                        {achievement.icon}
                      </div>
                      <h6 className="fw-bold mb-2">{achievement.title}</h6>
                      <p className="text-muted small mb-0">{achievement.description}</p>
                      {achievement.unlocked && (
                        <Badge bg="success" className="mt-3">Unlocked</Badge>
                      )}
                    </div>
                  </Col>
                ))}
              </Row>
            </div>
          </>
        )}
      </Container>
    </div>
  );
}
