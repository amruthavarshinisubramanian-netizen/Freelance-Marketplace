/**
 * Freelancer Portal Logic
 * Dashboard metrics, proposal submission, and tracking my submitted applications
 */

// Initialize Freelancer Dashboard
async function initFreelancerDashboard() {
  if (!requireAuth(['Freelancer'])) return;

  const metricTotal = document.getElementById('metric-total-apps');
  const metricPending = document.getElementById('metric-pending-apps');
  const metricAccepted = document.getElementById('metric-accepted-apps');
  const metricRejected = document.getElementById('metric-rejected-apps');
  const recentTableBody = document.getElementById('recent-apps-body');
  const recommendedGrid = document.getElementById('recommended-projects-grid');

  try {
    // 1. Fetch my applications
    const data = await apiFetch('/applications/my');
    const apps = data.applications || [];

    let pendingCount = 0;
    let acceptedCount = 0;
    let rejectedCount = 0;

    apps.forEach(a => {
      if (a.ApplicationStatus === 'Pending') pendingCount++;
      if (a.ApplicationStatus === 'Accepted') acceptedCount++;
      if (a.ApplicationStatus === 'Rejected') rejectedCount++;
    });

    if (metricTotal) metricTotal.textContent = apps.length;
    if (metricPending) metricPending.textContent = pendingCount;
    if (metricAccepted) metricAccepted.textContent = acceptedCount;
    if (metricRejected) metricRejected.textContent = rejectedCount;

    // Render recent 5 applications
    if (recentTableBody) {
      if (apps.length === 0) {
        recentTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align:center; padding: 2rem 1rem;">
              <p style="color:var(--text-muted); margin-bottom: 1rem;">You have not applied to any projects yet.</p>
              <a href="/projects.html" class="btn btn-primary btn-sm">Explore Open Projects</a>
            </td>
          </tr>
        `;
      } else {
        const top5 = apps.slice(0, 5);
        recentTableBody.innerHTML = top5.map(a => {
          let badgeClass = 'badge-pending';
          if (a.ApplicationStatus === 'Accepted') badgeClass = 'badge-accepted';
          if (a.ApplicationStatus === 'Rejected') badgeClass = 'badge-rejected';

          return `
            <tr>
              <td>
                <a href="/project-details.html?id=${a.ProjectId}" style="font-weight:600; color:var(--gray-900);">
                  ${escapeHtml(a.ProjectTitle)}
                </a>
                <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(a.ProjectCategory)}</div>
              </td>
              <td>${formatCurrency(a.ProjectBudget)}</td>
              <td><strong>${formatCurrency(a.BidAmount)}</strong></td>
              <td><span class="badge ${badgeClass}">${a.ApplicationStatus}</span></td>
              <td>${formatDate(a.AppliedAt)}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // 2. Fetch open projects for recommendation
    if (recommendedGrid) {
      const projData = await apiFetch('/projects?status=Open');
      const openProjects = (projData.projects || []).slice(0, 3);

      if (openProjects.length === 0) {
        recommendedGrid.innerHTML = '<div style="grid-column: 1/-1; color:var(--text-muted);">No new open projects right now. Check back soon!</div>';
      } else {
        recommendedGrid.innerHTML = openProjects.map(createProjectCardHtml).join('');
      }
    }
  } catch (error) {
    showToast(`Error loading freelancer dashboard: ${error.message}`, 'error');
  }
}

// Track all applications submitted by the logged-in freelancer
async function initMyApplications() {
  if (!requireAuth(['Freelancer'])) return;

  const tableBody = document.getElementById('my-applications-body');
  const countDisplay = document.getElementById('app-count-display');

  try {
    const data = await apiFetch('/applications/my');
    const apps = data.applications || [];

    if (countDisplay) {
      countDisplay.textContent = `${apps.length} submitted application${apps.length === 1 ? '' : 's'}`;
    }

    if (!tableBody) return;

    if (apps.length === 0) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="6" style="text-align:center; padding: 3rem 1rem;">
            <p style="color:var(--text-muted); margin-bottom: 1rem;">No applications submitted yet.</p>
            <a href="/projects.html" class="btn btn-primary btn-sm">Find Work & Apply</a>
          </td>
        </tr>
      `;
      return;
    }

    tableBody.innerHTML = apps.map(a => {
      let badgeClass = 'badge-pending';
      if (a.ApplicationStatus === 'Accepted') badgeClass = 'badge-accepted';
      if (a.ApplicationStatus === 'Rejected') badgeClass = 'badge-rejected';

      return `
        <tr>
          <td>
            <a href="/project-details.html?id=${a.ProjectId}" style="font-weight:600; color:var(--gray-900);">
              ${escapeHtml(a.ProjectTitle)}
            </a>
            <div style="font-size:0.8rem; color:var(--text-muted);">
              ${escapeHtml(a.ProjectCategory)} &bull; Client: ${escapeHtml(a.ClientName)}
            </div>
          </td>
          <td>${formatCurrency(a.ProjectBudget)}</td>
          <td><strong>${formatCurrency(a.BidAmount)}</strong></td>
          <td><span class="badge ${badgeClass}">${a.ApplicationStatus}</span></td>
          <td>${formatDate(a.AppliedAt)}</td>
          <td>
            <a href="/project-details.html?id=${a.ProjectId}" class="btn btn-outline btn-sm">View Project</a>
          </td>
        </tr>
      `;
    }).join('');
  } catch (error) {
    showToast(`Error loading applications: ${error.message}`, 'error');
  }
}

// Submit proposal to a project
async function initApplyProjectForm() {
  if (!requireAuth(['Freelancer'])) return;

  const urlParams = new URLSearchParams(window.location.search);
  const projectId = urlParams.get('id');

  if (!projectId) {
    showToast('No project selected.', 'error');
    setTimeout(() => { window.location.href = '/projects.html'; }, 1000);
    return;
  }

  const projectHeader = document.getElementById('apply-project-info');
  const form = document.getElementById('apply-project-form');

  try {
    const data = await apiFetch(`/projects/${projectId}`);
    const project = data.project;

    // Check if user already applied
    if (data.hasApplied) {
      showToast('You have already applied for this project.', 'info');
      setTimeout(() => {
        window.location.href = `/project-details.html?id=${projectId}`;
      }, 1200);
      return;
    }

    // Check if project is open
    if (project.Status !== 'Open') {
      showToast(`This project is ${project.Status} and cannot accept new proposals.`, 'error');
      setTimeout(() => {
        window.location.href = `/project-details.html?id=${projectId}`;
      }, 1200);
      return;
    }

    // Populate project overview card
    if (projectHeader) {
      projectHeader.innerHTML = `
        <div class="card" style="margin-bottom: 2rem;">
          <div class="card-header">
            <div>
              <span class="badge badge-open" style="margin-bottom:0.25rem;">Open</span>
              <h3>${escapeHtml(project.Title)}</h3>
            </div>
            <div style="text-align:right;">
              <span style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase;">Client Budget</span>
              <div style="font-size:1.4rem; font-weight:800; color:var(--gray-900);">${formatCurrency(project.Budget)}</div>
            </div>
          </div>
          <div class="card-body">
            <p style="color:var(--gray-700); margin-bottom:1rem; font-size:0.95rem;">${escapeHtml(project.Description)}</p>
            <div style="display:flex; gap:1.5rem; font-size:0.85rem; color:var(--text-muted);">
              <span>📁 <strong>Category:</strong> ${escapeHtml(project.Category)}</span>
              <span>📅 <strong>Deadline:</strong> ${formatDate(project.Deadline)}</span>
              <span>👤 <strong>Client:</strong> ${escapeHtml(project.ClientName)}</span>
            </div>
          </div>
        </div>
      `;
    }

    // Set default suggested bid amount to project budget
    const bidInput = document.getElementById('bidAmount');
    if (bidInput) {
      bidInput.value = project.Budget;
    }

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const bidAmount = parseFloat(document.getElementById('bidAmount').value);
        const proposal = document.getElementById('proposal').value.trim();

        if (!bidAmount || bidAmount <= 0) {
          showToast('Please specify a positive bid amount.', 'error');
          return;
        }

        if (!proposal || proposal.length < 20) {
          showToast('Please provide a detailed proposal (at least 20 characters).', 'error');
          return;
        }

        try {
          const res = await apiFetch('/applications', {
            method: 'POST',
            body: JSON.stringify({
              projectId: parseInt(projectId, 10),
              bidAmount,
              proposal
            })
          });

          showToast(res.message || 'Proposal submitted successfully!', 'success');
          setTimeout(() => {
            window.location.href = '/my-applications.html';
          }, 1000);
        } catch (error) {
          showToast(`Submission failed: ${error.message}`, 'error');
        }
      });
    }
  } catch (error) {
    showToast(`Failed to load project: ${error.message}`, 'error');
  }
}

