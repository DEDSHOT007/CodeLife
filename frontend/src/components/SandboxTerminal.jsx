import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Button, Spinner, Badge, Alert } from 'react-bootstrap';
import { api } from '../services/api';
import './SandboxTerminal.css'; // Create this css file next

const SandboxTerminal = ({ labId: propLabId }) => {
    const { labId: routeLabId } = useParams();
    const labId = propLabId || routeLabId;
    const [status, setStatus] = useState('idle'); // idle, starting, running, error
    const [containerInfo, setContainerInfo] = useState(null);
    const [error, setError] = useState(null);
    const iframeRef = useRef(null);

    useEffect(() => {
        checkServiceStatus();
    }, []);

    const checkServiceStatus = async () => {
        try {
            const res = await api.getLabStatus();
            if (!res.available) {
                setError('Docker Sandbox Service is unavailable. Please ensure the backend has Docker access.');
                setStatus('unavailable');
            }
        } catch (err) {
            console.error("Failed to check status:", err);
            // Don't block UI on check failure, might be temporary
        }
    };

    const startLab = async () => {
        setStatus('starting');
        setError(null);
        try {
            const res = await api.startLab(labId);
            setContainerInfo(res);
            setStatus('running');
        } catch (err) {
            console.error("Failed to start lab:", err);
            setError(err.message || 'Failed to start lab environment.');
            setStatus('error');
        }
    };

    const stopLab = async () => {
        if (!containerInfo?.container_id) return;

        try {
            await api.stopLab(containerInfo.container_id);
            setContainerInfo(null);
            setStatus('idle');
        } catch (err) {
            console.error("Failed to stop lab:", err);
            setError('Failed to stop lab properly.');
        }
    };

    return (
        <Card className="sandbox-terminal-card h-100 shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center bg-dark text-light">
                <span>
                    <i className="bi bi-terminal-fill me-2"></i>
                    Cyber Sandbox: Lab {labId}
                </span>
                <div>
                    {status === 'running' && (
                        <Badge bg="success" className="me-2">Running</Badge>
                    )}
                    {status === 'unavailable' && (
                        <Badge bg="danger" className="me-2">Service Down</Badge>
                    )}

                    {status === 'idle' || status === 'error' ? (
                        <Button
                            size="sm"
                            variant="primary"
                            onClick={startLab}
                            disabled={status === 'unavailable'}
                        >
                            Start Lab
                        </Button>
                    ) : (
                        <Button
                            size="sm"
                            variant="danger"
                            onClick={stopLab}
                            disabled={status === 'starting'}
                        >
                            Stop Lab
                        </Button>
                    )}
                </div>
            </Card.Header>
            <Card.Body className="p-0 position-relative bg-black" style={{ minHeight: '400px' }}>
                {status === 'idle' && (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                        <i className="bi bi-pc-display" style={{ fontSize: '3rem' }}></i>
                        <p className="mt-3">Click 'Start Lab' to launch your isolated environment.</p>
                    </div>
                )}

                {status === 'starting' && (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 text-light">
                        <Spinner animation="border" role="status" variant="light">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                        <p className="mt-3">Provisioning Sandbox Container...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
                        <Alert variant="danger">
                            <Alert.Heading>Connection Failed</Alert.Heading>
                            <p>{error}</p>
                            <hr />
                            <p className="mb-0">
                                Please check if Docker is running on the server.
                            </p>
                        </Alert>
                    </div>
                )}

                {status === 'unavailable' && (
                    <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
                        <div className="text-center text-danger">
                            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem' }}></i>
                            <h5 className="mt-3">Sandbox Unavailable</h5>
                            <p className="text-muted">{error}</p>
                        </div>
                    </div>
                )}

                {status === 'running' && containerInfo && (
                    <iframe
                        src={containerInfo.url}
                        title="Terminal"
                        width="100%"
                        height="100%"
                        frameBorder="0"
                        className="terminal-frame"
                    />
                )}
            </Card.Body>
        </Card>
    );
};

export default SandboxTerminal;
