import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatCurrency, formatDate } from '../services/formatters';

export default function HomePage() {
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeatured() {
      try {
        const data = await api.get('/projects?status=OPEN');
        const list = (data.projects || []).slice(0, 3);
        setFeaturedProjects(list);
      } catch (e) {
        console.error('Failed to load featured projects:', e);
      } finally {
        setLoading(false);
      }
    }
    loadFeatured();
  }, []);

  const getStatusBadge = (status) => {
    const s = (status || '').toUpperCase();
    if (s === 'OPEN') return <span className="badge badge-open">Open</span>;
    if (s === 'IN_PROGRESS' || s === 'IN PROGRESS') return <span className="badge badge-in-progress">In Progress</span>;
    if (s === 'COMPLETED') return <span className="badge badge-completed">Completed</span>;
    return <span className="badge badge-cancelled">Cancelled</span>;
  };

  return (
    <>
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <span className="hero-tagline">🚀 Connect &bull; Collaborate &bull; Deliver</span>
          <h1>
            Where Top Clients Hire <br />
            <span className="gradient-text">World-Class Freelancers</span>
          </h1>
          <p>
            A modern, secure marketplace platform for web development, UI/UX design, database engineering, and digital solutions. Post projects or land high-paying contracts with verified clients.
          </p>
          <div className="hero-cta">
            <Link to="/projects" className="btn btn-primary btn-lg">Explore Open Projects</Link>
            <Link to="/register" className="btn btn-outline btn-lg">Join as a Freelancer or Client</Link>
          </div>
        </div>
      </section>

      {/* Platform Stats Bar */}
      <div className="container" style={{ marginTop: '-2rem', position: 'relative', zIndex: 10 }}>
        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>💼</div>
            <div className="metric-info">
              <h4>Active Projects</h4>
              <div className="metric-value">5+</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>👥</div>
            <div className="metric-info">
              <h4>Verified Talent</h4>
              <div className="metric-value">100%</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: 'var(--warning-light)', color: 'var(--warning)' }}>⚡</div>
            <div className="metric-info">
              <h4>Fast Proposals</h4>
              <div className="metric-value">&lt; 24 hrs</div>
            </div>
          </div>
          <div className="metric-card">
            <div className="metric-icon" style={{ backgroundColor: '#ede9fe', color: '#6b21a8' }}>🔒</div>
            <div className="metric-info">
              <h4>Enterprise Security</h4>
              <div className="metric-value">MySQL &amp; JWT</div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <section className="container" style={{ padding: '4rem 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.5rem' }}>
            How FreelanceHub Works
          </h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto' }}>
            Streamlined hiring workflow designed for clear milestones, trusted relationships, and successful delivery.
          </p>
        </div>

        <div className="feature-grid" style={{ margin: 0 }}>
          <div className="feature-card">
            <div className="feature-icon">1</div>
            <h3>Post or Discover Gigs</h3>
            <p>Clients post custom project specifications with clear budgets and deadlines. Freelancers discover curated projects matching their skill set.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">2</div>
            <h3>Bid &amp; Review Proposals</h3>
            <p>Freelancers submit competitive bids with detailed execution plans. Clients compare proposals, evaluate skills, and choose the ideal match.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">3</div>
            <h3>Assign &amp; Deliver</h3>
            <p>Upon proposal acceptance, the contract automatically transitions to active development with dedicated client-freelancer collaboration.</p>
          </div>
        </div>
      </section>

      {/* Featured Projects Section */}
      <section style={{ backgroundColor: 'var(--gray-50)', borderTop: '1px solid var(--border-color)', padding: '4rem 0' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '0.25rem' }}>
                Featured Open Projects
              </h2>
              <p style={{ color: 'var(--text-muted)' }}>Recent opportunities posted by verified clients.</p>
            </div>
            <Link to="/projects" className="btn btn-outline btn-sm">View All Projects →</Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            {loading ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                Loading featured opportunities...
              </div>
            ) : featuredProjects.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '2rem' }}>
                No open projects at this time.
              </div>
            ) : (
              featuredProjects.map((project) => (
                <div key={project.projectId} className="project-card">
                  <div className="project-card-header">
                    <div>
                      <span className="badge badge-client" style={{ marginBottom: '0.35rem' }}>{project.category}</span>
                      <h3 className="project-title">
                        <Link to={`/projects/${project.projectId}`}>{project.title}</Link>
                      </h3>
                      <div className="project-client">By {project.clientName}</div>
                    </div>
                    {getStatusBadge(project.status)}
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
                      View Details →
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}

