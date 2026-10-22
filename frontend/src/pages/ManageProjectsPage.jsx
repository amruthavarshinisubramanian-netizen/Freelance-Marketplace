import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ManageProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/projects');
      setProjects(data.projects || []);
    } catch (e) {
      showToast(e.message || 'Failed to load projects', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (projectId, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/projects/${projectId}`);
      showToast(res.message || 'Project deleted successfully.', 'success');
      fetchProjects();
    } catch (e) {
      showToast(e.message || 'Failed to delete project', 'error');
    }
  };

  const filtered = projects.filter((p) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchTitle = (p.title || '').toLowerCase().includes(s);
      const matchClient = (p.clientName || '').toLowerCase().includes(s);
      if (!matchTitle && !matchClient) return false;
    }
    if (statusFilter !== 'all') {
      if ((p.status || '').toUpperCase() !== statusFilter.toUpperCase()) return false;
    }
    return true;
  });

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
              <h1>Project Moderation &amp; Management</h1>
              <p>Monitor all client postings across categories, inspect details, and remove inappropriate content.</p>
            </div>
            <Link to="/admin-dashboard" className="btn btn-secondary btn-sm">← Back to Analytics</Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="proj-search">Search Projects</label>
            <input
              type="text"
              id="proj-search"
              className="form-control"
              placeholder="Search by title or client name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="proj-status-filter">Status Filter</label>
            <select
              id="proj-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {loading ? 'Loading projects...' : `Showing ${filtered.length} platform project${filtered.length === 1 ? '' : 's'}`}
        </div>

        {/* Projects Table */}
        <div className="card" style={{ marginBottom: '4rem' }}>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Title &amp; Category</th>
                  <th>Client</th>
                  <th>Budget</th>
                  <th>Status</th>
                  <th>Proposals</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>Loading platform projects...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>No projects found.</td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.projectId}>
                      <td>
                        <Link to={`/projects/${p.projectId}`} style={{ fontWeight: 600 }}>{p.title}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</div>
                      </td>
                      <td>
                        <strong>{p.clientName}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.clientEmail}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(p.budget)}</td>
                      <td>{getStatusBadge(p.status)}</td>
                      <td>
                        <span className="badge badge-pending">{p.applicationCount || 0} bids</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <Link to={`/projects/${p.projectId}`} className="btn btn-outline btn-sm">View</Link>
                          <button
                            onClick={() => handleDelete(p.projectId, p.title)}
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--danger)' }}
                          >
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

