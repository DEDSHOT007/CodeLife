import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, ProgressBar, Badge } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function CourseDetailsPage() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeLesson, setActiveLesson] = useState(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadCourseDetails();
  }, [courseId]);

  async function loadCourseDetails() {
    try {
      setLoading(true);
      const token = await currentUser.getIdToken();
      const response = await fetch(`http://localhost:8000/courses/${courseId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch course');
      
      const data = await response.json();
      setCourse(data);
      if (data.lessons && data.lessons.length > 0) {
        setActiveLesson(data.lessons);
      }
    } catch (err) {
      setError('Failed to load course: ' + err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLessonComplete(lessonId) {
    try {
      const token = await currentUser.getIdToken();
      const response = await fetch(
        `http://localhost:8000/courses/${courseId}/lessons/${lessonId}/complete`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) throw new Error('Failed to mark lesson complete');
      
      // Update UI
      setCourse(prev => ({
        ...prev,
        lessons: prev.lessons.map(l =>
          l.id === lessonId ? { ...l, completed: true } : l
        )
      }));
    } catch (err) {
      setError('Failed to complete lesson: ' + err.message);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center">
        <Spinner animation="border" variant="primary" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="bg-gradient-dark min-vh-100 p-5">
        <Alert variant="danger">Course not found</Alert>
      </div>
    );
  }

  const completedLessons = course.lessons.filter(l => l.completed).length;
  const completionPercentage = (completedLessons / course.lessons.length) * 100;

  return (
    <div className="bg-gradient-dark min-vh-100 py-5">
      <Container fluid>
        <Row className="g-4">
          {/* Sidebar - Lessons List */}
          <Col lg={3} md={4}>
            <Card className="card-glass border-0 sticky-top" style={{ top: '20px' }}>
              <Card.Body className="p-4">
                <h5 className="text-white fw-bold mb-3">Lessons</h5>
                <ProgressBar 
                  now={completionPercentage} 
                  label={`${Math.round(completionPercentage)}%`}
                  className="mb-4"
                />
                
                <div className="lessons-list" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                  {course.lessons.map((lesson, index) => (
                    <Card 
                      key={lesson.id}
                      className="mb-2 border-0"
                      style={{
                        backgroundColor: activeLesson?.id === lesson.id ? 'rgba(59, 130, 246, 0.3)' : 'rgba(71, 85, 105, 0.2)',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                      }}
                      onClick={() => setActiveLesson(lesson)}
                    >
                      <Card.Body className="p-3">
                        <div className="d-flex align-items-center">
                          <div className="flex-grow-1">
                            <small className="text-muted">Lesson {index + 1}</small>
                            <p className="text-white small fw-500 mb-0">{lesson.title}</p>
                          </div>
                          {lesson.completed && (
                            <Badge bg="success">✓</Badge>
                          )}
                        </div>
                      </Card.Body>
                    </Card>
                  ))}
                </div>
              </Card.Body>
            </Card>
          </Col>

          {/* Main Content - Lesson Details */}
          <Col lg={9} md={8}>
            {error && <Alert variant="danger" className="mb-4">{error}</Alert>}
            
            {activeLesson && (
              <Card className="card-glass border-0 shadow-lg animate-fadeIn">
                <Card.Body className="p-5">
                  {/* Lesson Header */}
                  <div className="mb-4">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h2 className="h3 text-white fw-bold mb-0">{activeLesson.title}</h2>
                      {activeLesson.completed && (
                        <Badge bg="success" className="ms-2">Completed</Badge>
                      )}
                    </div>
                    <div className="d-flex gap-3 text-muted small">
                      {activeLesson.duration_minutes && (
                        <span>⏱️ {activeLesson.duration_minutes} min</span>
                      )}
                    </div>
                  </div>

                  {/* Video */}
                  {activeLesson.video_url && (
                    <div className="mb-4">
                      <div style={{
                        position: 'relative',
                        paddingBottom: '56.25%',
                        height: 0,
                        overflow: 'hidden',
                        backgroundColor: '#000',
                        borderRadius: '8px'
                      }}>
                        <iframe
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            borderRadius: '8px'
                          }}
                          src={activeLesson.video_url}
                          title={activeLesson.title}
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Article Content */}
                  <div className="mb-4">
                    <h4 className="text-white mb-3">📖 Article</h4>
                    <div className="text-light" style={{ lineHeight: '1.8' }}>
                      {activeLesson.content}
                    </div>
                  </div>

                  {/* Quizzes Section */}
                  {activeLesson.quizzes && activeLesson.quizzes.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-white mb-3">📝 Quizzes</h4>
                      {activeLesson.quizzes.map((quiz, index) => (
                        <Card key={index} className="mb-3 border-0" style={{ backgroundColor: 'rgba(71, 85, 105, 0.2)' }}>
                          <Card.Body className="p-3">
                            <p className="text-light fw-500 mb-3">{quiz.question}</p>
                            <div>
                              {quiz.options.map((option, optIndex) => (
                                <div key={optIndex} className="form-check mb-2">
                                  <input 
                                    className="form-check-input" 
                                    type="radio" 
                                    name={`quiz_${index}`}
                                    id={`quiz_${index}_${optIndex}`}
                                  />
                                  <label className="form-check-label text-muted small" htmlFor={`quiz_${index}_${optIndex}`}>
                                    {option}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </Card.Body>
                        </Card>
                      ))}
                    </div>
                  )}

                  {/* Complete Button */}
                  <Button 
                    className={activeLesson.completed ? 'btn-secondary' : 'btn-gradient'}
                    size="lg"
                    onClick={() => handleLessonComplete(activeLesson.id)}
                    disabled={activeLesson.completed}
                  >
                    {activeLesson.completed ? '✓ Completed' : 'Mark as Complete'}
                  </Button>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      </Container>
    </div>
  );
}
