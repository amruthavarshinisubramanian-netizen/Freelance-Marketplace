package com.marketplace.controller;

import com.marketplace.dto.ApiResponse;
import com.marketplace.dto.ProjectRequest;
import com.marketplace.dto.ProjectResponse;
import com.marketplace.dto.StatusUpdateRequest;
import com.marketplace.security.UserPrincipal;
import com.marketplace.service.ProjectService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;

    public ProjectController(ProjectService projectService) {
        this.projectService = projectService;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllProjects(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) BigDecimal minBudget,
            @RequestParam(required = false) BigDecimal maxBudget,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String sortBy,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        List<ProjectResponse> projects = projectService.getAllProjects(
                search, category, minBudget, maxBudget, status, sortBy, currentUser
        );

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", projects.size());
        response.put("projects", projects);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getProjectById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ProjectResponse project = projectService.getProjectById(id, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("project", project);
        response.put("hasApplied", project.getHasApplied() != null && project.getHasApplied());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/client/my")
    public ResponseEntity<Map<String, Object>> getClientProjects(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ProjectResponse> projects = projectService.getClientProjects(currentUser.getUserId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("count", projects.size());
        response.put("projects", projects);

        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createProject(
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ProjectResponse created = projectService.createProject(request, currentUser.getUserId());

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project created successfully!");
        response.put("project", created);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateProject(
            @PathVariable Long id,
            @Valid @RequestBody ProjectRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ProjectResponse updated = projectService.updateProject(id, request, currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project updated successfully!");
        response.put("project", updated);

        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateProjectStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ProjectResponse updated = projectService.updateProjectStatus(id, request.getStatus(), currentUser);

        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "Project status updated to " + updated.getStatus());
        response.put("project", updated);

        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteProject(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        projectService.deleteProject(id, currentUser);
        return ResponseEntity.ok(ApiResponse.ok("Project deleted successfully."));
    }
}

