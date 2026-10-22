import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../services/toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const handleLogin = async (loginEmail, loginPass) => {
    if (loading) return;
    setLoading(true);
    try {
      const data = await login(loginEmail, loginPass);
      showToast(`Welcome back, ${data.user.fullName}!`, 'success');

      const redirect = searchParams.get('redirect');
      setTimeout(() => {
        if (redirect) {
          navigate(redirect);
        } else {
          const userRole = (data.user.role || '').toUpperCase();
          if (userRole === 'ADMIN') navigate('/admin-dashboard');
          else if (userRole === 'CLIENT') navigate('/client-dashboard');
          else if (userRole === 'FREELANCER') navigate('/freelancer-dashboard');
          else navigate('/');
        }
      }, 500);
    } catch (err) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter both email and password.', 'error');
      return;
    }
    handleLogin(email, password);
  };

  const autofillAdmin = () => {
    setEmail('admin@marketplace.com');
    setPassword('Admin@123');
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="subtitle">Log in to your FreelanceHub account</p>

        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            style={{ marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className="demo-credentials-box">
          <h4>⚡ Development Admin Demo Shortcut</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.25rem 0 0.75rem' }}>
            Click to fill verified admin credentials, then click Sign In to authenticate.
          </p>
          <div className="demo-btn-group" style={{ justifyContent: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={autofillAdmin}
            >
              🛡️ Autofill Admin Credentials
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Don't have an account yet? <Link to="/register" style={{ fontWeight: 600 }}>Create an account</Link>
        </div>
      </div>
    </div>
  );
}

