import React, { useState, useEffect } from 'react';
import { Card, Button, Row, Col, Badge, Spinner, Alert, ProgressBar } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import './PQCLab.css'; // We'll create this next for custom styles/animations

const PQCLab = () => {
    const [currentScreen, setCurrentScreen] = useState(1);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // State for Kyber Demo
    const [kyberResult, setKyberResult] = useState(null);

    // State for Dilithium Demo
    const [dilithiumResult, setDilithiumResult] = useState(null);

    // State for Benchmarks
    const [benchmarkAlgo, setBenchmarkAlgo] = useState('');
    const [benchmarkResults, setBenchmarkResults] = useState([]);

    // State for Challenge
    const [challengeScore, setChallengeScore] = useState(0);
    const [showChallengeResult, setShowChallengeResult] = useState(false);

    const navigate = useNavigate();

    const handleNext = () => {
        if (currentScreen < 6) setCurrentScreen(currentScreen + 1);
    };

    const handlePrev = () => {
        if (currentScreen > 1) setCurrentScreen(currentScreen - 1);
    };

    const runKyberDemo = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.executePQC("Kyber512");
            setKyberResult(res);
        } catch (err) {
            setError(err.message || "Kyber execution failed.");
        } finally {
            setLoading(false);
        }
    };

    const runDilithiumDemo = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await api.executePQC("Dilithium2");
            setDilithiumResult(res);
        } catch (err) {
            setError(err.message || "Dilithium execution failed.");
        } finally {
            setLoading(false);
        }
    };

    const runBenchmark = async () => {
        if (!benchmarkAlgo) return;
        setLoading(true);
        setError(null);
        try {
            const res = await api.benchmarkPQC({ algorithm: benchmarkAlgo });
            setBenchmarkResults(prev => [...prev, res]);
        } catch (err) {
            setError(err.message || "Benchmark failed.");
        } finally {
            setLoading(false);
        }
    };

    const clearBenchmarks = () => setBenchmarkResults([]);

    // --- Screens rendered below ---

    const renderScreen1 = () => (
        <div className="pqc-screen text-center">
            <h2>The Quantum Threat</h2>
            <p className="lead mt-4">
                Quantum computers can break classical encryption like <b>RSA</b> and <b>ECC</b> using Shor’s algorithm.
            </p>

            <div className="animation-container my-5">
                <div className="quantum-animation">
                    <div className="rsa-lock">🔒 RSA Lock</div>
                    <div className="quantum-ray text-danger animate-pulse">⚡ Shor's Algorithm ⚡</div>
                    <div className="broken-lock">💥 Lock Broken</div>
                </div>
            </div>

            <p className="text-muted">
                If an attacker records encrypted data today, they can decrypt it tomorrow when a powerful enough quantum computer is built (Store Now, Decrypt Later).
            </p>
            <Button variant="primary" size="lg" className="mt-4" onClick={handleNext}>
                See The Solution
            </Button>
        </div>
    );

    const renderScreen2 = () => (
        <div className="pqc-screen">
            <h2 className="text-center mb-4">RSA vs Post-Quantum Crypto (PQC)</h2>

            <Row className="text-center mb-5 g-4">
                <Col md={6}>
                    <Card className="h-100 bg-dark text-white border-danger shadow">
                        <Card.Body>
                            <Card.Title className="text-danger">Classical (RSA)</Card.Title>
                            <div className="visual text-danger my-3 h1">🔢</div>
                            <p>Based on factoring large prime numbers.</p>
                            <ul className="text-start">
                                <li>Smaller keys (e.g., 2048-bit ≈ 256 bytes)</li>
                                <li>Vulnerable to Quantum Computers ❌</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="h-100 bg-dark text-white border-success shadow">
                        <Card.Body>
                            <Card.Title className="text-success">PQC (Kyber)</Card.Title>
                            <div className="visual text-success my-3 h1">🕸️</div>
                            <p>Based on complex Lattice math problems (LWE).</p>
                            <ul className="text-start">
                                <li>Larger keys (e.g., Kyber512 ≈ 800 bytes)</li>
                                <li>Quantum-Resistant ✅</li>
                            </ul>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            <div className="text-center">
                <Button variant="success" size="lg" onClick={handleNext}>Next: Kyber Key Exchange</Button>
            </div>
        </div>
    );

    const renderScreen3 = () => (
        <div className="pqc-screen">
            <h2>Kyber Key Exchange Demo</h2>
            <p>Kyber is NIST's chosen algorithm for secure key establishment. It ensures two parties securely agree on a shared secret over an insecure channel.</p>

            <Row className="mt-4">
                <Col md={6}>
                    <Card className="bg-dark text-light border-secondary">
                        <Card.Header>Flow Animation</Card.Header>
                        <Card.Body className="text-center py-5">
                            {loading && <Spinner animation="border" variant="info" />}
                            {!loading && !kyberResult && (
                                <div className="text-muted">Generate keys and encapsulate a secret to begin.</div>
                            )}
                            {!loading && kyberResult && (
                                <div className="flow-success animate-fade-in">
                                    <h4 className="text-success">✅ Shared Secret Matched!</h4>
                                    <hr className="bg-secondary" />
                                    <div className="d-flex justify-content-between text-start small">
                                        <div>
                                            <strong>KeyGen:</strong> {kyberResult.keygen_time_ms}ms<br />
                                            <strong>Public Key:</strong> {kyberResult.public_key_size} bytes
                                        </div>
                                        <div>
                                            <strong>Encap:</strong> {kyberResult.encap_time_ms}ms<br />
                                            <strong>Ciphertext:</strong> {kyberResult.ciphertext_size} bytes
                                        </div>
                                    </div>
                                    <div className="mt-3 text-start small">
                                        <strong>Decap Time:</strong> {kyberResult.decap_time_ms}ms
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="bg-dark bg-opacity-75 h-100 border-info">
                        <Card.Header>Python Code (Sandbox Output)</Card.Header>
                        <Card.Body>
                            <pre className="text-info small" style={{ whiteSpace: 'pre-wrap' }}>
                                {`# 1. Generate Keypair
public_key, secret_key = kyber.generate_keypair()

# 2. Encapsulate (Create shared secret + ciphertext)
ciphertext, shared_secret_sender = kyber.encapsulate(public_key)

# 3. Decapsulate (Recover shared secret)
shared_secret_receiver = kyber.decapsulate(secret_key, ciphertext)

assert shared_secret_sender == shared_secret_receiver`}
                            </pre>
                            <div className="text-center mt-4">
                                <Button variant="info" onClick={runKyberDemo} disabled={loading}>
                                    {loading ? 'Running in Sandbox...' : '▶ Run Kyber Sandbox Executable'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="text-end mt-4">
                <Button variant="outline-light" onClick={handleNext}>Next: Dilithium Signatures</Button>
            </div>
        </div>
    );

    const renderScreen4 = () => (
        <div className="pqc-screen">
            <h2>Dilithium Digital Signatures</h2>
            <p>Dilithium is the new standard for proving authenticity. It ensures a message was not tampered with.</p>

            <Row className="mt-4">
                <Col md={6}>
                    <Card className="bg-dark text-light border-secondary h-100">
                        <Card.Header>Flow Animation</Card.Header>
                        <Card.Body className="text-center py-4">
                            {loading && <Spinner animation="border" variant="warning" />}
                            {!loading && !dilithiumResult && (
                                <div className="text-muted mt-5">Sign a message to verify authenticity.</div>
                            )}
                            {!loading && dilithiumResult && (
                                <div className="flow-success animate-fade-in">
                                    <h4 className={dilithiumResult.success ? "text-success" : "text-danger"}>
                                        {dilithiumResult.success ? "✅ Signature Verified!" : "❌ Signature Invalid!"}
                                    </h4>
                                    <hr className="bg-secondary" />
                                    <div className="d-flex justify-content-between text-start small">
                                        <div>
                                            <strong>KeyGen:</strong> {dilithiumResult.keygen_time_ms}ms<br />
                                            <strong>Sign Time:</strong> {dilithiumResult.sign_time_ms}ms
                                        </div>
                                        <div>
                                            <strong>Verify Time:</strong> {dilithiumResult.verify_time_ms}ms<br />
                                            <strong>Signature:</strong> {dilithiumResult.signature_size} bytes
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="bg-dark bg-opacity-75 h-100 border-warning">
                        <Card.Header>Python Code</Card.Header>
                        <Card.Body>
                            <pre className="text-warning small" style={{ whiteSpace: 'pre-wrap' }}>
                                {`message = b"Highly secure message."

# 1. Sign
signature = dilithium.sign(message, secret_key)

# 2. Verify
is_valid = dilithium.verify(message, signature, public_key)
assert is_valid == True`}
                            </pre>
                            <div className="text-center mt-4">
                                <Button variant="warning" className="text-dark fw-bold" onClick={runDilithiumDemo} disabled={loading}>
                                    {loading ? 'Executing...' : '▶ Run Dilithium Sandbox'}
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <div className="text-end mt-4">
                <Button variant="outline-light" onClick={handleNext}>Next: Track Performance</Button>
            </div>
        </div>
    );

    const renderScreen5 = () => (
        <div className="pqc-screen">
            <h2>Visual Performance Benchmarks</h2>
            <p>Compare classical algorithms against Post-Quantum algorithms by running live sandbox tests.</p>

            <Row className="mb-4">
                <Col md={6} className="d-flex gap-2">
                    <select className="form-select bg-dark text-light" value={benchmarkAlgo} onChange={(e) => setBenchmarkAlgo(e.target.value)}>
                        <option value="">-- Select Algorithm --</option>
                        <option value="RSA-2048">RSA-2048 (Classical)</option>
                        <option value="ECC">ECC secp256r1 (Classical)</option>
                        <option value="Kyber512">Kyber512 (PQC)</option>
                        <option value="Dilithium2">Dilithium2 (PQC)</option>
                    </select>
                    <Button variant="primary" onClick={runBenchmark} disabled={!benchmarkAlgo || loading}>
                        {loading ? 'Running...' : 'Test'}
                    </Button>
                    <Button variant="outline-secondary" onClick={clearBenchmarks}>Clear</Button>
                </Col>
            </Row>

            {error && <Alert variant="danger">{error}</Alert>}

            {benchmarkResults.length > 0 && (
                <div className="table-responsive">
                    <table className="table table-dark table-hover table-bordered align-middle text-center">
                        <thead className="table-secondary">
                            <tr>
                                <th>Algorithm</th>
                                <th>KeyGen (ms)</th>
                                <th>Encrypt/Sign (ms)</th>
                                <th>Decrypt/Verify (ms)</th>
                                <th>Public Key (bytes)</th>
                                <th>Ciphertext/Sig (bytes)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {benchmarkResults.map((res, i) => (
                                <tr key={i}>
                                    <td className="fw-bold text-info">{res.algorithm}</td>
                                    <td>{res.keygen_time_ms}</td>
                                    <td>{res.encrypt_time_ms}</td>
                                    <td>{res.decrypt_time_ms}</td>
                                    <td>{res.public_key_size}</td>
                                    <td>{res.ciphertext_size}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="mt-2 small text-muted">
                        <strong>Note:</strong> PQC algorithms are extremely fast (often faster than RSA), but the tradeoff is their large key and ciphertext sizes.
                    </div>
                </div>
            )}

            <div className="text-end mt-4">
                <Button variant="success" size="lg" onClick={handleNext}>Next: Final Challenge 🏆</Button>
            </div>
        </div>
    );

    const handleScoreAndComplete = async () => {
        try {
            await api.submitPQCScore(10);
            await api.completePQCModule();
            alert("Module Complete! Badge earned & Score submitted!");
            navigate('/dashboard');
        } catch (err) {
            console.error("Failed to submit score", err);
            alert("Module Complete! (Error saving score)");
        }
    };

    const renderScreen6 = () => (
        <div className="pqc-screen text-center">
            <h2>Post-Quantum Knowledge Check</h2>
            <p>You've completed the interactive labs! Let's test your conceptual understanding.</p>

            {/* We will add the actual challenges here later, keeping it simple for now */}
            <Card className="bg-dark text-light border-success max-w-lg mx-auto p-4 mb-4">
                <h4>Q1: Why is Kyber considered "Quantum-Safe"?</h4>
                <div className="d-grid gap-2 mt-3">
                    <Button variant="outline-light" onClick={() => setChallengeScore(-2)}>Uses much larger prime numbers</Button>
                    <Button variant="outline-light" onClick={() => { setChallengeScore(10); setShowChallengeResult(true); }}>Resolves math problems on Lattice grids (LWE)</Button>
                    <Button variant="outline-light" onClick={() => setChallengeScore(-2)}>It uses AES-256 securely</Button>
                </div>

                {showChallengeResult && challengeScore > 0 && (
                    <Alert variant="success" className="mt-3">
                        Correct! Lattice problems (like LWE) cannot be solved efficiently by Shor's algorithm. +10 Points!
                    </Alert>
                )}
            </Card>

            {showChallengeResult && (
                <Button variant="primary" size="lg" onClick={handleScoreAndComplete}>Finish Module</Button>
            )}
        </div>
    );

    return (
        <div className="pqc-lab-container container-fluid py-4 min-vh-100 bg-black text-light">
            <div className="d-flex justify-content-between align-items-center mb-4 border-bottom border-secondary pb-3">
                <h1 className="h3">⚛️ Post-Quantum Cryptography Lab</h1>
                <Badge bg="secondary" className="fs-6">Step {currentScreen} of 6</Badge>
            </div>

            <div className="pqc-content-body px-md-5">
                {currentScreen === 1 && renderScreen1()}
                {currentScreen === 2 && renderScreen2()}
                {currentScreen === 3 && renderScreen3()}
                {currentScreen === 4 && renderScreen4()}
                {currentScreen === 5 && renderScreen5()}
                {currentScreen === 6 && renderScreen6()}
            </div>

            <div className="d-flex justify-content-between mt-5 px-md-5">
                <Button variant="outline-secondary" onClick={handlePrev} disabled={currentScreen === 1}>← Back</Button>
            </div>
        </div>
    );
};

export default PQCLab;
