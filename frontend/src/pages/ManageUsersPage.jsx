import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { formatDate } from '../services/formatters';
import { showToast } from '../services/toast';

export default function ManageUsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (statusFilter !== 'all') params.append('status', statusFilter === 'active');

      const data = await api.get(`/admin/users?${params.toString()}`);
      setUsers(data.users || []);
    } catch (e) {
      showToast(e.message || 'Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const handleToggleStatus = async (userId) => {
    try {
      const res = await api.put(`/admin/users/${userId}/toggle-status`);
      showToast(res.message || 'User status toggled.', 'success');
      fetchUsers();
    } catch (e) {
      showToast(e.message || 'Failed to update user status', 'error');
    }
  };

  const handleDeleteUser = async (userId, userFullName) => {
    if (!window.confirm(`Are you sure you want to permanently delete account for ${userFullName}?`)) {
      return;
    }
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      showToast(res.message || 'User deleted successfully.', 'success');
      fetchUsers();
    } catch (e) {
      showToast(e.message || 'Failed to delete user', 'error');
    }
  };

  const getRoleBadge = (role) => {
    const r = (role || '').toUpperCase();
    if (r === 'ADMIN') return <span className="badge badge-admin">Admin</span>;
    if (r === 'CLIENT') return <span className="badge badge-client">Client</span>;
    return <span className="badge badge-freelancer">Freelancer</span>;
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="page-header-actions">
            <div>
              <h1>User Account Management</h1>
              <p>Search, review, activate/deactivate, or remove client and freelancer accounts.</p>
            </div>
            <Link to="/admin-dashboard" className="btn btn-secondary btn-sm">← Back to Analytics</Link>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <form onSubmit={handleSearchSubmit} className="filter-bar">
          <div className="filter-item" style={{ flex: 2 }}>
            <label className="form-label" htmlFor="user-search">Search Users</label>
            <input
              type="text"
              id="user-search"
              className="form-control"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="user-role-filter">Filter by Role</label>
            <select
              id="user-role-filter"
              className="form-select"
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="CLIENT">Clients</option>
              <option value="FREELANCER">Freelancers</option>
              <option value="ADMIN">Admins</option>
            </select>
          </div>

          <div className="filter-item">
            <label className="form-label" htmlFor="user-status-filter">Account Status</label>
            <select
              id="user-status-filter"
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active Accounts</option>
              <option value="inactive">Deactivated Accounts</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="btn btn-primary">Search</button>
          </div>
        </form>

        <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--text-muted)' }}>
          {loading ? 'Loading users...' : `Showing ${users.length} registered user account${users.length === 1 ? '' : 's'}`}
        </div>

        {/* Users Table */}
        <div className="card" style={{ marginBottom: '4rem' }}>
          <div className="table-container" style={{ border: 'none', boxShadow: 'none', marginBottom: 0 }}>
            <table className="table">
              <thead>
                <tr>
                  <th>User Name &amp; Email</th>
                  <th>Role</th>
                  <th>Platform Activity</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Moderation Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>Loading user records...</td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>No users match the criteria.</td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isAdmin = (u.role || '').toUpperCase() === 'ADMIN';
                    return (
                      <tr key={u.userId}>
                        <td>
                          <strong>{u.fullName}</strong>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </td>
                        <td>{getRoleBadge(u.role)}</td>
                        <td>
                          <div style={{ fontSize: '0.85rem' }}>
                            {u.projectsPosted > 0 && <span>📁 {u.projectsPosted} projects posted<br /></span>}
                            {u.applicationsSubmitted > 0 && <span>📝 {u.applicationsSubmitted} proposals submitted</span>}
                            {u.projectsPosted === 0 && u.applicationsSubmitted === 0 && <span style={{ color: 'var(--text-muted)' }}>New account</span>}
                          </div>
                        </td>
                        <td>{formatDate(u.createdAt)}</td>
                        <td>
                          {u.isActive ? (
                            <span className="badge badge-accepted">Active</span>
                          ) : (
                            <span className="badge badge-rejected">Deactivated</span>
                          )}
                        </td>
                        <td>
                          {!isAdmin ? (
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              <button
                                onClick={() => handleToggleStatus(u.userId)}
                                className={`btn btn-sm ${u.isActive ? 'btn-outline' : 'btn-success'}`}
                              >
                                {u.isActive ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.userId, u.fullName)}
                                className="btn btn-outline btn-sm"
                                style={{ color: 'var(--danger)' }}
                              >
                                Delete
                              </button>
                            </div>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Superadmin (Protected)</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

