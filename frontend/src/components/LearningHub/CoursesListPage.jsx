import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CoursesListPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function fetchCourses() {
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
        if (isMounted) {
          setCourses(data);
        }
      } catch (err) {
        if (isMounted) {
          setError('Failed to load courses: ' + err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    if (currentUser) {
      fetchCourses();
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
          <p className="section-label mb-2">Learning hub</p>
          <h1 className="page-title fs-2">Curated cybersecurity tracks</h1>
          <p className="page-subtitle">Pick a path and dive into structured, hands-on lessons.</p>
        </div>

        {courses.length === 0 ? (
          <Alert variant="info">No courses available</Alert>
        ) : (
          <Row className="g-4">
            {courses.map(course => (
              <Col lg={4} md={6} sm={12} key={course.id}>
                <Card className="card-glass border-0 h-100 animate-fadeIn">
                  {course.thumbnail_url && (
                    <Card.Img
                      variant="top"
                      src={course.thumbnail_url}
                      className="course-card-img"
                    />
                  )}
                  <Card.Body className="course-card-body">
                    <Card.Title className="fw-bold mb-2">{course.title}</Card.Title>
                    <Card.Text className="text-muted mb-3">{course.description}</Card.Text>

                    <div className="d-flex flex-wrap gap-2 mb-3">
                      <span className={`badge ${
                        course.difficulty === 'Beginner' ? 'bg-success' :
                        course.difficulty === 'Intermediate' ? 'bg-warning text-dark' :
                        'bg-danger'
                      }`}>
                        {course.difficulty}
                      </span>
                      <span className="badge bg-secondary">{course.lesson_count} lessons</span>
                    </div>

                    <Button
                      className="btn-modern-primary w-100"
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
