/**
 * Project browsing and project details handler
 */

// Helper to render skill pills from comma-separated string
function renderSkills(skillsString) {
  if (!skillsString) return '';
  return skillsString
    .split(',')
    .map(skill => `<span class="skill-pill">${skill.trim()}</span>`)
    .join('');
}

// Helper to get status badge HTML
function getStatusBadge(status) {
  switch (status) {
    case 'Open':
      return '<span class="badge badge-open">Open</span>';
    case 'In Progress':
      return '<span class="badge badge-progress">In Progress</span>';
    case 'Completed':
      return '<span class="badge badge-completed">Completed</span>';
    case 'Cancelled':
      return '<span class="badge badge-cancelled">Cancelled</span>';
    default:
      return `<span class="badge">${status}</span>`;
  }
}

// Render a single project card
function createProjectCardHtml(project) {
  return `
    <div class="project-card">
      <div>
        <div class="project-card-header">
          <h3><a href="/project-details.html?id=${project.ProjectId}">${escapeHtml(project.Title)}</a></h3>
          ${getStatusBadge(project.Status)}
        </div>
        <div class="project-card-meta">
          <span>📁 ${escapeHtml(project.Category)}</span>
          <span>👤 ${escapeHtml(project.ClientName)}</span>
          <span>📅 Due: ${formatDate(project.Deadline)}</span>
          <span>📝 ${project.ApplicationCount || 0} proposal${project.ApplicationCount === 1 ? '' : 's'}</span>
        </div>
        <p class="project-description">${escapeHtml(project.Description)}</p>
        <div class="project-skills">
          ${renderSkills(project.RequiredSkills)}
        </div>
      </div>
      <div class="project-card-footer">
        <div class="project-budget">
          <span>Budget</span>
          ${formatCurrency(project.Budget)}
        </div>
        <a href="/project-details.html?id=${project.ProjectId}" class="btn btn-primary btn-sm">View Details</a>
      </div>
    </div>
  `;
}

