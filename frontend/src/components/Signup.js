import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

export default function Signup() {
  const { signup } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [country, setCountry] = useState('');
  const [state, setState] = useState('');
  const [institution, setInstitution] = useState('');
  
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [universities, setUniversities] = useState([]);
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const db = getFirestore();

  // Fetch countries on component mount
  useEffect(() => {
    fetchCountries();
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (country) {
      fetchStates(country);
    }
  }, [country]);

  // Fetch universities when country changes
  useEffect(() => {
    if (country) {
      fetchUniversities(country);
    }
  }, [country]);

  async function fetchCountries() {
    try {
      const response = await fetch('https://restcountries.com/v3.1/all');
      const data = await response.json();
      const countryList = data.map(c => c.name.common).sort();
      setCountries(countryList);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
    }
  }

  async function fetchStates(countryName) {
    try {
      // Using country-state-city API (requires installation or use public endpoints)
      // Alternative: Use https://countriesnow.space/api/v0.1/countries/states
      const response = await fetch('https://countriesnow.space/api/v0.1/countries/states', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ country: countryName })
      });
      const data = await response.json();
      
      if (data.data && data.data.states) {
        const stateList = data.data.states.map(s => s.name).sort();
        setStates(stateList);
      } else {
        setStates([]);
      }
    } catch (error) {
      console.error('Failed to fetch states:', error);
      setStates([]);
    }
  }

  async function fetchUniversities(countryName) {
    try {
      const response = await fetch(`http://universities.hipolabs.com/search?country=${countryName}`);
      const data = await response.json();
      const universityList = data.map(u => u.name).sort();
      setUniversities(universityList);
    } catch (error) {
      console.error('Failed to fetch universities:', error);
      setUniversities([]);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Validation
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    if (!name || !dob || !gender || !country) {
      return setError('Please fill all required fields');
    }

    try {
      setError('');
      setLoading(true);

      // Create Firebase Auth user
      const userCredential = await signup(email, password);
      const user = userCredential.user;

      // Save additional user details to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        dob: dob,
        gender: gender,
        country: country,
        state: state,
        institution: institution,
        created_at: new Date(),
        email_verified: false
      });

      navigate('/dashboard');
    } catch (error) {
      setError('Failed to create account: ' + error.message);
    }

    setLoading(false);
  }

  return (
    <div className="bg-gradient-dark min-vh-100 d-flex align-items-center justify-content-center py-5">
      <Container style={{ maxWidth: '600px' }}>
        <Card className="card-glass border-0 shadow-lg animate-fadeIn">
          <Card.Body className="p-5">
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2" style={{ 
                background: 'linear-gradient(135deg, #60a5fa 0%, #a855f7 100%)', 
                backgroundClip: 'text', 
                WebkitBackgroundClip: 'text', 
                WebkitTextFillColor: 'transparent' 
              }}>
                Join CodeLife
              </h2>
              <p className="text-muted">Create your account and start learning</p>
            </div>

            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}

            <Form onSubmit={handleSubmit}>
              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                />
              </Form.Group>

              {/* Name */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                />
              </Form.Group>

              {/* Date of Birth */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Date of Birth *</Form.Label>
                <Form.Control
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                />
              </Form.Group>

              {/* Gender */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Gender *</Form.Label>
                <Form.Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </Form.Select>
              </Form.Group>

              {/* Country */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Country *</Form.Label>
                <Form.Select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                >
                  <option value="">Select Country</option>
                  {countries.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* State */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">State/Region</Form.Label>
                <Form.Select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="bg-dark text-white border-secondary"
                  disabled={!country || states.length === 0}
                >
                  <option value="">Select State</option>
                  {states.map((s, idx) => (
                    <option key={idx} value={s}>{s}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* Institution */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Institution/Organization</Form.Label>
                <Form.Control
                  type="text"
                  list="universities"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="bg-dark text-white border-secondary"
                  placeholder="Type or select from list"
                />
                <datalist id="universities">
                  {universities.map((u, idx) => (
                    <option key={idx} value={u} />
                  ))}
                </datalist>
              </Form.Group>

              {/* Password */}
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Password *</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                />
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-4">
                <Form.Label className="text-white">Confirm Password *</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-dark text-white border-secondary"
                />
              </Form.Group>

              <Button 
                disabled={loading} 
                className="btn-gradient w-100 fw-semibold" 
                type="submit"
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Sign Up'}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <p className="text-muted small">
                Already have an account? <Link to="/login" className="text-primary">Log In</Link>
              </p>
            </div>
          </Card.Body>
        </Card>
      </Container>
    </div>
  );
}
