/**
 * Admin Portal Logic
 * Analytics dashboard, user moderation, project management, and platform oversight
 */

// Initialize Admin Dashboard
async function initAdminDashboard() {
  if (!requireAuth(['Admin'])) return;

  try {
    const data = await apiFetch('/admin/dashboard');
    const { stats, recentProjects, recentUsers } = data;

    // Set stats
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val !== undefined ? val : 0;
    };

    setVal('stat-total-users', stats.users.TotalUsers);
    setVal('stat-clients', stats.users.TotalClients);
    setVal('stat-freelancers', stats.users.TotalFreelancers);
    setVal('stat-total-projects', stats.projects.TotalProjects);
    setVal('stat-open-projects', stats.projects.OpenProjects);
    setVal('stat-total-apps', stats.applications.TotalApplications);
    setVal('stat-accepted-apps', stats.applications.AcceptedApplications);
    setVal('stat-project-value', formatCurrency(stats.projects.TotalProjectValue || 0));

    // Render Recent Projects
    const projectsTable = document.getElementById('recent-projects-body');
    if (projectsTable) {
      if (!recentProjects || recentProjects.length === 0) {
        projectsTable.innerHTML = '<tr><td colspan="5" style="text-align:center;">No recent projects.</td></tr>';
      } else {
        projectsTable.innerHTML = recentProjects.map(p => `
          <tr>
            <td>
              <a href="/project-details.html?id=${p.ProjectId}" style="font-weight:600;">
                ${escapeHtml(p.Title)}
              </a>
              <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(p.Category)}</div>
            </td>
            <td>${escapeHtml(p.ClientName)}</td>
            <td>${formatCurrency(p.Budget)}</td>
            <td>${getStatusBadge(p.Status)}</td>
            <td>${formatDate(p.CreatedAt)}</td>
          </tr>
        `).join('');
      }
    }

    // Render Recent Users
    const usersTable = document.getElementById('recent-users-body');
    if (usersTable) {
      if (!recentUsers || recentUsers.length === 0) {
        usersTable.innerHTML = '<tr><td colspan="4" style="text-align:center;">No recent users.</td></tr>';
      } else {
        usersTable.innerHTML = recentUsers.map(u => {
          let roleBadge = 'badge-client';
          if (u.Role === 'Freelancer') roleBadge = 'badge-freelancer';
          if (u.Role === 'Admin') roleBadge = 'badge-admin';

          return `
            <tr>
              <td>
                <div style="font-weight:600;">${escapeHtml(u.FullName)}</div>
                <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(u.Email)}</div>
              </td>
              <td><span class="badge ${roleBadge}">${u.Role}</span></td>
              <td>${formatDate(u.CreatedAt)}</td>
              <td>
                <span class="badge ${u.IsActive ? 'badge-accepted' : 'badge-rejected'}">
                  ${u.IsActive ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          `;
        }).join('');
      }
    }
  } catch (error) {
    showToast(`Error loading admin dashboard: ${error.message}`, 'error');
  }
}

