import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';

export default function AdminDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await api.get('/admin/dashboard');
        setData(res);
      } catch (e) {
        console.error('Failed to load admin stats:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboard();
  }, []);

  const stats = data?.stats || {};
  const users = stats.users || {};
  const projects = stats.projects || {};
  const apps = stats.applications || {};
  const recentProjects = data?.recentProjects || [];
  const recentUsers = data?.recentUsers || [];

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN') return <span className="badge badge-open">Open</span>;
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return <span className="badge badge-in-progress">In Progress</span>;
    if (s === 'COMPLETED') return <span className="badge badge-completed">Completed</span>;
    return <span className="badge badge-cancelled">Cancelled</span>;
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return <span className="badge badge-admin">Admin</span>;
    if (r === 'CLIENT') return <span className="badge badge-client">Client</span>;
    return <span className="badge badge-freelancer">Freelancer</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <h1>Platform Administration &amp; Analytics</h1>
              <p>Real-time metrics, system volume, user accounts, and moderation controls.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Link to="/manage-users" className="btn btn-outline btn-sm">👥 Manage Users</Link>
              <Link to="/manage-projects" className="btn btn-outline btn-sm">💼 Manage Projects</Link>
              <Link to="/manage-applications" className="btn btn-outline btn-sm">📄 Manage Applications</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stat Metrics Grid */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>👥</div>
            <div className="metric-info">
              <h4>Total Users</h4>
              <div className="metric-value">{users.totalUsers ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: '#ede9fe', color: '#6b21a8' }}>💼</div>
            <div className="metric-info">
              <h4>Clients</h4>
              <div className="metric-value">{users.totalClients ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>💻</div>
            <div className="metric-info">
              <h4>Freelancers</h4>
              <div className="metric-value">{users.totalFreelancers ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>💰</div>
            <div className="metric-info">
              <h4>Project Volume</h4>
              <div className="metric-value">{formatCurrency(projects.totalProjectValue || 0)}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>📁</div>
            <div className="metric-info">
              <h4>Total Projects</h4>
              <div className="metric-value">{projects.totalProjects ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>🟢</div>
            <div className="metric-info">
              <h4>Open Projects</h4>
              <div className="metric-value">{projects.openProjects ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: '#fef3c7', color: '#92400e' }}>📝</div>
            <div className="metric-info">
              <h4>Total Applications</h4>
              <div className="metric-value">{apps.totalApplications ?? 0}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>🤝</div>
            <div className="metric-info">
              <h4>Accepted Bids</h4>
              <div className="metric-value">{apps.acceptedApplications ?? 0}</div>
            </div>
          </div>
        </div>

        {/* Dual Table Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {/* Recent Projects */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>Recent Project Postings</h3>
              <Link to="/manage-projects" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="table-container" style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Client</th>
                    <th>Budget</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading recent projects...</td>
                    </tr>
                  ) : recentProjects.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem' }}>No projects found.</td>
                    </tr>
                  ) : (
                    recentProjects.map((p) => (
                      <tr key={p.projectId}>
                        <td>
                          <Link to={`/projects/${p.projectId}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</div>
                        </td>
                        <td>{p.clientName}</td>
                        <td style={{ fontWeight: 700 }}>{formatCurrency(p.budget)}</td>
                        <td>{getStatusBadge(p.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div className="card" style={{ marginBottom: 0 }}>
            <div className="card-header">
              <h3>Recent User Registrations</h3>
              <Link to="/manage-users" className="btn btn-outline btn-sm">View All →</Link>
            </div>
            <div className="table-container" style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>User &amp; Email</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading users...</td>
                    </tr>
                  ) : recentUsers.length === 0 ? (
                    <tr>
                      <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem' }}>No users found.</td>
                    </tr>
                  ) : (
                    recentUsers.map((u) => (
                      <tr key={u.userId}>
                        <td>
                          <strong>{u.fullName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td>{formatDate(u.createdAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

