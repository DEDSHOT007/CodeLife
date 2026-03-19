import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, Spinner, Badge, Alert, ProgressBar, Row, Col } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { sandboxApi as api } from '../services/sandboxApi';
import './SandboxLauncher.css';

const SandboxLauncher = () => {
    const { scenarioId } = useParams();
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // State management
    const [status, setStatus] = useState('idle'); // idle, launching, running, stopping, error
    const [scenario, setScenario] = useState(null);
    const [sandboxInfo, setSandboxInfo] = useState(null);
    const [error, setError] = useState(null);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(null);
    const [revealedHints, setRevealedHints] = useState({});

    // Load scenario details on mount
    useEffect(() => {
        loadScenarioDetails();
        checkExistingSandbox();
    }, [scenarioId]);

    // Update time remaining countdown
    useEffect(() => {
        if (sandboxInfo?.expires_at && status === 'running') {
            const interval = setInterval(() => {
                const now = new Date();
                const expires = new Date(sandboxInfo.expires_at);
                const remaining = Math.max(0, expires - now);
                setTimeRemaining(remaining);

                if (remaining === 0) {
                    handleSandboxExpired();
                }
            }, 1000);

            return () => clearInterval(interval);
        }
    }, [sandboxInfo, status]);

    const loadScenarioDetails = async () => {
        try {
            const data = await api.getScenarioDetails(scenarioId);
            setScenario(data);
        } catch (err) {
            console.error('Failed to load scenario:', err);
            setError('Failed to load scenario details');
        }
    };

    const checkExistingSandbox = async () => {
        try {
            const userId = currentUser?.uid;
            if (!userId) return;
            const activeSandboxes = await api.getUserSandboxes(userId);

            const existing = activeSandboxes?.sandboxes?.find(
                s => s.scenario_id === scenarioId && s.status === 'running'
            );

            if (existing) {
                setSandboxInfo(existing);
                setStatus('running');
            }
        } catch (err) {
            console.error('Failed to check existing sandboxes:', err);
        }
    };

    const launchSandbox = async () => {
        setStatus('launching');
        setError(null);
        setLoadingProgress(0);

        try {
            const userId = currentUser?.uid;
            if (!userId) {
                setError('You must be logged in to launch a sandbox.');
                setStatus('error');
                return;
            }

            const progressInterval = setInterval(() => {
                setLoadingProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return 90;
                    }
                    return prev + 10;
                });
            }, 500);

            const result = await api.startSandbox(userId, scenarioId);

            clearInterval(progressInterval);
            setLoadingProgress(100);

            setTimeout(() => {
                setSandboxInfo(result);
                setStatus('running');
            }, 2000);

        } catch (err) {
            console.error('Failed to launch sandbox:', err);
            setError(err.response?.data?.detail || err.message || 'Failed to launch sandbox environment');
            setStatus('error');
            setLoadingProgress(0);
        }
    };

    const stopSandbox = async () => {
        if (!sandboxInfo?.container_name) return;

        setStatus('stopping');
        try {
            await api.stopSandbox(sandboxInfo.container_name);
            setSandboxInfo(null);
            setStatus('idle');
            setTimeRemaining(null);
        } catch (err) {
            console.error('Failed to stop sandbox:', err);
            setError('Failed to stop sandbox. It will auto-cleanup on expiry.');
            setStatus('running');
        }
    };

    const extendTime = async () => {
        if (!sandboxInfo?.container_name) return;

        try {
            const result = await api.extendSandboxTime(sandboxInfo.container_name, 2);
            setSandboxInfo({ ...sandboxInfo, expires_at: result.expires_at });
        } catch (err) {
            console.error('Failed to extend time:', err);
            setError('Failed to extend sandbox time');
        }
    };

    const handleSandboxExpired = () => {
        setSandboxInfo(null);
        setStatus('idle');
        setTimeRemaining(null);
        setError('Sandbox session has expired. Please launch a new one.');
    };

    const toggleHint = (challengeId) => {
        setRevealedHints(prev => ({ ...prev, [challengeId]: !prev[challengeId] }));
    };

    const formatTimeRemaining = (ms) => {
        if (!ms) return '0h 0m';
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m ${seconds}s`;
    };

    const getDifficultyColor = (difficulty) => {
        const colors = {
            'beginner': 'success',
            'intermediate': 'warning',
            'advanced': 'danger',
            'beginner-intermediate': 'info',
            'beginner-advanced': 'primary'
        };
        return colors[difficulty] || 'secondary';
    };

    const getChallengeTypeIcon = (type) => {
        switch (type) {
            case 'flag':
                return <i className="bi bi-flag-fill challenge-type-flag me-1"></i>;
            case 'challenge':
                return <i className="bi bi-puzzle-fill challenge-type-challenge me-1"></i>;
            case 'tip':
                return <i className="bi bi-lightbulb-fill challenge-type-tip me-1"></i>;
            default:
                return <i className="bi bi-bookmark-fill text-secondary me-1"></i>;
        }
    };

    const getChallengeTypeLabel = (type) => {
        switch (type) {
            case 'flag': return 'Capture the Flag';
            case 'challenge': return 'Challenge';
            case 'tip': return 'Guided Tip';
            default: return 'Task';
        }
    };

    if (!scenario) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <div className="sandbox-launcher-container">
            {/* Header Section */}
            <Card className="mb-4">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <div className="d-flex align-items-center gap-3">
                        <Button
                            variant="outline-light"
                            size="sm"
                            onClick={() => navigate('/sandbox')}
                        >
                            ← Back to Sandbox Menu
                        </Button>
                        <h5 className="mb-0">
                            <i className="bi bi-shield-lock-fill me-2"></i>
                            {scenario.name}
                        </h5>
                    </div>
                    <Badge bg={getDifficultyColor(scenario.difficulty)}>
                        {scenario.difficulty}
                    </Badge>
                </Card.Header>

                <Card.Body>
                    <p className="text-muted mb-3">{scenario.description}</p>

                    <Row className="mb-3">
                        <Col md={4}>
                            <div className="d-flex align-items-center">
                                <i className="bi bi-clock me-2 text-primary"></i>
                                <span><strong>Duration:</strong> {scenario.estimated_time}</span>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex align-items-center">
                                <i className="bi bi-trophy me-2 text-warning"></i>
                                <span><strong>Challenges:</strong> {scenario.challenges?.length || 0}</span>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="d-flex align-items-center">
                                <i className="bi bi-tag me-2 text-success"></i>
                                <span><strong>Categories:</strong> {scenario.categories?.length || 0}</span>
                            </div>
                        </Col>
                    </Row>

                    {/* Categories Tags */}
                    <div className="d-flex flex-wrap gap-2 mb-3">
                        {scenario.categories?.map((cat, idx) => (
                            <Badge key={idx} bg="secondary" className="px-2 py-1">
                                {cat}
                            </Badge>
                        ))}
                    </div>

                    {/* Default Credentials (if applicable) */}
                    {scenario.default_credentials && (
                        <Alert variant="info" className="mb-0">
                            <strong>Default Credentials:</strong>
                            <br />
                            Username: <code>{scenario.default_credentials.username}</code>
                            <br />
                            Password: <code>{scenario.default_credentials.password}</code>
                        </Alert>
                    )}
                </Card.Body>
            </Card>

            {/* Challenges Section (when idle) */}
            {status === 'idle' && scenario.challenges?.length > 0 && (
                <Card className="mb-4">
                    <Card.Header>
                        <h5 className="mb-0">
                            <i className="bi bi-list-check me-2"></i>
                            Available Challenges ({scenario.challenges.length})
                        </h5>
                    </Card.Header>
                    <Card.Body>
                        {scenario.challenges.map((challenge, idx) => (
                            <div key={challenge.id} className="challenge-item border-start border-4 border-primary ps-3 mb-3">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                    <h6 className="mb-0">
                                        {getChallengeTypeIcon(challenge.type)}
                                        <span className="text-muted me-2">{idx + 1}.</span>
                                        {challenge.name}
                                    </h6>
                                    <div className="d-flex align-items-center gap-2">
                                        <span className="text-muted small">{getChallengeTypeLabel(challenge.type)}</span>
                                        <Badge bg={getDifficultyColor(challenge.difficulty)}>
                                            {challenge.difficulty}
                                        </Badge>
                                    </div>
                                </div>
                                <div
                                    className="hint-toggle small mt-1"
                                    onClick={() => toggleHint(challenge.id)}
                                >
                                    <i className={`bi ${revealedHints[challenge.id] ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                                    {revealedHints[challenge.id] ? 'Hide hint' : 'Reveal hint'}
                                </div>
                                {revealedHints[challenge.id] && (
                                    <p className="hint-text text-muted mb-0 mt-1 ms-2">
                                        <i className="bi bi-lightbulb text-warning me-1"></i>
                                        <small>{challenge.hint}</small>
                                    </p>
                                )}
                            </div>
                        ))}
                    </Card.Body>
                </Card>
            )}

            {/* Launch Button / Status Area */}
            <Card>
                <Card.Body className="p-0">
                    {/* IDLE STATE */}
                    {status === 'idle' && (
                        <div className="text-center p-5">
                            <i className="bi bi-rocket-takeoff text-primary" style={{ fontSize: '4rem' }}></i>
                            <h4 className="mt-3 mb-3">Ready to Start?</h4>
                            <p className="text-muted mb-4">
                                Launch your isolated sandbox environment to begin practicing
                            </p>
                            <Button
                                size="lg"
                                variant="primary"
                                onClick={launchSandbox}
                                className="px-5"
                            >
                                <i className="bi bi-play-fill me-2"></i>
                                Launch Environment
                            </Button>
                        </div>
                    )}

                    {/* LAUNCHING STATE */}
                    {status === 'launching' && (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="primary" style={{ width: '4rem', height: '4rem' }}>
                                <span className="visually-hidden">Loading...</span>
                            </Spinner>
                            <h4 className="mt-4 mb-3">Launching Sandbox...</h4>
                            <div className="px-5">
                                <ProgressBar
                                    now={loadingProgress}
                                    animated
                                    striped
                                    variant="primary"
                                    className="mb-2"
                                />
                                <p className="text-muted">
                                    {loadingProgress < 30 && 'Pulling Docker image...'}
                                    {loadingProgress >= 30 && loadingProgress < 60 && 'Creating container...'}
                                    {loadingProgress >= 60 && loadingProgress < 90 && 'Configuring environment...'}
                                    {loadingProgress >= 90 && 'Almost ready...'}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* RUNNING STATE */}
                    {status === 'running' && sandboxInfo && (
                        <>
                            {/* Control Bar */}
                            <div className="bg-success bg-gradient text-light p-3 d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-3">
                                    <Badge bg="light" text="dark" className="d-flex align-items-center gap-2">
                                        <span className="status-dot bg-success"></span>
                                        <span>Running</span>
                                    </Badge>
                                    {timeRemaining != null && (
                                        <span className={timeRemaining < 5 * 60 * 1000 ? 'time-warning' : ''}>
                                            <i className="bi bi-clock me-2"></i>
                                            Time Remaining: <strong>{formatTimeRemaining(timeRemaining)}</strong>
                                        </span>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    {timeRemaining && timeRemaining < 30 * 60 * 1000 && (
                                        <Button
                                            size="sm"
                                            variant="light"
                                            onClick={extendTime}
                                        >
                                            <i className="bi bi-plus-circle me-1"></i>
                                            Extend +2h
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={stopSandbox}
                                    >
                                        <i className="bi bi-stop-circle me-1"></i>
                                        Stop Sandbox
                                    </Button>
                                </div>
                            </div>

                            {/* Sandbox Access Info */}
                            <Alert variant="info" className="m-3 mb-0">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <strong>Access URL:</strong>{' '}
                                        <code>{sandboxInfo.access_url}</code>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline-info"
                                        onClick={() => window.open(sandboxInfo.access_url, '_blank')}
                                    >
                                        <i className="bi bi-box-arrow-up-right me-1"></i>
                                        Open in New Tab
                                    </Button>
                                </div>
                            </Alert>

                            {/* Split Layout: Iframe & Challenges */}
                            <Row className="m-0 mt-3" style={{ minHeight: '600px' }}>
                                {/* Iframe Column */}
                                <Col lg={scenario.challenges?.length ? 8 : 12} className="p-0">
                                    <div className="sandbox-iframe-container border-0 h-100 position-relative">
                                        <iframe
                                            src={sandboxInfo.access_url}
                                            title="Sandbox Environment"
                                            className="w-100 h-100 border-0"
                                            style={{ minHeight: '600px' }}
                                            sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
                                        />
                                    </div>
                                </Col>
                                
                                {/* Challenges Side-Panel */}
                                {scenario.challenges?.length > 0 && (
                                    <Col lg={4} className="p-0 challenges-panel">
                                        <div className="challenges-scroll p-3" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                            <h5 className="mb-1 d-flex align-items-center">
                                                <i className="bi bi-list-check me-2 text-info"></i>
                                                Active Challenges
                                            </h5>
                                            <p className="small mb-3" style={{ color: '#8b949e' }}>
                                                Complete these flags and tasks within the environment.
                                            </p>
                                            
                                            <>
                                                {scenario.challenges.map((challenge, idx) => (
                                                    <Card key={challenge.id} className="mb-3 border-start border-4 border-warning">
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-start mb-1">
                                                                <h6 className="mb-0 fw-bold" style={{ fontSize: '0.88rem' }}>
                                                                    {getChallengeTypeIcon(challenge.type)}
                                                                    {idx + 1}. {challenge.name}
                                                                </h6>
                                                                <Badge bg={getDifficultyColor(challenge.difficulty)} style={{ fontSize: '0.65rem' }}>
                                                                    {challenge.difficulty}
                                                                </Badge>
                                                            </div>

                                                            <small className="d-block mb-2" style={{ color: '#8b949e', fontSize: '0.72rem' }}>
                                                                {getChallengeTypeLabel(challenge.type)}
                                                            </small>

                                                            <div
                                                                className="hint-toggle small"
                                                                onClick={() => toggleHint(challenge.id)}
                                                            >
                                                                <i className={`bi ${revealedHints[challenge.id] ? 'bi-eye-slash' : 'bi-eye'} me-1`}></i>
                                                                {revealedHints[challenge.id] ? 'Hide hint' : 'Reveal hint'}
                                                            </div>

                                                            {revealedHints[challenge.id] && (
                                                                <div className="hint-text mt-2 p-2 rounded" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.8rem' }}>
                                                                    <i className="bi bi-lightbulb text-warning me-1"></i>
                                                                    {challenge.hint}
                                                                </div>
                                                            )}
                                                        </Card.Body>
                                                    </Card>
                                                ))}

                                                {/* Default Credentials Reminder */}
                                                {scenario.default_credentials && (
                                                    <Alert variant="dark" className="small border-0 shadow-sm mt-3" style={{ background: 'rgba(56,139,253,0.1)' }}>
                                                        <i className="bi bi-key-fill text-info me-2"></i>
                                                        <strong>Credentials:</strong>{' '}
                                                        <code>{scenario.default_credentials.username}</code> / <code>{scenario.default_credentials.password}</code>
                                                    </Alert>
                                                )}
                                            </>
                                        </div>
                                    </Col>
                                )}
                            </Row>
                        </>
                    )}

                    {/* STOPPING STATE */}
                    {status === 'stopping' && (
                        <div className="text-center p-5">
                            <Spinner animation="border" variant="danger">
                                <span className="visually-hidden">Stopping...</span>
                            </Spinner>
                            <h5 className="mt-3">Stopping sandbox...</h5>
                        </div>
                    )}

                    {/* ERROR STATE */}
                    {status === 'error' && (
                        <div className="p-4">
                            <Alert variant="danger">
                                <Alert.Heading>
                                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                                    Launch Failed
                                </Alert.Heading>
                                <p>{error}</p>
                                <hr />
                                <div className="d-flex justify-content-between">
                                    <p className="mb-0">
                                        Please try again or contact support if the issue persists.
                                    </p>
                                    <Button
                                        variant="outline-danger"
                                        size="sm"
                                        onClick={() => {
                                            setStatus('idle');
                                            setError(null);
                                        }}
                                    >
                                        Try Again
                                    </Button>
                                </div>
                            </Alert>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </div>
    );
};

export default SandboxLauncher;
