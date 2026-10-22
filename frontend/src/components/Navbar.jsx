import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogout = () => {
    logout(true);
    navigate('/login');
  };

  const isActive = (target) => {
    if (target === '/' && path === '/') return true;
    if (target !== '/' && (path === target || path === `${target}.html`)) return true;
    return false;
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          <span className="logo-icon">F</span>
          <span>FreelanceHub</span>
        </Link>

        <ul className="nav-links">
          {!user && (
            <>
              <li><Link to="/" className={isActive('/') ? 'active' : ''}>Home</Link></li>
              <li><Link to="/projects" className={isActive('/projects') ? 'active' : ''}>Browse Projects</Link></li>
            </>
          )}

          {role === 'CLIENT' && (
            <>
              <li><Link to="/client-dashboard" className={isActive('/client-dashboard') ? 'active' : ''}>Dashboard</Link></li>
              <li><Link to="/create-project" className={isActive('/create-project') ? 'active' : ''}>Post Project</Link></li>
              <li><Link to="/client-applications" className={isActive('/client-applications') ? 'active' : ''}>Applications</Link></li>
              <li><Link to="/projects" className={isActive('/projects') ? 'active' : ''}>Browse All</Link></li>
            </>
          )}

          {role === 'FREELANCER' && (
            <>
              <li><Link to="/freelancer-dashboard" className={isActive('/freelancer-dashboard') ? 'active' : ''}>Dashboard</Link></li>
              <li><Link to="/projects" className={isActive('/projects') ? 'active' : ''}>Find Work</Link></li>
              <li><Link to="/my-applications" className={isActive('/my-applications') ? 'active' : ''}>My Applications</Link></li>
            </>
          )}

          {role === 'ADMIN' && (
            <>
              <li><Link to="/admin-dashboard" className={isActive('/admin-dashboard') ? 'active' : ''}>Analytics</Link></li>
              <li><Link to="/manage-users" className={isActive('/manage-users') ? 'active' : ''}>Users</Link></li>
              <li><Link to="/manage-projects" className={isActive('/manage-projects') ? 'active' : ''}>Projects</Link></li>
              <li><Link to="/manage-applications" className={isActive('/manage-applications') ? 'active' : ''}>Applications</Link></li>
            </>
          )}
        </ul>

        <div className="nav-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-outline btn-sm">Log In</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </>
          ) : (
            <>
              <div className="nav-user-badge">
                <span>{user.fullName}</span>
                <span className="role-pill">
                  {role === 'ADMIN' ? 'Admin' : (role === 'CLIENT' ? 'Client' : 'Freelancer')}
                </span>
              </div>
              <button onClick={handleLogout} className="btn btn-outline btn-sm">
                Sign Out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

