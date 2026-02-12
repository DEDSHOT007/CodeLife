import React, { useState } from 'react';
import { Row, Col, Card, Button, Form, Alert, ProgressBar, Badge, Spinner } from 'react-bootstrap';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const PhishingAnalyzer = () => {
    const [emailText, setEmailText] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleAnalyze = async (e) => {
        e.preventDefault();
        if (!emailText.trim()) return;

        setLoading(true);
        setError('');
        setResult(null);

        try {
            const data = await api.analyzePhishing({ email_text: emailText, strip_html: true });
            setResult(data);
        } catch (err) {
            setError(err.message || 'Analysis failed. Please check your connection.');
        } finally {
            setLoading(false);
        }
    };

    const getRiskColor = (level) => {
        switch (level) {
            case 'HIGH': return 'danger';
            case 'MEDIUM': return 'warning';
            case 'LOW': return 'success';
            default: return 'secondary';
        }
    };

    const getConfidenceVariant = (score) => {
        if (score > 0.7) return 'danger';
        if (score > 0.4) return 'warning';
        return 'success';
    };

    return (
        <div className="page-shell">
            <div className="page-container">
                <header className="glass-nav d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <p className="mb-1 text-muted small">AI Defense Labs</p>
                        <h1 className="h4 mb-0 brand-gradient f-bold">Phishing Analyzer</h1>
                    </div>
                    <Button className="btn-modern-secondary" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </header>

                {error && <Alert variant="danger" className="animate-slideIn" dismissible onClose={() => setError('')}>{error}</Alert>}

                <Row className="g-4">
                    {/* Input Panel */}
                    <Col lg={7}>
                        <Card className="card-glass border-0 h-100 animate-fadeIn">
                            <Card.Body className="p-4">
                                <div className="mb-4">
                                    <h5 className="section-title">Ingest Email Content</h5>
                                    <p className="text-muted small">Paste the full email body, subject, or suspicious URLs below for deep analysis.</p>
                                </div>
                                <Form onSubmit={handleAnalyze}>
                                    <Form.Group className="mb-3">
                                        <Form.Control
                                            as="textarea"
                                            rows={12}
                                            placeholder="Paste suspicious content here..."
                                            className="surface-soft border-0 text-light focus-none"
                                            value={emailText}
                                            onChange={(e) => setEmailText(e.target.value)}
                                            style={{ resize: 'none', borderRadius: '12px' }}
                                        />
                                    </Form.Group>
                                    <Button
                                        type="submit"
                                        className="btn-modern-primary w-100 py-3"
                                        disabled={loading || !emailText.trim()}
                                    >
                                        {loading ? (
                                            <>
                                                <Spinner animation="border" size="sm" className="me-2" />
                                                Analyzing with Ensemble AI...
                                            </>
                                        ) : (
                                            '🚀 Launch Analysis'
                                        )}
                                    </Button>
                                </Form>
                            </Card.Body>
                        </Card>
                    </Col>

                    {/* Results Panel */}
                    <Col lg={5}>
                        <Card className="card-glass border-0 h-100 animate-fadeIn">
                            <Card.Body className="p-4">
                                {!result && !loading ? (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
                                        <div className="surface-soft rounded-circle p-4 mb-3" style={{ fontSize: '2rem' }}>🕵️</div>
                                        <h6 className="text-muted">Awaiting Input</h6>
                                        <p className="small text-muted px-4">Submit content on the left to generate an intelligence report.</p>
                                    </div>
                                ) : loading ? (
                                    <div className="h-100 d-flex flex-column align-items-center justify-content-center text-center py-5">
                                        <Spinner animation="grow" variant="primary" className="mb-3" />
                                        <h6 className="brand-gradient">Running Inference</h6>
                                        <p className="small text-muted px-4">Parsing signals through DistilBERT, SVM, and Logistic Regression experts...</p>
                                    </div>
                                ) : (
                                    <div className="animate-slideIn">
                                        <div className="d-flex justify-content-between align-items-center mb-4">
                                            <h5 className="section-title mb-0">Risk Assessment</h5>
                                            <Badge bg={getRiskColor(result.risk_level)} className="px-3 py-2">
                                                {result.risk_level} RISK
                                            </Badge>
                                        </div>

                                        <div className="surface-card p-3 mb-4 text-center">
                                            <p className="text-muted small mb-1">Ensemble Confidence</p>
                                            <h2 className="mb-2">{(result.confidence * 100).toFixed(1)}%</h2>
                                            <ProgressBar
                                                now={result.confidence * 100}
                                                variant={getConfidenceVariant(result.confidence)}
                                                className="rounded-pill"
                                                style={{ height: '8px' }}
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <h6 className="small text-muted text-uppercase mb-2">Verdict</h6>
                                            <Card className="surface-soft border-0">
                                                <Card.Body className="p-3">
                                                    <h5 className={result.classification === 'LEGIT' ? 'text-success' : 'text-danger'}>
                                                        {result.classification}
                                                    </h5>
                                                    <p className="small text-muted mb-0">{result.explanations.short_summary}</p>
                                                </Card.Body>
                                            </Card>
                                        </div>

                                        {/* XAI Signals */}
                                        <div className="mb-4">
                                            <h6 className="small text-muted text-uppercase mb-3">Detected Signals</h6>

                                            {result.signals.urls_detected.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="small fw-bold mb-2">🔗 Suspicious URLs</p>
                                                    {result.signals.urls_detected.map((u, i) => (
                                                        <div key={i} className="small text-muted mb-1 d-flex justify-content-between">
                                                            <span className="text-truncate me-2" style={{ maxWidth: '200px' }}>{u.url}</span>
                                                            <Badge bg={u.suspicious ? 'danger' : 'secondary'} pill>
                                                                {u.is_ip ? 'IP-BASE' : u.is_shortened ? 'SHORTENED' : 'DETECTED'}
                                                            </Badge>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {result.signals.urgent_language.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="small fw-bold mb-2">⏰ Urgency Cues</p>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {result.signals.urgent_language.map((sig, i) => (
                                                            <Badge key={i} bg="warning" text="dark" className="small">{sig}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {result.signals.credential_requests.length > 0 && (
                                                <div className="mb-3">
                                                    <p className="small fw-bold mb-2">🔑 Credential Harvesting</p>
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {result.signals.credential_requests.map((sig, i) => (
                                                            <Badge key={i} bg="danger" className="small">{sig}</Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {result.signals.urls_detected.length === 0 &&
                                                result.signals.urgent_language.length === 0 &&
                                                result.signals.credential_requests.length === 0 && (
                                                    <p className="small text-muted italic">No classic phishing patterns flagged.</p>
                                                )}
                                        </div>

                                        <div className="surface-soft p-3 rounded-3 mt-4">
                                            <p className="small text-muted mb-1">System Intelligence</p>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <span className="small">Model Mode:</span>
                                                <Badge bg={result.explanations.model_status === 'production' ? 'info' : 'warning'} className="text-uppercase">
                                                    {result.explanations.model_status}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default PhishingAnalyzer;
