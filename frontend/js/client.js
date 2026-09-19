/**
 * Client Portal Logic
 * Dashboard metrics, project creation/editing, and proposal review actions
 */

// Initialize Client Dashboard
async function initClientDashboard() {
  if (!requireAuth(['Client'])) return;

  const tableBody = document.getElementById('client-projects-body');
  const metricTotal = document.getElementById('metric-total');
  const metricOpen = document.getElementById('metric-open');
  const metricProgress = document.getElementById('metric-progress');
  const metricProposals = document.getElementById('metric-proposals');

  try {
    const data = await apiFetch('/projects/client/my');
    const projects = data.projects || [];

    // Calculate metrics
    let openCount = 0;
    let progressCount = 0;
    let totalPendingProposals = 0;

    projects.forEach(p => {
      if (p.Status === 'Open') openCount++;
      if (p.Status === 'In Progress') progressCount++;
      totalPendingProposals += (p.PendingCount || 0);
    });

    if (metricTotal) metricTotal.textContent = projects.length;
    if (metricOpen) metricOpen.textContent = openCount;
    if (metricProgress) metricProgress.textContent = progressCount;
    if (metricProposals) metricProposals.textContent = totalPendingProposals;

    if (!tableBody) return;

    if (projects.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 2.5rem 1rem;">
            <p style="color:var(--text-muted); margin-bottom: 1rem;">You have not posted any projects yet.</p>
            <a href="/create-project.html" class="btn btn-primary btn-sm">+ Post Your First Project</a>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = projects.map(p => `
      <tr>
        <td>
          <a href="/project-details.html?id=${p.ProjectId}" style="font-weight:600; color:var(--gray-900);">
            ${escapeHtml(p.Title)}
          </a>
          <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(p.Category)}</div>
        </td>
        <td><strong>${formatCurrency(p.Budget)}</strong></td>
        <td>${formatDate(p.Deadline)}</td>
        <td>${getStatusBadge(p.Status)}</td>
        <td>
          <a href="/client-applications.html?projectId=${p.ProjectId}" class="btn btn-outline btn-sm">
            ${p.ApplicationCount} proposal${p.ApplicationCount === 1 ? '' : 's'}
            ${p.PendingCount > 0 ? `<span class="badge badge-pending" style="margin-left:4px;">${p.PendingCount} new</span>` : ''}
          </a>
        </td>
        <td>
          <div class="table-actions">
            <a href="/project-details.html?id=${p.ProjectId}" class="btn btn-secondary btn-sm" title="View">View</a>
            <a href="/create-project.html?edit=${p.ProjectId}" class="btn btn-outline btn-sm" title="Edit">Edit</a>
            <button onclick="confirmDeleteProject(${p.ProjectId}, '${escapeHtml(p.Title)}')" class="btn btn-danger btn-sm" title="Delete">Delete</button>
          </div>
        </td>
      </tr>
    `).join('');
  } catch (error) {
    showToast(`Error loading projects: ${error.message}`, 'error');
  }
}

// Confirm and delete client project
async function confirmDeleteProject(projectId, title) {
  if (!confirm(`Are you sure you want to delete the project "${title}"? This will also remove all associated applications.`)) {
    return;
  }

  try {
    await apiFetch(`/projects/${projectId}`, { method: 'DELETE' });
    showToast('Project deleted successfully.', 'success');
    initClientDashboard();
  } catch (error) {
    showToast(`Failed to delete project: ${error.message}`, 'error');
  }
}

// Project Create / Edit Form Handler
async function initProjectForm() {
  if (!requireAuth(['Client'])) return;

  const form = document.getElementById('project-form');
  const formTitle = document.getElementById('form-page-title');
  const submitBtn = document.getElementById('submit-btn');
  if (!form) return;

  const urlParams = new URLSearchParams(window.location.search);
  const editId = urlParams.get('edit');

  // Set min date on deadline picker to tomorrow
  const deadlineInput = document.getElementById('deadline');
  if (deadlineInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    deadlineInput.min = tomorrow.toISOString().split('T')[0];
  }

  // Prepopulate if editing
  if (editId) {
    if (formTitle) formTitle.textContent = 'Edit Project Details';
    if (submitBtn) submitBtn.textContent = 'Save Changes';

    try {
      const data = await apiFetch(`/projects/${editId}`);
      const p = data.project;

      document.getElementById('title').value = p.Title || '';
      document.getElementById('category').value = p.Category || '';
      document.getElementById('budget').value = p.Budget || '';
      document.getElementById('deadline').value = p.Deadline || '';
      document.getElementById('requiredSkills').value = p.RequiredSkills || '';
      document.getElementById('description').value = p.Description || '';

      const statusGroup = document.getElementById('status-group');
      if (statusGroup) {
        statusGroup.style.display = 'block';
        document.getElementById('status').value = p.Status || 'Open';
      }
    } catch (error) {
      showToast(`Error loading project: ${error.message}`, 'error');
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const category = document.getElementById('category').value.trim();
    const budget = parseFloat(document.getElementById('budget').value);
    const deadline = document.getElementById('deadline').value;
    const requiredSkills = document.getElementById('requiredSkills').value.trim();
    const description = document.getElementById('description').value.trim();
    const statusSelect = document.getElementById('status');
    const status = statusSelect ? statusSelect.value : undefined;

    if (!title || !category || !budget || !deadline || !requiredSkills || !description) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (budget <= 0) {
      showToast('Budget must be greater than zero.', 'error');
      return;
    }

    const payload = {
      title,
      category,
      budget,
      deadline,
      requiredSkills,
      description,
      ...(status ? { status } : {})
    };

    try {
      if (editId) {
        await apiFetch(`/projects/${editId}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        showToast('Project updated successfully!', 'success');
      } else {
        await apiFetch('/projects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        showToast('Project posted successfully!', 'success');
      }

      setTimeout(() => {
        window.location.href = '/client-dashboard.html';
      }, 1000);
    } catch (error) {
      showToast(error.message, 'error');
    }
  });
}

// Client Review Applications Page
async function initClientApplications() {
  if (!requireAuth(['Client'])) return;

  const urlParams = new URLSearchParams(window.location.search);
  const initialProjectId = urlParams.get('projectId') || '';

  const projectSelect = document.getElementById('filter-project-select');
  const statusSelect = document.getElementById('filter-app-status');
  const applicationsContainer = document.getElementById('applications-list');

  // Load client projects into dropdown
  try {
    const projData = await apiFetch('/projects/client/my');
    const clientProjects = projData.projects || [];

    if (projectSelect) {
      projectSelect.innerHTML = '<option value="">All My Projects</option>' + clientProjects.map(p => `
        <option value="${p.ProjectId}" ${p.ProjectId == initialProjectId ? 'selected' : ''}>
          ${escapeHtml(p.Title)}
        </option>
      `).join('');
    }
  } catch (err) {
    console.error('Failed to load projects dropdown', err);
  }

  async function loadApplications() {
    if (!applicationsContainer) return;
    applicationsContainer.innerHTML = '<div style="text-align:center; padding: 2rem;">Loading proposals...</div>';

    const selProj = projectSelect ? projectSelect.value : initialProjectId;
    const selStatus = statusSelect ? statusSelect.value : 'all';

    const params = new URLSearchParams();
    if (selProj) params.append('projectId', selProj);
    if (selStatus && selStatus !== 'all') params.append('status', selStatus);

    try {
      const data = await apiFetch(`/applications/client?${params.toString()}`);
      const applications = data.applications || [];

      if (applications.length === 0) {
        applicationsContainer.innerHTML = `
          <div class="empty-state">
            <div class="empty-state-icon">📬</div>
            <h3>No applications found</h3>
            <p>There are no proposals matching the selected filters.</p>
          </div>
        `;
        return;
      }

      applicationsContainer.innerHTML = applications.map(app => {
        let badgeClass = 'badge-pending';
        if (app.ApplicationStatus === 'Accepted') badgeClass = 'badge-accepted';
        if (app.ApplicationStatus === 'Rejected') badgeClass = 'badge-rejected';

        const isPending = app.ApplicationStatus === 'Pending';

        return `
          <div class="card" style="border-left: 4px solid ${isPending ? 'var(--warning)' : (app.ApplicationStatus === 'Accepted' ? 'var(--success)' : 'var(--danger)')}">
            <div class="card-header">
              <div>
                <h3 style="margin-bottom:0.25rem;">${escapeHtml(app.FreelancerName)}</h3>
                <div style="font-size:0.85rem; color:var(--text-muted);">
                  Email: ${escapeHtml(app.FreelancerEmail)} &bull; Submitted: ${formatDate(app.AppliedAt)}
                </div>
              </div>
              <div style="text-align:right;">
                <span class="badge ${badgeClass}">${app.ApplicationStatus}</span>
                <div style="font-size:1.25rem; font-weight:800; color:var(--gray-900); margin-top:0.25rem;">
                  Bid: ${formatCurrency(app.BidAmount)}
                </div>
              </div>
            </div>
            <div class="card-body">
              <div style="margin-bottom:0.75rem; font-size:0.9rem; color:var(--text-muted);">
                Project: <strong><a href="/project-details.html?id=${app.ProjectId}">${escapeHtml(app.ProjectTitle)}</a></strong>
                (Project Budget: ${formatCurrency(app.ProjectBudget)})
              </div>
              <div style="background-color:var(--gray-50); padding:1rem; border-radius:var(--radius-sm); border:1px solid var(--border-color); font-size:0.95rem; white-space:pre-wrap;">
                ${escapeHtml(app.Proposal)}
              </div>
            </div>
            ${isPending ? `
              <div class="card-footer" style="justify-content:flex-end; gap:0.75rem;">
                <button onclick="handleApplicationStatus(${app.ApplicationId}, 'Rejected')" class="btn btn-outline btn-sm">
                  Reject Proposal
                </button>
                <button onclick="handleApplicationStatus(${app.ApplicationId}, 'Accepted')" class="btn btn-success btn-sm">
                  ✓ Accept Proposal & Assign
                </button>
              </div>
            ` : ''}
          </div>
        `;
      }).join('');
    } catch (error) {
      applicationsContainer.innerHTML = `
        <div class="alert alert-danger">
          Error loading proposals: ${error.message}
        </div>
      `;
    }
  }

  if (projectSelect) projectSelect.addEventListener('change', loadApplications);
  if (statusSelect) statusSelect.addEventListener('change', loadApplications);

  loadApplications();
}

// Accept or Reject an Application
async function handleApplicationStatus(applicationId, newStatus) {
  const confirmMsg = newStatus === 'Accepted'
    ? 'Are you sure you want to accept this proposal? This will assign the freelancer and transition the project status to "In Progress".'
    : 'Are you sure you want to reject this proposal?';

  if (!confirm(confirmMsg)) return;

  try {
    const res = await apiFetch(`/applications/${applicationId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus })
    });
    showToast(res.message, 'success');
    initClientApplications();
  } catch (error) {
    showToast(`Action failed: ${error.message}`, 'error');
  }
}

