/**
 * Freelance Marketplace - Auth & API Client Helper
 * Handles JWT token storage, user state, route guard, toasts, and dynamic navbars
 */

const API_BASE = '/api';

// --- Token & User State Management ---
function getToken() {
  return localStorage.getItem('fm_token');
}

function setToken(token) {
  localStorage.setItem('fm_token', token);
}

function getCurrentUser() {
  const userJson = localStorage.getItem('fm_user');
  if (!userJson) return null;
  try {
    return JSON.parse(userJson);
  } catch (e) {
    return null;
  }
}

function setCurrentUser(user) {
  localStorage.setItem('fm_user', JSON.stringify(user));
}

function clearAuth() {
  localStorage.removeItem('fm_token');
  localStorage.removeItem('fm_user');
}

function logout() {
  clearAuth();
  showToast('You have been logged out.', 'info');
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 400);
}

// --- Authenticated Fetch Wrapper ---
async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers
    });

    // Handle session expiration
    if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
      clearAuth();
      showToast('Your session has expired. Please log in again.', 'error');
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 1000);
      throw new Error('Unauthorized');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// --- Route Protection Helper ---
function requireAuth(allowedRoles = []) {
  const user = getCurrentUser();
  const token = getToken();

  if (!token || !user) {
    showToast('Please log in to view this page.', 'error');
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return false;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    showToast('Access denied: You do not have permission to view this page.', 'error');
    if (user.role === 'Client') window.location.href = '/client-dashboard.html';
    else if (user.role === 'Freelancer') window.location.href = '/freelancer-dashboard.html';
    else if (user.role === 'Admin') window.location.href = '/admin-dashboard.html';
    else window.location.href = '/index.html';
    return false;
  }

  return true;
}

// --- Dynamic Toast Notifications ---
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
    <button style="background:none;border:none;color:#fff;cursor:pointer;font-size:1.1rem;" onclick="this.parentElement.remove()">✕</button>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 4000);
}

// --- Formatters ---
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// --- Dynamic Navigation Bar Injection ---
function renderNavbar() {
  const navContainer = document.getElementById('main-nav');
  if (!navContainer) return;

  const user = getCurrentUser();
  const currentPath = window.location.pathname;

  let linksHtml = '';
  let actionsHtml = '';

  if (!user) {
    // Guest Navigation
    linksHtml = `
      <li><a href="/index.html" class="${currentPath === '/' || currentPath.endsWith('index.html') ? 'active' : ''}">Home</a></li>
      <li><a href="/projects.html" class="${currentPath.endsWith('projects.html') ? 'active' : ''}">Browse Projects</a></li>
    `;
    actionsHtml = `
      <a href="/login.html" class="btn btn-outline btn-sm">Log In</a>
      <a href="/register.html" class="btn btn-primary btn-sm">Sign Up</a>
    `;
  } else if (user.role === 'Client') {
    // Client Navigation
    linksHtml = `
      <li><a href="/client-dashboard.html" class="${currentPath.endsWith('client-dashboard.html') ? 'active' : ''}">Dashboard</a></li>
      <li><a href="/create-project.html" class="${currentPath.endsWith('create-project.html') ? 'active' : ''}">Post Project</a></li>
      <li><a href="/client-applications.html" class="${currentPath.endsWith('client-applications.html') ? 'active' : ''}">Applications</a></li>
      <li><a href="/projects.html" class="${currentPath.endsWith('projects.html') ? 'active' : ''}">Browse All</a></li>
    `;
    actionsHtml = `
      <div class="nav-user-badge">
        <span>${user.fullName}</span>
        <span class="role-pill">Client</span>
      </div>
      <button onclick="logout()" class="btn btn-outline btn-sm">Sign Out</button>
    `;
  } else if (user.role === 'Freelancer') {
    // Freelancer Navigation
    linksHtml = `
      <li><a href="/freelancer-dashboard.html" class="${currentPath.endsWith('freelancer-dashboard.html') ? 'active' : ''}">Dashboard</a></li>
      <li><a href="/projects.html" class="${currentPath.endsWith('projects.html') ? 'active' : ''}">Find Work</a></li>
      <li><a href="/my-applications.html" class="${currentPath.endsWith('my-applications.html') ? 'active' : ''}">My Applications</a></li>
    `;
    actionsHtml = `
      <div class="nav-user-badge">
        <span>${user.fullName}</span>
        <span class="role-pill">Freelancer</span>
      </div>
      <button onclick="logout()" class="btn btn-outline btn-sm">Sign Out</button>
    `;
  } else if (user.role === 'Admin') {
    // Admin Navigation
    linksHtml = `
      <li><a href="/admin-dashboard.html" class="${currentPath.endsWith('admin-dashboard.html') ? 'active' : ''}">Analytics</a></li>
      <li><a href="/manage-users.html" class="${currentPath.endsWith('manage-users.html') ? 'active' : ''}">Users</a></li>
      <li><a href="/manage-projects.html" class="${currentPath.endsWith('manage-projects.html') ? 'active' : ''}">Projects</a></li>
      <li><a href="/manage-applications.html" class="${currentPath.endsWith('manage-applications.html') ? 'active' : ''}">Applications</a></li>
    `;
    actionsHtml = `
      <div class="nav-user-badge">
        <span>${user.fullName}</span>
        <span class="role-pill">Admin</span>
      </div>
      <button onclick="logout()" class="btn btn-outline btn-sm">Sign Out</button>
    `;
  }

  navContainer.innerHTML = `
    <nav class="navbar">
      <div class="nav-container">
        <a href="/index.html" class="nav-brand">
          <span class="logo-icon">F</span>
          <span>FreelanceHub</span>
        </a>
        <ul class="nav-links">
          ${linksHtml}
        </ul>
        <div class="nav-actions">
          ${actionsHtml}
        </div>
      </div>
    </nav>
  `;
}

// Auto-render navigation on page load
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

