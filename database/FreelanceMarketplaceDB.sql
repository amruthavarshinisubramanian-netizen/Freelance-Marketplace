-- ============================================================================
-- Freelance Marketplace Platform Database Initialization Script
-- Target: Microsoft SQL Server 2016+ / 2019 / 2022 / 2025
-- Database: FreelanceMarketplaceDB
-- ============================================================================

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'FreelanceMarketplaceDB')
BEGIN
    CREATE DATABASE [FreelanceMarketplaceDB];
    PRINT 'Database FreelanceMarketplaceDB created successfully.';
END
ELSE
BEGIN
    PRINT 'Database FreelanceMarketplaceDB already exists.';
END
GO

USE [FreelanceMarketplaceDB];
GO

-- ============================================================================
-- 1. DROP EXISTING CONSTRAINTS AND TABLES (FOR CLEAN SETUP IF NEEDED)
-- ============================================================================
IF OBJECT_ID('dbo.ProjectAssignments', 'U') IS NOT NULL DROP TABLE dbo.ProjectAssignments;
IF OBJECT_ID('dbo.Applications', 'U') IS NOT NULL DROP TABLE dbo.Applications;
IF OBJECT_ID('dbo.Projects', 'U') IS NOT NULL DROP TABLE dbo.Projects;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
GO

-- ============================================================================
-- 2. USERS TABLE
-- Roles: 'Client', 'Freelancer', 'Admin'
-- ============================================================================
CREATE TABLE dbo.Users (
    UserId INT IDENTITY(1,1) PRIMARY KEY,
    FullName NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL CONSTRAINT UQ_Users_Email UNIQUE,
    PasswordHash NVARCHAR(255) NOT NULL,
    Role NVARCHAR(20) NOT NULL CONSTRAINT CHK_Users_Role CHECK (Role IN ('Client', 'Freelancer', 'Admin')),
    CreatedAt DATETIME NOT NULL CONSTRAINT DF_Users_CreatedAt DEFAULT GETDATE(),
    IsActive BIT NOT NULL CONSTRAINT DF_Users_IsActive DEFAULT 1
);
GO

-- ============================================================================
-- 3. PROJECTS TABLE
-- Status: 'Open', 'In Progress', 'Completed', 'Cancelled'
-- ============================================================================
CREATE TABLE dbo.Projects (
    ProjectId INT IDENTITY(1,1) PRIMARY KEY,
    ClientId INT NOT NULL,
    Title NVARCHAR(200) NOT NULL,
    Description NVARCHAR(MAX) NOT NULL,
    Category NVARCHAR(100) NOT NULL,
    Budget DECIMAL(12, 2) NOT NULL CONSTRAINT CHK_Projects_Budget CHECK (Budget > 0),
    Deadline DATE NOT NULL,
    RequiredSkills NVARCHAR(500) NOT NULL,
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Projects_Status DEFAULT 'Open' 
        CONSTRAINT CHK_Projects_Status CHECK (Status IN ('Open', 'In Progress', 'Completed', 'Cancelled')),
    CreatedAt DATETIME NOT NULL CONSTRAINT DF_Projects_CreatedAt DEFAULT GETDATE(),
    CONSTRAINT FK_Projects_Users FOREIGN KEY (ClientId) 
        REFERENCES dbo.Users(UserId) ON DELETE CASCADE
);
GO

-- ============================================================================
-- 4. APPLICATIONS TABLE
-- Status: 'Pending', 'Accepted', 'Rejected'
-- Ensures 1 application per freelancer per project
-- ============================================================================
CREATE TABLE dbo.Applications (
    ApplicationId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    FreelancerId INT NOT NULL,
    Proposal NVARCHAR(MAX) NOT NULL,
    BidAmount DECIMAL(12, 2) NOT NULL CONSTRAINT CHK_Applications_BidAmount CHECK (BidAmount > 0),
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_Applications_Status DEFAULT 'Pending' 
        CONSTRAINT CHK_Applications_Status CHECK (Status IN ('Pending', 'Accepted', 'Rejected')),
    AppliedAt DATETIME NOT NULL CONSTRAINT DF_Applications_AppliedAt DEFAULT GETDATE(),
    CONSTRAINT FK_Applications_Projects FOREIGN KEY (ProjectId) 
        REFERENCES dbo.Projects(ProjectId) ON DELETE CASCADE,
    CONSTRAINT FK_Applications_Users FOREIGN KEY (FreelancerId) 
        REFERENCES dbo.Users(UserId) ON DELETE NO ACTION,
    CONSTRAINT UQ_Project_Freelancer UNIQUE (ProjectId, FreelancerId)
);
GO

