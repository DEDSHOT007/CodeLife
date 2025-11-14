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
    loadProgress();
  }, []);

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
      setProgress(data);
      
      // Mock achievements - replace with actual API call
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
    } catch (err) {
      setError('Failed to load progress: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-dark min-vh-100 py-5">
      <Container>
        {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

        <div className="mb-5 animate-slideIn">
          <h1 className="h2 fw-bold text-white mb-2">Your Progress</h1>
          <p className="text-muted">Track your learning journey</p>
        </div>

        {progress && (
          <>
            {/* Overall Stats */}
            <Row className="g-4 mb-5">
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center shadow-lg animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="text-primary fw-bold mb-2">{progress.courses_completed}</h3>
                    <p className="text-muted small mb-0">Courses Completed</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center shadow-lg animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="text-success fw-bold mb-2">{progress.lessons_completed}</h3>
                    <p className="text-muted small mb-0">Lessons Completed</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center shadow-lg animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="text-warning fw-bold mb-2">{progress.total_lessons}</h3>
                    <p className="text-muted small mb-0">Total Lessons</p>
                  </Card.Body>
                </Card>
              </Col>
              <Col lg={3} md={6}>
                <Card className="card-glass border-0 text-center shadow-lg animate-fadeIn">
                  <Card.Body className="p-4">
                    <h3 className="text-info fw-bold mb-2">{progress.progress_percentage}%</h3>
                    <p className="text-muted small mb-0">Overall Progress</p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Progress Bar */}
            <Card className="card-glass border-0 shadow-lg mb-5 animate-fadeIn">
              <Card.Body className="p-4">
                <h5 className="text-white fw-bold mb-3">Overall Progress</h5>
                <ProgressBar 
                  now={progress.progress_percentage}
                  label={`${progress.progress_percentage}%`}
                  style={{ height: '30px' }}
                />
              </Card.Body>
            </Card>

            {/* Achievements */}
            <div className="mb-5 animate-slideIn">
              <h4 className="text-white fw-bold mb-4">🏅 Achievements</h4>
              <Row className="g-4">
                {achievements.map(achievement => (
                  <Col lg={3} md={6} key={achievement.id}>
                    <Card 
                      className="card-glass border-0 h-100 text-center shadow-lg"
                      style={{ opacity: achievement.unlocked ? 1 : 0.5 }}
                    >
                      <Card.Body className="p-4">
                        <div style={{ fontSize: '48px', marginBottom: '10px' }}>
                          {achievement.icon}
                        </div>
                        <h6 className="text-white fw-bold mb-2">{achievement.title}</h6>
                        <p className="text-muted small mb-0">{achievement.description}</p>
                        {achievement.unlocked && (
                          <Badge bg="success" className="mt-3">Unlocked</Badge>
                        )}
                      </Card.Body>
                    </Card>
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
