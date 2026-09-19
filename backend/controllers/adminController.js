const { query } = require('../config/db');

// GET /api/admin/dashboard
async function getAdminDashboard(req, res) {
  try {
    // 1. User stats
    const userStats = await query(`
      SELECT 
        COUNT(*) AS TotalUsers,
        SUM(CASE WHEN Role = 'Client' THEN 1 ELSE 0 END) AS TotalClients,
        SUM(CASE WHEN Role = 'Freelancer' THEN 1 ELSE 0 END) AS TotalFreelancers,
        SUM(CASE WHEN Role = 'Admin' THEN 1 ELSE 0 END) AS TotalAdmins,
        SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) AS ActiveUsers
      FROM dbo.Users
    `);

    // 2. Project stats
    const projectStats = await query(`
      SELECT 
        COUNT(*) AS TotalProjects,
        SUM(CASE WHEN Status = 'Open' THEN 1 ELSE 0 END) AS OpenProjects,
        SUM(CASE WHEN Status = 'In Progress' THEN 1 ELSE 0 END) AS InProgressProjects,
        SUM(CASE WHEN Status = 'Completed' THEN 1 ELSE 0 END) AS CompletedProjects,
        SUM(CASE WHEN Status = 'Cancelled' THEN 1 ELSE 0 END) AS CancelledProjects,
        ISNULL(SUM(Budget), 0) AS TotalProjectValue
      FROM dbo.Projects
    `);

    // 3. Application stats
    const appStats = await query(`
      SELECT 
        COUNT(*) AS TotalApplications,
        SUM(CASE WHEN Status = 'Pending' THEN 1 ELSE 0 END) AS PendingApplications,
        SUM(CASE WHEN Status = 'Accepted' THEN 1 ELSE 0 END) AS AcceptedApplications,
        SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) AS RejectedApplications
      FROM dbo.Applications
    `);

    // 4. Recent projects
    const recentProjects = await query(`
      SELECT TOP 5
        p.ProjectId,
        p.Title,
        p.Category,
        p.Budget,
        p.Status,
        p.CreatedAt,
        u.FullName AS ClientName
      FROM dbo.Projects p
      INNER JOIN dbo.Users u ON p.ClientId = u.UserId
      ORDER BY p.CreatedAt DESC
    `);

    // 5. Recent users
    const recentUsers = await query(`
      SELECT TOP 5
        UserId,
        FullName,
        Email,
        Role,
        CreatedAt,
        IsActive
      FROM dbo.Users
      ORDER BY CreatedAt DESC
    `);

    return res.status(200).json({
      success: true,
      stats: {
        users: userStats.recordset[0],
        projects: projectStats.recordset[0],
        applications: appStats.recordset[0]
      },
      recentProjects: recentProjects.recordset,
      recentUsers: recentUsers.recordset
    });
  } catch (error) {
    console.error('Error fetching admin dashboard:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve admin dashboard analytics.'
    });
  }
}

// GET /api/admin/users
async function getAllUsers(req, res) {
  try {
    const { search, role, status } = req.query;

    let sqlQuery = `
      SELECT 
        UserId,
        FullName,
        Email,
        Role,
        CreatedAt,
        IsActive,
        (SELECT COUNT(*) FROM dbo.Projects p WHERE p.ClientId = u.UserId) AS ProjectsPosted,
        (SELECT COUNT(*) FROM dbo.Applications a WHERE a.FreelancerId = u.UserId) AS ApplicationsSubmitted
      FROM dbo.Users u
      WHERE 1=1
    `;

    const params = {};

    if (search && search.trim() !== '') {
      sqlQuery += ' AND (FullName LIKE @searchPattern OR Email LIKE @searchPattern)';
      params.searchPattern = `%${search.trim()}%`;
    }

    if (role && role !== 'all') {
      sqlQuery += ' AND Role = @role';
      params.role = role.trim();
    }

    if (status && status !== 'all') {
      sqlQuery += ' AND IsActive = @isActive';
      params.isActive = status === 'active' ? 1 : 0;
    }

    sqlQuery += ' ORDER BY CreatedAt DESC';

    const result = await query(sqlQuery, params);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      users: result.recordset
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve users.'
    });
  }
}

// PUT /api/admin/users/:id/toggle-status
async function toggleUserStatus(req, res) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (targetUserId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own admin account.'
      });
    }

    const check = await query('SELECT UserId, IsActive FROM dbo.Users WHERE UserId = @userId', {
      userId: targetUserId
    });

    if (check.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    const newStatus = check.recordset[0].IsActive ? 0 : 1;

    await query('UPDATE dbo.Users SET IsActive = @newStatus WHERE UserId = @userId', {
      newStatus,
      userId: targetUserId
    });

    return res.status(200).json({
      success: true,
      message: `User account has been ${newStatus === 1 ? 'activated' : 'deactivated'}.`,
      isActive: newStatus === 1
    });
  } catch (error) {
    console.error('Error toggling user status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user status.'
    });
  }
}