-- ============================================================================
-- 5. PROJECT ASSIGNMENTS TABLE
-- Created when a Client accepts a Freelancer proposal
-- Status: 'Active', 'Completed', 'Terminated'
-- ============================================================================
CREATE TABLE dbo.ProjectAssignments (
    AssignmentId INT IDENTITY(1,1) PRIMARY KEY,
    ProjectId INT NOT NULL,
    FreelancerId INT NOT NULL,
    AssignedAt DATETIME NOT NULL CONSTRAINT DF_ProjectAssignments_AssignedAt DEFAULT GETDATE(),
    Status NVARCHAR(20) NOT NULL CONSTRAINT DF_ProjectAssignments_Status DEFAULT 'Active' 
        CONSTRAINT CHK_ProjectAssignments_Status CHECK (Status IN ('Active', 'Completed', 'Terminated')),
    CONSTRAINT FK_Assignments_Projects FOREIGN KEY (ProjectId) 
        REFERENCES dbo.Projects(ProjectId) ON DELETE CASCADE,
    CONSTRAINT FK_Assignments_Users FOREIGN KEY (FreelancerId) 
        REFERENCES dbo.Users(UserId) ON DELETE NO ACTION
);
GO

-- ============================================================================
-- 6. PERFORMANCE INDEXES
-- ============================================================================
CREATE NONCLUSTERED INDEX IX_Users_Role ON dbo.Users(Role);
CREATE NONCLUSTERED INDEX IX_Projects_ClientId ON dbo.Projects(ClientId);
CREATE NONCLUSTERED INDEX IX_Projects_Category ON dbo.Projects(Category);
CREATE NONCLUSTERED INDEX IX_Projects_Status ON dbo.Projects(Status);
CREATE NONCLUSTERED INDEX IX_Applications_ProjectId ON dbo.Applications(ProjectId);
CREATE NONCLUSTERED INDEX IX_Applications_FreelancerId ON dbo.Applications(FreelancerId);
CREATE NONCLUSTERED INDEX IX_Applications_Status ON dbo.Applications(Status);
CREATE NONCLUSTERED INDEX IX_Assignments_ProjectId ON dbo.ProjectAssignments(ProjectId);
CREATE NONCLUSTERED INDEX IX_Assignments_FreelancerId ON dbo.ProjectAssignments(FreelancerId);
GO

-- ============================================================================
-- 7. SEED DATA
-- Default Passwords:
--   Admin:      Admin@123      -> Hash: $2b$10$vqjs8YvNOTWenonQ9baKbuQA/Yb/H53V/i8/2IXbFoyl4m4PNjTge
--   Clients:    Client@123     -> Hash: $2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.
--   Freelancers: Freelancer@123 -> Hash: $2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC
-- ============================================================================

SET IDENTITY_INSERT dbo.Users ON;

INSERT INTO dbo.Users (UserId, FullName, Email, PasswordHash, Role, CreatedAt, IsActive)
VALUES
(1, 'Platform Admin', 'admin@marketplace.com', '$2b$10$vqjs8YvNOTWenonQ9baKbuQA/Yb/H53V/i8/2IXbFoyl4m4PNjTge', 'Admin', DATEADD(DAY, -30, GETDATE()), 1),
(2, 'Johnathan Vance', 'client@marketplace.com', '$2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.', 'Client', DATEADD(DAY, -25, GETDATE()), 1),
(3, 'Sarah Jenkins', 'sarah.client@company.com', '$2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.', 'Client', DATEADD(DAY, -20, GETDATE()), 1),
(4, 'Alex Rivera', 'freelancer@marketplace.com', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'Freelancer', DATEADD(DAY, -20, GETDATE()), 1),
(5, 'Emily Watson', 'emily.freelancer@design.com', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'Freelancer', DATEADD(DAY, -18, GETDATE()), 1),
(6, 'David Miller', 'david.code@dev.io', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'Freelancer', DATEADD(DAY, -15, GETDATE()), 1);

SET IDENTITY_INSERT dbo.Users OFF;
GO

SET IDENTITY_INSERT dbo.Projects ON;

