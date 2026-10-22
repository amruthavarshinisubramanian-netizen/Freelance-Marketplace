package com.marketplace.service;

import com.marketplace.dto.ProjectRequest;
import com.marketplace.dto.ProjectResponse;
import com.marketplace.entity.*;
import com.marketplace.exception.BadRequestException;
import com.marketplace.exception.ResourceNotFoundException;
import com.marketplace.exception.UnauthorizedException;
import com.marketplace.repository.ApplicationRepository;
import com.marketplace.repository.ProjectAssignmentRepository;
import com.marketplace.repository.ProjectRepository;
import com.marketplace.repository.UserRepository;
import com.marketplace.security.UserPrincipal;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ApplicationRepository applicationRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;

    public ProjectService(ProjectRepository projectRepository,
                          UserRepository userRepository,
                          ApplicationRepository applicationRepository,
                          ProjectAssignmentRepository projectAssignmentRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.applicationRepository = applicationRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getAllProjects(String search,
                                               String category,
                                               BigDecimal minBudget,
                                               BigDecimal maxBudget,
                                               String status,
                                               String sortBy,
                                               UserPrincipal currentUser) {
        ProjectStatus projectStatus = null;
        if (status != null && !status.equalsIgnoreCase("all") && !status.trim().isEmpty()) {
            projectStatus = ProjectStatus.fromString(status);
        } else if (status == null) {
            projectStatus = ProjectStatus.OPEN;
        }

        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cat = (category != null && !category.equalsIgnoreCase("all") && !category.trim().isEmpty()) ? category.trim() : null;

        List<Project> projects = projectRepository.filterProjects(projectStatus, cat, minBudget, maxBudget, searchPattern, sortBy);

        return projects.stream()
                .map(p -> mapToResponse(p, currentUser))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        return mapToResponse(project, currentUser);
    }

    @Transactional(readOnly = true)
    public List<ProjectResponse> getClientProjects(Long clientId) {
        List<Project> projects = projectRepository.findByClientUserIdOrderByCreatedAtDesc(clientId);
        return projects.stream()
                .map(p -> {
                    ProjectResponse res = mapToResponse(p, null);
                    long pending = applicationRepository.countByProjectProjectIdAndStatus(p.getProjectId(), ApplicationStatus.PENDING);
                    res.setPendingCount(pending);
                    return res;
                })
                .collect(Collectors.toList());
    }

    @Transactional
    public ProjectResponse createProject(ProjectRequest request, Long clientId) {
        User client = userRepository.findById(clientId)
                .orElseThrow(() -> new ResourceNotFoundException("Client not found with id: " + clientId));

        if (request.getDeadline().isBefore(LocalDate.now())) {
            throw new BadRequestException("Deadline must be a future date.");
        }

        Project project = new Project();
        project.setClient(client);
        project.setTitle(request.getTitle().trim());
        project.setDescription(request.getDescription().trim());
        project.setCategory(request.getCategory().trim());
        project.setBudget(request.getBudget());
        project.setDeadline(request.getDeadline());
        project.setRequiredSkills(request.getRequiredSkills().trim());
        project.setStatus(ProjectStatus.OPEN);

        Project savedProject = projectRepository.save(project);
        return mapToResponse(savedProject, null);
    }

    @Transactional
    public ProjectResponse updateProject(Long projectId, ProjectRequest request, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        boolean isOwner = project.getClient().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to edit this project.");
        }

        if (request.getDeadline().isBefore(LocalDate.now())) {
            throw new BadRequestException("Deadline must be a future date.");
        }

        project.setTitle(request.getTitle().trim());
        project.setDescription(request.getDescription().trim());
        project.setCategory(request.getCategory().trim());
        project.setBudget(request.getBudget());
        project.setDeadline(request.getDeadline());
        project.setRequiredSkills(request.getRequiredSkills().trim());

        Project updatedProject = projectRepository.save(project);
        return mapToResponse(updatedProject, currentUser);
    }

    @Transactional
    public ProjectResponse updateProjectStatus(Long projectId, String statusStr, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        boolean isOwner = project.getClient().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to update status of this project.");
        }

        ProjectStatus newStatus = ProjectStatus.fromString(statusStr);
        project.setStatus(newStatus);
        Project saved = projectRepository.save(project);
        return mapToResponse(saved, currentUser);
    }

    @Transactional
    public void deleteProject(Long projectId, UserPrincipal currentUser) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + projectId));

        boolean isOwner = project.getClient().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to delete this project.");
        }

        projectRepository.delete(project);
    }

    private ProjectResponse mapToResponse(Project project, UserPrincipal currentUser) {
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

        // Check if current user is freelancer and has applied
        if (currentUser != null && currentUser.getRole() == Role.FREELANCER) {
            boolean applied = applicationRepository.existsByProjectProjectIdAndFreelancerUserId(
                    project.getProjectId(), currentUser.getUserId()
            );
            response.setHasApplied(applied);
        }

        // Assigned freelancer info
        Optional<ProjectAssignment> assignmentOpt = projectAssignmentRepository.findByProjectIdWithFreelancer(project.getProjectId());
        if (assignmentOpt.isPresent()) {
            ProjectAssignment pa = assignmentOpt.get();
            response.setAssignedFreelancerName(pa.getFreelancer().getFullName());
            response.setAssignedFreelancerId(pa.getFreelancer().getUserId());
        }

        return response;
    }
}