// User Management Page
async function initManageUsers() {
  if (!requireAuth(['Admin'])) return;

  const tableBody = document.getElementById('manage-users-body');
  const countDisplay = document.getElementById('user-count-display');
  const searchInput = document.getElementById('user-search');
  const roleSelect = document.getElementById('user-role-filter');
  const statusSelect = document.getElementById('user-status-filter');

  async function loadUsers() {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading users...</td></tr>';

    const search = searchInput?.value.trim() || '';
    const role = roleSelect?.value || 'all';
    const status = statusSelect?.value || 'all';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (role && role !== 'all') params.append('role', role);
    if (status && status !== 'all') params.append('status', status);

    try {
      const data = await apiFetch(`/admin/users?${params.toString()}`);
      const users = data.users || [];

      if (countDisplay) {
        countDisplay.textContent = `${users.length} registered user${users.length === 1 ? '' : 's'}`;
      }

      if (users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2.5rem;">No users found matching query.</td></tr>';
        return;
      }

      const currentUser = getCurrentUser();

      tableBody.innerHTML = users.map(u => {
        let roleBadge = 'badge-client';
        if (u.Role === 'Freelancer') roleBadge = 'badge-freelancer';
        if (u.Role === 'Admin') roleBadge = 'badge-admin';

        const isSelf = currentUser && currentUser.userId === u.UserId;

        return `
          <tr>
            <td>
              <div style="font-weight:600; color:var(--gray-900);">${escapeHtml(u.FullName)} ${isSelf ? '<span style="font-size:0.75rem; color:var(--primary); font-weight:700;">(You)</span>' : ''}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(u.Email)}</div>
            </td>
            <td><span class="badge ${roleBadge}">${u.Role}</span></td>
            <td>
              ${u.Role === 'Client' ? `${u.ProjectsPosted} projects` : `${u.ApplicationsSubmitted} proposals`}
            </td>
            <td>${formatDate(u.CreatedAt)}</td>
            <td>
              <span class="badge ${u.IsActive ? 'badge-accepted' : 'badge-rejected'}">
                ${u.IsActive ? 'Active' : 'Deactivated'}
              </span>
            </td>
            <td>
              ${isSelf ? '<span style="color:var(--text-muted); font-size:0.85rem;">Current Session</span>' : `
                <div class="table-actions">
                  <button onclick="toggleUserStatus(${u.UserId}, ${u.IsActive ? 'false' : 'true'}, '${escapeHtml(u.FullName)}')" 
                          class="btn btn-outline btn-sm">
                    ${u.IsActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onclick="deleteUserAccount(${u.UserId}, '${escapeHtml(u.FullName)}')" 
                          class="btn btn-danger btn-sm">
                    Delete
                  </button>
                </div>
              `}
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="alert alert-danger">${error.message}</td></tr>`;
    }
  }

  if (searchInput) searchInput.addEventListener('input', debounce(loadUsers, 300));
  if (roleSelect) roleSelect.addEventListener('change', loadUsers);
  if (statusSelect) statusSelect.addEventListener('change', loadUsers);

  loadUsers();
}

async function toggleUserStatus(userId, willActivate, name) {
  const actionText = willActivate ? 'activate' : 'deactivate';
  if (!confirm(`Are you sure you want to ${actionText} the account for ${name}?`)) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}/toggle-status`, { method: 'PUT' });
    showToast(res.message, 'success');
    initManageUsers();
  } catch (error) {
    showToast(`Failed to update user: ${error.message}`, 'error');
  }
}

async function deleteUserAccount(userId, name) {
  if (!confirm(`Are you sure you want to PERMANENTLY DELETE user "${name}"? This action will remove all their projects, applications, and assignments.`)) return;

  try {
    const res = await apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    initManageUsers();
  } catch (error) {
    showToast(`Delete failed: ${error.message}`, 'error');
  }
}

// Project Management Page
async function initManageProjects() {
  if (!requireAuth(['Admin'])) return;

  const tableBody = document.getElementById('manage-projects-body');
  const countDisplay = document.getElementById('proj-count-display');
  const searchInput = document.getElementById('proj-search');
  const statusSelect = document.getElementById('proj-status-filter');

  async function loadProjects() {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading projects...</td></tr>';

    const search = searchInput?.value.trim() || '';
    const status = statusSelect?.value || 'all';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    try {
      const data = await apiFetch(`/admin/projects?${params.toString()}`);
      const projects = data.projects || [];

      if (countDisplay) {
        countDisplay.textContent = `${projects.length} project${projects.length === 1 ? '' : 's'}`;
      }

      if (projects.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2.5rem;">No projects found.</td></tr>';
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
          <td>${escapeHtml(p.ClientName)}</td>
          <td><strong>${formatCurrency(p.Budget)}</strong></td>
          <td>${getStatusBadge(p.Status)}</td>
          <td>${p.ApplicationCount} proposal${p.ApplicationCount === 1 ? '' : 's'}</td>
          <td>
            <div class="table-actions">
              <a href="/project-details.html?id=${p.ProjectId}" class="btn btn-outline btn-sm">View</a>
              <button onclick="adminDeleteProject(${p.ProjectId}, '${escapeHtml(p.Title)}')" class="btn btn-danger btn-sm">Delete</button>
            </div>
          </td>
        </tr>
      `).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="alert alert-danger">${error.message}</td></tr>`;
    }
  }

  if (searchInput) searchInput.addEventListener('input', debounce(loadProjects, 300));
  if (statusSelect) statusSelect.addEventListener('change', loadProjects);

  loadProjects();
}

async function adminDeleteProject(projectId, title) {
  if (!confirm(`Are you sure you want to delete project "${title}"? This cannot be undone.`)) return;

  try {
    const res = await apiFetch(`/admin/projects/${projectId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    initManageProjects();
  } catch (error) {
    showToast(`Delete failed: ${error.message}`, 'error');
  }
}

// Applications Management Page
async function initManageApplications() {
  if (!requireAuth(['Admin'])) return;

  const tableBody = document.getElementById('manage-apps-body');
  const countDisplay = document.getElementById('apps-count-display');
  const statusSelect = document.getElementById('apps-status-filter');
  const searchInput = document.getElementById('apps-search');

  async function loadApplications() {
    if (!tableBody) return;
    tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2rem;">Loading applications...</td></tr>';

    const search = searchInput?.value.trim() || '';
    const status = statusSelect?.value || 'all';

    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'all') params.append('status', status);

    try {
      const data = await apiFetch(`/admin/applications?${params.toString()}`);
      const apps = data.applications || [];

      if (countDisplay) {
        countDisplay.textContent = `${apps.length} application${apps.length === 1 ? '' : 's'}`;
      }

      if (apps.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:2.5rem;">No applications found.</td></tr>';
        return;
      }

      tableBody.innerHTML = apps.map(a => {
        let badgeClass = 'badge-pending';
        if (a.ApplicationStatus === 'Accepted') badgeClass = 'badge-accepted';
        if (a.ApplicationStatus === 'Rejected') badgeClass = 'badge-rejected';

        return `
          <tr>
            <td>
              <a href="/project-details.html?id=${a.ProjectId}" style="font-weight:600;">
                ${escapeHtml(a.ProjectTitle)}
              </a>
              <div style="font-size:0.8rem; color:var(--text-muted);">Client: ${escapeHtml(a.ClientName)}</div>
            </td>
            <td>
              <div style="font-weight:600;">${escapeHtml(a.FreelancerName)}</div>
              <div style="font-size:0.8rem; color:var(--text-muted);">${escapeHtml(a.FreelancerEmail)}</div>
            </td>
            <td><strong>${formatCurrency(a.BidAmount)}</strong></td>
            <td><span class="badge ${badgeClass}">${a.ApplicationStatus}</span></td>
            <td>${formatDate(a.AppliedAt)}</td>
            <td>
              <button onclick="adminDeleteApp(${a.ApplicationId})" class="btn btn-danger btn-sm">Delete</button>
            </td>
          </tr>
        `;
      }).join('');
    } catch (error) {
      tableBody.innerHTML = `<tr><td colspan="6" class="alert alert-danger">${error.message}</td></tr>`;
    }
  }

  if (searchInput) searchInput.addEventListener('input', debounce(loadApplications, 300));
  if (statusSelect) statusSelect.addEventListener('change', loadApplications);

  loadApplications();
}

async function adminDeleteApp(appId) {
  if (!confirm('Are you sure you want to delete this application record?')) return;

  try {
    const res = await apiFetch(`/admin/applications/${appId}`, { method: 'DELETE' });
    showToast(res.message, 'success');
    initManageApplications();
  } catch (error) {
    showToast(`Delete failed: ${error.message}`, 'error');
  }
}

// Simple debounce helper
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

