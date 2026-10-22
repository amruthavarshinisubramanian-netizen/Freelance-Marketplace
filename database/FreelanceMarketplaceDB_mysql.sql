-- ============================================================================
-- Freelance Marketplace Platform - MySQL Database Script
-- Compatible with MySQL 8.0+
-- Database: FreelanceMarketplaceDB
-- ============================================================================

CREATE DATABASE IF NOT EXISTS FreelanceMarketplaceDB
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE FreelanceMarketplaceDB;

-- Disable foreign key checks for clean recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS project_assignments;
DROP TABLE IF EXISTS applications;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================================
-- 1. USERS TABLE
-- Roles: 'ADMIN', 'CLIENT', 'FREELANCER'
-- ============================================================================
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    INDEX idx_users_role (role),
    INDEX idx_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. PROJECTS TABLE
-- Status: 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
-- ============================================================================
CREATE TABLE projects (
    project_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    client_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    budget DECIMAL(12, 2) NOT NULL,
    deadline DATE NOT NULL,
    required_skills VARCHAR(500) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_projects_client FOREIGN KEY (client_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_projects_client (client_id),
    INDEX idx_projects_category (category),
    INDEX idx_projects_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. APPLICATIONS TABLE
-- Status: 'PENDING', 'ACCEPTED', 'REJECTED'
-- Prevents a freelancer from applying to the same project more than once
-- ============================================================================
CREATE TABLE applications (
    application_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    proposal TEXT NOT NULL,
    bid_amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_applications_project FOREIGN KEY (project_id)
        REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_applications_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT uq_project_freelancer UNIQUE (project_id, freelancer_id),
    INDEX idx_applications_project (project_id),
    INDEX idx_applications_freelancer (freelancer_id),
    INDEX idx_applications_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PROJECT ASSIGNMENTS TABLE
-- Created when a Client accepts a Freelancer proposal
-- Status: 'ACTIVE', 'COMPLETED', 'TERMINATED'
-- ============================================================================
CREATE TABLE project_assignments (
    assignment_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT NOT NULL,
    freelancer_id BIGINT NOT NULL,
    assigned_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    CONSTRAINT fk_assignments_project FOREIGN KEY (project_id)
        REFERENCES projects(project_id) ON DELETE CASCADE,
    CONSTRAINT fk_assignments_freelancer FOREIGN KEY (freelancer_id)
        REFERENCES users(user_id) ON DELETE CASCADE,
    INDEX idx_assignments_project (project_id),
    INDEX idx_assignments_freelancer (freelancer_id),
    INDEX idx_assignments_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. SEED DATA
-- Default Passwords:
--   Admin:       Admin@123      -> Hash: $2b$10$vqjs8YvNOTWenonQ9baKbuQA/Yb/H53V/i8/2IXbFoyl4m4PNjTge
--   Clients:     Client@123     -> Hash: $2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.
--   Freelancers: Freelancer@123 -> Hash: $2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC
-- ============================================================================

INSERT INTO users (user_id, full_name, email, password_hash, role, created_at, is_active)
VALUES
(1, 'Platform Admin', 'admin@marketplace.com', '$2b$10$vqjs8YvNOTWenonQ9baKbuQA/Yb/H53V/i8/2IXbFoyl4m4PNjTge', 'ADMIN', DATE_SUB(NOW(), INTERVAL 30 DAY), TRUE),
(2, 'Johnathan Vance', 'client@marketplace.com', '$2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.', 'CLIENT', DATE_SUB(NOW(), INTERVAL 25 DAY), TRUE),
(3, 'Sarah Jenkins', 'sarah.client@company.com', '$2b$10$zHOLJmO7GZQiR6D.X0swTOU2uDWoQYYf4RtEyg5GYEBeZdzrTP1O.', 'CLIENT', DATE_SUB(NOW(), INTERVAL 20 DAY), TRUE),
(4, 'Alex Rivera', 'freelancer@marketplace.com', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'FREELANCER', DATE_SUB(NOW(), INTERVAL 20 DAY), TRUE),
(5, 'Emily Watson', 'emily.freelancer@design.com', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'FREELANCER', DATE_SUB(NOW(), INTERVAL 18 DAY), TRUE),
(6, 'David Miller', 'david.code@dev.io', '$2b$10$VgfEn5wB722Fp2KwmNC37.DwTYwVblGu7Y/8kWLz.eD3tCYz0rrrC', 'FREELANCER', DATE_SUB(NOW(), INTERVAL 15 DAY), TRUE);

INSERT INTO projects (project_id, client_id, title, description, category, budget, deadline, required_skills, status, created_at)
VALUES
(1, 2, 'Enterprise E-Commerce Storefront Development', 'We are looking for an experienced full-stack engineer to build a high-performance modern e-commerce storefront. Needs custom product catalog, shopping cart, and order processing flow.', 'Web Development', 4500.00, DATE_ADD(CURRENT_DATE(), INTERVAL 45 DAY), 'React.js, Spring Boot, Java, MySQL, REST APIs, Tailwind', 'OPEN', DATE_SUB(NOW(), INTERVAL 12 DAY)),
(2, 2, 'Mobile SaaS Dashboard UI/UX Design', 'Need a sleek, modern UI/UX design in Figma for an analytics dashboard. Deliverables include wireframes, responsive mobile/tablet/desktop components, design token system, and interactive prototype.', 'UI/UX Design', 1800.00, DATE_ADD(CURRENT_DATE(), INTERVAL 25 DAY), 'Figma, UI/UX, Design Systems, Mobile Design', 'IN_PROGRESS', DATE_SUB(NOW(), INTERVAL 10 DAY)),
(3, 3, 'High Performance REST API & Microservice Architecture', 'Our production system requires Spring Boot microservice optimization, database indexing, and query profiling to handle high-throughput concurrent requests.', 'Backend Development', 2400.00, DATE_ADD(CURRENT_DATE(), INTERVAL 20 DAY), 'Java 17, Spring Boot, MySQL, REST API, Docker', 'OPEN', DATE_SUB(NOW(), INTERVAL 7 DAY)),
(4, 3, 'Secure Payment Gateway & Subscription Integration', 'Implement automated checkout, webhook processing, recurring subscription management, and dispute handling with Stripe & PayPal APIs.', 'Backend Development', 1600.00, DATE_ADD(CURRENT_DATE(), INTERVAL 18 DAY), 'Java, Spring Security, Stripe API, REST APIs, Webhooks', 'OPEN', DATE_SUB(NOW(), INTERVAL 5 DAY)),
(5, 2, 'Corporate Brand Identity & Marketing Kit', 'Design complete brand guide, visual identity palette, typography recommendations, vector logo variations, and presentation slide templates for enterprise pitch deck.', 'Design & Branding', 950.00, DATE_ADD(CURRENT_DATE(), INTERVAL 14 DAY), 'Branding, Graphic Design, Typography, Vector Art', 'COMPLETED', DATE_SUB(NOW(), INTERVAL 20 DAY));

INSERT INTO applications (application_id, project_id, freelancer_id, proposal, bid_amount, status, applied_at)
VALUES
(1, 1, 4, 'Hello Johnathan! I have over 6 years of experience engineering high-throughput web applications with Spring Boot and React. I can deliver a cleanly architected storefront within 5 weeks with complete test coverage.', 4200.00, 'PENDING', DATE_SUB(NOW(), INTERVAL 8 DAY)),
(2, 1, 6, 'Hi there! I specialize in full-stack architecture, clean REST APIs, and database performance. Would love to collaborate and help launch your storefront.', 4400.00, 'PENDING', DATE_SUB(NOW(), INTERVAL 6 DAY)),
(3, 2, 5, 'Hi! I am a senior UI/UX designer with 15+ shipped design systems. I reviewed your dashboard specifications and have already outlined the user journey. I can deliver prototype milestones weekly.', 1800.00, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 9 DAY)),
(4, 3, 6, 'Hello Sarah! I am a backend specialist with extensive experience fine-tuning query execution plans and designing resilient microservices in Spring Boot.', 2200.00, 'PENDING', DATE_SUB(NOW(), INTERVAL 4 DAY)),
(5, 5, 5, 'I would love to craft a distinctive brand identity for your corporate materials. Portfolio attached in my profile with past venture-backed client work.', 950.00, 'ACCEPTED', DATE_SUB(NOW(), INTERVAL 19 DAY));

INSERT INTO project_assignments (assignment_id, project_id, freelancer_id, assigned_at, status)
VALUES
(1, 2, 5, DATE_SUB(NOW(), INTERVAL 8 DAY), 'ACTIVE'),
(2, 5, 5, DATE_SUB(NOW(), INTERVAL 18 DAY), 'COMPLETED');

