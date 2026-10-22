import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ClientApplicationsPage() {
  const [searchParams] = useSearchParams();
  const initialProjectId = searchParams.get('projectId') || '';

  const [applications, setApplications] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(initialProjectId);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  // Load client's projects for filter dropdown
  useEffect(() => {
    async function fetchProjects() {
      try {
        const data = await api.get('/projects/client/my');
        setProjects(data.projects || []);
      } catch (e) {
        console.error('Failed to load client projects:', e);
      }
    }
    fetchProjects();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await api.get('/applications/client');
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

  const handleStatusUpdate = async (applicationId, newStatus) => {
    const confirmMsg =
      newStatus === 'ACCEPTED'
        ? 'Are you sure you want to accept this proposal? This will assign the freelancer and transition the project status to "In Progress".'
        : 'Are you sure you want to reject this proposal?';

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await api.put(`/applications/${applicationId}/status`, { status: newStatus });
      showToast(res.message || 'Proposal status updated successfully!', 'success');
      fetchApplications();
    } catch (e) {
      showToast(e.message || 'Status update failed', 'error');
    }
  };

  const filtered = applications.filter((app) => {
    if (selectedProject && String(app.projectId) !== String(selectedProject)) return false;
    if (selectedStatus && selectedStatus !== 'all') {
      if ((app.status || '').toUpperCase() !== selectedStatus.toUpperCase()) return false;
    }
    return true;
  });

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <h1>Review Received Proposals</h1>
              <p>Evaluate pitches, compare freelancer bids, and award projects.</p>
            </div>
            <Link to="/client-dashboard" className="btn btn-secondary btn-sm">← Back to Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filter Bar */}
        <div className="filter-bar">
          <div className="filter-item" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="filter-project-select">Filter by Project</label>
            <select
              id="filter-project-select"
              className="form-select"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
            >
              <option value="">All My Projects</option>
              {projects.map((p) => (
                <option key={p.projectId} value={p.projectId}>
                  {p.title}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="filter-app-status">Status</label>
            <select
              id="filter-app-status"
              className="form-select"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="PENDING">Pending Review</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>

        {/* Applications List */}
        <div style={{ marginBottom: '4rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem' }}>Loading proposals...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📬</div>
              <h3>No applications found</h3>
              <p>There are no proposals matching the selected filters.</p>
            </div>
          ) : (
            filtered.map((app) => {
              const statusUpper = (app.status || '').toUpperCase();
              const isPending = statusUpper === 'PENDING';
              let badgeClass = 'badge-pending';
              let borderLeftColor = 'var(--warning)';

              if (statusUpper === 'ACCEPTED') {
                badgeClass = 'badge-accepted';
                borderLeftColor = 'var(--success)';
              } else if (statusUpper === 'REJECTED') {
                badgeClass = 'badge-rejected';
                borderLeftColor = 'var(--danger)';
              }

              return (
                <div key={app.applicationId} className="card" style={{ borderLeft: `4px solid ${borderLeftColor}`, marginBottom: '1.5rem' }}>
                  <div className="card-header">
                    <div>
                      <h3 style={{ marginBottom: '0.25rem' }}>{app.freelancerName}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Email: {app.freelancerEmail} &bull; Submitted: {formatDate(app.appliedAt)}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span className={`badge ${badgeClass}`}>{app.status}</span>
                      <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gray-900)', marginTop: '0.25rem' }}>
                        Bid: {formatCurrency(app.bidAmount)}
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      Project: <strong><Link to={`/projects/${app.projectId}`}>{app.projectTitle}</Link></strong>
                      {app.projectBudget && ` (Project Budget: ${formatCurrency(app.projectBudget)})`}
                    </div>
                    <div
                      style={{
                        backgroundColor: 'var(--gray-50)',
                        padding: '1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid var(--border-color)',
                        fontSize: '0.95rem',
                        whiteSpace: 'pre-wrap'
                      }}
                    >
                      {app.proposal}
                    </div>
                  </div>
                  {isPending && (
                    <div className="card-footer" style={{ justifyContent: 'flex-end', gap: '0.75rem' }}>
                      <button
                        onClick={() => handleStatusUpdate(app.applicationId, 'REJECTED')}
                        className="btn btn-outline btn-sm"
                      >
                        Reject Proposal
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(app.applicationId, 'ACCEPTED')}
                        className="btn btn-success btn-sm"
                      >
                        ✓ Accept Proposal &amp; Assign
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

