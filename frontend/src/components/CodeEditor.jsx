import React, { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Card, Button, Form, Spinner, Alert, Badge, Row, Col, Container } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import './CodeEditor.css';

const CODE_PLACEHOLDERS = {
    python: "# Write your Python code here...\nimport os\nimport subprocess\n\n# Example: Try writing code with potential security issues\nuser_input = input('Enter command: ')\nos.system(user_input)  # This is a security vulnerability!\n",
    javascript: "// Write your JavaScript code here...\nconst exec = require('child_process').exec;\n\n// Example: Try writing code with potential security issues\nconst userInput = 'ls'; // Imagine this comes from user input\nexec(userInput); // This is a security vulnerability!\n",
    html: "<!-- Write your HTML code here... -->\n<!DOCTYPE html>\n<html>\n<head>\n  <title>Security Test</title>\n</head>\n<body>\n  <!-- Example: Try writing HTML with potential XSS issues -->\n  <div id=\"output\"></div>\n  <script>\n    const userInput = '<img src=x onerror=alert(1)>';\n    document.getElementById('output').innerHTML = userInput; // XSS vulnerability!\n  </script>\n</body>\n</html>\n"
};

const CodeEditor = ({ initialLanguage = "python" }) => {
    const [language, setLanguage] = useState(initialLanguage);
    const [code, setCode] = useState(CODE_PLACEHOLDERS[initialLanguage]);
    const [analyzing, setAnalyzing] = useState(false);
    const [results, setResults] = useState(null);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { logout } = useAuth();

    const handleEditorChange = (value) => {
        setCode(value);
    };

    const handleLanguageChange = (e) => {
        const newLang = e.target.value;
        setLanguage(newLang);
        if (Object.values(CODE_PLACEHOLDERS).includes(code) || !code.trim()) {
            setCode(CODE_PLACEHOLDERS[newLang]);
        }
        setResults(null);
        setError(null);
    };

    const runAnalysis = async () => {
        setAnalyzing(true);
        setError(null);
        setResults(null);

        try {
            const res = await api.analyzeCode({ code, language });
            setResults(res);
        } catch (err) {
            console.error("Analysis failed:", err);
            setError("Failed to analyze code. Please try again.");
        } finally {
            setAnalyzing(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (err) {
            setError('Failed to log out');
        }
    };

    const editorHeight = results ? 'calc(100vh - 220px)' : 'calc(100vh - 220px)';

    return (
        <div className="page-shell">
            <Container className="page-container">
                {/* Navigation Header */}
                <header className="glass-nav d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
                    <div>
                        <p className="eyebrow mb-1">Security toolkit</p>
                        <h2 className="h4 mb-0 brand-gradient">Code Analysis Suite</h2>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <Button className="btn-modern-secondary" onClick={() => navigate('/dashboard')}>
                            Dashboard
                        </Button>
                        <Button className="btn-modern-primary" onClick={handleLogout}>
                            Logout
                        </Button>
                    </div>
                </header>

                {/* Error Alert */}
                {error && (
                    <Alert variant="danger" className="mb-3" dismissible onClose={() => setError(null)}>
                        <strong>Error:</strong> {error}
                    </Alert>
                )}

                {/* Main Content Card */}
                <Card className="card-glass border-0 shadow-lg">
                    {/* Toolbar */}
                    <Card.Header className="bg-transparent border-0 d-flex flex-wrap justify-content-between align-items-center p-3">
                        <div className="d-flex align-items-center gap-3">
                            <h5 className="text-white fw-bold mb-0">🔬 Code Editor</h5>
                            <Form.Select
                                size="sm"
                                value={language}
                                onChange={handleLanguageChange}
                                className="code-lang-select"
                            >
                                <option value="python">Python</option>
                                <option value="javascript">JavaScript</option>
                                <option value="html">HTML</option>
                            </Form.Select>
                        </div>
                        <Button
                            variant="warning"
                            size="sm"
                            onClick={runAnalysis}
                            disabled={analyzing || !code.trim()}
                            className="fw-bold px-3"
                        >
                            {analyzing ? (
                                <><Spinner size="sm" animation="border" className="me-2" />Scanning...</>
                            ) : (
                                <>🛡️ Scan Vulnerabilities</>
                            )}
                        </Button>
                    </Card.Header>

                    <Card.Body className="p-0">
                        <Row className="g-0">
                            {/* Editor Panel */}
                            <Col md={results ? 8 : 12}>
                                <div className="editor-wrapper">
                                    <Editor
                                        height={editorHeight}
                                        theme="vs-dark"
                                        language={language}
                                        value={code}
                                        onChange={handleEditorChange}
                                        options={{
                                            minimap: { enabled: false },
                                            fontSize: 14,
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            padding: { top: 16 },
                                            wordWrap: 'on',
                                        }}
                                    />
                                </div>
                            </Col>

                            {/* Results Panel */}
                            {results && (
                                <Col md={4}>
                                    <div className="results-panel" style={{ height: editorHeight, overflowY: 'auto' }}>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h6 className="text-white m-0 fw-bold">Security Report</h6>
                                            <Badge bg={results.score > 80 ? 'success' : results.score > 50 ? 'warning' : 'danger'}>
                                                Score: {results.score}/100
                                            </Badge>
                                        </div>

                                        {results.summary && (
                                            <p className="text-muted small mb-3">{results.summary}</p>
                                        )}

                                        {(!results.vulnerabilities || results.vulnerabilities.length === 0) ? (
                                            <Alert variant="success" className="mb-0" style={{ background: 'rgba(94,243,140,0.1)', borderColor: 'rgba(94,243,140,0.35)', color: '#5ef38c' }}>
                                                ✅ No vulnerabilities found!
                                            </Alert>
                                        ) : (
                                            <div className="vulnerability-list">
                                                {results.vulnerabilities.map((vuln, idx) => (
                                                    <Card key={idx} className="mb-2 vuln-card">
                                                        <Card.Body className="p-3">
                                                            <div className="d-flex justify-content-between align-items-center mb-2">
                                                                <Badge bg={vuln.severity === 'HIGH' ? 'danger' : vuln.severity === 'MEDIUM' ? 'warning' : 'info'}>
                                                                    {vuln.severity}
                                                                </Badge>
                                                                <small className="text-muted">Line {vuln.line}</small>
                                                            </div>
                                                            <p className="mb-0 small" style={{ color: '#c0c6de' }}>{vuln.message}</p>
                                                        </Card.Body>
                                                    </Card>
                                                ))}
                                            </div>
                                        )}

                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            className="w-100 mt-3"
                                            onClick={() => setResults(null)}
                                        >
                                            Close Report
                                        </Button>
                                    </div>
                                </Col>
                            )}
                        </Row>
                    </Card.Body>
                </Card>
            </Container>
        </div>
    );
};

export default CodeEditor;
