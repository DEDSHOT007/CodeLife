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
  const today = new Date().toISOString().split('T')[0];
  const labelClass = 'form-label fw-semibold';

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
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name');
      if (!response.ok) {
        throw new Error(`Failed to fetch countries. Status: ${response.status}`);
      }
      const data = await response.json();
      if (!Array.isArray(data)) {
        throw new Error('Unexpected response format for countries');
      }
      const countryList = data
        .map((c) => c?.name?.common)
        .filter(Boolean)
        .sort();
      setCountries(countryList);
    } catch (error) {
      console.error('Failed to fetch countries:', error);
      setCountries([]);
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
      if (!response.ok) {
        throw new Error(`Failed to fetch states. Status: ${response.status}`);
      }
      const data = await response.json();
      
      if (data?.data?.states) {
        const stateList = data.data.states.map((s) => s.name).sort();
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
      const response = await fetch(`https://universities.hipolabs.com/search?country=${encodeURIComponent(countryName)}`);
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
    <div className="auth-shell bg-gradient-dark">
      <Container style={{ maxWidth: '640px' }}>
        <div className="text-center mb-4 animate-slideIn">
          <p className="eyebrow mb-2">Create account</p>
          <h2 className="fw-bold mb-2 brand-gradient">Join CodeLife</h2>
          <p className="text-muted">Personalize your security learning journey</p>
        </div>
        <Card className="card-glass border-0 shadow-lg animate-fadeIn">
          <Card.Body className="p-5">

            {error && (
              <Alert variant="danger" onClose={() => setError('')} dismissible aria-live="assertive">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              {/* Name */}
              <Form.Group className="mb-3">
                <Form.Label className={labelClass}>Full Name *</Form.Label>
                <Form.Control
                  type="text"
                  value={name}
                  placeholder="Enter your full name"
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="form-control"
                />
              </Form.Group>

              {/* Email */}
              <Form.Group className="mb-3">
                <Form.Label className={labelClass}>Email *</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  placeholder="you@example.com"
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-control"
                />
              </Form.Group>

              {/* Date of Birth */}
              <Form.Group className="mb-3">
                <Form.Label className={labelClass}>Date of Birth *</Form.Label>
                <Form.Control
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  required
                  className="form-control"
                  max={today}
                  aria-label="Date of birth"
                />
                <Form.Text className="text-muted">Please enter your date of birth (no future dates).</Form.Text>
              </Form.Group>

              {/* Gender */}
              <Form.Group className="mb-3">
                <Form.Label className={labelClass}>Gender *</Form.Label>
                <Form.Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  required
                  className="form-control"
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
                <Form.Label className={labelClass}>Country *</Form.Label>
                <Form.Select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                  className="form-control"
                >
                  <option value="">Select Country</option>
                  {countries.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </Form.Select>
              </Form.Group>

              {/* State */}
              <Form.Group className="mb-3">
                <Form.Label className={labelClass}>State/Region</Form.Label>
                <Form.Select
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="form-control"
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
                <Form.Label className={labelClass}>Institution/Organization</Form.Label>
                <Form.Control
                  type="text"
                  list="universities"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="form-control"
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
                <Form.Label className={labelClass}>Password *</Form.Label>
                <Form.Control
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="form-control"
                  aria-label="Password"
                />
                <Form.Text className="text-muted">Use at least 6 characters. Consider adding numbers and symbols for strength.</Form.Text>
              </Form.Group>

              {/* Confirm Password */}
              <Form.Group className="mb-4">
                <Form.Label className={labelClass}>Confirm Password *</Form.Label>
                <Form.Control
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Repeat your password"
                  className="form-control"
                  aria-label="Confirm password"
                />
                {confirmPassword && password !== confirmPassword && (
                  <Form.Text className="text-danger">Passwords do not match</Form.Text>
                )}
              </Form.Group>

              <Button
                disabled={loading}
                className="btn-modern-primary w-100 fw-semibold"
                type="submit"
                aria-disabled={loading}
              >
                {loading ? (
                  <>
                    <Spinner animation="border" size="sm" /> <span className="ms-2">Creating account...</span>
                  </>
                ) : (
                  'Sign Up'
                )}
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
