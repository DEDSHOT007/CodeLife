import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

export default function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch('http://localhost:8000/courses/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch courses');
      
      const data = await response.json();
      setCourses(data);
    } catch (err) {
      setError('Failed to load courses: ' + err.message);
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
          <h1 className="h2 fw-bold text-white mb-2">Learning Hub</h1>
          <p className="text-muted">Master cybersecurity through structured learning paths</p>
        </div>

        {courses.length === 0 ? (
          <Alert variant="info">No courses available</Alert>
        ) : (
          <Row className="g-4">
            {courses.map(course => (
              <Col lg={4} md={6} sm={12} key={course.id}>
                <Card className="card-glass border-0 h-100 shadow-lg animate-fadeIn" style={{ cursor: 'pointer', transition: 'transform 0.3s' }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  {course.thumbnail_url && (
                    <Card.Img 
                      variant="top" 
                      src={course.thumbnail_url}
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  )}
                  <Card.Body className="p-4">
                    <Card.Title className="text-white fw-bold mb-2">{course.title}</Card.Title>
                    <Card.Text className="text-muted mb-3">{course.description}</Card.Text>
                    
                    <div className="mb-3">
                      <span className={`badge ${
                        course.difficulty === 'Beginner' ? 'bg-success' :
                        course.difficulty === 'Intermediate' ? 'bg-warning' :
                        'bg-danger'
                      }`}>
                        {course.difficulty}
                      </span>
                      <span className="badge bg-secondary ms-2">{course.lesson_count} lessons</span>
                    </div>

                    <Button 
                      className="btn-gradient w-100"
                      onClick={() => navigate(`/learning-hub/course/${course.id}`)}
                    >
                      Start Course →
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Container>
    </div>
  );
}
