import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { showToast } from '../services/toast';

export default function CreateProjectPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit') || searchParams.get('id');
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [deadline, setDeadline] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [requiredSkills, setRequiredSkills] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(!!editId);

  useEffect(() => {
    if (editId) {
      async function loadProject() {
        try {
          const data = await api.get(`/projects/${editId}`);
          const p = data.project;
          setTitle(p.title);
          setCategory(p.category);
          setBudget(p.budget);
          setDeadline(p.deadline ? p.deadline.substring(0, 10) : '');
          setStatus(p.status);
          setRequiredSkills(p.requiredSkills);
          setDescription(p.description);
        } catch (e) {
          showToast(e.message || 'Failed to load project details for editing', 'error');
        } finally {
          setFetching(false);
        }
      }
      loadProject();
    }
  }, [editId]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!title || !category || !budget || !deadline || !requiredSkills || !description) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (parseFloat(budget) <= 0) {
      showToast('Budget must be greater than zero.', 'error');
      return;
    }

    setLoading(true);
    const payload = {
      title: title.trim(),
      category: category.trim(),
      budget: parseFloat(budget),
      deadline,
      requiredSkills: requiredSkills.trim(),
      description: description.trim()
    };

    try {
      if (editId) {
        await api.put(`/projects/${editId}`, payload);
        if (status) {
          await api.patch(`/projects/${editId}/status`, { status });
        }
        showToast('Project updated successfully!', 'success');
      } else {
        await api.post('/projects', payload);
        showToast('Project posted successfully!', 'success');
      }

      setTimeout(() => {
        navigate('/client-dashboard');
      }, 800);
    } catch (err) {
      showToast(err.message || 'Failed to save project', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="container" style={{ padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p>Loading project details...</p>
      </div>
    );
  }

  return (
    <>
      <div className="page-header">
        <div className="container container-narrow">
          <div className="page-header-actions">
            <div>
              <h1>{editId ? 'Edit Project Specifications' : 'Post a New Project'}</h1>
              <p>Describe your technical requirements and receive competitive proposals from expert freelancers.</p>
            </div>
            <Link to="/client-dashboard" className="btn btn-secondary btn-sm">← Back to Dashboard</Link>
          </div>
        </div>
      </div>

      <div className="container container-narrow" style={{ marginBottom: '4rem' }}>
        <div className="card">
          <div className="card-body" style={{ padding: '2.5rem' }}>
            <form onSubmit={onSubmit}>
              <div className="form-group">
                <label className="form-label" htmlFor="title">Project Title *</label>
                <input
                  type="text"
                  id="title"
                  className="form-control"
                  placeholder="e.g. Build Modern SaaS Dashboard in Spring Boot & React"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  autoFocus
                />
                <div className="helper-text">Keep your title concise and descriptive.</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="category">Category *</label>
                  <select
                    id="category"
                    className="form-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                  >
                    <option value="">Select Category...</option>
                    <option value="Web Development">Web Development</option>
                    <option value="Backend Development">Backend Development</option>
                    <option value="UI/UX Design">UI/UX Design</option>
                    <option value="Database">Database</option>
                    <option value="Design & Branding">Design & Branding</option>
                    <option value="Mobile Development">Mobile Development</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="budget">Total Budget (USD $) *</label>
                  <input
                    type="number"
                    id="budget"
                    className="form-control"
                    placeholder="2500"
                    min="1"
                    step="10"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: editId ? '1fr 1fr' : '1fr', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="deadline">Target Delivery Deadline *</label>
                  <input
                    type="date"
                    id="deadline"
                    className="form-control"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    required
                  />
                </div>

                {editId && (
                  <div className="form-group">
                    <label className="form-label" htmlFor="status">Project Status</label>
                    <select
                      id="status"
                      className="form-select"
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="OPEN">Open</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="COMPLETED">Completed</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="requiredSkills">Required Skills &amp; Technologies (comma-separated) *</label>
                <input
                  type="text"
                  id="requiredSkills"
                  className="form-control"
                  placeholder="e.g. Java, Spring Boot, MySQL, React, REST APIs"
                  value={requiredSkills}
                  onChange={(e) => setRequiredSkills(e.target.value)}
                  required
                />
                <div className="helper-text">Separate tags with commas so freelancers can easily find this project.</div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="description">Detailed Project Description &amp; Scope *</label>
                <textarea
                  id="description"
                  className="form-textarea"
                  rows={6}
                  placeholder="Provide background information, expected deliverables, architecture guidelines, and milestone requirements..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
                <Link to="/client-dashboard" className="btn btn-outline">Cancel</Link>
                <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                  {loading ? 'Saving...' : editId ? 'Save Changes' : 'Publish Project Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

