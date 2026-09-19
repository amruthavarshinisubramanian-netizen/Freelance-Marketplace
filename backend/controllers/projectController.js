const { query } = require('../config/db');

// GET /api/projects
// Public project browse with filtering and search
async function getAllProjects(req, res) {
  try {
    const { search, category, minBudget, maxBudget, status, sortBy } = req.query;

    let sqlQuery = `
      SELECT 
        p.ProjectId,
        p.ClientId,
        p.Title,
        p.Description,
        p.Category,
        p.Budget,
        CONVERT(VARCHAR(10), p.Deadline, 120) AS Deadline,
        p.RequiredSkills,
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

    // Filter by status (default to 'Open' for public catalog unless specified or 'all')
    if (status && status !== 'all') {
      sqlQuery += ' AND p.Status = @status';
      params.status = status;
    } else if (!status) {
      sqlQuery += " AND p.Status = 'Open'";
    }

    // Search query (matches title, description, or required skills)
    if (search && search.trim() !== '') {
      sqlQuery += ` AND (
        p.Title LIKE @searchPattern 
        OR p.Description LIKE @searchPattern 
        OR p.RequiredSkills LIKE @searchPattern
        OR u.FullName LIKE @searchPattern
      )`;
      params.searchPattern = `%${search.trim()}%`;
    }

    // Category filter
    if (category && category !== 'all' && category.trim() !== '') {
      sqlQuery += ' AND p.Category = @category';
      params.category = category.trim();
    }

    // Budget range
    if (minBudget && !isNaN(minBudget)) {
      sqlQuery += ' AND p.Budget >= @minBudget';
      params.minBudget = parseFloat(minBudget);
    }

    if (maxBudget && !isNaN(maxBudget)) {
      sqlQuery += ' AND p.Budget <= @maxBudget';
      params.maxBudget = parseFloat(maxBudget);
    }

    // Sorting
    if (sortBy === 'budget_asc') {
      sqlQuery += ' ORDER BY p.Budget ASC, p.CreatedAt DESC';
    } else if (sortBy === 'budget_desc') {
      sqlQuery += ' ORDER BY p.Budget DESC, p.CreatedAt DESC';
    } else if (sortBy === 'deadline') {
      sqlQuery += ' ORDER BY p.Deadline ASC';
    } else {
      // default: newest
      sqlQuery += ' ORDER BY p.CreatedAt DESC';
    }

    const result = await query(sqlQuery, params);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      projects: result.recordset
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve projects.'
    });
  }
}

// GET /api/projects/:id
// Get single project details
async function getProjectById(req, res) {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format.'
      });
    }

    const projectResult = await query(
      `SELECT 
        p.ProjectId,
        p.ClientId,
        p.Title,
        p.Description,
        p.Category,
        p.Budget,
        CONVERT(VARCHAR(10), p.Deadline, 120) AS Deadline,
        p.RequiredSkills,
        p.Status,
        p.CreatedAt,
        u.FullName AS ClientName,
        u.Email AS ClientEmail,
        (SELECT COUNT(*) FROM dbo.Applications a WHERE a.ProjectId = p.ProjectId) AS ApplicationCount
      FROM dbo.Projects p
      INNER JOIN dbo.Users u ON p.ClientId = u.UserId
      WHERE p.ProjectId = @projectId`,
      { projectId }
    );

    if (projectResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    const project = projectResult.recordset[0];
    let userApplication = null;

    // Check if viewing user is a Freelancer who already submitted an application
    if (req.user && req.user.role === 'Freelancer') {
      const appResult = await query(
        `SELECT ApplicationId, Proposal, BidAmount, Status, AppliedAt
         FROM dbo.Applications
         WHERE ProjectId = @projectId AND FreelancerId = @freelancerId`,
        { projectId, freelancerId: req.user.userId }
      );
      if (appResult.recordset.length > 0) {
        userApplication = appResult.recordset[0];
      }
    }

    // If client is viewing their own project, get accepted freelancer info if any
    let assignedFreelancer = null;
    if (req.user && (req.user.userId === project.ClientId || req.user.role === 'Admin')) {
      const assignResult = await query(
        `SELECT pa.AssignmentId, pa.AssignedAt, pa.Status AS AssignmentStatus,
                u.UserId AS FreelancerId, u.FullName AS FreelancerName, u.Email AS FreelancerEmail
         FROM dbo.ProjectAssignments pa
         INNER JOIN dbo.Users u ON pa.FreelancerId = u.UserId
         WHERE pa.ProjectId = @projectId`,
        { projectId }
      );
      if (assignResult.recordset.length > 0) {
        assignedFreelancer = assignResult.recordset[0];
      }
    }

    return res.status(200).json({
      success: true,
      project,
      hasApplied: !!userApplication,
      userApplication,
      assignedFreelancer
    });
  } catch (error) {
    console.error('Error fetching project by id:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve project details.'
    });
  }
}

// GET /api/projects/client/my
// Get projects created by logged-in Client
async function getClientProjects(req, res) {
  try {
    const clientId = req.user.userId;

    const result = await query(
      `SELECT 
        p.ProjectId,
        p.Title,
        p.Category,
        p.Budget,
        CONVERT(VARCHAR(10), p.Deadline, 120) AS Deadline,
        p.RequiredSkills,
        p.Status,
        p.CreatedAt,
        (SELECT COUNT(*) FROM dbo.Applications a WHERE a.ProjectId = p.ProjectId) AS ApplicationCount,
        (SELECT COUNT(*) FROM dbo.Applications a WHERE a.ProjectId = p.ProjectId AND a.Status = 'Pending') AS PendingCount,
        uAssigned.FullName AS AssignedFreelancerName
      FROM dbo.Projects p
      LEFT JOIN dbo.ProjectAssignments pa ON p.ProjectId = pa.ProjectId AND pa.Status = 'Active'
      LEFT JOIN dbo.Users uAssigned ON pa.FreelancerId = uAssigned.UserId
      WHERE p.ClientId = @clientId
      ORDER BY p.CreatedAt DESC`,
      { clientId }
    );

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      projects: result.recordset
    });
  } catch (error) {
    console.error('Error fetching client projects:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve client projects.'
    });
  }
}

// POST /api/projects
// Client creates new project
async function createProject(req, res) {
  try {
    const { title, description, category, budget, deadline, requiredSkills } = req.body;

    if (!title || !description || !category || !budget || !deadline || !requiredSkills) {
      return res.status(400).json({
        success: false,
        message: 'All fields (title, description, category, budget, deadline, requiredSkills) are required.'
      });
    }

    const numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Budget must be a positive number.'
      });
    }

    const deadlineDate = new Date(deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(deadlineDate.getTime()) || deadlineDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Deadline must be a valid future date.'
      });
    }

    const insertResult = await query(
      `INSERT INTO dbo.Projects (ClientId, Title, Description, Category, Budget, Deadline, RequiredSkills, Status)
       OUTPUT INSERTED.ProjectId, INSERTED.Title, INSERTED.Status, INSERTED.CreatedAt
       VALUES (@clientId, @title, @description, @category, @budget, @deadline, @requiredSkills, 'Open')`,
      {
        clientId: req.user.userId,
        title: title.trim(),
        description: description.trim(),
        category: category.trim(),
        budget: numBudget,
        deadline: deadline.trim(),
        requiredSkills: requiredSkills.trim()
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Project created successfully!',
      project: insertResult.recordset[0]
    });
  } catch (error) {
    console.error('Error creating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create project.'
    });
  }
}

// PUT /api/projects/:id
// Client or Admin updates existing project
async function updateProject(req, res) {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID.'
      });
    }

    // Check project ownership
    const checkResult = await query(
      'SELECT ProjectId, ClientId, Status FROM dbo.Projects WHERE ProjectId = @projectId',
      { projectId }
    );

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    const existing = checkResult.recordset[0];
    if (req.user.role !== 'Admin' && existing.ClientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only update projects that you have posted.'
      });
    }

    const { title, description, category, budget, deadline, requiredSkills, status } = req.body;

    const allowedStatuses = ['Open', 'In Progress', 'Completed', 'Cancelled'];
    const newStatus = status && allowedStatuses.includes(status) ? status : existing.Status;

    let numBudget = parseFloat(budget);
    if (isNaN(numBudget) || numBudget <= 0) {
      numBudget = undefined;
    }

    await query(
      `UPDATE dbo.Projects
       SET Title = ISNULL(@title, Title),
           Description = ISNULL(@description, Description),
           Category = ISNULL(@category, Category),
           Budget = ISNULL(@budget, Budget),
           Deadline = ISNULL(@deadline, Deadline),
           RequiredSkills = ISNULL(@requiredSkills, RequiredSkills),
           Status = @status
       WHERE ProjectId = @projectId`,
      {
        projectId,
        title: title ? title.trim() : null,
        description: description ? description.trim() : null,
        category: category ? category.trim() : null,
        budget: numBudget || null,
        deadline: deadline ? deadline.trim() : null,
        requiredSkills: requiredSkills ? requiredSkills.trim() : null,
        status: newStatus
      }
    );

    return res.status(200).json({
      success: true,
      message: 'Project updated successfully.'
    });
  } catch (error) {
    console.error('Error updating project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update project.'
    });
  }
}

// DELETE /api/projects/:id
// Client or Admin deletes project
async function deleteProject(req, res) {
  try {
    const projectId = parseInt(req.params.id, 10);
    if (isNaN(projectId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID.'
      });
    }

    const checkResult = await query(
      'SELECT ProjectId, ClientId FROM dbo.Projects WHERE ProjectId = @projectId',
      { projectId }
    );

    if (checkResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    const existing = checkResult.recordset[0];
    if (req.user.role !== 'Admin' && existing.ClientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only delete projects that you have posted.'
      });
    }

    await query('DELETE FROM dbo.Projects WHERE ProjectId = @projectId', { projectId });

    return res.status(200).json({
      success: true,
      message: 'Project deleted successfully.'
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete project.'
    });
  }
}

module.exports = {
  getAllProjects,
  getProjectById,
  getClientProjects,
  createProject,
  updateProject,
  deleteProject
};

