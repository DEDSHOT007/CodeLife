import React, { useState, useEffect } from 'react';
import { Container, Card, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { api } from '../services/api';

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
      <div className="min-vh-100 d-flex justify-content-center align-items-center">
        <Spinner animation="border" />
      </div>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <h2 className="mb-4">My Enrolled Courses</h2>
      {courses.length === 0 ? (
        <p>You are not enrolled in any courses yet.</p>
      ) : (
        <ListGroup>
          {courses.map((course, index) => (
            <ListGroup.Item key={index}>
              <h5>{course.title || course}</h5>
              <p>{course.description || 'No description'}</p>
            </ListGroup.Item>
          ))}
        </ListGroup>
      )}
    </Container>
  );
}
