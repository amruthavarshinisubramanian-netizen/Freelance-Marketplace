import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchApps() {
      try {
        const data = await api.get('/applications/my');
        setApplications(data.applications || []);
      } catch (e) {
        console.error('Failed to load applications:', e);
      } finally {
        setLoading(false);
      }
    }
    fetchApps();
  }, []);

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
              <h1>My Submitted Proposals</h1>
              <p>Track proposal status, bid amounts, and responses from clients in real time.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/projects" className="btn btn-primary">Find More Work</Link>
              <Link to="/freelancer-dashboard" className="btn btn-secondary">Dashboard</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <div style={{ marginBottom: '1.5rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {loading ? 'Loading applications...' : `Showing ${applications.length} submitted proposal${applications.length === 1 ? '' : 's'}`}
        </div>

        <div className="card" style={{ marginBottom: '4rem' }}>
          <div className="table-container" style={{ marginBottom: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Project &amp; Client</th>
                  <th>Client Budget</th>
                  <th>My Bid</th>
                  <th>Status</th>
                  <th>Submitted Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>Loading your applications...</td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '3rem' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📬</div>
                        <h3>No submitted proposals</h3>
                        <p>You haven't submitted any proposals yet. Check available projects.</p>
                        <Link to="/projects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                          Browse Projects
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr key={app.applicationId}>
                      <td>
                        <Link to={`/projects/${app.projectId}`} style={{ fontWeight: 600 }}>{app.projectTitle}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Client: {app.clientName} ({app.clientEmail})
                        </div>
                      </td>
                      <td>{formatCurrency(app.projectBudget)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(app.bidAmount)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{formatDate(app.appliedAt)}</td>
                      <td>
                        <Link to={`/projects/${app.projectId}`} className="btn btn-outline btn-sm">
                          View Project
                        </Link>
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

