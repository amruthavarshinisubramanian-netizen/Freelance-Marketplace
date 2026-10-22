import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../services/formatters';

export default function ProjectDetailsPage() {
  const { id } = useParams();
  const { user, role } = useAuth();
  const [project, setProject] = useState(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchProject() {
      try {
        const data = await api.get(`/projects/${id}`);
        setProject(data.project);
        setHasApplied(data.hasApplied);
      } catch (err) {
        setError(err.message || 'Failed to load project details');
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN') return <span className="badge badge-open">Open</span>;
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return <span className="badge badge-in-progress">In Progress</span>;
    if (s === 'COMPLETED') return <span className="badge badge-completed">Completed</span>;
    return <span className="badge badge-cancelled">Cancelled</span>;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="container" style={{ marginTop: '2rem' }}>
        <div className="alert alert-danger">{error || 'Project not found.'}</div>
        <Link to="/projects" className="btn btn-outline">Back to Projects</Link>
      </div>
    );
  }

  const isOwner = user && project.clientId && user.userId === project.clientId;
  const isOpen = (project.status || '').toUpperCase() === 'OPEN';

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <span className="badge badge-client">{project.category}</span>
                {getStatusBadge(project.status)}
              </div>
              <h1>{project.title}</h1>
              <p>Posted by <strong>{project.clientName}</strong> on {formatDate(project.createdAt)}</p>
            </div>
            <Link to="/projects" className="btn btn-secondary">← Back to Catalog</Link>
          </div>
        </div>
      </div>

      <div className="container">
        <div className="detail-grid">
          {/* Main Content */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3>Project Description</h3>
              </div>
              <div className="card-body">
                <div style={{ whiteSpace: 'pre-wrap', fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--gray-800)' }}>
                  {project.description}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3>Required Skills &amp; Technologies</h3>
              </div>
              <div className="card-body">
                <div className="project-skills">
                  {(project.requiredSkills || '').split(',').map((skill, idx) => (
                    <span key={idx} className="skill-pill">{skill.trim()}</span>
                  ))}
                </div>
              </div>
            </div>

            {project.assignedFreelancerName && (
              <div className="card" style={{ borderLeft: '4px solid var(--success)' }}>
                <div className="card-header">
                  <h3>Assigned Freelancer</h3>
                  <span className="badge badge-accepted">Active Assignment</span>
                </div>
                <div className="card-body">
                  <p><strong>Freelancer:</strong> {project.assignedFreelancerName}</p>
                  <p style={{ marginTop: '0.35rem' }}><strong>Status:</strong> Contract in progress</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3>Project Summary</h3>
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Client Budget</div>
                  <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--gray-900)' }}>{formatCurrency(project.budget)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Submission Deadline</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{formatDate(project.deadline)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Total Proposals</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 600 }}>{project.applicationCount || 0} received</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>Client Contact</div>
                  <div style={{ fontSize: '0.95rem', color: 'var(--gray-700)' }}>{project.clientEmail}</div>
                </div>
              </div>
            </div>

            {/* Action CTA depending on user state */}
            {!user ? (
              <div className="card">
                <div className="card-body" style={{ textAlign: 'center' }}>
                  <h3>Interested in this project?</h3>
                  <p style={{ color: 'var(--text-muted)', margin: '0.5rem 0 1.25rem' }}>Sign in to submit your proposal.</p>
                  <Link to={`/login?redirect=/projects/${project.projectId}`} className="btn btn-primary btn-block">Log In to Apply</Link>
                </div>
              </div>
            ) : role === 'FREELANCER' ? (
              hasApplied ? (
                <div className="card" style={{ borderLeft: '4px solid var(--primary)' }}>
                  <div className="card-body">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ fontWeight: 700 }}>Your Proposal</h4>
                      <span className="badge badge-pending">Submitted</span>
                    </div>
                    <p style={{ fontSize: '0.9rem', color: 'var(--gray-600)', marginBottom: '0.75rem' }}>
                      You have submitted a proposal for this project. Track its review in your dashboard.
                    </p>
                    <Link to="/my-applications" className="btn btn-outline btn-block btn-sm">
                      View My Applications
                    </Link>
                  </div>
                </div>
              ) : isOpen ? (
                <div className="card">
                  <div className="card-body">
                    <h3 style={{ marginBottom: '0.5rem' }}>Ready to take on this project?</h3>
                    <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                      Submit your custom proposal and bid amount to the client.
                    </p>
                    <Link to={`/apply-project?id=${project.projectId}`} className="btn btn-success btn-block btn-lg">
                      Submit Proposal
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning">
                  This project is currently {project.status} and is no longer accepting new proposals.
                </div>
              )
            ) : isOwner ? (
              <div className="card">
                <div className="card-body">
                  <h3 style={{ marginBottom: '0.5rem' }}>Project Management</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>You posted this project.</p>
                  <Link
                    to={`/client-applications?projectId=${project.projectId}`}
                    className="btn btn-primary btn-block"
                    style={{ marginBottom: '0.5rem' }}
                  >
                    Review Applications ({project.applicationCount || 0})
                  </Link>
                  <Link to={`/create-project?edit=${project.projectId}`} className="btn btn-outline btn-block">
                    Edit Details
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}

