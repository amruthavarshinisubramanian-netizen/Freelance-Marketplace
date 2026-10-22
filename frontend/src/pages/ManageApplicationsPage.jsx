import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ManageApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.get('/admin/applications');
      setApplications(data.applications || []);
    } catch (e) {
      showToast(e.message || 'Failed to load applications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleDelete = async (applicationId) => {
    if (!window.confirm('Are you sure you want to delete this application?')) {
      return;
    }
    try {
      const res = await api.delete(`/admin/applications/${applicationId}`);
      showToast(res.message || 'Application deleted successfully.', 'success');
      fetchApplications();
    } catch (e) {
      showToast(e.message || 'Failed to delete application', 'error');
    }
  };

  const filtered = applications.filter((app) => {
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchProj = (app.projectTitle || '').toLowerCase().includes(s);
      const matchFree = (app.freelancerName || '').toLowerCase().includes(s);
      const matchClient = (app.clientName || '').toLowerCase().includes(s);
      if (!matchProj && !matchFree && !matchClient) return false;
    }
    if (statusFilter !== 'all') {
      if ((app.status || '').toUpperCase() !== statusFilter.toUpperCase()) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'PENDING') return <span className="badge badge-pending">Pending</span>;
    if (s === 'ACCEPTED') return <span className="badge badge-accepted">Accepted</span>;
    if (s === 'REJECTED') return <span className="badge badge-rejected">Rejected</span>;
    return <span className="badge badge-cancelled">{status}</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <h1>Applications &amp; Proposals Oversight</h1>
              <p>Supervise all bids across projects, verify proposal activity, and moderate records.</p>
            </div>
            <Link to="/admin-dashboard" className="btn btn-secondary btn-sm">← Back to Analytics</Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="apps-search">Search Applications</label>
            <input
              type="text"
              id="apps-search"
              className="form-control"
              placeholder="Search by project title, freelancer, or client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="apps-status-filter">Status Filter</label>
            <select
              id="apps-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {loading ? 'Loading applications...' : `Showing ${filtered.length} proposal record${filtered.length === 1 ? '' : 's'}`}
        </div>

        {/* Applications Table */}
        <div className="card" style={{ marginBottom: '4rem' }}>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Target Project</th>
                  <th>Freelancer</th>
                  <th>Bid Amount</th>
                  <th>Proposal Status</th>
                  <th>Applied Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>Loading platform applications...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>No applications found.</td>
                  </tr>
                ) : (
                  filtered.map((app) => (
                    <tr key={app.applicationId}>
                      <td>
                        <Link to={`/projects/${app.projectId}`} style={{ fontWeight: 600 }}>{app.projectTitle}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Client: {app.clientName} &bull; Budget: {formatCurrency(app.projectBudget)}
                        </div>
                      </td>
                      <td>
                        <strong>{app.freelancerName}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.freelancerEmail}</div>
                      </td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(app.bidAmount)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{formatDate(app.appliedAt)}</td>
                      <td>
                        <button
                          onClick={() => handleDelete(app.applicationId)}
                          className="btn btn-outline btn-sm"
                          style={{ color: 'var(--danger)' }}
                        >
                          Delete
                        </button>
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

