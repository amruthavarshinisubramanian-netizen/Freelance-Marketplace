import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../services/toast';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password || !role) {
      showToast('Please fill in all fields.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Password must be at least 6 characters long.', 'error');
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        role: role.toUpperCase()
      });

      showToast('Account registered successfully! Welcome to FreelanceHub.', 'success');
      setTimeout(() => {
        if (role.toUpperCase() === 'CLIENT') {
          navigate('/client-dashboard');
        } else {
          navigate('/freelancer-dashboard');
        }
      }, 700);
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Create Your Account</h2>
        <p className="subtitle">Join the leading marketplace for freelance talent and clients</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="fullName">Full Name</label>
            <input
              type="text"
              id="fullName"
              className="form-control"
              placeholder="e.g. Jordan Lee"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">Work Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="jordan@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password (minimum 6 characters)</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">I want to join as:</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
              <label
                style={{
                  border: role === 'CLIENT' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: role === 'CLIENT' ? 'var(--primary-light)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="CLIENT"
                  checked={role === 'CLIENT'}
                  onChange={() => setRole('CLIENT')}
                />
                <div>
                  <strong>Client</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Hiring talent</div>
                </div>
              </label>

              <label
                style={{
                  border: role === 'FREELANCER' ? '2px solid var(--primary)' : '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: role === 'FREELANCER' ? 'var(--primary-light)' : 'transparent'
                }}
              >
                <input
                  type="radio"
                  name="role"
                  value="FREELANCER"
                  checked={role === 'FREELANCER'}
                  onChange={() => setRole('FREELANCER')}
                />
                <div>
                  <strong>Freelancer</strong>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Looking for work</div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Get Started Now'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 600 }}>Sign in</Link>
        </div>
      </div>
    </div>
  );
}

