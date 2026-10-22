package com.marketplace.config;

import com.marketplace.entity.*;
import com.marketplace.repository.ApplicationRepository;
import com.marketplace.repository.ProjectAssignmentRepository;
import com.marketplace.repository.ProjectRepository;
import com.marketplace.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           ProjectRepository projectRepository,
                           ApplicationRepository applicationRepository,
                           ProjectAssignmentRepository projectAssignmentRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.applicationRepository = applicationRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        initializeAdminUser();
        initializeSampleDataIfEmpty();
    }

    private void initializeAdminUser() {
        String adminEmail = "admin@marketplace.com";
        if (userRepository.findByEmailIgnoreCase(adminEmail).isEmpty()) {
            logger.info("Initializing default development admin account ({})", adminEmail);
            User admin = new User();
            admin.setFullName("Platform Admin");
            admin.setEmail(adminEmail);
            admin.setPasswordHash(passwordEncoder.encode("Admin@123"));
            admin.setRole(Role.ADMIN);
            admin.setIsActive(true);
            admin.setCreatedAt(LocalDateTime.now().minusDays(30));
            userRepository.save(admin);
            logger.info("Development admin account created successfully.");
        } else {
            logger.info("Admin account ({}) already exists. Existing credentials preserved.", adminEmail);
        }
    }

    private void initializeSampleDataIfEmpty() {
        if (projectRepository.count() > 0) {
            return;
        }

        // Find a client user to own the sample projects
        Optional<User> clientOpt = userRepository.findByEmailIgnoreCase("client@marketplace.com");
        if (clientOpt.isEmpty()) {
            List<User> clients = userRepository.searchUsers(Role.CLIENT, true, null);
            if (!clients.isEmpty()) {
                clientOpt = Optional.of(clients.get(0));
            }
        }

        if (clientOpt.isEmpty()) {
            logger.info("No client user found for sample projects. Skipping sample data seed.");
            return;
        }

        User client = clientOpt.get();
        logger.info("Seeding initial sample projects from original platform dataset for client: {}", client.getEmail());

        // Project 1: Open E-Commerce Storefront
        Project p1 = new Project();
        p1.setClient(client);
        p1.setTitle("Enterprise E-Commerce Storefront Development");
        p1.setDescription("We are looking for an experienced full-stack engineer to build a high-performance modern e-commerce storefront. Needs custom product catalog, shopping cart, and order processing flow.");
        p1.setCategory("Web Development");
        p1.setBudget(new BigDecimal("4500.00"));
        p1.setDeadline(LocalDate.now().plusDays(45));
        p1.setRequiredSkills("Node.js, Express, JavaScript, SQL Server, HTML5, CSS3");
        p1.setStatus(ProjectStatus.OPEN);
        p1.setCreatedAt(LocalDateTime.now().minusDays(12));
        projectRepository.save(p1);

        // Project 2: In-Progress SaaS UI/UX Design
        Project p2 = new Project();
        p2.setClient(client);
        p2.setTitle("Mobile SaaS Dashboard UI/UX Design");
        p2.setDescription("Need a sleek, modern UI/UX design in Figma for an analytics dashboard. Deliverables include wireframes, responsive mobile/tablet/desktop components, design token system, and interactive prototype.");
        p2.setCategory("UI/UX Design");
        p2.setBudget(new BigDecimal("1800.00"));
        p2.setDeadline(LocalDate.now().plusDays(25));
        p2.setRequiredSkills("Figma, UI/UX, Design Systems, Mobile Design");
        p2.setStatus(ProjectStatus.IN_PROGRESS);
        p2.setCreatedAt(LocalDateTime.now().minusDays(10));
        projectRepository.save(p2);

        // Project 3: Open Database Tuning
        Project p3 = new Project();
        p3.setClient(client);
        p3.setTitle("SQL Server Database Tuning & Optimization");
        p3.setDescription("Our production SQL Server instance needs query optimization, index tuning, and performance profiling to eliminate deadlocks and slow queries during peak load hours.");
        p3.setCategory("Database");
        p3.setBudget(new BigDecimal("2400.00"));
        p3.setDeadline(LocalDate.now().plusDays(20));
        p3.setRequiredSkills("SQL Server, T-SQL, Query Optimization, Database Indexing");
        p3.setStatus(ProjectStatus.OPEN);
        p3.setCreatedAt(LocalDateTime.now().minusDays(7));
        projectRepository.save(p3);

        // Project 4: Open Payment Gateway
        Project p4 = new Project();
        p4.setClient(client);
        p4.setTitle("Secure Stripe & PayPal Payment Gateway Integration");
        p4.setDescription("Implement automated checkout, webhook processing, recurring subscription management, and secure webhook dispute handling with Express.js REST API.");
        p4.setCategory("Backend Development");
        p4.setBudget(new BigDecimal("1600.00"));
        p4.setDeadline(LocalDate.now().plusDays(18));
        p4.setRequiredSkills("Node.js, Express, Stripe API, REST APIs, Webhooks");
        p4.setStatus(ProjectStatus.OPEN);
        p4.setCreatedAt(LocalDateTime.now().minusDays(5));
        projectRepository.save(p4);

        // Project 5: Completed Brand Identity
        Project p5 = new Project();
        p5.setClient(client);
        p5.setTitle("Corporate Brand Identity & Marketing Kit");
        p5.setDescription("Design complete brand guide, visual identity palette, typography recommendations, vector logo variations, and presentation slide templates for enterprise pitch deck.");
        p5.setCategory("Design & Branding");
        p5.setBudget(new BigDecimal("950.00"));
        p5.setDeadline(LocalDate.now().plusDays(14));
        p5.setRequiredSkills("Branding, Graphic Design, Typography, Vector Art");
        p5.setStatus(ProjectStatus.COMPLETED);
        p5.setCreatedAt(LocalDateTime.now().minusDays(20));
        projectRepository.save(p5);

        // Check if freelancer exists to seed sample proposals
        Optional<User> freeOpt = userRepository.findByEmailIgnoreCase("freelancer@marketplace.com");
        if (freeOpt.isEmpty()) {
            List<User> freelancers = userRepository.searchUsers(Role.FREELANCER, true, null);
            if (!freelancers.isEmpty()) {
                freeOpt = Optional.of(freelancers.get(0));
            }
        }

        if (freeOpt.isPresent()) {
            User freelancer = freeOpt.get();

            // Application 1 on Project 1
            Application a1 = new Application();
            a1.setProject(p1);
            a1.setFreelancer(freelancer);
            a1.setProposal("Hello! I have over 6 years of experience engineering high-throughput web applications with Node.js and SQL Server. I can deliver a cleanly architected storefront within 5 weeks with full test coverage.");
            a1.setBidAmount(new BigDecimal("4200.00"));
            a1.setStatus(ApplicationStatus.PENDING);
            a1.setAppliedAt(LocalDateTime.now().minusDays(8));
            applicationRepository.save(a1);

            // Application 2 on Project 2 (Accepted)
            Application a2 = new Application();
            a2.setProject(p2);
            a2.setFreelancer(freelancer);
            a2.setProposal("Hi! I am a senior UI/UX designer with 15+ shipped design systems. I reviewed your dashboard specifications and have already outlined the user journey. I can deliver prototype milestones weekly.");
            a2.setBidAmount(new BigDecimal("1800.00"));
            a2.setStatus(ApplicationStatus.ACCEPTED);
            a2.setAppliedAt(LocalDateTime.now().minusDays(9));
            applicationRepository.save(a2);

            // Project Assignment for Project 2
            ProjectAssignment pa1 = new ProjectAssignment(p2, freelancer);
            pa1.setStatus(AssignmentStatus.ACTIVE);
            pa1.setAssignedAt(LocalDateTime.now().minusDays(8));
            projectAssignmentRepository.save(pa1);

            logger.info("Sample proposals and assignments seeded successfully.");
        }
    }
}

