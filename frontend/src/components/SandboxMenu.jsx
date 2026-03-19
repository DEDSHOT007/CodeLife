import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Row, Col, Card, Badge, Spinner, Alert, Button } from 'react-bootstrap';
import { sandboxApi as api } from '../services/sandboxApi';
import './SandboxMenu.css';

const SandboxMenu = () => {
    const navigate = useNavigate();
    const [scenarios, setScenarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dockerStatus, setDockerStatus] = useState(null);

    useEffect(() => {
        loadScenarios();
        checkHealth();
    }, []);

    const loadScenarios = async () => {
        try {
            setLoading(true);
            const data = await api.getScenarios();
            setScenarios(data?.scenarios || []);
        } catch (err) {
            console.error('Failed to load scenarios:', err);
            setError('Failed to load available sandboxes. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    const checkHealth = async () => {
        try {
            const health = await api.checkHealth();
            setDockerStatus(health?.docker || 'unknown');
        } catch {
            setDockerStatus('unavailable');
        }
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger',
            'beginner-intermediate': 'info',
            'beginner-advanced': 'primary'
        };
        return colors[difficulty?.toLowerCase()] || 'secondary';
    };

    const getScenarioIcon = (scenarioId) => {
        const icons = {
            'juice-shop': 'bi-cup-straw',
            'dvwa': 'bi-shield-exclamation'
        };
        return icons[scenarioId] || 'bi-box-seam';
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="sandbox-menu-container page-shell">
            <div className="d-flex justify-content-between align-items-start mb-4">
                <div>
                    <h2 className="page-title mb-2">Cyber Sandbox</h2>
                    <p className="page-subtitle mb-0">
                        Launch isolated vulnerable environments and practice real-world penetration testing.
                    </p>
                </div>
                <Button
                    variant="outline-light"
                    size="sm"
                    onClick={() => navigate('/dashboard')}
                >
                    ← Dashboard
                </Button>
            </div>

            {dockerStatus === 'unavailable' && (
                <Alert variant="warning" className="mb-4 d-flex align-items-center gap-2">
                    <i className="bi bi-exclamation-triangle-fill"></i>
                    <div>
                        <strong>Docker is not running.</strong> You can browse scenarios, but launching will require Docker Desktop to be started.
                    </div>
                </Alert>
            )}

            {error && (
                <Alert variant="danger" className="mb-4" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {scenarios.length === 0 && !error && (
                <Alert variant="info" className="mb-4">
                    No scenarios available at this time.
                </Alert>
            )}

            <Row className="g-4">
                {scenarios.map((scenario) => (
                    <Col key={scenario.id} lg={6} xl={4}>
                        <Card
                            className="scenario-card h-100"
                            onClick={() => navigate(`/sandbox/scenario/${scenario.id}`)}
                        >
                            <Card.Body className="p-4 d-flex flex-column">
                                <div className="d-flex justify-content-between align-items-start mb-3">
                                    <div className="scenario-icon">
                                        <i className={`bi ${getScenarioIcon(scenario.id)}`}></i>
                                    </div>
                                    <Badge bg={getDifficultyColor(scenario.difficulty)}>
                                        {scenario.difficulty}
                                    </Badge>
                                </div>

                                <h4 className="card-title fw-bold mb-3 text-white">{scenario.name}</h4>
                                <p className="card-text text-muted mb-4">
                                    {scenario.description}
                                </p>

                                <div className="d-flex flex-wrap gap-2 mb-4">
                                    {scenario.categories?.slice(0, 3).map((cat, idx) => (
                                        <Badge key={idx} bg="dark" text="light" className="border border-secondary">
                                            {cat}
                                        </Badge>
                                    ))}
                                    {scenario.categories?.length > 3 && (
                                        <Badge bg="dark" text="light" className="border border-secondary">
                                            +{scenario.categories.length - 3} more
                                        </Badge>
                                    )}
                                </div>

                                <div className="d-flex justify-content-between align-items-center mt-auto border-top border-secondary pt-3">
                                    <span className="text-info small">
                                        <i className="bi bi-clock me-1"></i>
                                        {scenario.estimated_time}
                                    </span>
                                    <span className="text-warning small">
                                        <i className="bi bi-trophy me-1"></i>
                                        {scenario.challenges ?? 0} challenges
                                    </span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </div>
    );
};

export default SandboxMenu;
