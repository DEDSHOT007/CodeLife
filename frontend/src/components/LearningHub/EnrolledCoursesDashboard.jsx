import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { api } from '../../services/api';

export default function EnrolledCoursesDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadCourses() {
      try {
        const response = await api.getEnrolledCourses();
        setCourses(response.enrolled_courses || []);
      } catch (err) {
        setError('Failed to load courses: ' + err.message);
      }
      setLoading(false);
    }
    loadCourses();
  }, []);

  if (loading) {
    return (
      <div className="page-shell d-flex justify-content-center align-items-center">
        <Spinner animation="border" variant="light" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-shell">
        <Container className="page-container">
          <Alert variant="danger">{error}</Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <Container className="page-container">
        <div className="mb-4">
          <p className="section-label mb-2">Enrolled courses</p>
          <h2 className="page-title fs-3">Your personalized syllabus</h2>
          <p className="page-subtitle">Pick up where you left off and keep your streak alive.</p>
        </div>
        <Card className="card-glass border-0">
          <Card.Body className="p-4">
            {courses.length === 0 ? (
              <p className="text-muted mb-0">You are not enrolled in any courses yet.</p>
            ) : (
              <ListGroup variant="flush">
                {courses.map((course, index) => (
                  <ListGroup.Item key={index} className="bg-transparent">
                    <h5 className="mb-1">{course.title || course}</h5>
                    <p className="text-muted mb-0">{course.description || 'No description provided.'}</p>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