// Load browse projects with optional filters
async function loadBrowseProjects() {
  const container = document.getElementById('projects-grid');
  const countDisplay = document.getElementById('project-count');
  if (!container) return;

  container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem;">Loading projects...</div>';

  const search = document.getElementById('filter-search')?.value || '';
  const category = document.getElementById('filter-category')?.value || '';
  const minBudget = document.getElementById('filter-min-budget')?.value || '';
  const maxBudget = document.getElementById('filter-max-budget')?.value || '';
  const sortBy = document.getElementById('filter-sort')?.value || 'newest';
  const status = document.getElementById('filter-status')?.value || 'Open';

  const queryParams = new URLSearchParams();
  if (search) queryParams.append('search', search);
  if (category && category !== 'all') queryParams.append('category', category);
  if (minBudget) queryParams.append('minBudget', minBudget);
  if (maxBudget) queryParams.append('maxBudget', maxBudget);
  if (sortBy) queryParams.append('sortBy', sortBy);
  if (status) queryParams.append('status', status);

  try {
    const data = await apiFetch(`/projects?${queryParams.toString()}`);
    const projects = data.projects || [];

    if (countDisplay) {
      countDisplay.textContent = `${projects.length} project${projects.length === 1 ? '' : 's'} found`;
    }

    if (projects.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column: 1/-1;">
          <div class="empty-state-icon">🔍</div>
          <h3>No projects match your search criteria</h3>
          <p>Try adjusting your search keywords, category filters, or budget range.</p>
          <button class="btn btn-outline btn-sm" onclick="resetFilters()">Reset All Filters</button>
        </div>
      `;
      return;
    }

    container.innerHTML = projects.map(createProjectCardHtml).join('');
  } catch (error) {
    container.innerHTML = `
      <div class="alert alert-danger" style="grid-column: 1/-1;">
        Failed to load projects: ${error.message}
      </div>
    `;
  }
}

function resetFilters() {
  const search = document.getElementById('filter-search');
  const category = document.getElementById('filter-category');
  const minBudget = document.getElementById('filter-min-budget');
  const maxBudget = document.getElementById('filter-max-budget');
  const sortBy = document.getElementById('filter-sort');
  const status = document.getElementById('filter-status');

  if (search) search.value = '';
  if (category) category.value = 'all';
  if (minBudget) minBudget.value = '';
  if (maxBudget) maxBudget.value = '';
  if (sortBy) sortBy.value = 'newest';
  if (status) status.value = 'Open';

  loadBrowseProjects();
}

// Load single project details
async function loadProjectDetails() {
  const params = new URLSearchParams(window.location.search);
  const projectId = params.get('id');

  if (!projectId) {
    showToast('No project specified.', 'error');
    setTimeout(() => { window.location.href = '/projects.html'; }, 1000);
    return;
  }

  const container = document.getElementById('project-detail-content');
  if (!container) return;

  try {
    const data = await apiFetch(`/projects/${projectId}`);
    const project = data.project;
    const user = getCurrentUser();
    const hasApplied = data.hasApplied;
    const userApp = data.userApplication;
    const assignedFreelancer = data.assignedFreelancer;

    let actionCtaHtml = '';

    if (!user) {
      actionCtaHtml = `
        <div class="card">
          <div class="card-body" style="text-align:center;">
            <h3>Interested in this project?</h3>
            <p style="color:var(--text-muted); margin: 0.5rem 0 1.25rem;">Sign in to submit your proposal.</p>
            <a href="/login.html?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}" class="btn btn-primary btn-block">Log In to Apply</a>
          </div>
        </div>
      `;
    } else if (user.role === 'Freelancer') {
      if (hasApplied && userApp) {
        let appBadgeClass = 'badge-pending';
        if (userApp.Status === 'Accepted') appBadgeClass = 'badge-accepted';
        if (userApp.Status === 'Rejected') appBadgeClass = 'badge-rejected';

        actionCtaHtml = `
          <div class="card" style="border-left: 4px solid var(--primary);">
            <div class="card-body">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.75rem;">
                <h4 style="font-weight:700;">Your Proposal</h4>
                <span class="badge ${appBadgeClass}">${userApp.Status}</span>
              </div>
              <p style="font-size:0.9rem; color:var(--gray-600); margin-bottom:0.75rem;">${escapeHtml(userApp.Proposal)}</p>
              <div style="font-weight:700; font-size:1.1rem; color:var(--gray-900);">
                Your Bid: ${formatCurrency(userApp.BidAmount)}
              </div>
              <p class="helper-text">Submitted on ${formatDate(userApp.AppliedAt)}</p>
            </div>
          </div>
        `;
      } else if (project.Status === 'Open') {
        actionCtaHtml = `
          <div class="card">
            <div class="card-body">
              <h3 style="margin-bottom:0.5rem;">Ready to take on this project?</h3>
              <p style="color:var(--text-muted); margin-bottom:1.25rem; font-size:0.9rem;">Submit your custom proposal and bid amount to the client.</p>
              <a href="/apply-project.html?id=${project.ProjectId}" class="btn btn-success btn-block btn-lg">Submit Proposal</a>
            </div>
          </div>
        `;
      } else {
        actionCtaHtml = `
          <div class="alert alert-warning">
            This project is currently ${project.Status} and is no longer accepting new proposals.
          </div>
        `;
      }
    } else if (user.role === 'Client' && user.userId === project.ClientId) {
      actionCtaHtml = `
        <div class="card">
          <div class="card-body">
            <h3 style="margin-bottom:0.5rem;">Project Management</h3>
            <p style="color:var(--text-muted); font-size:0.9rem; margin-bottom:1.25rem;">You posted this project.</p>
            <a href="/client-applications.html?projectId=${project.ProjectId}" class="btn btn-primary btn-block" style="margin-bottom:0.5rem;">
              Review Applications (${project.ApplicationCount})
            </a>
            <a href="/create-project.html?edit=${project.ProjectId}" class="btn btn-outline btn-block">Edit Details</a>
          </div>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="container">
          <div class="page-header-actions">
            <div>
              <div style="display:flex; gap:0.5rem; align-items:center; margin-bottom:0.5rem;">
                <span class="badge badge-client">${escapeHtml(project.Category)}</span>
                ${getStatusBadge(project.Status)}
              </div>
              <h1>${escapeHtml(project.Title)}</h1>
              <p>Posted by <strong>${escapeHtml(project.ClientName)}</strong> on ${formatDate(project.CreatedAt)}</p>
            </div>
            <a href="/projects.html" class="btn btn-secondary">← Back to Catalog</a>
          </div>
        </div>
      </div>

      <div class="container">
        <div class="detail-grid">
          <!-- Main Content -->
          <div>
            <div class="card">
              <div class="card-header">
                <h3>Project Description</h3>
              </div>
              <div class="card-body">
                <div style="white-space: pre-wrap; font-size: 1.05rem; line-height: 1.7; color: var(--gray-800);">
                  ${escapeHtml(project.Description)}
                </div>
              </div>
            </div>

            <div class="card">
              <div class="card-header">
                <h3>Required Skills & Technologies</h3>
              </div>
              <div class="card-body">
                <div class="project-skills">
                  ${renderSkills(project.RequiredSkills)}
                </div>
              </div>
            </div>

            ${assignedFreelancer ? `
              <div class="card" style="border-left: 4px solid var(--success);">
                <div class="card-header">
                  <h3>Assigned Freelancer</h3>
                  <span class="badge badge-accepted">Active Assignment</span>
                </div>
                <div class="card-body">
                  <p><strong>Freelancer:</strong> ${escapeHtml(assignedFreelancer.FreelancerName)}</p>
                  <p><strong>Contact Email:</strong> ${escapeHtml(assignedFreelancer.FreelancerEmail)}</p>
                  <p><strong>Assigned On:</strong> ${formatDate(assignedFreelancer.AssignedAt)}</p>
                </div>
              </div>
            ` : ''}
          </div>

          <!-- Sidebar Info -->
          <div>
            <div class="card">
              <div class="card-header">
                <h3>Project Summary</h3>
              </div>
              <div class="card-body" style="display:flex; flex-direction:column; gap:1.2rem;">
                <div>
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Client Budget</div>
                  <div style="font-size:1.8rem; font-weight:800; color:var(--gray-900);">${formatCurrency(project.Budget)}</div>
                </div>
                <div>
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Submission Deadline</div>
                  <div style="font-size:1.1rem; font-weight:600;">${formatDate(project.Deadline)}</div>
                </div>
                <div>
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Total Proposals</div>
                  <div style="font-size:1.1rem; font-weight:600;">${project.ApplicationCount} received</div>
                </div>
                <div>
                  <div style="font-size:0.8rem; text-transform:uppercase; color:var(--text-muted); font-weight:600;">Client Contact</div>
                  <div style="font-size:0.95rem; color:var(--gray-700);">${escapeHtml(project.ClientEmail)}</div>
                </div>
              </div>
            </div>

            ${actionCtaHtml}
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="container" style="margin-top:2rem;">
        <div class="alert alert-danger">
          Error loading project details: ${error.message}
        </div>
        <a href="/projects.html" class="btn btn-outline">Back to Projects</a>
      </div>
    `;
  }
}

// XSS prevention helper
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

