
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { formatCurrency, formatDate } from '../services/formatters';

export default function ProjectsPage() {
  const { role } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [minBudget, setMinBudget] = useState('');
  const [maxBudget, setMaxBudget] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (category && category !== 'all') params.append('category', category);
      if (minBudget) params.append('minBudget', minBudget);
      if (maxBudget) params.append('maxBudget', maxBudget);
      if (sortBy) params.append('sortBy', sortBy);

      const data = await api.get(`/projects?${params.toString()}`);
      setProjects(data.projects || []);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [category, sortBy]);

  const onFilterSubmit = (e) => {
    e.preventDefault();
    fetchProjects();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setMinBudget('');
    setMaxBudget('');
    setSortBy('newest');
    setTimeout(() => {
      api.get('/projects').then((data) => setProjects(data.projects || []));
    }, 50);
  };

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
              <h1>Explore Project Opportunities</h1>
              <p>Discover high-paying contracts across web development, design, and architecture.</p>
            </div>
            {role === 'CLIENT' && (
              <div>
                <Link to="/create-project" className="btn btn-primary">+ Post a New Project</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filter and Search Bar */}
        <form onSubmit={onFilterSubmit} className="filter-bar">
          <div className="filter-item" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="filter-search">Search Keywords</label>
            <input
              type="text"
              id="filter-search"
              className="form-control"
              placeholder="Search by title, skill (e.g. React, SQL)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="filter-category">Category</label>
            <select
              id="filter-category"
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Web Development">Web Development</option>
              <option value="Backend Development">Backend Development</option>
              <option value="UI/UX Design">UI/UX Design</option>
              <option value="Database">Database</option>
              <option value="Design & Branding">Design & Branding</option>
            </select>
          </div>

          <div className="filter-item" style={{ maxWidth: '130px' }}>
            <label className="form-label" htmlFor="filter-min-budget">Min Budget ($)</label>
            <input
              type="number"
              id="filter-min-budget"
              className="form-control"
              placeholder="500"
              min="0"
              value={minBudget}
              onChange={(e) => setMinBudget(e.target.value)}
            />
          </div>

          <div className="filter-item" style={{ maxWidth: '130px' }}>
            <label className="form-label" htmlFor="filter-max-budget">Max Budget ($)</label>
            <input
              type="number"
              id="filter-max-budget"
              className="form-control"
              placeholder="10000"
              min="0"
              value={maxBudget}
              onChange={(e) => setMaxBudget(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="filter-sort">Sort By</label>
            <select
              id="filter-sort"
              className="form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Newest First</option>
              <option value="budget_desc">Highest Budget</option>
              <option value="budget_asc">Lowest Budget</option>
              <option value="deadline">Soonest Deadline</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Filter</button>
            <button type="button" onClick={resetFilters} className="btn btn-outline" title="Reset Filters">↺</button>
          </div>
        </form>

        {/* Active Count */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <span style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
            {loading ? 'Loading projects...' : `Showing ${projects.length} available project${projects.length === 1 ? '' : 's'}`}
          </span>
        </div>

        {/* Projects Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>
          {loading ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading projects...
            </div>
          ) : projects.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '3rem' }}>
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h3>No projects found</h3>
                <p>Try adjusting your search keywords or budget filters.</p>
              </div>
            </div>
          ) : (
            projects.map((project) => (
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
    </>
  );
}

