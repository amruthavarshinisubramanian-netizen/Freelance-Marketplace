package com.marketplace.service;

import com.marketplace.dto.AdminDashboardStatsResponse;
import com.marketplace.dto.ApplicationResponse;
import com.marketplace.dto.ProjectResponse;
import com.marketplace.dto.UserDto;
import com.marketplace.entity.*;
import com.marketplace.exception.BadRequestException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.repository.ApplicationRepository;
import com.marketplace.repository.ProjectAssignmentRepository;
import com.marketplace.repository.ProjectRepository;
import com.marketplace.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminService {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;

    public AdminService(UserRepository userRepository,
                        ProjectRepository projectRepository,
                        ApplicationRepository applicationRepository,
                        ProjectAssignmentRepository projectAssignmentRepository) {
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.applicationRepository = applicationRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
    }

    @Transactional(readOnly = true)
    public AdminDashboardStatsResponse getDashboardStats() {
        // User stats
        long totalUsers = userRepository.count();
        long totalClients = userRepository.countByRole(Role.CLIENT);
        long totalFreelancers = userRepository.countByRole(Role.FREELANCER);
        long totalAdmins = userRepository.countByRole(Role.ADMIN);
        long activeUsers = userRepository.countByIsActiveTrue();

        Map<String, Object> userMap = new HashMap<>();
        userMap.put("totalUsers", totalUsers);
        userMap.put("totalClients", totalClients);
        userMap.put("totalFreelancers", totalFreelancers);
        userMap.put("totalAdmins", totalAdmins);
        userMap.put("activeUsers", activeUsers);

        // Project stats
        long totalProjects = projectRepository.count();
        long openProjects = projectRepository.countByStatus(ProjectStatus.OPEN);
        long inProgressProjects = projectRepository.countByStatus(ProjectStatus.IN_PROGRESS);
        long completedProjects = projectRepository.countByStatus(ProjectStatus.COMPLETED);
        long cancelledProjects = projectRepository.countByStatus(ProjectStatus.CANCELLED);
        BigDecimal totalValue = projectRepository.sumTotalBudget();
        if (totalValue == null) {
            totalValue = BigDecimal.ZERO;
        }

        Map<String, Object> projectMap = new HashMap<>();
        projectMap.put("totalProjects", totalProjects);
        projectMap.put("openProjects", openProjects);
        projectMap.put("inProgressProjects", inProgressProjects);
        projectMap.put("completedProjects", completedProjects);
        projectMap.put("cancelledProjects", cancelledProjects);
        projectMap.put("totalProjectValue", totalValue);

        // Application stats
        long totalApps = applicationRepository.count();
        long pendingApps = applicationRepository.countByStatus(ApplicationStatus.PENDING);
        long acceptedApps = applicationRepository.countByStatus(ApplicationStatus.ACCEPTED);
        long rejectedApps = applicationRepository.countByStatus(ApplicationStatus.REJECTED);

        Map<String, Object> appMap = new HashMap<>();
        appMap.put("totalApplications", totalApps);
        appMap.put("pendingApplications", pendingApps);
        appMap.put("acceptedApplications", acceptedApps);
        appMap.put("rejectedApplications", rejectedApps);

        Map<String, Object> stats = new HashMap<>();
        stats.put("users", userMap);
        stats.put("projects", projectMap);
        stats.put("applications", appMap);

        // Recent projects
        List<ProjectResponse> recentProjects = projectRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(this::mapProjectToResponse)
                .collect(Collectors.toList());

        // Recent users
        List<UserDto> recentUsers = userRepository.findTop5ByOrderByCreatedAtDesc().stream()
                .map(this::mapUserToDto)
                .collect(Collectors.toList());

        return new AdminDashboardStatsResponse(stats, recentProjects, recentUsers);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAllUsers(String roleStr, Boolean isActive, String search) {
        Role role = null;
        if (roleStr != null && !roleStr.equalsIgnoreCase("all") && !roleStr.trim().isEmpty()) {
            role = Role.fromString(roleStr);
        }

        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<User> users = userRepository.searchUsers(role, isActive, searchPattern);

        return users.stream().map(u -> {
            UserDto dto = mapUserToDto(u);
            dto.setProjectsPosted((long) projectRepository.findByClientUserIdOrderByCreatedAtDesc(u.getUserId()).size());
            dto.setApplicationsSubmitted((long) applicationRepository.findByFreelancerIdWithDetails(u.getUserId()).size());
            return dto;
        }).collect(Collectors.toList());
    }

    @Transactional
    public UserDto toggleUserStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrator account status cannot be deactivated.");
        }

        user.setIsActive(!Boolean.TRUE.equals(user.getIsActive()));
        User updated = userRepository.save(user);
        return mapUserToDto(updated);
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (user.getRole() == Role.ADMIN) {
            throw new BadRequestException("Administrator accounts cannot be deleted.");
        }

        userRepository.delete(user);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::mapProjectToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getAllApplications() {
        return applicationRepository.findAllWithDetails().stream()
                .map(this::mapApplicationToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void deleteApplication(Long applicationId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));
        applicationRepository.delete(application);
    }

    private UserDto mapUserToDto(User user) {
        return new UserDto(
                user.getUserId(),
                user.getFullName(),
                user.getEmail(),
                user.getRole(),
                user.getCreatedAt(),
                user.getIsActive()
        );
    }

    private ProjectResponse mapProjectToResponse(Project project) {
        ProjectResponse response = new ProjectResponse();
        response.setProjectId(project.getProjectId());
        response.setTitle(project.getTitle());
        response.setDescription(project.getDescription());
        response.setCategory(project.getCategory());
        response.setBudget(project.getBudget());
        response.setDeadline(project.getDeadline());
        response.setRequiredSkills(project.getRequiredSkills());
        response.setStatus(project.getStatus());
        response.setCreatedAt(project.getCreatedAt());

        if (project.getClient() != null) {
            response.setClientId(project.getClient().getUserId());
            response.setClientName(project.getClient().getFullName());
            response.setClientEmail(project.getClient().getEmail());
        }

        long appCount = applicationRepository.countByProjectProjectId(project.getProjectId());
        response.setApplicationCount(appCount);

        return response;
    }

    private ApplicationResponse mapApplicationToResponse(Application application) {
        ApplicationResponse res = new ApplicationResponse();
        res.setApplicationId(application.getApplicationId());
        res.setProposal(application.getProposal());
        res.setBidAmount(application.getBidAmount());
        res.setStatus(application.getStatus());
        res.setAppliedAt(application.getAppliedAt());

        if (application.getProject() != null) {
            res.setProjectId(application.getProject().getProjectId());
            res.setProjectTitle(application.getProject().getTitle());
            res.setProjectCategory(application.getProject().getCategory());
            res.setProjectBudget(application.getProject().getBudget());
            res.setProjectDeadline(application.getProject().getDeadline());
            res.setProjectStatus(application.getProject().getStatus());

            if (application.getProject().getClient() != null) {
                res.setClientId(application.getProject().getClient().getUserId());
                res.setClientName(application.getProject().getClient().getFullName());
                res.setClientEmail(application.getProject().getClient().getEmail());
            }
        }

        if (application.getFreelancer() != null) {
            res.setFreelancerId(application.getFreelancer().getUserId());
            res.setFreelancerName(application.getFreelancer().getFullName());
            res.setFreelancerEmail(application.getFreelancer().getEmail());
        }

        return res;
    }
}

