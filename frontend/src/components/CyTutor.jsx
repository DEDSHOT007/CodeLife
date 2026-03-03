import React, { useState, useRef, useEffect } from 'react';
import { Card, Button, Form, Spinner, Badge } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';
import { api } from '../services/api';

const CyTutor = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am Cy, your AI cybersecurity tutor. I can help you with your labs and questions. How can I assist you today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const location = useLocation();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        const userMsg = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // Context from current URL/State
            const context = {
                path: location.pathname,
                timestamp: new Date().toISOString()
            };

            const response = await api.cyChat({ query: userMsg.content, context });

            const botMsg = {
                role: 'assistant',
                content: response.response,
                sources: response.sources
            };
            setMessages(prev => [...prev, botMsg]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'system', content: 'Error connecting to Cy. Please try again.' }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) {
        return (
            <Button
                className="position-fixed bottom-0 end-0 m-4 rounded-circle shadow-lg d-flex align-items-center justify-content-center animate-bounce"
                style={{ width: '60px', height: '60px', zIndex: 1050, background: 'linear-gradient(135deg, #00C9FF 0%, #92FE9D 100%)', border: 'none' }}
                onClick={() => setIsOpen(true)}
            >
                <span style={{ fontSize: '24px' }}>🤖</span>
            </Button>
        );
    }

    return (
        <Card
            className="position-fixed bottom-0 end-0 m-4 shadow-2xl animate-slideInUp"
            style={{ width: '380px', height: '600px', zIndex: 1050, borderRadius: '16px', border: '1px solid rgba(124,93,255,0.4)', background: '#0a1228' }}
        >
            <Card.Header className="border-0 d-flex justify-content-between align-items-center p-3" style={{ background: '#0d1a35', borderBottom: '1px solid rgba(74,209,217,0.3)', borderRadius: '16px 16px 0 0' }}>
                <div className="d-flex align-items-center">
                    <div className="rounded-circle p-2 me-2" style={{ background: 'rgba(74, 209, 217, 0.25)' }}>🤖</div>
                    <div>
                        <h6 className="mb-0 fw-bold" style={{ color: '#f5f7ff' }}>Cy AI Tutor</h6>
                        <small style={{ fontSize: '0.75rem', color: '#4ad1d9' }}>Context-Aware Assistant</small>
                    </div>
                </div>
                <Button variant="link" className="p-0" style={{ color: '#c0c6de', fontSize: '1.1rem' }} onClick={() => setIsOpen(false)}>✖</Button>
            </Card.Header>

            <Card.Body className="p-3 d-flex flex-column overflow-hidden" style={{ background: '#0a1228' }}>
                <div className="flex-grow-1 overflow-auto mb-3 pe-2 custom-scrollbar" style={{ scrollBehavior: 'smooth' }}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`d-flex mb-3 ${msg.role === 'user' ? 'justify-content-end' : 'justify-content-start'}`}>
                            <div
                                className={`p-3 rounded-3 ${msg.role === 'user' ? 'bg-primary text-white' : 'surface-soft text-light'}`}
                                style={{ maxWidth: '85%', fontSize: '0.9rem', borderTopLeftRadius: msg.role === 'assistant' ? '2px' : '12px', borderTopRightRadius: msg.role === 'user' ? '2px' : '12px' }}
                            >
                                {msg.content}
                                {msg.sources && msg.sources.length > 0 && (
                                    <div className="mt-2 pt-2 border-top border-secondary">
                                        <small className="text-muted d-block mb-1">📚 Sources:</small>
                                        {msg.sources.map((src, i) => (
                                            <Badge key={i} bg="secondary" className="me-1 mb-1 text-truncate" style={{ maxWidth: '100%', fontWeight: 'normal' }}>
                                                {src.metadata?.title || 'Doc ' + (i + 1)}
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {loading && (
                        <div className="d-flex justify-content-start mb-3">
                            <div className="surface-soft p-3 rounded-3">
                                <Spinner animation="border" size="sm" variant="info" /> <small className="ms-2 text-muted">Thinking...</small>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <Form onSubmit={handleSend}>
                    <div className="position-relative">
                        <Form.Control
                            type="text"
                            placeholder="Ask for a hint..."
                            className="bg-black border-dark text-white pe-5 rounded-pill"
                            style={{ paddingLeft: '20px', height: '50px' }}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                            autoFocus
                        />
                        <Button
                            type="submit"
                            variant="link"
                            className="position-absolute end-0 top-50 translate-middle-y text-info text-decoration-none pe-3"
                            disabled={!input.trim() || loading}
                        >
                            ➤
                        </Button>
                    </div>
                </Form>
            </Card.Body>
        </Card>
    );
};

export default CyTutor;
