import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';

export default function FreelancerDashboardPage() {
  const [applications, setApplications] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [appData, projData] = await Promise.all([
          api.get('/applications/my'),
          api.get('/projects?status=OPEN')
        ]);
        setApplications(appData.applications || []);
        setRecommended((projData.projects || []).slice(0, 3));
      } catch (e) {
        console.error('Failed to load dashboard data:', e);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const total = applications.length;
  const pending = applications.filter((a) => (a.status || '').toUpperCase() === 'PENDING').length;
  const accepted = applications.filter((a) => (a.status || '').toUpperCase() === 'ACCEPTED').length;
  const rejected = applications.filter((a) => (a.status || '').toUpperCase() === 'REJECTED').length;

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
              <h1>Freelancer Dashboard</h1>
              <p>Monitor your active proposals, accepted gigs, and explore new project postings.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <Link to="/projects" className="btn btn-primary">Find New Work</Link>
              <Link to="/my-applications" className="btn btn-outline">My Applications</Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stat Cards */}
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>📝</div>
            <div className="metric-info">
              <h4>Total Proposals</h4>
              <div className="metric-value">{total}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>⏳</div>
            <div className="metric-info">
              <h4>Pending Review</h4>
              <div className="metric-value">{pending}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>🎉</div>
            <div className="metric-info">
              <h4>Accepted Bids</h4>
              <div className="metric-value">{accepted}</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}>✕</div>
            <div className="metric-info">
              <h4>Rejected</h4>
              <div className="metric-value">{rejected}</div>
            </div>
          </div>
        </div>

        {/* Recent Applications Table */}
        <div className="card">
          <div className="card-header">
            <h2>Recent Proposals</h2>
            <Link to="/my-applications" className="btn btn-outline btn-sm">View All Proposals →</Link>
          </div>
          <div className="table-container" style={{ marginBottom: 0, border: 'none', boxShadow: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Project Title &amp; Category</th>
                  <th>Client Budget</th>
                  <th>My Bid</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading your proposals...</td>
                  </tr>
                ) : applications.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2.5rem' }}>
                      <div className="empty-state">
                        <div className="empty-state-icon">📝</div>
                        <h3>No proposals submitted yet</h3>
                        <p>Browse open projects and submit your first pitch today.</p>
                        <Link to="/projects" className="btn btn-primary" style={{ marginTop: '1rem' }}>
                          Find Projects
                        </Link>
                      </div>
                    </td>
                  </tr>
                ) : (
                  applications.slice(0, 5).map((app) => (
                    <tr key={app.applicationId}>
                      <td>
                        <Link to={`/projects/${app.projectId}`} style={{ fontWeight: 600 }}>{app.projectTitle}</Link>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{app.projectCategory}</div>
                      </td>
                      <td>{formatCurrency(app.projectBudget)}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(app.bidAmount)}</td>
                      <td>{getStatusBadge(app.status)}</td>
                      <td>{formatDate(app.appliedAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recommended Opportunities */}
        <div style={{ margin: '3rem 0 4rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h2>Recommended Projects For You</h2>
            <Link to="/projects" className="btn btn-outline btn-sm">Browse All →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {recommended.map((project) => (
              <div key={project.projectId} className="project-card">
                <div className="project-card-header">
                  <div>
                    <span className="badge badge-client" style={{ marginBottom: '0.35rem' }}>{project.category}</span>
                    <h3 className="project-title">
                      <Link to={`/projects/${project.projectId}`}>{project.title}</Link>
                    </h3>
                    <div className="project-client">By {project.clientName}</div>
                  </div>
                  <span className="badge badge-open">Open</span>
                </div>

                <div className="project-card-body">
                  <p className="project-desc">{project.description}</p>
                  <div className="project-skills">
                    {(project.requiredSkills || '').split(',').map((skill, idx) => (
                      <span key={idx} className="skill-pill">{skill.trim()}</span>
                    ))}
                  </div>
                </div>

                <div className="project-card-footer">
                  <div>
                    <div className="project-meta">Budget: <span className="price-tag">{formatCurrency(project.budget)}</span></div>
                    <div className="project-meta" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Deadline: {formatDate(project.deadline)}
                    </div>
                  </div>
                  <Link to={`/projects/${project.projectId}`} className="btn btn-outline btn-sm">
                    View &amp; Apply →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

