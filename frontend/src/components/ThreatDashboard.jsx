import React, { useState, useEffect, useMemo } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Accordion } from 'react-bootstrap';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ThreatDashboard = () => {
  const [threats, setThreats] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();
  
  // Deduplicate threats by indicators, keeping only the latest by timestamp
  const { latestThreats, olderThreats } = useMemo(() => {
    if (!threats || threats.length === 0) {
      return { latestThreats: [], olderThreats: [] };
    }

    // #region agent log
    const logData = { location: 'ThreatDashboard.jsx:deduplicate:entry', message: 'Deduplicating threats', data: { total: threats.length }, timestamp: new Date().toISOString(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' };
    fetch('http://127.0.0.1:7242/ingest/10ce20dc-ddc8-4f37-8bb9-4ead1f9997c1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logData) }).catch(() => {});
    // #endregion

    // Group threats by sorted indicator tuple (for deduplication)
    const threatMap = new Map();
    
    threats.forEach(threat => {
      const indicators = threat.indicators || [];
      const key = JSON.stringify(indicators.sort());
      const timestamp = threat.timestamp ? new Date(threat.timestamp).getTime() : 0;
      
      // Keep only the latest threat for each indicator set
      if (!threatMap.has(key)) {
        threatMap.set(key, threat);
      } else {
        const existing = threatMap.get(key);
        const existingTimestamp = existing.timestamp ? new Date(existing.timestamp).getTime() : 0;
        if (timestamp > existingTimestamp) {
          threatMap.set(key, threat);
        }
      }
    });

    // Convert back to array and sort by timestamp (newest first)
    const deduplicated = Array.from(threatMap.values()).sort((a, b) => {
      const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
      const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
      return timeB - timeA;
    });

    // #region agent log
    const logData2 = { location: 'ThreatDashboard.jsx:deduplicate:exit', message: 'Deduplication complete', data: { original: threats.length, deduplicated: deduplicated.length }, timestamp: new Date().toISOString(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' };
    fetch('http://127.0.0.1:7242/ingest/10ce20dc-ddc8-4f37-8bb9-4ead1f9997c1', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(logData2) }).catch(() => {});
    // #endregion

    // Split into latest (first 10) and older (rest)
    const latest = deduplicated.slice(0, 10);
    const older = deduplicated.slice(10);

    return {
      latestThreats: latest,
      olderThreats: older
    };
  }, [threats]);

  // Fetch threat data on component mount
  useEffect(() => {
    fetchThreats();
    // Optional: Auto-refresh every 5 minutes
    const interval = setInterval(fetchThreats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchThreats = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch latest threats
      const threatRes = await api.getLatestThreats();

      // Fetch stats
      const statsRes = await api.getThreatStats();

      setThreats(threatRes.threats || []);
      setStats(statsRes);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      setError('Failed to fetch threats: ' + (err.message || 'Unknown error'));
      console.error('Threat fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleManualRefresh = async () => {
    try {
      setRefreshing(true);
      setError('');

      const res = await api.refreshThreats();

      // Re-fetch after refresh
      await fetchThreats();
      alert(res.message);
    } catch (err) {
      setError('Failed to refresh threats: ' + (err.message || 'Unknown error'));
    } finally {
      setRefreshing(false);
    }
  };

  // Prepare data for charts
  const chartData = stats ? [
    { name: 'High', value: stats.by_severity?.High || 0 },
    { name: 'Medium', value: stats.by_severity?.Medium || 0 },
    { name: 'Low', value: stats.by_severity?.Low || 0 }
  ] : [];

  const COLORS = ['#dc3545', '#ffc107', '#28a745']; // Red, Yellow, Green

  // Severity badge color mapping
  const getSeverityVariant = (severity) => {
    switch (severity) {
      case 'High': return 'danger';
      case 'Medium': return 'warning';
      case 'Low': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="page-shell">
      <Container fluid className="py-5 px-4">
        <header className="glass-nav d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <p className="eyebrow mb-1">Threat Intelligence</p>
            <h1 className="h4 mb-0 brand-gradient">
              Threat Intelligence Dashboard
            </h1>
          </div>
          <div className="d-flex gap-2">
            <Button 
              className="btn-modern-secondary"
              onClick={() => navigate('/dashboard')}
            >
              Dashboard
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              {refreshing ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Refresh Live Feeds
            </Button>
            {lastUpdated && <small className="text-muted align-self-center">Last updated: {lastUpdated}</small>}
          </div>
        </header>

        {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

        {loading && !threats.length ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading threats...</span>
            </Spinner>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <Row className="mb-4">
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Body>
                    <Card.Title>Total Threats</Card.Title>
                    <h2 className="mb-0">{stats?.total || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm bg-danger text-white">
                  <Card.Body>
                    <Card.Title>High Severity</Card.Title>
                    <h2 className="mb-0">{stats?.by_severity?.High || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm bg-warning text-dark">
                  <Card.Body>
                    <Card.Title>Medium Severity</Card.Title>
                    <h2 className="mb-0">{stats?.by_severity?.Medium || 0}</h2>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Charts Row */}
            <Row className="mb-4">
              <Col md={6}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Header className="bg-dark text-white">
                    <Card.Title className="mb-0">Threats by Severity</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted">No data available</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>

              <Col md={6}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Header className="bg-dark text-white">
                    <Card.Title className="mb-0">Severity Distribution</Card.Title>
                  </Card.Header>
                  <Card.Body>
                    {chartData.length > 0 && chartData.some(d => d.value > 0) ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value }) => `${name}: ${value}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-muted">No data available</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Threats Table */}
            <Row>
              <Col md={12}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                    <Card.Title className="mb-0">
                      Latest Threats ({latestThreats.length} unique)
                      {threats.length > latestThreats.length && (
                        <small className="text-muted ms-2">({threats.length - latestThreats.length} duplicates hidden)</small>
                      )}
                    </Card.Title>
                  </Card.Header>
                  <Card.Body className="p-0">
                    {latestThreats.length > 0 ? (
                      <>
                        <div className="table-responsive">
                          <table className="table table-hover mb-0">
                            <thead className="table-light">
                              <tr>
                                <th>Type</th>
                                <th>Severity</th>
                                <th>Source</th>
                                <th>Description</th>
                                <th>Indicators</th>
                                <th>Timestamp</th>
                              </tr>
                            </thead>
                            <tbody>
                              {latestThreats.map((threat, idx) => (
                                <tr key={threat.id || idx}>
                                  <td>
                                    <Badge bg="info">{threat.type}</Badge>
                                  </td>
                                  <td>
                                    <Badge bg={getSeverityVariant(threat.severity)}>
                                      {threat.severity}
                                    </Badge>
                                  </td>
                                  <td><small>{threat.source}</small></td>
                                  <td><small>{threat.description}</small></td>
                                  <td>
                                    <small>
                                      {threat.indicators?.slice(0, 2).join(', ')}
                                      {threat.indicators?.length > 2 && ` +${threat.indicators.length - 2}`}
                                    </small>
                                  </td>
                                  <td>
                                    <small>
                                      {threat.timestamp 
                                        ? new Date(threat.timestamp).toLocaleString() 
                                        : 'N/A'}
                                    </small>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        {olderThreats.length > 0 && (
                          <Accordion className="border-top">
                            <Accordion.Item eventKey="0" className="border-0">
                              <Accordion.Header className="bg-light">
                                <small className="text-muted">
                                  Older Threats ({olderThreats.length})
                                </small>
                              </Accordion.Header>
                              <Accordion.Body className="p-0">
                                <div className="table-responsive">
                                  <table className="table table-sm table-hover mb-0">
                                    <thead className="table-light">
                                      <tr>
                                        <th>Type</th>
                                        <th>Severity</th>
                                        <th>Source</th>
                                        <th>Description</th>
                                        <th>Indicators</th>
                                        <th>Timestamp</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {olderThreats.map((threat, idx) => (
                                        <tr key={threat.id || `older-${idx}`}>
                                          <td>
                                            <Badge bg="info">{threat.type}</Badge>
                                          </td>
                                          <td>
                                            <Badge bg={getSeverityVariant(threat.severity)}>
                                              {threat.severity}
                                            </Badge>
                                          </td>
                                          <td><small>{threat.source}</small></td>
                                          <td><small>{threat.description}</small></td>
                                          <td>
                                            <small>
                                              {threat.indicators?.slice(0, 2).join(', ')}
                                              {threat.indicators?.length > 2 && ` +${threat.indicators.length - 2}`}
                                            </small>
                                          </td>
                                          <td>
                                            <small>
                                              {threat.timestamp 
                                                ? new Date(threat.timestamp).toLocaleString() 
                                                : 'N/A'}
                                            </small>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </Accordion.Body>
                            </Accordion.Item>
                          </Accordion>
                        )}
                      </>
                    ) : (
                      <p className="text-muted text-center py-4">No threats available. Click "Refresh Live Feeds" to fetch data.</p>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}
      </Container>
    </div>
  );
};

export default ThreatDashboard;