INSERT INTO dbo.Projects (ProjectId, ClientId, Title, Description, Category, Budget, Deadline, RequiredSkills, Status, CreatedAt)
VALUES
(1, 2, 'Enterprise E-Commerce Storefront Development', 'We are looking for an experienced full-stack engineer to build a high-performance modern e-commerce storefront. Needs custom product catalog, shopping cart, and order processing flow.', 'Web Development', 4500.00, DATEADD(DAY, 45, GETDATE()), 'Node.js, Express, JavaScript, SQL Server, HTML5, CSS3', 'Open', DATEADD(DAY, -12, GETDATE())),
(2, 2, 'Mobile SaaS Dashboard UI/UX Design', 'Need a sleek, modern UI/UX design in Figma for an analytics dashboard. Deliverables include wireframes, responsive mobile/tablet/desktop components, design token system, and interactive prototype.', 'UI/UX Design', 1800.00, DATEADD(DAY, 25, GETDATE()), 'Figma, UI/UX, Design Systems, Mobile Design', 'In Progress', DATEADD(DAY, -10, GETDATE())),
(3, 3, 'SQL Server Database Tuning & Optimization', 'Our production SQL Server instance needs query optimization, index tuning, and performance profiling to eliminate deadlocks and slow queries during peak load hours.', 'Database', 2400.00, DATEADD(DAY, 20, GETDATE()), 'SQL Server, T-SQL, Query Optimization, Database Indexing', 'Open', DATEADD(DAY, -7, GETDATE())),
(4, 3, 'Secure Stripe & PayPal Payment Gateway Integration', 'Implement automated checkout, webhook processing, recurring subscription management, and secure webhook dispute handling with Express.js REST API.', 'Backend Development', 1600.00, DATEADD(DAY, 18, GETDATE()), 'Node.js, Express, Stripe API, REST APIs, Webhooks', 'Open', DATEADD(DAY, -5, GETDATE())),
(5, 2, 'Corporate Brand Identity & Marketing Kit', 'Design complete brand guide, visual identity palette, typography recommendations, vector logo variations, and presentation slide templates for enterprise pitch deck.', 'Design & Branding', 950.00, DATEADD(DAY, 14, GETDATE()), 'Branding, Graphic Design, Typography, Vector Art', 'Completed', DATEADD(DAY, -20, GETDATE()));

SET IDENTITY_INSERT dbo.Projects OFF;
GO

SET IDENTITY_INSERT dbo.Applications ON;

INSERT INTO dbo.Applications (ApplicationId, ProjectId, FreelancerId, Proposal, BidAmount, Status, AppliedAt)
VALUES
(1, 1, 4, 'Hello Johnathan! I have over 6 years of experience engineering high-throughput web applications with Node.js and SQL Server. I can deliver a cleanly architected storefront within 5 weeks with test coverage.', 4200.00, 'Pending', DATEADD(DAY, -8, GETDATE())),
(2, 1, 6, 'Hi there! I specialize in full-stack architecture, clean REST APIs, and database performance. Would love to collaborate and help launch your storefront.', 4400.00, 'Pending', DATEADD(DAY, -6, GETDATE())),
(3, 2, 5, 'Hi! I am a senior UI/UX designer with 15+ shipped design systems. I reviewed your dashboard specifications and have already outlined the user journey. I can deliver prototype milestones weekly.', 1800.00, 'Accepted', DATEADD(DAY, -9, GETDATE())),
(4, 3, 6, 'Hello Sarah! I am a database specialist with extensive experience resolving deadlocks and fine-tuning query execution plans in high-concurrency SQL Server environments.', 2200.00, 'Pending', DATEADD(DAY, -4, GETDATE())),
(5, 5, 5, 'I would love to craft a distinctive brand identity for your corporate materials. Portfolio attached in my profile with past venture-backed client work.', 950.00, 'Accepted', DATEADD(DAY, -19, GETDATE()));

SET IDENTITY_INSERT dbo.Applications OFF;
GO

SET IDENTITY_INSERT dbo.ProjectAssignments ON;

INSERT INTO dbo.ProjectAssignments (AssignmentId, ProjectId, FreelancerId, AssignedAt, Status)
VALUES
(1, 2, 5, DATEADD(DAY, -8, GETDATE()), 'Active'),
(2, 5, 5, DATEADD(DAY, -18, GETDATE()), 'Completed');

SET IDENTITY_INSERT dbo.ProjectAssignments OFF;
GO

PRINT 'FreelanceMarketplaceDB initialized and seeded successfully!';

