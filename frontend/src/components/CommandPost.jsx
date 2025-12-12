import React, { useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

const securityFeeds = new Set(['thn', 'krebs', 'bleepingcomputer', 'darkreading', 'securityweek', 'cybersecuritydive']);

const CommandPost = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadArticles();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getLatestNews();
      setArticles(res.articles || []);
      setLastUpdated(new Date().toLocaleString());
    } catch (err) {
      setError(err.message || 'Failed to load news.');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      setError('');
      await api.refreshNews();
      await loadArticles();
    } catch (err) {
      setError(err.message || 'Failed to refresh news.');
    } finally {
      setRefreshing(false);
    }
  };

  const stats = useMemo(() => {
    const total = articles.length;
    const security = articles.filter((a) => securityFeeds.has(a.feed)).length;
    const ai = total - security;
    return { total, security, ai };
  }, [articles]);

  return (
    <div className="page-shell">
      <Container fluid className="py-5 px-4">
        <header className="glass-nav d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
          <div>
            <p className="eyebrow mb-1">Command Post</p>
            <h1 className="h4 mb-0 brand-gradient">Command Post – News & Research</h1>
            {lastUpdated && <small className="text-muted">Last updated: {lastUpdated}</small>}
          </div>
          <div className="d-flex gap-2 align-items-center">
            <Button className="btn-modern-secondary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button variant="outline-primary" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? <Spinner animation="border" size="sm" className="me-2" /> : null}
              Refresh News
            </Button>
          </div>
        </header>

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading && !articles.length ? (
          <div className="text-center py-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading news...</span>
            </Spinner>
          </div>
        ) : (
          <>
            <Row className="mb-4">
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Body>
                    <p className="text-muted small mb-1">Total articles</p>
                    <h3 className="mb-0">{stats.total}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Body>
                    <p className="text-muted small mb-1">Security</p>
                    <h3 className="mb-0">{stats.security}</h3>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="card-glass border-0 shadow-sm">
                  <Card.Body>
                    <p className="text-muted small mb-1">AI / Research</p>
                    <h3 className="mb-0">{stats.ai}</h3>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-4">
              {articles.map((article) => (
                <Col key={article.id || article.url} md={6} xl={4}>
                  <Card className="card-glass border-0 h-100">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <Badge bg="secondary">{article.source}</Badge>
                        <small className="text-muted">
                          {article.published_at ? new Date(article.published_at).toLocaleString() : 'Unknown date'}
                        </small>
                      </div>
                      <h5>
                        <a href={article.url} target="_blank" rel="noreferrer" className="text-decoration-none">
                          {article.title}
                        </a>
                      </h5>
                      <p className="text-muted small flex-grow-1">{article.summary}</p>
                      <div className="d-flex flex-wrap gap-2 mt-2">
                        {article.tags?.map((tag) => (
                          <Badge bg="info" key={tag}>
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {!articles.length && (
              <div className="text-center text-muted py-4">
                No news yet. Try refreshing to pull the latest articles.
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
};

export default CommandPost;

