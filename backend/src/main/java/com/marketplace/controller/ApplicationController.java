package com.marketplace.controller;

import com.marketplace.dto.ApiResponse;
import com.marketplace.dto.ApplicationRequest;
import com.marketplace.dto.ApplicationResponse;
import com.marketplace.dto.StatusUpdateRequest;
import com.marketplace.security.UserPrincipal;
import com.marketplace.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/applications")
public class ApplicationController {

    private final ApplicationService applicationService;

    public ApplicationController(ApplicationService applicationService) {
        this.applicationService = applicationService;
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> applyForProject(
            @Valid @RequestBody ApplicationRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApplicationResponse response = applicationService.applyForProject(request, currentUser.getUserId());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Application submitted successfully!");
        res.put("application", response);

        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/my")
    public ResponseEntity<Map<String, Object>> getMyApplications(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ApplicationResponse> list = applicationService.getMyApplications(currentUser.getUserId());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", list.size());
        res.put("applications", list);

        return ResponseEntity.ok(res);
    }

    @GetMapping("/client")
    public ResponseEntity<Map<String, Object>> getClientApplications(@AuthenticationPrincipal UserPrincipal currentUser) {
        List<ApplicationResponse> list = applicationService.getClientApplications(currentUser.getUserId());

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("count", list.size());
        res.put("applications", list);

        return ResponseEntity.ok(res);
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateApplicationStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal currentUser) {

        ApplicationResponse response = applicationService.updateApplicationStatus(id, request.getStatus(), currentUser);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("message", "Application status updated to " + response.getStatus());
        res.put("application", response);

        return ResponseEntity.ok(res);
    }
}

