import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { showToast } from '../services/toast';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      showToast('Please log in to view this page.', 'error');
    } else if (!loading && user && allowedRoles.length > 0) {
      const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
      if (!normalizedAllowed.includes(role)) {
        showToast('Access denied: You do not have permission to view this page.', 'error');
      }
    }
  }, [loading, user, role, location.pathname]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  }

  if (allowedRoles.length > 0) {
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());
    if (!normalizedAllowed.includes(role)) {
      if (role === 'CLIENT') return <Navigate to="/client-dashboard" replace />;
      if (role === 'FREELANCER') return <Navigate to="/freelancer-dashboard" replace />;
      if (role === 'ADMIN') return <Navigate to="/admin-dashboard" replace />;
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

