package com.marketplace.service;

import com.marketplace.dto.ApplicationRequest;
import com.marketplace.dto.ApplicationResponse;
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

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ApplicationService {

    private final ApplicationRepository applicationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectAssignmentRepository projectAssignmentRepository;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ProjectRepository projectRepository,
                              UserRepository userRepository,
                              ProjectAssignmentRepository projectAssignmentRepository) {
        this.applicationRepository = applicationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.projectAssignmentRepository = projectAssignmentRepository;
    }

    @Transactional
    public ApplicationResponse applyForProject(ApplicationRequest request, Long freelancerId) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new ResourceNotFoundException("Project not found with id: " + request.getProjectId()));

        if (project.getStatus() != ProjectStatus.OPEN) {
            throw new BadRequestException("Cannot apply to this project because its status is: " + project.getStatus());
        }

        if (project.getClient().getUserId().equals(freelancerId)) {
            throw new BadRequestException("You cannot apply to your own project.");
        }

        if (applicationRepository.existsByProjectProjectIdAndFreelancerUserId(project.getProjectId(), freelancerId)) {
            throw new BadRequestException("You have already submitted a proposal for this project.");
        }

        User freelancer = userRepository.findById(freelancerId)
                .orElseThrow(() -> new ResourceNotFoundException("Freelancer not found with id: " + freelancerId));

        Application application = new Application();
        application.setProject(project);
        application.setFreelancer(freelancer);
        application.setProposal(request.getProposal().trim());
        application.setBidAmount(request.getBidAmount());
        application.setStatus(ApplicationStatus.PENDING);

        Application saved = applicationRepository.save(application);
        return mapToResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getMyApplications(Long freelancerId) {
        List<Application> applications = applicationRepository.findByFreelancerIdWithDetails(freelancerId);
        return applications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ApplicationResponse> getClientApplications(Long clientId) {
        List<Application> applications = applicationRepository.findByClientIdWithDetails(clientId);
        return applications.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public ApplicationResponse updateApplicationStatus(Long applicationId, String statusStr, UserPrincipal currentUser) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new ResourceNotFoundException("Application not found with id: " + applicationId));

        Project project = application.getProject();
        boolean isOwner = project.getClient().getUserId().equals(currentUser.getUserId());
        boolean isAdmin = currentUser.getRole() == Role.ADMIN;

        if (!isOwner && !isAdmin) {
            throw new UnauthorizedException("You do not have permission to review applications for this project.");
        }

        ApplicationStatus newStatus = ApplicationStatus.fromString(statusStr);
        application.setStatus(newStatus);
        Application saved = applicationRepository.save(application);

        // If proposal is accepted, assign freelancer and mark project as IN_PROGRESS
        if (newStatus == ApplicationStatus.ACCEPTED) {
            project.setStatus(ProjectStatus.IN_PROGRESS);
            projectRepository.save(project);

            ProjectAssignment assignment = new ProjectAssignment(project, application.getFreelancer());
            projectAssignmentRepository.save(assignment);
        }

        return mapToResponse(saved);
    }

    private ApplicationResponse mapToResponse(Application application) {
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