// DELETE /api/admin/users/:id
async function deleteUser(req, res) {
  try {
    const targetUserId = parseInt(req.params.id, 10);

    if (targetUserId === req.user.userId) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own admin account.'
      });
    }

    // Clean up dependencies if needed before deleting user
    await query('DELETE FROM dbo.ProjectAssignments WHERE FreelancerId = @userId', { userId: targetUserId });
    await query('DELETE FROM dbo.Applications WHERE FreelancerId = @userId', { userId: targetUserId });
    await query('DELETE FROM dbo.Projects WHERE ClientId = @userId', { userId: targetUserId });
    await query('DELETE FROM dbo.Users WHERE UserId = @userId', { userId: targetUserId });

    return res.status(200).json({
      success: true,
      message: 'User and all associated records deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user.'
    });
  }
}

// GET /api/admin/projects
async function getAllProjects(req, res) {
  try {
    const { search, status, category } = req.query;

    let sqlQuery = `
      SELECT 
        p.ProjectId,
        p.ClientId,
        p.Title,
        p.Category,
        p.Budget,
        CONVERT(VARCHAR(10), p.Deadline, 120) AS Deadline,
        p.Status,
        p.CreatedAt,
        u.FullName AS ClientName,
        u.Email AS ClientEmail,
        (SELECT COUNT(*) FROM dbo.Applications a WHERE a.ProjectId = p.ProjectId) AS ApplicationCount
      FROM dbo.Projects p
      INNER JOIN dbo.Users u ON p.ClientId = u.UserId
      WHERE 1=1
    `;

    const params = {};

    if (search && search.trim() !== '') {
      sqlQuery += ' AND (p.Title LIKE @searchPattern OR u.FullName LIKE @searchPattern)';
      params.searchPattern = `%${search.trim()}%`;
    }

    if (status && status !== 'all') {
      sqlQuery += ' AND p.Status = @status';
      params.status = status;
    }

    if (category && category !== 'all') {
      sqlQuery += ' AND p.Category = @category';
      params.category = category;
    }

    sqlQuery += ' ORDER BY p.CreatedAt DESC';

    const result = await query(sqlQuery, params);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      projects: result.recordset
    });
  } catch (error) {
    console.error('Error fetching admin projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.'
    });
  }
}

// GET /api/admin/applications
async function getAllApplications(req, res) {
  try {
    const { status, search } = req.query;

    let sqlQuery = `
      SELECT 
        a.ApplicationId,
        a.ProjectId,
        a.FreelancerId,
        a.Proposal,
        a.BidAmount,
        a.Status AS ApplicationStatus,
        a.AppliedAt,
        p.Title AS ProjectTitle,
        p.Status AS ProjectStatus,
        uClient.FullName AS ClientName,
        uFree.FullName AS FreelancerName,
        uFree.Email AS FreelancerEmail
      FROM dbo.Applications a
      INNER JOIN dbo.Projects p ON a.ProjectId = p.ProjectId
      INNER JOIN dbo.Users uClient ON p.ClientId = uClient.UserId
      INNER JOIN dbo.Users uFree ON a.FreelancerId = uFree.UserId
      WHERE 1=1
    `;

    const params = {};

    if (status && status !== 'all') {
      sqlQuery += ' AND a.Status = @status';
      params.status = status;
    }

    if (search && search.trim() !== '') {
      sqlQuery += ' AND (p.Title LIKE @searchPattern OR uFree.FullName LIKE @searchPattern OR uClient.FullName LIKE @searchPattern)';
      params.searchPattern = `%${search.trim()}%`;
    }

    sqlQuery += ' ORDER BY a.AppliedAt DESC';

    const result = await query(sqlQuery, params);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      applications: result.recordset
    });
  } catch (error) {
    console.error('Error fetching admin applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications.'
    });
  }
}

// DELETE /api/admin/applications/:id
async function deleteApplication(req, res) {
  try {
    const applicationId = parseInt(req.params.id, 10);
    await query('DELETE FROM dbo.Applications WHERE ApplicationId = @applicationId', { applicationId });
    return res.status(200).json({
      success: true,
      message: 'Application deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting application:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete application.'
    });
  }
}

module.exports = {
  getAdminDashboard,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllProjects,
  getAllApplications,
  deleteApplication
};

