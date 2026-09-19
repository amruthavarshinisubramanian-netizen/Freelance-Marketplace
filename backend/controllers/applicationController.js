const { query } = require('../config/db');

// POST /api/applications
// Freelancer submits an application / proposal
async function applyForProject(req, res) {
  try {
    const { projectId, proposal, bidAmount } = req.body;
    const freelancerId = req.user.userId;

    if (!projectId || !proposal || !bidAmount) {
      return res.status(400).json({
        success: false,
        message: 'Project ID, proposal text, and bid amount are required.'
      });
    }

    const numBid = parseFloat(bidAmount);
    if (isNaN(numBid) || numBid <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Bid amount must be a positive number.'
      });
    }

    // Check project status
    const projectResult = await query(
      'SELECT ProjectId, Status, Deadline, ClientId FROM dbo.Projects WHERE ProjectId = @projectId',
      { projectId: parseInt(projectId, 10) }
    );

    if (projectResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Project not found.'
      });
    }

    const project = projectResult.recordset[0];

    if (project.Status !== 'Open') {
      return res.status(400).json({
        success: false,
        message: `Cannot apply to this project because its status is "${project.Status}".`
      });
    }

    // Check if freelancer already applied
    const existing = await query(
      'SELECT ApplicationId FROM dbo.Applications WHERE ProjectId = @projectId AND FreelancerId = @freelancerId',
      { projectId: project.ProjectId, freelancerId }
    );

    if (existing.recordset.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'You have already submitted a proposal for this project.'
      });
    }

    const insertResult = await query(
      `INSERT INTO dbo.Applications (ProjectId, FreelancerId, Proposal, BidAmount, Status)
       OUTPUT INSERTED.ApplicationId, INSERTED.ProjectId, INSERTED.BidAmount, INSERTED.Status, INSERTED.AppliedAt
       VALUES (@projectId, @freelancerId, @proposal, @bidAmount, 'Pending')`,
      {
        projectId: project.ProjectId,
        freelancerId,
        proposal: proposal.trim(),
        bidAmount: numBid
      }
    );

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully!',
      application: insertResult.recordset[0]
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to submit proposal.'
    });
  }
}

// GET /api/applications/my
// Freelancer views all their submitted applications
async function getMyApplications(req, res) {
  try {
    const freelancerId = req.user.userId;

    const result = await query(
      `SELECT 
        a.ApplicationId,
        a.ProjectId,
        a.Proposal,
        a.BidAmount,
        a.Status AS ApplicationStatus,
        a.AppliedAt,
        p.Title AS ProjectTitle,
        p.Category AS ProjectCategory,
        p.Budget AS ProjectBudget,
        CONVERT(VARCHAR(10), p.Deadline, 120) AS ProjectDeadline,
        p.Status AS ProjectStatus,
        uClient.FullName AS ClientName,
        uClient.Email AS ClientEmail
      FROM dbo.Applications a
      INNER JOIN dbo.Projects p ON a.ProjectId = p.ProjectId
      INNER JOIN dbo.Users uClient ON p.ClientId = uClient.UserId
      WHERE a.FreelancerId = @freelancerId
      ORDER BY a.AppliedAt DESC`,
      { freelancerId }
    );

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      applications: result.recordset
    });
  } catch (error) {
    console.error('Error fetching freelancer applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve applications.'
    });
  }
}

// GET /api/applications/client
// Client views applications for their posted projects
async function getClientApplications(req, res) {
  try {
    const clientId = req.user.userId;
    const { projectId, status } = req.query;

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
        p.Category AS ProjectCategory,
        p.Budget AS ProjectBudget,
        p.Status AS ProjectStatus,
        uFreelancer.FullName AS FreelancerName,
        uFreelancer.Email AS FreelancerEmail
      FROM dbo.Applications a
      INNER JOIN dbo.Projects p ON a.ProjectId = p.ProjectId
      INNER JOIN dbo.Users uFreelancer ON a.FreelancerId = uFreelancer.UserId
      WHERE p.ClientId = @clientId
    `;

    const params = { clientId };

    if (projectId && !isNaN(projectId)) {
      sqlQuery += ' AND a.ProjectId = @projectId';
      params.projectId = parseInt(projectId, 10);
    }

    if (status && status !== 'all') {
      sqlQuery += ' AND a.Status = @status';
      params.status = status;
    }

    sqlQuery += ' ORDER BY a.AppliedAt DESC';

    const result = await query(sqlQuery, params);

    return res.status(200).json({
      success: true,
      count: result.recordset.length,
      applications: result.recordset
    });
  } catch (error) {
    console.error('Error fetching client applications:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve proposals.'
    });
  }
}

// PUT /api/applications/:id/status
// Client or Admin updates application status (Accept / Reject)
async function updateApplicationStatus(req, res) {
  try {
    const applicationId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!['Accepted', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be "Accepted" or "Rejected".'
      });
    }

    // Get application and project details
    const appResult = await query(
      `SELECT a.ApplicationId, a.ProjectId, a.FreelancerId, a.Status, p.ClientId, p.Title
       FROM dbo.Applications a
       INNER JOIN dbo.Projects p ON a.ProjectId = p.ProjectId
       WHERE a.ApplicationId = @applicationId`,
      { applicationId }
    );

    if (appResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found.'
      });
    }

    const application = appResult.recordset[0];

    // Check permissions
    if (req.user.role !== 'Admin' && application.ClientId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You can only manage applications for your own projects.'
      });
    }

    // Update application status
    await query(
      'UPDATE dbo.Applications SET Status = @status WHERE ApplicationId = @applicationId',
      { status, applicationId }
    );

    // If accepted:
    // 1. Update Project status to 'In Progress'
    // 2. Add entry to dbo.ProjectAssignments if not exists
    if (status === 'Accepted') {
      await query(
        "UPDATE dbo.Projects SET Status = 'In Progress' WHERE ProjectId = @projectId",
        { projectId: application.ProjectId }
      );

      const assignCheck = await query(
        'SELECT AssignmentId FROM dbo.ProjectAssignments WHERE ProjectId = @projectId AND FreelancerId = @freelancerId',
        { projectId: application.ProjectId, freelancerId: application.FreelancerId }
      );

      if (assignCheck.recordset.length === 0) {
        await query(
          `INSERT INTO dbo.ProjectAssignments (ProjectId, FreelancerId, Status)
           VALUES (@projectId, @freelancerId, 'Active')`,
          { projectId: application.ProjectId, freelancerId: application.FreelancerId }
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: `Proposal has been ${status.toLowerCase()}.`
    });
  } catch (error) {
    console.error('Error updating application status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update application status.'
    });
  }
}

module.exports = {
  applyForProject,
  getMyApplications,
  getClientApplications,
  updateApplicationStatus
};

