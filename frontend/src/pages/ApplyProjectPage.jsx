import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ApplyProjectPage() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('id') || searchParams.get('projectId');
  const navigate = useNavigate();

  const [project, setProject] = useState(null);
  const [bidAmount, setBidAmount] = useState('');
  const [proposal, setProposal] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alreadyApplied, setAlreadyApplied] = useState(false);

  useEffect(() => {
    if (!projectId) {
      showToast('No project specified to apply for.', 'error');
      navigate('/projects');
      return;
    }

    async function loadProject() {
      try {
        const data = await api.get(`/projects/${projectId}`);
        setProject(data.project);
        if (data.hasApplied) {
          setAlreadyApplied(true);
        }
        if (data.project && data.project.budget) {
          setBidAmount(data.project.budget);
        }
      } catch (e) {
        showToast(e.message || 'Failed to load project details', 'error');
      } finally {
        setLoading(false);
      }
    }
    loadProject();
  }, [projectId, navigate]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!bidAmount || !proposal) {
      showToast('Please enter both bid amount and your proposal pitch.', 'error');
      return;
    }

    if (parseFloat(bidAmount) <= 0) {
      showToast('Bid amount must be greater than zero.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/applications', {
        projectId: parseInt(projectId, 10),
        bidAmount: parseFloat(bidAmount),
        proposal: proposal.trim()
      });

      showToast('Proposal submitted successfully! The client will review your bid.', 'success');
      setTimeout(() => {
        navigate('/my-applications');
      }, 800);
    } catch (err) {
      showToast(err.message || 'Failed to submit proposal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="container container-narrow" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading project details...</p>
      </div>
    );
  }

  if (alreadyApplied) {
    return (
      <div className="container container-narrow" style={{ marginTop: '3rem' }}>
        <div className="card" style={{ borderLeft: '4px solid var(--primary)', padding: '2rem', textAlign: 'center' }}>
          <h3>Already Applied</h3>
          <p style={{ color: 'var(--text-muted)', margin: '1rem 0' }}>
            You have already submitted a proposal for this project.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link to="/my-applications" className="btn btn-primary">View My Applications</Link>
            <Link to="/projects" className="btn btn-outline">Browse Other Projects</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="container container-narrow">
          <div className="page-header-actions">
            <div>
              <h1>Submit Your Project Proposal</h1>
              <p>Provide a competitive bid and detail how your expertise matches the client's needs.</p>
            </div>
            <Link to="/projects" className="btn btn-secondary btn-sm">← Back to Projects</Link>
          </div>
        </div>
      </div>

      <div className="container container-narrow" style={{ marginBottom: '4rem' }}>
        {/* Project Summary Card */}
        {project && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <div className="card-header">
              <div>
                <span className="badge badge-client" style={{ marginBottom: '0.25rem' }}>{project.category}</span>
                <h3 style={{ margin: 0 }}>{project.title}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Posted by {project.clientName} &bull; Deadline: {formatDate(project.deadline)}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Client Budget</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gray-900)' }}>
                  {formatCurrency(project.budget)}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Application Form */}
        <div className="card">
          <div className="card-header">
            <h3>Your Proposal Details</h3>
          </div>
          <div className="card-body" style={{ padding: '2rem' }}>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="bidAmount">Your Bid Amount (USD $) *</label>
                <input
                  type="number"
                  id="bidAmount"
                  className="form-control"
                  placeholder="e.g. 2400"
                  min="1"
                  step="10"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                  required
                  autoFocus
                />
                <div className="helper-text">You can bid higher, lower, or equal to the client's target budget.</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="proposal">Proposal Pitch &amp; Execution Plan *</label>
                <textarea
                  id="proposal"
                  className="form-textarea"
                  rows={7}
                  placeholder="Introduce yourself, explain your architectural approach, highlight similar projects you have built, and propose your milestone timeline..."
                  value={proposal}
                  onChange={(e) => setProposal(e.target.value)}
                  required
                  minLength={20}
                />
                <div className="helper-text">A clear, well-written pitch substantially increases your acceptance rate.</div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <Link to={`/projects/${projectId}`} className="btn btn-outline">Cancel</Link>
                <button type="submit" className="btn btn-success btn-lg" disabled={submitting}>
                  {submitting ? 'Submitting Proposal...' : 'Submit Proposal Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

