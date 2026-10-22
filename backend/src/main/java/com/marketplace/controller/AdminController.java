package com.marketplace.controller;

import com.marketplace.dto.AdminDashboardStatsResponse;
import com.marketplace.dto.ApiResponse;
import com.marketplace.dto.ApplicationResponse;
import com.marketplace.dto.ProjectResponse;
import com.marketplace.dto.UserDto;
import com.marketplace.service.AdminService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardStatsResponse> getDashboardStats() {
        AdminDashboardStatsResponse response = adminService.getDashboardStats();
        return ResponseEntity.ok(response);
    }

    @GetMapping("/users")
    public ResponseEntity<Map<String, Object>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) Boolean status,
            @RequestParam(required = false) String search) {

        List<UserDto> users = adminService.getAllUsers(role, status, search);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", users.size());
        res.put("users", users);

        return ResponseEntity.ok(res);
    }

    @PutMapping("/users/{id}/toggle-status")
    public ResponseEntity<Map<String, Object>> toggleUserStatus(@PathVariable Long id) {
        UserDto updated = adminService.toggleUserStatus(id);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "User status updated successfully!");
        res.put("user", updated);

        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.ok(ApiResponse.ok("User deleted successfully."));
    }

    @GetMapping("/projects")
    public ResponseEntity<Map<String, Object>> getAllProjects() {
        List<ProjectResponse> projects = adminService.getAllProjects();

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", projects.size());
        res.put("projects", projects);

        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/projects/{id}")
    public ResponseEntity<ApiResponse> deleteProject(@PathVariable Long id) {
        adminService.deleteProject(id);
        return ResponseEntity.ok(ApiResponse.ok("Project deleted successfully."));
    }

    @GetMapping("/applications")
    public ResponseEntity<Map<String, Object>> getAllApplications() {
        List<ApplicationResponse> apps = adminService.getAllApplications();

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", apps.size());
        res.put("applications", apps);

        return ResponseEntity.ok(res);
    }

    @DeleteMapping("/applications/{id}")
    public ResponseEntity<ApiResponse> deleteApplication(@PathVariable Long id) {
        adminService.deleteApplication(id);
        return ResponseEntity.ok(ApiResponse.ok("Application deleted successfully."));
    }
}

