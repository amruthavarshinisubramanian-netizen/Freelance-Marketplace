import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClientProjects = async () => {
    try {
      const data = await api.get('/projects/client/my');
      setProjects(data.projects || []);
    } catch (e) {
      showToast(e.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClientProjects();
  }, []);

  const handleDelete = async (projectId) => {
    if (!window.confirm('Are you sure you want to delete this project? This will remove all associated applications.')) {
      return;
    }
    try {
      await api.delete(`/projects/${projectId}`);
      showToast('Project deleted successfully.', 'success');
      fetchClientProjects();
    } catch (e) {
      showToast(e.message || 'Failed to delete project', 'error');
    }
  };

  const total = projects.length;
  const openCount = projects.filter((p) => (p.status || '').toUpperCase() === 'OPEN').length;
  const progressCount = projects.filter((p) => (p.status || '').toUpperCase() === 'IN_PROGRESS' || (p.status || '').toUpperCase() === 'IN PROGRESS').length;
  const totalProposals = projects.reduce((acc, p) => acc + (p.applicationCount || 0), 0);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN') return <span className="badge badge-open">Open</span>;
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return <span className="badge badge-in-progress">In Progress</span>;
    if (s === 'COMPLETED') return <span className="badge badge-completed">Completed</span>;
    return <span className="badge badge-cancelled">Cancelled</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <h1>Client Dashboard</h1>
              <p>Manage your job postings, evaluate freelancer proposals, and track active contracts.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/create-project" className="btn btn-primary">+ Post New Project</Link>
              <Link to="/client-applications" className="btn btn-outline">Review Proposals</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stat Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>📁</div>
            <div className="metric-info">
              <h4>Total Projects</h4>
              <div className="metric-value">{total}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>🟢</div>
            <div className="metric-info">
              <h4>Open Projects</h4>
              <div className="metric-value">{openCount}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>⚡</div>
            <div className="metric-info">
              <h4>In Progress</h4>
              <div className="metric-value">{progressCount}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: '#ede9fe', color: '#6b21a8' }}>📩</div>
            <div className="metric-info">
              <h4>Total Proposals</h4>
              <div className="metric-value">{totalProposals}</div>
            </div>
          </div>
        </div>

        {/* Client Projects Table */}
        <div className="card" style={{ marginBottom: '4rem' }}>
          <div className="card-header">
            <h2>My Posted Projects</h2>
            <Link to="/create-project" className="btn btn-primary btn-sm">+ Post Project</Link>
          </div>
          <div className="table-container" style={{ marginBottom: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Project Title &amp; Category</th>
                  <th>Budget</th>
                  <th>Deadline</th>
                  <th>Status</th>
                  <th>Proposals</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading your projects...</td>
                  </tr>
                ) : projects.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📋</div>
                        <h3>No projects posted yet</h3>
                        <p>Get started by publishing your first freelance project requirements.</p>
                        <Link to="/create-project" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                          + Post a Project
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  projects.map((p) => (
                    <tr key={p.projectId}>
                      <td>
                        <Link to={`/projects/${p.projectId}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(p.budget)}</td>
                      <td>{formatDate(p.deadline)}</td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td>
                        <Link to={`/client-applications?projectId=${p.projectId}`} className="badge badge-pending">
                          {p.applicationCount || 0} received
                        </Link>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          <Link to={`/projects/${p.projectId}`} className="btn btn-secondary btn-sm">View</Link>
                          <Link to={`/create-project?edit=${p.projectId}`} className="btn btn-outline btn-sm">Edit</Link>
                          <button onClick={() => handleDelete(p.projectId)} className="btn btn-outline btn-sm" style={{ color: 'var(--danger)' }}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

